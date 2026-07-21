import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowDownCircle, ArrowLeft, ArrowUpCircle, ClipboardCheck, Clock, Download, Hammer, Power, Trash2, User, Wrench } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageContainer } from "@/components/Layout";
import {
  COLOR_BG_SOFT,
  COLOR_BG_SOLID,
  COLOR_BORDER,
  Card,
  DetailRow,
  IconTile,
  MOVEMENT_ICON,
  SectionHeader,
  Separator,
  TOOL_STATUS_ICON,
} from "@/components/shared";
import {
  AttachmentGrid,
  AttachmentViewer,
  MediaUploadButton,
  OPERATION_LABEL,
  PhotoValidationDialog,
  type ValidationOperation,
} from "@/components/attachments";
import { ToolEditDialog } from "@/components/ToolEditDialog";
import { AuditDialog } from "@/components/AuditDialog";
import { MaintenanceReturnDialog } from "@/components/MaintenanceReturnDialog";
import { useData } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import type { ToolAttachment } from "@/lib/types";
import {
  AUDIT_FREQUENCY_LABEL,
  MOVEMENT_COLOR,
  MOVEMENT_LABEL,
  OWNERSHIP_LABEL,
  RENTAL_PERIOD_LABEL,
  TOOL_STATUS_COLOR,
  TOOL_STATUS_LABEL,
  auditStatusLabel,
  auditStatusColor,
  auditDaysRemaining,
  daysRemaining,
  effectiveStatus,
  isRentalTracked,
  newId,
  totalRentalCost,
  dailyCostFromPeriod,
} from "@/lib/types";
import { formatCurrency, formatDateTime, formatShortDate } from "@/lib/format";
import { generateMovementsReport } from "@/lib/reports";
import { cn } from "@/lib/utils";

