import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2, ChevronRight, Mail, MapPin, Phone, Trash2, User, Wrench } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageContainer } from "@/components/Layout";
import { Card, EmptyState, Fab, Field, IconTile, SearchInput, SectionHeader, Separator, StatusBadge, inputClass } from "@/components/shared";
import { useData } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import type { Workshop } from "@/lib/types";
import { TOOL_STATUS_LABEL, effectiveStatus, newId } from "@/lib/types";
import { TOOL_STATUS_COLOR, TOOL_STATUS_ICON } from "@/components/shared";
import { formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

// MARK: - Edit dialog

function WorkshopEditDialog({ workshop, open, onClose }: { workshop: Workshop | null; open: boolean; onClose: () => void }) {
  const { saveWorkshop } = useData();
  const isNew = workshop === null;

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [contact1Name, setContact1Name] = useState("");
  const [contact1Phone, setContact1Phone] = useState("");
  const [contact2Name, setContact2Name] = useState("");
  const [contact2Phone, setContact2Phone] = useState("");
  const [notes, setNotes] = useState("");
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(workshop?.name ?? "");
    setAddress(workshop?.address ?? "");
    setPhone(workshop?.phone ?? "");
    setContact1Name(workshop?.contact1Name ?? "");
    setContact1Phone(workshop?.contact1Phone ?? "");
    setContact2Name(workshop?.contact2Name ?? "");
    setContact2Phone(workshop?.contact2Phone ?? "");
    setNotes(workshop?.notes ?? "");
    setShowError(false);
  }, [open, workshop]);

  const save = () => {
    if (!name.trim()) {
      setShowError(true);
      return;
    }
    onClose();
    toast.success(isNew ? "Oficina criada" : "Oficina atualizada");
    void saveWorkshop({
      id: workshop?.id ?? newId(),
      name: name.trim(),
      address,
      phone,
      contact1Name,
      contact1Phone,
      contact2Name,
      contact2Phone,
      notes,
      createdAt: workshop?.createdAt ?? new Date().toISOString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-app-separator bg-app-card">
        <DialogHeader>
          <DialogTitle className="text-white">{isNew ? "Nova Oficina" : "Editar Oficina"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field label="Nome *">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Oficina Central" />
          </Field>
          <Field label="Endereço">
            <input className={inputClass} value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>
          <Field label="Telefone">
            <input type="tel" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 3333-4444" />
          </Field>

          <p className="text-xs font-bold uppercase tracking-wider text-app-accent">Contato 1</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome">
              <input className={inputClass} value={contact1Name} onChange={(e) => setContact1Name(e.target.value)} />
            </Field>
            <Field label="Telefone">
              <input type="tel" className={inputClass} value={contact1Phone} onChange={(e) => setContact1Phone(e.target.value)} />
            </Field>
          </div>

          <p className="text-xs font-bold uppercase tracking-wider text-app-accent">Contato 2</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome">
              <input className={inputClass} value={contact2Name} onChange={(e) => setContact2Name(e.target.value)} />
            </Field>
            <Field label="Telefone">
              <input type="tel" className={inputClass} value={contact2Phone} onChange={(e) => setContact2Phone(e.target.value)} />
            </Field>
          </div>

          <Field label="Observações">
            <textarea className={inputClass} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>

          {showError && <p className="text-[13px] font-medium text-status-red">O nome da oficina é obrigatório.</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border-[0.5px] border-app-separator bg-app-elevated py-3 text-sm font-semibold text-app-muted hover:text-white">
              Cancelar
            </button>
            <button type="button" onClick={save} className="flex-1 rounded-xl bg-app-accent py-3 text-sm font-bold text-app-bg hover:opacity-90">
              Salvar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// MARK: - List page

export default function Workshops() {
  const { db } = useData();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...db.workshops]
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      .filter((w) => q === "" || w.name.toLowerCase().includes(q) || w.address.toLowerCase().includes(q));
  }, [db.workshops, search]);

  const toolsInWorkshop = (id: string) => db.tools.filter((t) => t.workshopId === id && t.baseStatus === "maintenance");

  return (
    <PageContainer title="Oficinas">
      <div className="flex flex-col gap-4 pb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Nome ou endereço" />
        {filtered.length === 0 ? (
          <EmptyState icon={Building2} title="Nenhuma oficina" subtitle="Toque em + para adicionar uma oficina" />
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((workshop) => {
              const inMaintenance = toolsInWorkshop(workshop.id);
              return (
                <Link key={workshop.id} to={`/oficinas/${workshop.id}`}>
                  <Card className="flex flex-col gap-2 transition-colors hover:border-app-accent/40">
                    <div className="flex items-center gap-3">
                      <IconTile icon={Building2} color="accent" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold text-white">{workshop.name}</p>
                        <p className="truncate text-xs text-app-muted">{workshop.address || "Sem endereço"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-medium text-app-muted">
                      <span className="flex items-center gap-1.5">
                        <Wrench size={11} /> {inMaintenance.length} em manutenção
                      </span>
                      {workshop.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone size={11} /> {workshop.phone}
                        </span>
                      )}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <Fab label="Nova oficina" onClick={() => setShowAdd(true)} />
      <WorkshopEditDialog workshop={null} open={showAdd} onClose={() => setShowAdd(false)} />
    </PageContainer>
  );
}

// MARK: - Detail page

export function WorkshopDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { db, deleteWorkshop } = useData();
  const { isAdmin } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const workshop = db.workshops.find((w) => w.id === id);
  const toolsInMaintenance = useMemo(
    () => db.tools.filter((t) => t.workshopId === id && t.baseStatus === "maintenance").sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [db.tools, id],
  );

  if (!workshop) {
    return (
      <PageContainer title="Oficina">
        <p className="text-app-muted">Oficina não encontrada.</p>
        <Link to="/oficinas" className="text-app-accent">Voltar</Link>
      </PageContainer>
    );
  }

  const contactRow = (icon: typeof Phone, label: string, value: string, color: "green" | "blue" | "orange" | "accent", href?: string) => {
    if (!value) return null;
    const Icon = icon;
    const content = (
      <div className="flex items-center gap-3">
        <IconTile icon={Icon} color={color === "accent" ? "accent" : color} size={32} iconSize={14} />
        <div>
          <p className="text-xs text-app-muted">{label}</p>
          <p className="text-sm font-medium text-white">{value}</p>
        </div>
      </div>
    );
    return href ? (
      <a key={label} href={href} className="transition-opacity hover:opacity-80">{content}</a>
    ) : (
      <div key={label}>{content}</div>
    );
  };

  return (
    <PageContainer
      title={workshop.name}
      actions={
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navigate("/oficinas")} className="flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-sm font-semibold text-app-muted hover:text-white">
            <ArrowLeft size={15} /> Voltar
          </button>
          {isAdmin && (
            <button type="button" onClick={() => setShowEdit(true)} className="rounded-[10px] bg-app-accent/15 px-4 py-2 text-sm font-semibold text-app-accent hover:bg-app-accent/25">
              Editar
            </button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-4 pb-6">
        <Card className="flex items-center gap-3.5">
          <IconTile icon={Building2} color="accent" size={56} iconSize={26} />
          <div>
            <p className="text-xl font-bold text-white">{workshop.name}</p>
            {workshop.address && <p className="text-[13px] text-app-muted">{workshop.address}</p>}
          </div>
        </Card>

        <Card className="flex flex-col gap-3">
          <SectionHeader title="Contatos" />
          {contactRow(Phone, "Telefone", workshop.phone, "green", workshop.phone ? `tel:${workshop.phone.replace(/\D/g, "")}` : undefined)}
          {contactRow(User, "Contato 1", workshop.contact1Name, "blue")}
          {contactRow(Phone, "Telefone Contato 1", workshop.contact1Phone, "green", workshop.contact1Phone ? `tel:${workshop.contact1Phone.replace(/\D/g, "")}` : undefined)}
          {contactRow(User, "Contato 2", workshop.contact2Name, "orange")}
          {contactRow(Phone, "Telefone Contato 2", workshop.contact2Phone, "green", workshop.contact2Phone ? `tel:${workshop.contact2Phone.replace(/\D/g, "")}` : undefined)}
          {!workshop.contact1Name && !workshop.contact2Name && !workshop.phone && (
            <p className="text-sm text-app-muted">Nenhum contato cadastrado.</p>
          )}
        </Card>

        {workshop.notes && (
          <Card className="flex flex-col gap-2">
            <SectionHeader title="Observações" />
            <p className="text-sm text-app-muted">{workshop.notes}</p>
          </Card>
        )}

        <Card className="flex flex-col gap-2">
          <SectionHeader title="Ferramentas em Manutenção" count={toolsInMaintenance.length} />
          {toolsInMaintenance.length === 0 ? (
            <p className="py-2 text-sm text-app-muted">Nenhuma ferramenta em manutenção nesta oficina.</p>
          ) : (
            toolsInMaintenance.map((tool, index) => {
              const status = effectiveStatus(tool);
              const StatusIcon = TOOL_STATUS_ICON[status];
              return (
                <div key={tool.id}>
                  <Link to={`/ferramentas/${tool.id}`} className="flex items-center gap-2.5 py-1">
                    <Wrench size={12} className="w-7 shrink-0 text-status-orange" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{tool.name}</p>
                      {tool.damageObs && <p className="truncate text-[11px] text-status-orange">Avaria: {tool.damageObs}</p>}
                    </div>
                    <StatusBadge label={TOOL_STATUS_LABEL[status]} color={TOOL_STATUS_COLOR[status]} icon={StatusIcon} />
                  </Link>
                  {index < toolsInMaintenance.length - 1 && <Separator />}
                </div>
              );
            })
          )}
        </Card>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-status-red/10 py-3.5 text-[15px] font-semibold text-status-red hover:bg-status-red/20"
          >
            <Trash2 size={15} /> Excluir Oficina
          </button>
        )}
      </div>

      <WorkshopEditDialog workshop={workshop} open={showEdit} onClose={() => setShowEdit(false)} />
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="border-app-separator bg-app-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir esta oficina?</AlertDialogTitle>
            <AlertDialogDescription className="text-app-muted">
              As ferramentas associadas permanecerão, mas sem oficina vinculada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-app-separator bg-app-elevated text-white">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-status-red text-white hover:bg-status-red/80"
              onClick={() => {
                void deleteWorkshop(workshop.id);
                toast.success("Oficina excluída");
                navigate("/oficinas");
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
