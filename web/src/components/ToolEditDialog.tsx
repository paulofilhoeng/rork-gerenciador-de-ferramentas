import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, inputClass } from "@/components/shared";
import { useData } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import type { AuditFrequency, MovementType, Tool, ToolMovement, ToolOwnership, ToolStatus } from "@/lib/types";
import { AUDIT_FREQUENCY_LABEL, OWNERSHIP_LABEL, TOOL_STATUS_LABEL, computeNextAuditDate, newId } from "@/lib/types";
import { formatShortDate, fromDateInputValue, toDateInputValue } from "@/lib/format";

interface Props {
  tool: Tool | null;
  open: boolean;
  onClose: () => void;
}

export function ToolEditDialog({ tool, open, onClose }: Props) {
  const { db, saveTool, addMovements } = useData();
  const { isAdmin } = useAuth();
  const isNew = tool === null;

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [ownership, setOwnership] = useState<ToolOwnership>("own");
  const [baseStatus, setBaseStatus] = useState<ToolStatus>("available");
  const [notes, setNotes] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [dailyRentalCost, setDailyRentalCost] = useState("");
  const [rentalStartDate, setRentalStartDate] = useState("");
  const [rentalEndDate, setRentalEndDate] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [auditFrequency, setAuditFrequency] = useState<AuditFrequency>("monthly");
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(tool?.name ?? "");
    setBrand(tool?.brand ?? "");
    setModel(tool?.model ?? "");
    setSerialNumber(tool?.serialNumber ?? "");
    setOwnership(tool?.ownership ?? "own");
    setBaseStatus(tool?.baseStatus ?? "available");
    setNotes(tool?.notes ?? "");
    setPurchaseDate(toDateInputValue(tool?.purchaseDate ?? null));
    setDailyRentalCost(tool && tool.dailyRentalCost > 0 ? String(tool.dailyRentalCost) : "");
    setRentalStartDate(toDateInputValue(tool?.rentalStartDate ?? null));
    setRentalEndDate(toDateInputValue(tool?.rentalEndDate ?? null));
    setCompanyId(tool?.rentalCompanyId ?? "");
    setSiteId(tool?.currentSiteId ?? "");
    setEmployeeId(tool?.currentEmployeeId ?? "");
    setAuditFrequency(tool?.auditFrequency ?? "monthly");
    setShowError(false);
  }, [open, tool]);

  const save = async () => {
    if (!name.trim()) {
      setShowError(true);
      return;
    }

    const target: Tool = {
      id: tool?.id ?? newId(),
      name: name.trim(),
      brand,
      model,
      serialNumber,
      ownership,
      baseStatus,
      notes,
      purchaseDate: fromDateInputValue(purchaseDate),
      dailyRentalCost: Number(dailyRentalCost) || 0,
      rentalStartDate: fromDateInputValue(rentalStartDate),
      rentalEndDate: fromDateInputValue(rentalEndDate),
      createdAt: tool?.createdAt ?? new Date().toISOString(),
      rentalCompanyId: companyId || null,
      currentSiteId: isAdmin ? siteId || null : (tool?.currentSiteId ?? null),
      currentEmployeeId: employeeId || null,
      auditFrequency,
      lastAuditDate: tool?.lastAuditDate ?? null,
      nextAuditDate: tool?.nextAuditDate ?? computeNextAuditDate(auditFrequency),
      statusUpdatedAt: tool?.statusUpdatedAt ?? null,
    };

    // Record movement diffs for existing tools
    const movements: ToolMovement[] = [];
    const record = (type: MovementType, description: string, oldValue = "", newValue = "") => {
      movements.push({
        id: newId(),
        toolId: target.id,
        type,
        description,
        oldValue,
        newValue,
        timestamp: new Date().toISOString(),
        attachmentIds: [],
        userId: null,
        userName: "",
      });
    };

    if (!isNew && tool) {
      const siteName = (id: string | null) => (id ? db.sites.find((s) => s.id === id)?.name ?? null : null);
      const empName = (id: string | null) => (id ? db.employees.find((e) => e.id === id)?.name ?? null : null);

      const oldSite = siteName(tool.currentSiteId);
      const newSite = siteName(target.currentSiteId);
      if (newSite !== oldSite) {
        if (oldSite && newSite) record("siteChanged", "Obra alterada", oldSite, newSite);
        else if (newSite) record("siteAssigned", "Atribuída à obra", "", newSite);
        else if (oldSite) record("siteRemoved", "Removida da obra", oldSite, "");
      }

      const oldEmp = empName(tool.currentEmployeeId);
      const newEmp = empName(target.currentEmployeeId);
      if (newEmp !== oldEmp) {
        if (oldEmp && newEmp) record("employeeChanged", "Responsável alterado", oldEmp, newEmp);
        else if (newEmp) record("employeeAssigned", "Responsável atribuído", "", newEmp);
        else if (oldEmp) record("employeeRemoved", "Responsável removido", oldEmp, "");
      }

      if (target.baseStatus !== tool.baseStatus) {
        record("statusChanged", "Status alterado", TOOL_STATUS_LABEL[tool.baseStatus], TOOL_STATUS_LABEL[target.baseStatus]);
      }
      if (target.ownership !== tool.ownership) {
        record("ownershipChanged", "Tipo de propriedade alterado", OWNERSHIP_LABEL[tool.ownership], OWNERSHIP_LABEL[target.ownership]);
      }
      if (target.notes !== tool.notes) {
        record("notesChanged", "Observações atualizadas");
      }
    }

    await saveTool(target);
    if (movements.length > 0) await addMovements(movements);
    toast.success(isNew ? "Ferramenta criada" : "Ferramenta atualizada");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-app-separator bg-app-card">
        <DialogHeader>
          <DialogTitle className="text-white">{isNew ? "Nova Ferramenta" : "Editar Ferramenta"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <p className="text-xs font-bold uppercase tracking-wider text-app-accent">Informações Básicas</p>
          <Field label="Nome *">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Furadeira de Impacto" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Marca">
              <input className={inputClass} value={brand} onChange={(e) => setBrand(e.target.value)} />
            </Field>
            <Field label="Modelo">
              <input className={inputClass} value={model} onChange={(e) => setModel(e.target.value)} />
            </Field>
          </div>
          <Field label="Código / Patrimônio / N° de série">
            <input className={inputClass} value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
          </Field>

          <p className="text-xs font-bold uppercase tracking-wider text-app-accent">Tipo</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Propriedade">
              <select className={inputClass} value={ownership} onChange={(e) => setOwnership(e.target.value as ToolOwnership)}>
                <option value="own">Própria</option>
                <option value="rented">Alugada</option>
              </select>
            </Field>
            <Field label="Status">
              <select className={inputClass} value={baseStatus} onChange={(e) => setBaseStatus(e.target.value as ToolStatus)}>
                <option value="available">Disponível</option>
                <option value="inUse">Em Uso</option>
                <option value="maintenance">Manutenção</option>
                <option value="overdue">Atrasada</option>
              </select>
            </Field>
          </div>

          {ownership === "rented" ? (
            <>
              <p className="text-xs font-bold uppercase tracking-wider text-app-accent">Aluguel</p>
              <Field label="Locadora">
                <select className={inputClass} value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                  <option value="">Nenhuma</option>
                  {db.companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Custo diário (R$)">
                <input type="number" min="0" step="0.01" className={inputClass} value={dailyRentalCost} onChange={(e) => setDailyRentalCost(e.target.value)} placeholder="0,00" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Data de início">
                  <input type="date" className={inputClass} value={rentalStartDate} onChange={(e) => setRentalStartDate(e.target.value)} />
                </Field>
                <Field label="Data de devolução">
                  <input type="date" className={inputClass} value={rentalEndDate} onChange={(e) => setRentalEndDate(e.target.value)} />
                </Field>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-wider text-app-accent">Compra</p>
              <Field label="Data de compra">
                <input type="date" className={inputClass} value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
              </Field>
            </>
          )}

          <p className="text-xs font-bold uppercase tracking-wider text-app-accent">Alocação</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Obra / Estoque">
              <select className={inputClass} value={siteId} onChange={(e) => setSiteId(e.target.value)} disabled={!isAdmin}>
                <option value="">Nenhuma</option>
                {db.sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {!isAdmin && <p className="mt-1 text-[11px] text-app-muted/70">Apenas administradores podem alterar a obra</p>}
            </Field>
            <Field label="Responsável">
              <select className={inputClass} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                <option value="">Ninguém</option>
                {db.employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </Field>
          </div>

          <p className="text-xs font-bold uppercase tracking-wider text-app-accent">Auditoria</p>
          <Field label="Frequência de Auditoria">
            <select className={inputClass} value={auditFrequency} onChange={(e) => setAuditFrequency(e.target.value as AuditFrequency)}>
              {(Object.keys(AUDIT_FREQUENCY_LABEL) as AuditFrequency[]).map((freq) => (
                <option key={freq} value={freq}>{AUDIT_FREQUENCY_LABEL[freq]}</option>
              ))}
            </select>
          </Field>
          {tool?.nextAuditDate && (
            <p className="text-xs text-app-muted">Próxima auditoria: {formatShortDate(tool.nextAuditDate)}</p>
          )}

          <Field label="Observações">
            <textarea className={inputClass} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas" />
          </Field>

          {showError && <p className="text-[13px] font-medium text-status-red">O nome da ferramenta é obrigatório.</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border-[0.5px] border-app-separator bg-app-elevated py-3 text-sm font-semibold text-app-muted hover:text-white">
              Cancelar
            </button>
            <button type="button" onClick={() => void save()} className="flex-1 rounded-xl bg-app-accent py-3 text-sm font-bold text-app-bg hover:opacity-90">
              Salvar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
