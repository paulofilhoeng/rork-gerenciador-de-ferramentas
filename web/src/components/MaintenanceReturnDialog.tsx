import { useRef, useState } from "react";
import { Camera, FileImage, Loader2, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, inputClass } from "@/components/shared";
import { useData } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import type { Tool, ToolAttachment } from "@/lib/types";
import { newId } from "@/lib/types";
import { fileToImageDataUrl } from "@/lib/media";

export function MaintenanceReturnDialog({
  tool,
  open,
  onClose,
}: {
  tool: Tool | null;
  open: boolean;
  onClose: () => void;
}) {
  const { returnFromMaintenance } = useData();
  const { profile } = useAuth();
  const [repairCost, setRepairCost] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDataUrl, setInvoiceDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    try {
      const dataUrl = await fileToImageDataUrl(file);
      setInvoiceDataUrl(dataUrl);
    } catch {
      toast.error("Falha ao processar imagem");
    }
  };

  const handleReturn = async () => {
    if (!tool) return;
    const cost = Number(repairCost);
    if (!repairCost || isNaN(cost) || cost < 0) {
      toast.error("Informe o valor do reparo");
      return;
    }
    if (!invoiceNumber.trim()) {
      toast.error("Informe o número da nota fiscal");
      return;
    }
    if (!invoiceDataUrl) {
      toast.error("Anexe a foto da nota fiscal ou orçamento");
      return;
    }

    setLoading(true);
    try {
      const attachment: ToolAttachment = {
        id: newId(),
        toolId: tool.id,
        movementId: null,
        type: "photo",
        purpose: "invoice",
        dataUrl: invoiceDataUrl,
        caption: `NF: ${invoiceNumber}`,
        createdAt: new Date().toISOString(),
      };
      await returnFromMaintenance(tool.id, cost, invoiceNumber.trim(), attachment);
      toast.success("Retorno de manutenção registrado");
      handleClose();
    } catch {
      toast.error("Falha ao registrar retorno");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRepairCost("");
    setInvoiceNumber("");
    setInvoiceDataUrl(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md border-app-separator bg-app-card">
        <DialogHeader>
          <DialogTitle className="text-white">Retorno de Manutenção</DialogTitle>
        </DialogHeader>

        {tool && (
          <p className="text-sm text-app-muted">
            Ferramenta: <span className="font-semibold text-white">{tool.name}</span>
          </p>
        )}

        <div className="flex flex-col gap-4">
          {/* Invoice photo */}
          <Field label="Foto da Nota Fiscal / Orçamento *">
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
            {invoiceDataUrl ? (
              <div className="relative">
                <img src={invoiceDataUrl} alt="Nota fiscal" className="h-32 w-full rounded-[10px] object-cover" />
                <button
                  type="button"
                  onClick={() => setInvoiceDataUrl(null)}
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
                <Camera size={18} /> Anexar foto da nota fiscal
              </button>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor do Reparo (R$) *">
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={repairCost}
                onChange={(e) => setRepairCost(e.target.value)}
                placeholder="0,00"
              />
            </Field>
            <Field label="N° da Nota Fiscal *">
              <input
                className={inputClass}
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="NF-00000"
              />
            </Field>
          </div>

          <p className="text-xs text-app-muted">
            Estas informações serão anexadas permanentemente ao histórico da ferramenta junto com a data do retorno e seu nome.
          </p>

          <button
            type="button"
            onClick={() => void handleReturn()}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-app-accent py-3 text-sm font-bold text-app-bg hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Wrench size={15} />}
            Concluir Retorno
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
