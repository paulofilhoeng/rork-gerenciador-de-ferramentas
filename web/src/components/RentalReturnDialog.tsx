import { useRef, useState } from "react";
import { AlertTriangle, Camera, CheckCircle2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Field, inputClass } from "@/components/shared";
import { useData } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import type { AuditStatus, Tool, ToolAttachment } from "@/lib/types";
import { newId, PERMISSION_NAMES } from "@/lib/types";
import { fileToImageDataUrl } from "@/lib/media";

export function RentalReturnDialog({
  tool,
  open,
  onClose,
}: {
  tool: Tool | null;
  open: boolean;
  onClose: () => void;
}) {
  const { registerRentalReturn, hasPermission } = useData();
  const { profile, isAdmin } = useAuth();
  const [conditionStatus, setConditionStatus] = useState<AuditStatus>("confirmed");
  const [conditionNotes, setConditionNotes] = useState("");
  const [accessoriesReturned, setAccessoriesReturned] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    try {
      const dataUrl = await fileToImageDataUrl(file);
      setPhotoDataUrl(dataUrl);
    } catch {
      toast.error("Falha ao processar imagem");
    }
  };

  const handleClose = () => {
    setConditionStatus("confirmed");
    setConditionNotes("");
    setAccessoriesReturned("");
    setRecipientName("");
    setRecipientPhone("");
    setPhotoDataUrl(null);
    onClose();
  };

  const handleConfirm = () => {
    if (!tool) return;
    if (!isAdmin && profile && !hasPermission(profile.id, tool.currentSiteId, PERMISSION_NAMES.RETURN_RENTAL)) {
      toast.error("Você não tem permissão para registrar devolução de locação nesta obra.");
      return;
    }
    if (!recipientName.trim()) {
      toast.error("Informe o nome do funcionário da locadora que recebeu");
      return;
    }
    if (conditionStatus === "damaged" && !conditionNotes.trim()) {
      toast.error("Descreva o estado/avaria da ferramenta na devolução");
      return;
    }
    if (!photoDataUrl) {
      toast.error("Anexe a foto do momento da devolução");
      return;
    }

    const attachment: ToolAttachment = {
      id: newId(),
      toolId: tool.id,
      movementId: null,
      type: "photo",
      purpose: "rentalReturn",
      dataUrl: photoDataUrl,
      caption: `Devolução — recebido por ${recipientName.trim()}`,
      createdAt: new Date().toISOString(),
    };

    // Close immediately — state is already optimistically updated.
    handleClose();
    toast.success("Devolução registrada");
    void registerRentalReturn(
      tool.id,
      conditionStatus,
      conditionNotes.trim(),
      accessoriesReturned.trim(),
      recipientName.trim(),
      recipientPhone.trim(),
      attachment,
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto border-app-separator bg-app-card">
        <DialogHeader>
          <DialogTitle className="text-white">Devolução à Locadora</DialogTitle>
        </DialogHeader>

        {tool && (
          <p className="text-sm text-app-muted">
            Ferramenta: <span className="font-semibold text-white">{tool.name}</span>
          </p>
        )}

        <div className="flex flex-col gap-4">
          {/* Condition toggle */}
          <Field label="Estado da ferramenta na devolução">
            <div className="flex gap-2 rounded-xl bg-app-elevated p-1">
              <button
                type="button"
                onClick={() => setConditionStatus("confirmed")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors",
                  conditionStatus === "confirmed" ? "bg-status-green text-white" : "text-app-muted",
                )}
              >
                <CheckCircle2 size={15} /> Boas condições
              </button>
              <button
                type="button"
                onClick={() => setConditionStatus("damaged")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors",
                  conditionStatus === "damaged" ? "bg-status-red text-white" : "text-app-muted",
                )}
              >
                <AlertTriangle size={15} /> Avariada
              </button>
            </div>
          </Field>

          {conditionStatus === "damaged" && (
            <Field label="Descrição do estado/avaria *">
              <textarea
                className={inputClass}
                rows={3}
                value={conditionNotes}
                onChange={(e) => setConditionNotes(e.target.value)}
                placeholder="Descreva o estado da ferramenta no momento da devolução..."
              />
            </Field>
          )}

          <Field label="Acessórios devolvidos junto">
            <textarea
              className={inputClass}
              rows={2}
              value={accessoriesReturned}
              onChange={(e) => setAccessoriesReturned(e.target.value)}
              placeholder="Ex: 2 baterias, 1 carregador, 1 maleta"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Funcionário da locadora *">
              <input
                className={inputClass}
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Quem recebeu/recolheu"
              />
            </Field>
            <Field label="Telefone da locadora">
              <input
                type="tel"
                className={inputClass}
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </Field>
          </div>

          {/* Return photo */}
          <Field label="Foto do momento da devolução *">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) void handleFile(e.target.files[0]);
                e.target.value = "";
              }}
            />
            {photoDataUrl ? (
              <div className="relative">
                <img src={photoDataUrl} alt="Devolução" className="h-32 w-full rounded-[10px] object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoDataUrl(null)}
                  className="absolute right-2 top-2 rounded-lg bg-status-red px-2 py-1 text-xs font-semibold text-white"
                >
                  Remover
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-[10px] border-[0.5px] border-dashed border-app-separator bg-app-elevated py-6 text-sm font-medium text-app-muted hover:text-white"
              >
                <Camera size={18} /> Anexar foto da devolução
              </button>
            )}
          </Field>

          <p className="text-xs text-app-muted">
            Estas informações serão anexadas permanentemente ao histórico da ferramenta junto com a data da devolução e seu nome.
          </p>

          <button
            type="button"
            onClick={() => handleConfirm()}
            className="flex items-center justify-center gap-2 rounded-xl bg-app-accent py-3 text-sm font-bold text-app-bg hover:opacity-90"
          >
            <Undo2 size={15} />
            Concluir Devolução
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
