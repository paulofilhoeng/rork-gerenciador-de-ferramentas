import { useMemo, useRef, useState } from "react";
import { Camera, FileImage, Play, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { AttachmentPurpose, Tool, ToolAttachment } from "@/lib/types";
import { ATTACHMENT_PURPOSE_LABEL, newId } from "@/lib/types";
import { fileToImageDataUrl, fileToVideoDataUrl } from "@/lib/media";

// MARK: - Thumbnail

export function AttachmentThumb({
  attachment,
  size = 72,
  onClick,
}: {
  attachment: ToolAttachment;
  size?: number;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative shrink-0 overflow-hidden rounded-[10px] border-[0.5px] border-app-separator bg-app-elevated transition-transform hover:scale-[1.03]"
      style={{ width: size, height: size }}
    >
      {attachment.type === "photo" ? (
        <img src={attachment.dataUrl} alt={ATTACHMENT_PURPOSE_LABEL[attachment.purpose]} className="h-full w-full object-cover" />
      ) : (
        <>
          <video src={attachment.dataUrl} muted className="h-full w-full object-cover" />
          <span className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Play size={20} className="text-white" fill="white" />
          </span>
        </>
      )}
      {attachment.purpose === "serialNumber" && (
        <span className="absolute inset-x-0 bottom-0 bg-app-accent/90 py-0.5 text-center text-[8px] font-bold uppercase text-app-bg">
          Registro
        </span>
      )}
    </button>
  );
}

// MARK: - Full-screen viewer

export function AttachmentViewer({
  attachment,
  onClose,
}: {
  attachment: ToolAttachment | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={attachment !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl border-app-separator bg-app-card p-3">
        <DialogHeader>
          <DialogTitle className="text-white">
            {attachment ? ATTACHMENT_PURPOSE_LABEL[attachment.purpose] : ""}
          </DialogTitle>
        </DialogHeader>
        {attachment &&
          (attachment.type === "photo" ? (
            <img
              src={attachment.dataUrl}
              alt={ATTACHMENT_PURPOSE_LABEL[attachment.purpose]}
              className="max-h-[70vh] w-full rounded-lg object-contain"
            />
          ) : (
            <video src={attachment.dataUrl} controls autoPlay className="max-h-[70vh] w-full rounded-lg" />
          ))}
      </DialogContent>
    </Dialog>
  );
}

// MARK: - Media picker (general attachments)

async function filesToAttachments(
  files: FileList,
  toolId: string,
  purpose: AttachmentPurpose,
): Promise<ToolAttachment[]> {
  const results: ToolAttachment[] = [];
  for (const file of Array.from(files)) {
    try {
      if (file.type.startsWith("image/")) {
        const dataUrl = await fileToImageDataUrl(file);
        results.push({ id: newId(), toolId, movementId: null, type: "photo", purpose, dataUrl, caption: "", createdAt: new Date().toISOString() });
      } else if (file.type.startsWith("video/")) {
        const dataUrl = await fileToVideoDataUrl(file);
        results.push({ id: newId(), toolId, movementId: null, type: "video", purpose, dataUrl, caption: "", createdAt: new Date().toISOString() });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao processar arquivo");
    }
  }
  return results;
}

export function MediaUploadButton({
  tool,
  onAdd,
  allowsVideo = true,
  label = "Anexar Fotos/Vídeos",
  className,
}: {
  tool: Tool;
  onAdd: (attachments: ToolAttachment[]) => void;
  allowsVideo?: boolean;
  label?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={allowsVideo ? "image/*,video/*" : "image/*"}
        multiple
        className="hidden"
        onChange={async (e) => {
          if (!e.target.files || e.target.files.length === 0) return;
          const attachments = await filesToAttachments(e.target.files, tool.id, "general");
          if (attachments.length > 0) {
            onAdd(attachments);
            toast.success(`${attachments.length} anexo(s) adicionado(s)`);
          }
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex items-center gap-2 rounded-[10px] bg-app-accent/15 px-3.5 py-2 text-sm font-semibold text-app-accent transition-colors hover:bg-app-accent/25",
          className,
        )}
      >
        <FileImage size={15} />
        {label}
      </button>
    </>
  );
}

// MARK: - Photo validation (3 mandatory photos incl. serial number)

export type ValidationOperation = "receipt" | "delivery";

export const OPERATION_LABEL: Record<ValidationOperation, string> = {
  receipt: "Recebimento",
  delivery: "Entrega",
};

interface PendingPhoto {
  id: string;
  dataUrl: string;
  isSerial: boolean;
}

export function PhotoValidationDialog({
  tool,
  operation,
  open,
  onClose,
  onConfirm,
}: {
  tool: Tool;
  operation: ValidationOperation;
  open: boolean;
  onClose: () => void;
  onConfirm: (attachments: ToolAttachment[]) => void;
}) {
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const serialInputRef = useRef<HTMLInputElement>(null);
  const generalInputRef = useRef<HTMLInputElement>(null);

  const hasSerial = useMemo(() => photos.some((p) => p.isSerial), [photos]);
  const hasThree = photos.length >= 3;
  const isValid = hasSerial && hasThree;

  const addFiles = async (files: FileList, isSerial: boolean) => {
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      try {
        const dataUrl = await fileToImageDataUrl(file);
        setPhotos((prev) => [...prev, { id: newId(), dataUrl, isSerial: isSerial && !prev.some((p) => p.isSerial) }]);
      } catch {
        toast.error("Falha ao processar foto");
      }
    }
  };

  const confirm = () => {
    if (!isValid) return;
    const purpose: AttachmentPurpose = operation === "receipt" ? "receipt" : "delivery";
    const attachments: ToolAttachment[] = photos.map((p) => ({
      id: newId(),
      toolId: tool.id,
      movementId: null,
      type: "photo",
      purpose: p.isSerial ? "serialNumber" : purpose,
      dataUrl: p.dataUrl,
      caption: "",
      createdAt: new Date().toISOString(),
    }));
    onConfirm(attachments);
    setPhotos([]);
    onClose();
  };

  const requirements: { label: string; met: boolean }[] = [
    { label: "Mínimo de 3 fotos", met: hasThree },
    { label: "1 foto do número de registro", met: hasSerial },
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setPhotos([]);
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-lg border-app-separator bg-app-card">
        <DialogHeader>
          <DialogTitle className="text-white">Registrar {OPERATION_LABEL[operation]}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-app-muted">
          Para registrar o {OPERATION_LABEL[operation].toLowerCase()} de <span className="font-semibold text-white">{tool.name}</span>, anexe
          3 fotos obrigatórias — incluindo 1 foto do número de registro da ferramenta.
        </p>

        <div className="flex flex-col gap-2 rounded-[10px] bg-app-elevated p-3">
          {requirements.map((req) => (
            <div key={req.label} className="flex items-center gap-2 text-sm">
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                  req.met ? "bg-status-green text-white" : "bg-app-separator text-app-muted",
                )}
              >
                {req.met ? "✓" : "•"}
              </span>
              <span className={req.met ? "text-white" : "text-app-muted"}>{req.label}</span>
            </div>
          ))}
        </div>

        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2.5">
            {photos.map((photo) => (
              <div key={photo.id} className="relative">
                <div className="h-[72px] w-[72px] overflow-hidden rounded-[10px] border-[0.5px] border-app-separator">
                  <img src={photo.dataUrl} alt="Foto" className="h-full w-full object-cover" />
                </div>
                {photo.isSerial && (
                  <span className="absolute inset-x-0 bottom-0 rounded-b-[10px] bg-app-accent/90 py-0.5 text-center text-[8px] font-bold uppercase text-app-bg">
                    Registro
                  </span>
                )}
                <button
                  type="button"
                  aria-label="Remover foto"
                  onClick={() => setPhotos((prev) => prev.filter((p) => p.id !== photo.id))}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-status-red text-white"
                >
                  <X size={11} strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={serialInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void addFiles(e.target.files, true);
            e.target.value = "";
          }}
        />
        <input
          ref={generalInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void addFiles(e.target.files, false);
            e.target.value = "";
          }}
        />

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => serialInputRef.current?.click()}
            disabled={hasSerial}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-[10px] px-3 py-2.5 text-sm font-semibold transition-colors",
              hasSerial
                ? "cursor-not-allowed bg-app-elevated text-app-muted/50"
                : "bg-app-accent/15 text-app-accent hover:bg-app-accent/25",
            )}
          >
            <Camera size={15} />
            Foto do Nº de Registro
          </button>
          <button
            type="button"
            onClick={() => generalInputRef.current?.click()}
            className="flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-app-accent/15 px-3 py-2.5 text-sm font-semibold text-app-accent transition-colors hover:bg-app-accent/25"
          >
            <FileImage size={15} />
            Fotos Gerais
          </button>
        </div>

        <button
          type="button"
          onClick={confirm}
          disabled={!isValid}
          className={cn(
            "w-full rounded-xl py-3 text-sm font-bold transition-colors",
            isValid ? "bg-app-accent text-app-bg hover:opacity-90" : "cursor-not-allowed bg-app-elevated text-app-muted/50",
          )}
        >
          Confirmar {OPERATION_LABEL[operation]}
        </button>
      </DialogContent>
    </Dialog>
  );
}

// MARK: - Attachment grid with delete

export function AttachmentGrid({
  attachments,
  onView,
  onDelete,
}: {
  attachments: ToolAttachment[];
  onView: (attachment: ToolAttachment) => void;
  onDelete?: (attachment: ToolAttachment) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {attachments.map((attachment) => (
        <div key={attachment.id} className="relative">
          <AttachmentThumb attachment={attachment} onClick={() => onView(attachment)} />
          {onDelete && (
            <button
              type="button"
              aria-label="Excluir anexo"
              onClick={() => onDelete(attachment)}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-status-red text-white"
            >
              <Trash2 size={10} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