export default function ToolDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { db, deleteTool, saveTool, addMovements, addAttachments, removeAttachment, startMaintenance, hasPermission } = useData();
  const { isAdmin, profile } = useAuth();

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [viewerAttachment, setViewerAttachment] = useState<ToolAttachment | null>(null);
  const [validationOp, setValidationOp] = useState<ValidationOperation | null>(null);
  const [showAudit, setShowAudit] = useState(false);
  const [showReturn, setShowReturn] = useState(false);

  const tool = db.tools.find((t) => t.id === id);

  const movements = useMemo(
    () => db.movements.filter((m) => m.toolId === id).sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [db.movements, id],
  );
  const attachments = useMemo(() => db.attachments.filter((a) => a.toolId === id), [db.attachments, id]);
  const audits = useMemo(
    () => db.audits.filter((a) => a.toolId === id).sort((a, b) => b.auditDate.localeCompare(a.auditDate)),
    [db.audits, id],
  );
  const maintenanceRecords = useMemo(
    () => db.maintenance.filter((m) => m.toolId === id).sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? "")),
    [db.maintenance, id],
  );

  if (!tool) {
    return (
      <PageContainer title="Ferramenta">
        <p className="text-app-muted">Ferramenta não encontrada.</p>
        <Link to="/ferramentas" className="text-app-accent">Voltar</Link>
      </PageContainer>
    );
  }

  const status = effectiveStatus(tool);
  const statusColor = TOOL_STATUS_COLOR[status];
  const StatusIcon = TOOL_STATUS_ICON[status];
  const days = daysRemaining(tool);
  const company = tool.rentalCompanyId ? db.companies.find((c) => c.id === tool.rentalCompanyId) : null;
  const site = tool.currentSiteId ? db.sites.find((s) => s.id === tool.currentSiteId) : null;
  const user = tool.currentUserId ? db.users.find((u) => u.id === tool.currentUserId) : null;
  const isInMaintenance = tool.baseStatus === "maintenance";
  const isDisabled = tool.baseStatus === "disabled";
  const hasActiveMaintenance = maintenanceRecords.some((m) => m.status === "active");

  const handleValidationConfirm = (newAttachments: ToolAttachment[]) => {
    if (!validationOp) return;
    const movementId = newId();
    const withMovement = newAttachments.map((a) => ({ ...a, movementId }));
    setValidationOp(null);
    toast.success(`${OPERATION_LABEL[validationOp]} registrado com ${withMovement.length} fotos`);
    void addAttachments(withMovement);
    void addMovements([
      {
        id: movementId,
        toolId: tool.id,
        type: validationOp === "receipt" ? "rentalStarted" : "rentalEnded",
        description: `${OPERATION_LABEL[validationOp]} registrado com fotos`,
        oldValue: "",
        newValue: "",
        timestamp: new Date().toISOString(),
        attachmentIds: withMovement.map((a) => a.id),
        userId: null,
        userName: "",
      },
    ]);
  };

  const handleStartMaintenance = () => {
    if (!isAdmin && profile && !hasPermission(profile.id, tool.currentSiteId, "Envio para manutenção")) {
      toast.error("Você não tem permissão para enviar ferramentas para manutenção nesta obra.");
      return;
    }
    toast.success("Ferramenta enviada para manutenção");
    void startMaintenance(tool.id);
  };

  const handleReactivate = () => {
    toast.success("Ferramenta reativada");
    void saveTool({ ...tool, baseStatus: "available", statusUpdatedAt: new Date().toISOString() });
    void addMovements([
      {
        id: newId(),
        toolId: tool.id,
        type: "statusChanged",
        description: "Ferramenta reativada",
        oldValue: "Desativada",
        newValue: "Disponível",
        timestamp: new Date().toISOString(),
        attachmentIds: [],
        userId: null,
        userName: "",
      },
    ]);
  };

  return (
    <PageContainer
      title={tool.name}
      actions={
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navigate("/ferramentas")} className="flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-sm font-semibold text-app-muted hover:text-white">
            <ArrowLeft size={15} /> Voltar
          </button>
          <button type="button" onClick={() => setShowEdit(true)} className="rounded-[10px] bg-app-accent/15 px-4 py-2 text-sm font-semibold text-app-accent hover:bg-app-accent/25">
            Editar
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pb-6">
        {/* Status banner */}
        <div className={cn("flex items-center gap-3 rounded-[14px] border p-4", COLOR_BG_SOFT[statusColor], COLOR_BORDER[statusColor])}>
          <span className={cn("flex h-14 w-14 items-center justify-center rounded-[14px] text-white", COLOR_BG_SOLID[statusColor])}>
            <StatusIcon size={28} />
          </span>
          <div>
            <p className="text-[22px] font-bold text-white">{TOOL_STATUS_LABEL[status]}</p>
            <p className="text-[13px] font-medium text-app-muted">
              {isRentalTracked(tool) ? (tool.ownership === "client" ? "Ferramenta de Cliente" : "Ferramenta Alugada") : "Ferramenta Própria"}
            </p>
          </div>
        </div>

        {/* Audit status card */}
        <Card className="flex flex-col gap-2.5">
          <SectionHeader title="Auditoria" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-app-muted">Frequência</p>
              <p className="text-sm font-semibold text-white">{AUDIT_FREQUENCY_LABEL[tool.auditFrequency]}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-app-muted">Status</p>
              <p className={cn("text-sm font-semibold", `text-status-${auditStatusColor(tool)}`)}>{auditStatusLabel(tool)}</p>
            </div>
          </div>
          {tool.lastAuditDate && (
            <DetailRow label="Última auditoria" value={formatDateTime(tool.lastAuditDate)} />
          )}
          {tool.nextAuditDate && !isDisabled && (
            <DetailRow label="Próxima auditoria" value={formatShortDate(tool.nextAuditDate)} />
          )}
          {isDisabled && (
            <p className="rounded-lg bg-app-elevated py-2 text-center text-xs font-medium text-app-muted">
              Ferramenta desativada — auditorias suspensas
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAudit(true)}
              disabled={isInMaintenance || isDisabled}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-[10px] py-2.5 text-sm font-semibold transition-colors",
                isInMaintenance || isDisabled ? "cursor-not-allowed bg-app-elevated text-app-muted/50" : "bg-app-accent/15 text-app-accent hover:bg-app-accent/25",
              )}
            >
              <ClipboardCheck size={15} /> Realizar Auditoria
            </button>
            {!hasActiveMaintenance && !isInMaintenance && !isDisabled && (
              <button
                type="button"
                onClick={() => void handleStartMaintenance()}
                className="flex items-center justify-center gap-2 rounded-[10px] bg-status-orange/15 px-3 py-2.5 text-sm font-semibold text-status-orange hover:bg-status-orange/25"
              >
                <Wrench size={15} /> Manutenção
              </button>
            )}
            {hasActiveMaintenance && (
              <button
                type="button"
                onClick={() => setShowReturn(true)}
                className="flex items-center justify-center gap-2 rounded-[10px] bg-status-green/15 px-3 py-2.5 text-sm font-semibold text-status-green hover:bg-status-green/25"
              >
                <ArrowDownCircle size={15} /> Retorno
              </button>
            )}
          </div>
        </Card>

        {/* Ownership / rental card */}
        <Card className="flex flex-col gap-2.5">
          <SectionHeader title={isRentalTracked(tool) ? "Aluguel / Cliente" : "Propriedade"} />
          {isRentalTracked(tool) ? (
            <>
              <DetailRow label={tool.ownership === "client" ? "Cliente (Proprietário)" : "Locadora"} value={company?.name ?? "—"} />
              <DetailRow label="Periodicidade" value={RENTAL_PERIOD_LABEL[tool.rentalPeriod]} />
              <DetailRow label={`Valor ${RENTAL_PERIOD_LABEL[tool.rentalPeriod].toLowerCase()}`} value={formatCurrency(tool.dailyRentalCost)} />
              <DetailRow label="Custo diário equivalente" value={formatCurrency(dailyCostFromPeriod(tool))} />
              <DetailRow label="Início" value={formatShortDate(tool.rentalStartDate)} />
              <DetailRow label="Devolução" value={formatShortDate(tool.rentalEndDate)} />
              {days !== null && (
                <>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-medium text-app-muted">{days < 0 ? "Atrasado" : "Dias restantes"}</span>
                    <span className={cn("text-base font-bold", days < 0 ? "text-status-red" : days <= 3 ? "text-status-orange" : "text-white")}>
                      {Math.abs(days)} dia(s)
                    </span>
                  </div>
                  <DetailRow label="Custo acumulado" value={formatCurrency(totalRentalCost(tool))} />
                </>
              )}
            </>
          ) : (
            <>
              <DetailRow label="Data de compra" value={formatShortDate(tool.purchaseDate)} />
            </>
          )}
        </Card>

        {/* Assignment */}
        <Card className="flex flex-col gap-3">
          <SectionHeader title="Localização Atual" />
          <div className="flex items-center gap-3">
            <IconTile icon={Hammer} color="green" size={32} iconSize={16} />
            <div>
              <p className="text-xs text-app-muted">Obra / Estoque</p>
              <p className="text-[15px] font-semibold text-white">{site?.name ?? "Não alocada"}</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center gap-3">
            <IconTile icon={User} color="blue" size={32} iconSize={16} />
            <div>
              <p className="text-xs text-app-muted">Responsável</p>
              <p className="text-[15px] font-semibold text-white">{user?.name ?? "Sem responsável"}</p>
            </div>
          </div>
        </Card>

        {/* Details */}
        <Card className="flex flex-col gap-2.5">
          <SectionHeader title="Detalhes" />
          <DetailRow label="Tipo" value={OWNERSHIP_LABEL[tool.ownership]} />
          <DetailRow label="Marca" value={tool.brand || "—"} />
          <DetailRow label="Modelo" value={tool.model || "—"} />
          <DetailRow label="Código/Série" value={tool.serialNumber || "—"} />
          <DetailRow label="Última atualização de status" value={tool.statusUpdatedAt ? formatDateTime(tool.statusUpdatedAt) : "—"} />
        </Card>

        {tool.notes && (
          <Card className="flex flex-col gap-2">
            <SectionHeader title="Observações" />
            <p className="text-sm text-app-muted">{tool.notes}</p>
          </Card>
        )}

        {/* Audit history */}
        {audits.length > 0 && (
          <Card className="flex flex-col gap-2">
            <SectionHeader title="Histórico de Auditorias" count={audits.length} />
            {audits.map((audit, i) => (
              <div key={audit.id}>
                <div className="flex items-start gap-3 py-1.5">
                  <IconTile
                    icon={audit.status === "confirmed" ? ClipboardCheck : Wrench}
                    color={audit.status === "confirmed" ? "green" : "red"}
                    size={30}
                    iconSize={13}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">
                      {audit.status === "confirmed" ? "Conferência Confirmada" : "Avaria Registrada"}
                    </p>
                    {audit.damageDescription && (
                      <p className="text-xs text-status-red">{audit.damageDescription}</p>
                    )}
                    <p className="text-[11px] text-app-muted/60">
                      {audit.userName} · {formatDateTime(audit.auditDate)}
                    </p>
                  </div>
                </div>
                {i < audits.length - 1 && <Separator />}
              </div>
            ))}
          </Card>
        )}

        {/* Maintenance history */}
        {maintenanceRecords.length > 0 && (
          <Card className="flex flex-col gap-2">
            <SectionHeader title="Histórico de Manutenções" count={maintenanceRecords.length} />
            {maintenanceRecords.map((m, i) => (
              <div key={m.id}>
                <div className="flex items-start gap-3 py-1.5">
                  <IconTile icon={Wrench} color={m.status === "active" ? "orange" : "green"} size={30} iconSize={13} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">
                      {m.status === "active" ? "Em Manutenção" : "Retorno Concluído"}
                    </p>
                    {m.repairCost > 0 && <p className="text-xs text-app-muted">Custo: {formatCurrency(m.repairCost)}</p>}
                    {m.invoiceNumber && <p className="text-xs text-app-muted">NF: {m.invoiceNumber}</p>}
                    <p className="text-[11px] text-app-muted/60">
                      {m.userName} · {m.startDate ? formatShortDate(m.startDate) : "—"}
                      {m.returnDate ? ` → ${formatShortDate(m.returnDate)}` : ""}
                    </p>
                  </div>
                </div>
                {i < maintenanceRecords.length - 1 && <Separator />}
              </div>
            ))}
          </Card>
        )}

        {/* Photographic record */}
        <Card className="flex flex-col gap-3">
          <SectionHeader title="Registro Fotográfico" />
          <button type="button" onClick={() => setValidationOp("receipt")} className="flex items-center gap-3 rounded-[10px] bg-app-elevated p-3 text-left hover:bg-app-elevated/70">
            <ArrowDownCircle size={18} className="shrink-0 text-status-green" />
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-white">Registrar Recebimento</p>
              <p className="text-xs text-app-muted">3 fotos obrigatórias (incluindo registro)</p>
            </div>
          </button>
          <button type="button" onClick={() => setValidationOp("delivery")} className="flex items-center gap-3 rounded-[10px] bg-app-elevated p-3 text-left hover:bg-app-elevated/70">
            <ArrowUpCircle size={18} className="shrink-0 text-app-orange" />
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-white">Registrar Entrega</p>
              <p className="text-xs text-app-muted">3 fotos obrigatórias (incluindo registro)</p>
            </div>
          </button>
        </Card>

        {/* Attachments */}
        <Card className="flex flex-col gap-3">
          <SectionHeader title="Anexos" count={attachments.length} />
          {attachments.length > 0 ? (
            <AttachmentGrid
              attachments={attachments}
              onView={setViewerAttachment}
              onDelete={(a) => { void removeAttachment(a.id); toast.success("Anexo removido"); }}
            />
          ) : (
            <p className="text-sm text-app-muted">Nenhuma foto ou vídeo anexado.</p>
          )}
          <MediaUploadButton tool={tool} onAdd={(atts) => void addAttachments(atts)} className="self-start" />
        </Card>

        {/* Movement history */}
        <Card className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <SectionHeader title="Histórico" count={movements.length} />
            {movements.length > 0 && (
              <button type="button" aria-label="Exportar histórico" onClick={() => { generateMovementsReport(db, movements); toast.success("Histórico exportado"); }} className="text-app-accent hover:opacity-80">
                <Download size={16} />
              </button>
            )}
          </div>
          {movements.length === 0 ? (
            <p className="py-2 text-sm text-app-muted">Nenhuma movimentação registrada.</p>
          ) : (
            <div className="flex flex-col">
              {movements.slice(0, 20).map((mov, index) => {
                const Icon = MOVEMENT_ICON[mov.type];
                return (
                  <div key={mov.id}>
                    <div className="flex items-start gap-3 py-1.5">
                      <IconTile icon={Icon} color={MOVEMENT_COLOR[mov.type]} size={32} iconSize={14} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white">{MOVEMENT_LABEL[mov.type]}</p>
                        {(mov.oldValue || mov.newValue) && (
                          <p className="text-xs text-app-muted">{mov.oldValue} → {mov.newValue}</p>
                        )}
                        <p className="text-[11px] text-app-muted/60">
                          {mov.userName && `${mov.userName} · `}{formatDateTime(mov.timestamp)}
                        </p>
                      </div>
                    </div>
                    {index < Math.min(movements.length, 20) - 1 && <Separator />}
                  </div>
                );
              })}
              {movements.length > 20 && (
                <p className="pt-2 text-xs font-medium text-app-muted">+ {movements.length - 20} movimentação(ões) anterior(es)</p>
              )}
            </div>
          )}
        </Card>

        {/* Reactivate (disabled tools, admin only) */}
        {isDisabled && isAdmin && (
          <button
            type="button"
            onClick={() => void handleReactivate()}
            className="flex items-center justify-center gap-2 rounded-xl bg-status-green/15 py-3.5 text-[15px] font-semibold text-status-green hover:bg-status-green/25"
          >
            <Power size={15} /> Reativar Ferramenta
          </button>
        )}

        {/* Delete */}
        {isAdmin && (
          <button type="button" onClick={() => setShowDelete(true)} className="flex items-center justify-center gap-2 rounded-xl bg-status-red/10 py-3.5 text-[15px] font-semibold text-status-red hover:bg-status-red/20">
            <Trash2 size={15} /> Excluir Ferramenta
          </button>
        )}
      </div>

      <ToolEditDialog tool={tool} open={showEdit} onClose={() => setShowEdit(false)} />
      <AttachmentViewer attachment={viewerAttachment} onClose={() => setViewerAttachment(null)} />
      {validationOp && (
        <PhotoValidationDialog tool={tool} operation={validationOp} open={validationOp !== null} onClose={() => setValidationOp(null)} onConfirm={handleValidationConfirm} />
      )}
      <AuditDialog tool={tool} open={showAudit} onClose={() => setShowAudit(false)} />
      <MaintenanceReturnDialog tool={tool} open={showReturn} onClose={() => setShowReturn(false)} />
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="border-app-separator bg-app-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir esta ferramenta?</AlertDialogTitle>
            <AlertDialogDescription className="text-app-muted">Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-app-separator bg-app-elevated text-white">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-status-red text-white hover:bg-status-red/80"
              onClick={() => { void deleteTool(tool.id); toast.success("Ferramenta excluída"); navigate("/ferramentas"); }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
