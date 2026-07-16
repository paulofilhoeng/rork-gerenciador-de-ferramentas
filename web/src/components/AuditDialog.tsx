import { useState } from "react";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Field, inputClass } from "@/components/shared";
import { useData } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import type { Tool } from "@/lib/types";

export function AuditDialog({
  tool,
  open,
  onClose,
}: {
  tool: Tool | null;
  open: boolean;
  onClose: () => void;
}) {
  const { confirmAudit, reportDamage, hasPermission } = useData();
  const { isAdmin, profile } = useAuth();
  const [mode, setMode] = useState<"confirm" | "damage">("confirm");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!tool) return;
    if (!isAdmin && profile && !hasPermission(profile.id, tool.currentSiteId, "Auditoria/conferência")) {
      toast.error("Você não tem permissão para realizar auditorias nesta obra.");
      return;
    }
    setLoading(true);
    try {
      await confirmAudit(tool.id);
      toast.success("Auditoria confirmada");
      onClose();
    } catch {
      toast.error("Falha ao confirmar auditoria");
    } finally {
      setLoading(false);
    }
  };

  const handleDamage = async () => {
    if (!tool) return;
    if (!isAdmin && profile && !hasPermission(profile.id, tool.currentSiteId, "Auditoria/conferência")) {
      toast.error("Você não tem permissão para realizar auditorias nesta obra.");
      return;
    }
    if (!description.trim()) {
      toast.error("Descreva a avaria/falha");
      return;
    }
    setLoading(true);
    try {
      await reportDamage(tool.id, description.trim());
      toast.success("Avaria registrada — status alterado para manutenção");
      onClose();
    } catch {
      toast.error("Falha ao registrar avaria");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMode("confirm");
    setDescription("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md border-app-separator bg-app-card">
        <DialogHeader>
          <DialogTitle className="text-white">Auditoria de Ativo</DialogTitle>
        </DialogHeader>

        {tool && (
          <p className="text-sm text-app-muted">
            Ferramenta: <span className="font-semibold text-white">{tool.name}</span>
          </p>
        )}

        <div className="flex gap-2 rounded-xl bg-app-elevated p-1">
          <button
            type="button"
            onClick={() => setMode("confirm")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors",
              mode === "confirm" ? "bg-status-green text-white" : "text-app-muted",
            )}
          >
            <CheckCircle2 size={15} /> Presente e OK
          </button>
          <button
            type="button"
            onClick={() => setMode("damage")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors",
              mode === "damage" ? "bg-status-red text-white" : "text-app-muted",
            )}
          >
            <AlertTriangle size={15} /> Avariada
          </button>
        </div>

        {mode === "confirm" ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-app-muted">
              Confirme que a ferramenta está presente no local esperado e em condições de uso.
            </p>
            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-status-green py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Confirmar Conferência
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Field label="Descrição da Avaria/Falha *">
              <textarea
                className={inputClass}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o problema encontrado..."
              />
            </Field>
            <p className="text-xs text-app-muted">
              O status da ferramenta será alterado para "Avariada — Aguardando Manutenção" e ela permanecerá alocada na obra atual.
            </p>
            <button
              type="button"
              onClick={() => void handleDamage()}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-status-red py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Registrar Avaria
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
