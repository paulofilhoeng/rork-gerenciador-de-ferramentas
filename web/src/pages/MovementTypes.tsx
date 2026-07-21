import { useEffect, useState } from "react";
import { ArrowLeftRight, GripVertical, Pencil, PlusCircle, Power } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageContainer } from "@/components/Layout";
import {
  Card,
  EmptyState,
  Fab,
  Field,
  IconTile,
  SectionHeader,
  Separator,
  StatusBadge,
  inputClass,
} from "@/components/shared";
import { useData } from "@/lib/store";
import type { MovementTypeEntity } from "@/lib/types";
import { newId } from "@/lib/types";
import { cn } from "@/lib/utils";

function MovementTypeEditDialog({
  mt,
  open,
  onClose,
}: {
  mt: MovementTypeEntity | null;
  open: boolean;
  onClose: () => void;
}) {
  const { saveMovementType } = useData();
  const isNew = mt === null;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(mt?.name ?? "");
    setDescription(mt?.description ?? "");
  }, [open, mt]);

  const save = () => {
    if (!name.trim()) {
      toast.error("Informe o nome do tipo de movimentação");
      return;
    }
    onClose();
    toast.success(isNew ? "Tipo criado" : "Tipo atualizado");
    void saveMovementType({
      id: mt?.id ?? newId(),
      name: name.trim(),
      description: description.trim(),
      isActive: mt?.isActive ?? true,
      isSystem: mt?.isSystem ?? false,
      sortOrder: mt?.sortOrder ?? 99,
      createdAt: mt?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md border-app-separator bg-app-card">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isNew ? "Novo Tipo de Movimentação" : "Editar Tipo de Movimentação"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field label="Nome *">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Descrição">
            <textarea
              className={inputClass}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          {mt?.isSystem && (
            <p className="text-xs text-app-muted">
              Este é um tipo do sistema — pode ser editado mas não removido.
            </p>
          )}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border-[0.5px] border-app-separator bg-app-elevated py-3 text-sm font-semibold text-app-muted hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => save()}
              className="flex-1 rounded-xl bg-app-accent py-3 text-sm font-bold text-app-bg hover:opacity-90"
            >
              Salvar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function MovementTypes() {
  const { db, toggleMovementType } = useData();
  const [showAdd, setShowAdd] = useState(false);
  const [editMt, setEditMt] = useState<MovementTypeEntity | null>(null);

  const sorted = [...db.movementTypes].sort((a, b) => a.sortOrder - b.sortOrder);
  const activeCount = sorted.filter((m) => m.isActive).length;

  return (
    <PageContainer title="Tipos de Movimentação">
      <div className="flex flex-col gap-4 pb-6">
        <Card className="flex items-center gap-3 border-app-accent/30 bg-app-accent/5">
          <IconTile icon={ArrowLeftRight} color="accent" size={36} iconSize={18} />
          <div>
            <p className="text-sm font-semibold text-white">Gestão de Tipos de Movimentação</p>
            <p className="text-xs text-app-muted">
              {sorted.length} tipo(s) cadastrado(s) · {activeCount} ativo(s)
            </p>
          </div>
        </Card>

        {sorted.length === 0 ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="Nenhum tipo de movimentação"
            subtitle="Toque em + para criar o primeiro tipo"
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {sorted.map((mt) => (
              <Card key={mt.id} className="flex items-center gap-3">
                <IconTile
                  icon={GripVertical}
                  color={mt.isActive ? "accent" : "gray"}
                  size={36}
                  iconSize={16}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-base font-semibold text-white">{mt.name}</p>
                    {mt.isSystem && (
                      <span className="rounded bg-app-elevated px-1.5 py-0.5 text-[9px] font-bold uppercase text-app-muted">
                        Sistema
                      </span>
                    )}
                  </div>
                  {mt.description && (
                    <p className="truncate text-xs text-app-muted">{mt.description}</p>
                  )}
                </div>
                <StatusBadge
                  label={mt.isActive ? "Ativo" : "Inativo"}
                  color={mt.isActive ? "green" : "gray"}
                  icon={Power}
                />
                <button
                  type="button"
                  onClick={() => setEditMt(mt)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-app-accent/15 text-app-accent hover:bg-app-accent/25"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void toggleMovementType(mt.id, !mt.isActive);
                    toast.success(mt.isActive ? "Tipo desativado" : "Tipo ativado");
                  }}
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    mt.isActive
                      ? "bg-status-red/15 text-status-red hover:bg-status-red/25"
                      : "bg-status-green/15 text-status-green hover:bg-status-green/25",
                  )}
                >
                  <Power size={15} />
                </button>
              </Card>
            ))}
          </div>
        )}

        <Card className="flex flex-col gap-2">
          <SectionHeader title="Sobre Tipos Desativados" />
          <p className="text-xs leading-relaxed text-app-muted">
            Tipos desativados não aparecem na matriz de permissões para novas configurações,
            mas permanecem preservados no histórico de movimentações antigas que já os utilizam.
          </p>
        </Card>
      </div>

      <Fab label="Novo tipo" onClick={() => setShowAdd(true)} />
      <MovementTypeEditDialog mt={null} open={showAdd} onClose={() => setShowAdd(false)} />
      {editMt && (
        <MovementTypeEditDialog
          mt={editMt}
          open={editMt !== null}
          onClose={() => setEditMt(null)}
        />
      )}
    </PageContainer>
  );
}
