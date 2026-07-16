import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowDownCircle, ArrowLeft, ArrowUpCircle, Download, Hammer, Trash2, User } from "lucide-react";
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
import { useData } from "@/lib/store";
import type { ToolAttachment } from "@/lib/types";
import {
  MOVEMENT_COLOR,
  MOVEMENT_LABEL,
  OWNERSHIP_LABEL,
  TOOL_STATUS_COLOR,
  TOOL_STATUS_LABEL,
  daysRemaining,
  effectiveStatus,
  newId,
  totalRentalCost,
} from "@/lib/types";
import { formatCurrency, formatDateTime, formatShortDate } from "@/lib/format";
import { generateMovementsReport } from "@/lib/reports";
import { cn } from "@/lib/utils";

export default function ToolDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { db, deleteTool, addMovements, addAttachments, removeAttachment } = useData();

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [viewerAttachment, setViewerAttachment] = useState<ToolAttachment | null>(null);
  const [validationOp, setValidationOp] = useState<ValidationOperation | null>(null);

  const tool = db.tools.find((t) => t.id === id);

  const movements = useMemo(
    () => db.movements.filter((m) => m.toolId === id).sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [db.movements, id],
  );
  const attachments = useMemo(() => db.attachments.filter((a) => a.toolId === id), [db.attachments, id]);

  if (!tool) {
    return (
      <PageContainer title="Ferramenta">
        <p className="text-app-muted">Ferramenta não encontrada.</p>
        <Link to="/ferramentas" className="text-app-accent">
          Voltar
        </Link>
      </PageContainer>
    );
  }

  const status = effectiveStatus(tool);
  const statusColor = TOOL_STATUS_COLOR[status];
  const StatusIcon = TOOL_STATUS_ICON[status];
  const days = daysRemaining(tool);
  const company = tool.rentalCompanyId ? db.companies.find((c) => c.id === tool.rentalCompanyId) : null;
  const site = tool.currentSiteId ? db.sites.find((s) => s.id === tool.currentSiteId) : null;
  const employee = tool.currentEmployeeId ? db.employees.find((e) => e.id === tool.currentEmployeeId) : null;

  const ownershipDuration = (): string => {
    if (!tool.purchaseDate) return "—";
    const months = Math.floor((Date.now() - new Date(tool.purchaseDate).getTime()) / (30.44 * 24 * 3600 * 1000));
    if (months < 12) return `${months} mês(es)`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem === 0 ? `${years} ano(s)` : `${years} ano(s) e ${rem} mês(es)`;
  };

  const handleValidationConfirm = (newAttachments: ToolAttachment[]) => {
    if (!validationOp) return;
    const movementId = newId();
    const withMovement = newAttachments.map((a) => ({ ...a, movementId }));
    addAttachments(withMovement);
    addMovements([
      {
        id: movementId,
        toolId: tool.id,
        type: validationOp === "receipt" ? "rentalStarted" : "rentalEnded",
        description: `${OPERATION_LABEL[validationOp]} registrado com fotos`,
        oldValue: "",
        newValue: "",
        timestamp: new Date().toISOString(),
        attachmentIds: withMovement.map((a) => a.id),
      },
    ]);
    toast.success(`${OPERATION_LABEL[validationOp]} registrado com ${withMovement.length} fotos`);
  };

  return (
    <PageContainer
      title={tool.name}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/ferramentas")}
            className="flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-sm font-semibold text-app-muted transition-colors hover:text-white"
          >
            <ArrowLeft size={15} /> Voltar
          </button>
          <button
            type="button"
            onClick={() => setShowEdit(true)}
            className="rounded-[10px] bg-app-accent/15 px-4 py-2 text-sm font-semibold text-app-accent transition-colors hover:bg-app-accent/25"
          >
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
              {tool.ownership === "rented" ? "Ferramenta Alugada" : "Ferramenta Própria"}
            </p>
          </div>
        </div>

        {/* Ownership / rental card */}
        <Card className="flex flex-col gap-2.5">
          <SectionHeader title={tool.ownership === "rented" ? "Aluguel" : "Propriedade"} />
          {tool.ownership === "rented" ? (
            <>
              <DetailRow label="Locadora" value={company?.name ?? "—"} />
              <DetailRow label="Custo diário" value={formatCurrency(tool.dailyRentalCost)} />
              <DetailRow label="Início" value={formatShortDate(tool.rentalStartDate)} />
              <DetailRow label="Devolução" value={formatShortDate(tool.rentalEndDate)} />
              {days !== null && (
                <>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-medium text-app-muted">{days < 0 ? "Atrasado" : "Dias restantes"}</span>
                    <span
                      className={cn(
                        "text-base font-bold",
                        days < 0 ? "text-status-red" : days <= 3 ? "text-status-orange" : "text-white",
                      )}
                    >
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
              <DetailRow label="Tempo de uso" value={ownershipDuration()} />
            </>
          )}
        </Card>

        {/* Assignment */}
        <Card className="flex flex-col gap-3">
          <SectionHeader title="Alocação" />
          <div className="flex items-center gap-3">
            <IconTile icon={Hammer} color="green" size={32} iconSize={16} />
            <div>
              <p className="text-xs text-app-muted">Obra</p>
              <p className="text-[15px] font-semibold text-white">{site?.name ?? "Não alocada"}</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center gap-3">
            <IconTile icon={User} color="blue" size={32} iconSize={16} />
            <div>
              <p className="text-xs text-app-muted">Responsável</p>
              <p className="text-[15px] font-semibold text-white">{employee?.name ?? "Sem responsável"}</p>
            </div>
          </div>
        </Card>

        {/* Details */}
        <Card className="flex flex-col gap-2.5">
          <SectionHeader title="Detalhes" />
          <DetailRow label="Tipo" value={OWNERSHIP_LABEL[tool.ownership]} />
          <DetailRow label="Marca" value={tool.brand || "—"} />
          <DetailRow label="Modelo" value={tool.model || "—"} />
          <DetailRow label="N° de série" value={tool.serialNumber || "—"} />
        </Card>

        {/* Notes */}
        {tool.notes && (
          <Card className="flex flex-col gap-2">
            <SectionHeader title="Observações" />
            <p className="text-sm text-app-muted">{tool.notes}</p>
          </Card>
        )}

        {/* Photographic record (receipt / delivery) */}
        <Card className="flex flex-col gap-3">
          <SectionHeader title="Registro Fotográfico" />
          <button
            type="button"
            onClick={() => setValidationOp("receipt")}
            className="flex items-center gap-3 rounded-[10px] bg-app-elevated p-3 text-left transition-colors hover:bg-app-elevated/70"
          >
            <ArrowDownCircle size={18} className="shrink-0 text-status-green" />
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-white">Registrar Recebimento</p>
              <p className="text-xs text-app-muted">3 fotos obrigatórias (incluindo registro)</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setValidationOp("delivery")}
            className="flex items-center gap-3 rounded-[10px] bg-app-elevated p-3 text-left transition-colors hover:bg-app-elevated/70"
          >
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
              onDelete={(a) => {
                removeAttachment(a.id);
                toast.success("Anexo removido");
              }}
            />
          ) : (
            <p className="text-sm text-app-muted">Nenhuma foto ou vídeo anexado.</p>
          )}
          <MediaUploadButton tool={tool} onAdd={addAttachments} className="self-start" />
        </Card>

        {/* Movement history */}
        <Card className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <SectionHeader title="Histórico" count={movements.length} />
            {movements.length > 0 && (
              <button
                type="button"
                aria-label="Exportar histórico"
                onClick={() => {
                  generateMovementsReport(db, movements);
                  toast.success("Histórico exportado");
                }}
                className="text-app-accent transition-opacity hover:opacity-80"
              >
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
                          <p className="text-xs text-app-muted">
                            {mov.oldValue} → {mov.newValue}
                          </p>
                        )}
                        <p className="text-[11px] text-app-muted/60">{formatDateTime(mov.timestamp)}</p>
                      </div>
                    </div>
                    {index < Math.min(movements.length, 20) - 1 && <Separator />}
                  </div>
                );
              })}
              {movements.length > 20 && (
                <p className="pt-2 text-xs font-medium text-app-muted">
                  + {movements.length - 20} movimentação(ões) anterior(es)
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Delete */}
        <button
          type="button"
          onClick={() => setShowDelete(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-status-red/10 py-3.5 text-[15px] font-semibold text-status-red transition-colors hover:bg-status-red/20"
        >
          <Trash2 size={15} />
          Excluir Ferramenta
        </button>
      </div>

      {/* Dialogs */}
      <ToolEditDialog tool={tool} open={showEdit} onClose={() => setShowEdit(false)} />
      <AttachmentViewer attachment={viewerAttachment} onClose={() => setViewerAttachment(null)} />
      {validationOp && (
        <PhotoValidationDialog
          tool={tool}
          operation={validationOp}
          open={validationOp !== null}
          onClose={() => setValidationOp(null)}
          onConfirm={handleValidationConfirm}
        />
      )}
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
              onClick={() => {
                deleteTool(tool.id);
                toast.success("Ferramenta excluída");
                navigate("/ferramentas");
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
