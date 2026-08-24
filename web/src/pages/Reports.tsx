import { useEffect, useState } from "react";
import { Building2, ClipboardList, Download, Filter, Activity, Wrench } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/Layout";
import { Card, IconTile, SectionHeader, Separator, FilterChip, inputClass } from "@/components/shared";
import { useData } from "@/lib/store";
import { ACTIVITY_ACTION_COLOR, ACTIVITY_ACTION_LABEL, AUDIT_STATUS_LABEL, type ActivityAction } from "@/lib/types";
import { COLOR_TEXT } from "@/components/shared";
import { formatDateTime, formatShortDate } from "@/lib/format";
import JSZip from "jszip";

function timestampSuffix(): string {
  return new Date().toISOString().split(":").join("-").slice(0, 19);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export default function Reports() {
  const { db } = useData();
  const [tab, setTab] = useState<"activities" | "audits">("activities");

  // Activity filters
  const [actUser, setActUser] = useState<string>("");
  const [actAction, setActAction] = useState<ActivityAction | "">("");
  const [actSite, setActSite] = useState<string>("");
  const [actStart, setActStart] = useState("");
  const [actEnd, setActEnd] = useState("");
  const [actWorkshop, setActWorkshop] = useState<string>("");

  // Audit filters
  const [audTool, setAudTool] = useState<string>("");

  // Only compute filtered results on demand (user clicks "Exportar").
  const [actResults, setActResults] = useState<typeof db.activityLogs | null>(null);
  const [audResults, setAudResults] = useState<typeof db.audits | null>(null);

  const computeActivities = () => {
    const result = db.activityLogs.filter((log) => {
      if (actUser && log.userId !== actUser && log.userEmail !== actUser) return false;
      if (actAction && log.action !== actAction) return false;
      if (actSite && log.siteId !== actSite) return false;
      if (actStart && new Date(log.createdAt) < new Date(actStart)) return false;
      if (actEnd && new Date(log.createdAt) > new Date(actEnd + "T23:59:59")) return false;
      if (actWorkshop) {
        // Filter activity logs related to tools at the selected workshop.
        const toolsAtWorkshop = db.tools.filter((t) => t.workshopId === actWorkshop);
        const toolIds = new Set(toolsAtWorkshop.map((t) => t.id));
        const entityMatches = log.entityType === "workshop" && log.entityId === actWorkshop
          || (log.newValues as { tool?: string } | null)?.tool && toolIds.has((log.newValues as { tool: string }).tool);
        if (!entityMatches) return false;
      }
      return true;
    });
    setActResults(result);
  };

  const computeAudits = () => {
    const result = db.audits
      .filter((a) => !audTool || a.toolId === audTool)
      .sort((a, b) => b.auditDate.localeCompare(a.auditDate));
    setAudResults(result);
  };

  const toolName = (id: string) => db.tools.find((t) => t.id === id)?.name ?? "—";
  const toolLastUser = (id: string) => db.tools.find((t) => t.id === id)?.lastUser ?? "";
  const toolWorkshopName = (id: string) => {
    const t = db.tools.find((t) => t.id === id);
    if (!t?.workshopId) return "";
    return db.workshops.find((w) => w.id === t.workshopId)?.name ?? "";
  };
  const siteName = (id: string | null) => (id ? db.sites.find((s) => s.id === id)?.name ?? "—" : "—");

  const exportActivities = () => {
    const rows = actResults ?? [];
    let csv = "Data/Hora;Usuario;E-mail;Acao;Entidade;Registro;Obra\n";
    for (const log of rows) {
      csv += [
        formatDateTime(log.createdAt),
        log.userName,
        log.userEmail,
        ACTIVITY_ACTION_LABEL[log.action],
        log.entityType,
        log.entityName,
        siteName(log.siteId),
      ].join(";") + "\n";
    }
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, `relatorio-atividades-${timestampSuffix()}.csv`);
    toast.success("Relatório de atividades exportado");
  };

  const exportAudits = async () => {
    const auditsToExport = audResults ?? [];
    let csv = "Data/Hora;Ferramenta;Status;Descricao Avaria;Ultimo Usuario (obra);Oficina;Auditor;Proxima Auditoria\n";
    for (const audit of auditsToExport) {
      csv += [
        formatDateTime(audit.auditDate),
        toolName(audit.toolId),
        AUDIT_STATUS_LABEL[audit.status],
        audit.damageDescription || "—",
        toolLastUser(audit.toolId) || "—",
        toolWorkshopName(audit.toolId) || "—",
        audit.userName,
        audit.nextAuditDate ? formatShortDate(audit.nextAuditDate) : "—",
      ].join(";") + "\n";
    }

    // Also include maintenance records with invoice info
    csv += "\n\nManutencoes\n";
    csv += "Ferramenta;Inicio;Retorno;Custo;Nota Fiscal;Oficina;Responsavel;Status\n";
    for (const m of db.maintenance) {
      csv += [
        toolName(m.toolId),
        m.startDate ? formatShortDate(m.startDate) : "—",
        m.returnDate ? formatShortDate(m.returnDate) : "—",
        m.repairCost.toFixed(2),
        m.invoiceNumber || "—",
        toolWorkshopName(m.toolId) || "—",
        m.userName,
        m.status === "active" ? "Em Manutencao" : "Concluida",
      ].join(";") + "\n";
    }

    // Workshops summary
    csv += "\n\nOficinas\n";
    csv += "Nome;Endereco;Telefone;Contato 1;Contato 2;Ferramentas em Manutencao\n";
    for (const w of db.workshops) {
      const inMaintenance = db.tools.filter((t) => t.workshopId === w.id && t.baseStatus === "maintenance").length;
      csv += [
        w.name,
        w.address,
        w.phone,
        w.contact1Name ? `${w.contact1Name} (${w.contact1Phone})` : "—",
        w.contact2Name ? `${w.contact2Name} (${w.contact2Phone})` : "—",
        String(inMaintenance),
      ].join(";") + "\n";
    }

    // Check for invoice attachments
    const invoiceAttachments = db.attachments.filter(
      (a) => a.purpose === "invoice" && db.maintenance.some((m) => m.invoiceAttachmentId === a.id),
    );

    if (invoiceAttachments.length > 0) {
      const zip = new JSZip();
      zip.file("relatorio-auditorias.csv", "\uFEFF" + csv);
      const media = zip.folder("notas-fiscais");
      for (const att of invoiceAttachments) {
        const tool = db.tools.find((t) => t.id === att.toolId);
        const name = (tool?.name ?? "ferramenta").replace(/[^\w\u00C0-\u017F -]+/g, "");
        if (media) media.file(`${name}-nf-${att.id.slice(0, 8)}.jpg`, att.dataUrl.split(",")[1], { base64: true });
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      downloadBlob(zipBlob, `relatorio-auditorias-${timestampSuffix()}.zip`);
    } else {
      const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
      downloadBlob(blob, `relatorio-auditorias-${timestampSuffix()}.csv`);
    }
    toast.success("Relatório de auditorias exportado");
  };

  return (
    <PageContainer title="Relatórios">
      <div className="flex flex-col gap-4 pb-6">
        {/* Tabs */}
        <div className="flex gap-2 rounded-xl bg-app-elevated p-1">
          <button
            type="button"
            onClick={() => setTab("activities")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors ${tab === "activities" ? "bg-app-accent text-app-bg" : "text-app-muted"}`}
          >
            <Activity size={15} /> Atividades
          </button>
          <button
            type="button"
            onClick={() => setTab("audits")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors ${tab === "audits" ? "bg-app-accent text-app-bg" : "text-app-muted"}`}
          >
            <ClipboardList size={15} /> Auditorias
          </button>
        </div>

        {tab === "activities" ? (
          <>
            {/* Filters */}
            <Card className="flex flex-col gap-3">
              <SectionHeader title="Filtros" />
              <div className="grid grid-cols-2 gap-3">
                <select className={inputClass} value={actUser} onChange={(e) => setActUser(e.target.value)}>
                  <option value="">Todos os usuários</option>
                  {db.users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name || u.email}</option>
                  ))}
                </select>
                <select className={inputClass} value={actSite} onChange={(e) => setActSite(e.target.value)}>
                  <option value="">Todas as obras</option>
                  {db.sites.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <select className={inputClass} value={actWorkshop} onChange={(e) => setActWorkshop(e.target.value)}>
                <option value="">Todas as oficinas</option>
                {db.workshops.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2">
                <FilterChip label="Todas" isActive={actAction === ""} onClick={() => setActAction("")} />
                {(Object.keys(ACTIVITY_ACTION_LABEL) as ActivityAction[]).map((action) => (
                  <FilterChip
                    key={action}
                    label={ACTIVITY_ACTION_LABEL[action]}
                    isActive={actAction === action}
                    onClick={() => setActAction(actAction === action ? "" : action)}
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="date" className={inputClass} value={actStart} onChange={(e) => setActStart(e.target.value)} placeholder="De" />
                <input type="date" className={inputClass} value={actEnd} onChange={(e) => setActEnd(e.target.value)} placeholder="Até" />
              </div>
              <button
                type="button"
                onClick={computeActivities}
                className="flex items-center justify-center gap-2 rounded-xl border-[0.5px] border-app-separator bg-app-elevated py-2.5 text-sm font-semibold text-white hover:bg-white/5"
              >
                <Filter size={15} /> Gerar Relatório
              </button>
              {actResults !== null && (
                <button
                  type="button"
                  onClick={exportActivities}
                  disabled={actResults.length === 0}
                  className="flex items-center justify-center gap-2 rounded-xl bg-app-accent py-2.5 text-sm font-bold text-app-bg hover:opacity-90 disabled:opacity-50"
                >
                  <Download size={15} /> Exportar CSV ({actResults.length})
                </button>
              )}
            </Card>

            {/* Activity list — only shown after user clicks "Gerar Relatório" */}
            {actResults !== null && (
              <Card className="flex flex-col">
                {actResults.length === 0 ? (
                  <p className="py-6 text-center text-sm text-app-muted">Nenhuma atividade encontrada com os filtros aplicados.</p>
                ) : (
                  actResults.slice(0, 100).map((log, i) => {
                    const color = ACTIVITY_ACTION_COLOR[log.action];
                    const oldSite = (log.oldValues as { site?: string } | null)?.site;
                    const newSite = (log.newValues as { site?: string } | null)?.site;
                    return (
                      <div key={log.id}>
                        <div className="flex items-start gap-3 py-2">
                          <IconTile icon={log.action === "siteChanged" ? Building2 : Filter} color={color} size={30} iconSize={13} />
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-semibold ${COLOR_TEXT[color]}`}>{ACTIVITY_ACTION_LABEL[log.action]}</p>
                            <p className="truncate text-xs text-app-muted">
                              {log.entityName} ({log.entityType})
                            </p>
                            {log.action === "siteChanged" && oldSite && newSite && (
                              <p className="truncate text-xs text-app-muted">{oldSite} → {newSite}</p>
                            )}
                            <p className="text-[11px] text-app-muted/60">
                              {log.userName} · {formatDateTime(log.createdAt)}
                            </p>
                          </div>
                        </div>
                        {i < Math.min(actResults.length, 100) - 1 && <Separator />}
                      </div>
                    );
                  })
                )}
                {actResults.length > 100 && (
                  <p className="pt-2 text-xs text-app-muted">+ {actResults.length - 100} registros anteriores</p>
                )}
              </Card>
            )}
          </>
        ) : (
          <>
            {/* Audit filters */}
            <Card className="flex flex-col gap-3">
              <SectionHeader title="Filtros" />
              <select className={inputClass} value={audTool} onChange={(e) => setAudTool(e.target.value)}>
                <option value="">Todas as ferramentas</option>
                {db.tools.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={computeAudits}
                className="flex items-center justify-center gap-2 rounded-xl border-[0.5px] border-app-separator bg-app-elevated py-2.5 text-sm font-semibold text-white hover:bg-white/5"
              >
                <Filter size={15} /> Gerar Relatório
              </button>
              {audResults !== null && (
                <button
                  type="button"
                  onClick={() => void exportAudits()}
                  disabled={audResults.length === 0 && db.maintenance.length === 0}
                  className="flex items-center justify-center gap-2 rounded-xl bg-app-accent py-2.5 text-sm font-bold text-app-bg hover:opacity-90 disabled:opacity-50"
                >
                  <Download size={15} /> Exportar ({audResults.length + db.maintenance.length})
                </button>
              )}
            </Card>

            {/* Audit list — only shown after user clicks "Gerar Relatório" */}
            {audResults !== null && (
              <Card className="flex flex-col">
                <SectionHeader title="Histórico de Auditorias" count={audResults.length} />
                {audResults.length === 0 ? (
                  <p className="py-6 text-center text-sm text-app-muted">Nenhuma auditoria registrada.</p>
                ) : (
                  audResults.slice(0, 100).map((audit, i) => (
                    <div key={audit.id}>
                      <div className="flex items-start gap-3 py-2">
                        <IconTile
                          icon={audit.status === "confirmed" ? ClipboardList : Wrench}
                          color={audit.status === "confirmed" ? "green" : "red"}
                          size={30}
                          iconSize={13}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white">{toolName(audit.toolId)}</p>
                          <p className={`text-xs font-medium ${audit.status === "confirmed" ? "text-status-green" : "text-status-red"}`}>
                            {AUDIT_STATUS_LABEL[audit.status]}
                          </p>
                          {audit.damageDescription && (
                            <p className="text-xs text-app-muted">Falha: {audit.damageDescription}</p>
                          )}
                          {toolLastUser(audit.toolId) && (
                            <p className="text-xs text-app-muted/80">Último usuário: {toolLastUser(audit.toolId)}</p>
                          )}
                          {toolWorkshopName(audit.toolId) && (
                            <p className="text-xs text-app-muted/80">Oficina: {toolWorkshopName(audit.toolId)}</p>
                          )}
                          <p className="text-[11px] text-app-muted/60">
                            {audit.userName} · {formatDateTime(audit.auditDate)}
                          </p>
                        </div>
                      </div>
                      {i < Math.min(audResults.length, 100) - 1 && <Separator />}
                    </div>
                  ))
                )}
              </Card>
            )}

            {/* Maintenance history */}
            {db.maintenance.length > 0 && (
              <Card className="flex flex-col">
                <SectionHeader title="Histórico de Manutenções" count={db.maintenance.length} />
                {db.maintenance.map((m, i) => (
                  <div key={m.id}>
                    <div className="flex items-start gap-3 py-2">
                      <IconTile icon={Wrench} color={m.status === "active" ? "orange" : "green"} size={30} iconSize={13} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white">{toolName(m.toolId)}</p>
                        <p className="text-xs text-app-muted">
                          {m.status === "active" ? "Em manutenção" : `Concluída · R$ ${m.repairCost.toFixed(2)}`}
                        </p>
                        {m.invoiceNumber && <p className="text-xs text-app-muted">NF: {m.invoiceNumber}</p>}
                        <p className="text-[11px] text-app-muted/60">
                          {m.userName} · {m.startDate ? formatShortDate(m.startDate) : "—"}
                          {m.returnDate ? ` → ${formatShortDate(m.returnDate)}` : ""}
                        </p>
                      </div>
                    </div>
                    {i < db.maintenance.length - 1 && <Separator />}
                  </div>
                ))}
              </Card>
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
}
