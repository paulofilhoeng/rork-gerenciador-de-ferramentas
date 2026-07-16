import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Hammer, MapPin, Phone, Trash2, User, Wrench } from "lucide-react";
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
import {
  COLOR_TEXT,
  Card,
  EmptyState,
  Fab,
  Field,
  FilterChip,
  IconTile,
  SearchInput,
  SectionHeader,
  Separator,
  StatusBadge,
  TOOL_STATUS_ICON,
  inputClass,
} from "@/components/shared";
import { useData } from "@/lib/store";
import type { ConstructionSite, SiteStatus } from "@/lib/types";
import {
  SITE_STATUS_COLOR,
  SITE_STATUS_LABEL,
  TOOL_STATUS_COLOR,
  TOOL_STATUS_LABEL,
  effectiveStatus,
  newId,
} from "@/lib/types";
import { formatShortDate, fromDateInputValue, toDateInputValue } from "@/lib/format";
import { CheckCircle2, PauseCircle, BadgeCheck, type LucideIcon } from "lucide-react";

const SITE_STATUS_ICON: Record<SiteStatus, LucideIcon> = {
  active: CheckCircle2,
  paused: PauseCircle,
  completed: BadgeCheck,
};

// MARK: - Edit dialog

function SiteEditDialog({ site, open, onClose }: { site: ConstructionSite | null; open: boolean; onClose: () => void }) {
  const { saveSite } = useData();
  const isNew = site === null;

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [responsibleName, setResponsibleName] = useState("");
  const [responsiblePhone, setResponsiblePhone] = useState("");
  const [status, setStatus] = useState<SiteStatus>("active");
  const [startDate, setStartDate] = useState("");
  const [notes, setNotes] = useState("");
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(site?.name ?? "");
    setAddress(site?.address ?? "");
    setResponsibleName(site?.responsibleName ?? "");
    setResponsiblePhone(site?.responsiblePhone ?? "");
    setStatus(site?.status ?? "active");
    setStartDate(toDateInputValue(site?.startDate ?? null));
    setNotes(site?.notes ?? "");
    setShowError(false);
  }, [open, site]);

  const save = async () => {
    if (!name.trim()) {
      setShowError(true);
      return;
    }
    await saveSite({
      id: site?.id ?? newId(),
      name: name.trim(),
      address,
      responsibleName,
      responsiblePhone,
      status,
      startDate: fromDateInputValue(startDate),
      notes,
      createdAt: site?.createdAt ?? new Date().toISOString(),
    });
    toast.success(isNew ? "Obra criada" : "Obra atualizada");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-app-separator bg-app-card">
        <DialogHeader>
          <DialogTitle className="text-white">{isNew ? "Nova Obra" : "Editar Obra"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field label="Nome *">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Status">
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as SiteStatus)}>
              <option value="active">Ativa</option>
              <option value="paused">Pausada</option>
              <option value="completed">Concluída</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Responsável">
              <input className={inputClass} value={responsibleName} onChange={(e) => setResponsibleName(e.target.value)} />
            </Field>
            <Field label="Telefone">
              <input type="tel" className={inputClass} value={responsiblePhone} onChange={(e) => setResponsiblePhone(e.target.value)} />
            </Field>
          </div>
          <Field label="Endereço">
            <input className={inputClass} value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>
          <Field label="Data de início">
            <input type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label="Observações">
            <textarea className={inputClass} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          {showError && <p className="text-[13px] font-medium text-status-red">O nome da obra é obrigatório.</p>}
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

// MARK: - List page

export default function Sites() {
  const { db } = useData();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<SiteStatus | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...db.sites]
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      .filter((site) => {
        const matchesSearch =
          q === "" || site.name.toLowerCase().includes(q) || site.responsibleName.toLowerCase().includes(q);
        const matchesStatus = filterStatus === null || site.status === filterStatus;
        return matchesSearch && matchesStatus;
      });
  }, [db.sites, search, filterStatus]);

  const toolCount = (id: string) => db.tools.filter((t) => t.currentSiteId === id).length;

  return (
    <PageContainer title="Obras">
      <div className="flex flex-col gap-4 pb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Nome ou responsável" />
        <div className="flex gap-2 overflow-x-auto pb-1">
          <FilterChip label="Todas" isActive={filterStatus === null} onClick={() => setFilterStatus(null)} />
          {(["active", "paused", "completed"] as SiteStatus[]).map((status) => (
            <FilterChip
              key={status}
              label={SITE_STATUS_LABEL[status]}
              isActive={filterStatus === status}
              onClick={() => setFilterStatus(filterStatus === status ? null : status)}
            />
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Hammer} title="Nenhuma obra" subtitle="Toque em + para adicionar uma obra" />
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((site) => (
              <Link key={site.id} to={`/obras/${site.id}`}>
                <Card className="flex flex-col gap-2 transition-colors hover:border-app-accent/40">
                  <div className="flex items-center gap-3">
                    <IconTile icon={Hammer} color={SITE_STATUS_COLOR[site.status]} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-white">{site.name}</p>
                      <p className="truncate text-xs text-app-muted">{site.responsibleName || "Sem responsável"}</p>
                    </div>
                    <StatusBadge
                      label={SITE_STATUS_LABEL[site.status]}
                      color={SITE_STATUS_COLOR[site.status]}
                      icon={SITE_STATUS_ICON[site.status]}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-app-muted">
                    <span className="flex items-center gap-1.5">
                      <Wrench size={11} /> {toolCount(site.id)} ferramenta(s)
                    </span>
                    {site.address && (
                      <span className="flex min-w-0 items-center gap-1.5">
                        <MapPin size={11} className="shrink-0" />
                        <span className="truncate">{site.address}</span>
                      </span>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Fab label="Nova obra" onClick={() => setShowAdd(true)} />
      <SiteEditDialog site={null} open={showAdd} onClose={() => setShowAdd(false)} />
    </PageContainer>
  );
}

// MARK: - Detail page

export function SiteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { db, deleteSite } = useData();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const site = db.sites.find((s) => s.id === id);
  const tools = useMemo(
    () => db.tools.filter((t) => t.currentSiteId === id).sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [db.tools, id],
  );
  const ownTools = tools.filter((t) => t.ownership === "own");
  const rentedTools = tools.filter((t) => t.ownership === "rented");

  if (!site) {
    return (
      <PageContainer title="Obra">
        <p className="text-app-muted">Obra não encontrada.</p>
        <Link to="/obras" className="text-app-accent">
          Voltar
        </Link>
      </PageContainer>
    );
  }

  const employeeName = (empId: string | null) => (empId ? db.employees.find((e) => e.id === empId)?.name ?? null : null);
  const color = SITE_STATUS_COLOR[site.status];

  return (
    <PageContainer
      title={site.name}
      actions={
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navigate("/obras")} className="flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-sm font-semibold text-app-muted hover:text-white">
            <ArrowLeft size={15} /> Voltar
          </button>
          <button type="button" onClick={() => setShowEdit(true)} className="rounded-[10px] bg-app-accent/15 px-4 py-2 text-sm font-semibold text-app-accent hover:bg-app-accent/25">
            Editar
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pb-6">
        <Card className="flex items-center gap-3.5">
          <IconTile icon={Hammer} color={color} size={56} iconSize={26} />
          <div>
            <p className="text-xl font-bold text-white">{site.name}</p>
            <p className={`text-[13px] font-medium ${COLOR_TEXT[color]}`}>{SITE_STATUS_LABEL[site.status]}</p>
          </div>
        </Card>

        <Card className="flex flex-col gap-3">
          <SectionHeader title="Informações" />
          {site.address && (
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm font-medium text-app-muted">
                <MapPin size={13} /> Endereço
              </span>
              <span className="text-right text-sm font-semibold text-white">{site.address}</span>
            </div>
          )}
          {site.responsibleName && (
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm font-medium text-app-muted">
                <User size={13} /> Responsável
              </span>
              <span className="text-sm font-semibold text-white">{site.responsibleName}</span>
            </div>
          )}
          {site.responsiblePhone && (
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm font-medium text-app-muted">
                <Phone size={13} /> Telefone
              </span>
              <a href={`tel:${site.responsiblePhone.replace(/\D/g, "")}`} className="text-sm font-semibold text-white hover:text-app-accent">
                {site.responsiblePhone}
              </a>
            </div>
          )}
          {site.startDate && (
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm font-medium text-app-muted">
                <Calendar size={13} /> Início
              </span>
              <span className="text-sm font-semibold text-white">{formatShortDate(site.startDate)}</span>
            </div>
          )}
          {site.notes && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-app-muted">Observações</p>
                <p className="text-sm text-white">{site.notes}</p>
              </div>
            </>
          )}
        </Card>

        <Card className="flex items-center py-4">
          <div className="flex flex-1 flex-col items-center">
            <span className="text-2xl font-bold text-app-accent">{ownTools.length}</span>
            <span className="text-[11px] text-app-muted">Próprias</span>
          </div>
          <div className="h-9 w-px bg-app-separator" />
          <div className="flex flex-1 flex-col items-center">
            <span className="text-2xl font-bold text-app-orange">{rentedTools.length}</span>
            <span className="text-[11px] text-app-muted">Alugadas</span>
          </div>
          <div className="h-9 w-px bg-app-separator" />
          <div className="flex flex-1 flex-col items-center">
            <span className="text-2xl font-bold text-white">{tools.length}</span>
            <span className="text-[11px] text-app-muted">Total</span>
          </div>
        </Card>

        <Card className="flex flex-col gap-2">
          <SectionHeader title="Ferramentas Alocadas" count={tools.length} />
          {tools.length === 0 ? (
            <p className="py-2 text-sm text-app-muted">Nenhuma ferramenta alocada nesta obra.</p>
          ) : (
            tools.map((tool, index) => {
              const status = effectiveStatus(tool);
              return (
                <div key={tool.id}>
                  <Link to={`/ferramentas/${tool.id}`} className="flex items-center gap-2.5 py-1">
                    <Wrench size={12} className={`w-7 shrink-0 ${tool.ownership === "rented" ? "text-app-orange" : "text-app-accent"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{tool.name}</p>
                      {employeeName(tool.currentEmployeeId) && (
                        <p className="truncate text-[11px] text-app-muted">{employeeName(tool.currentEmployeeId)}</p>
                      )}
                    </div>
                    <StatusBadge label={TOOL_STATUS_LABEL[status]} color={TOOL_STATUS_COLOR[status]} icon={TOOL_STATUS_ICON[status]} />
                  </Link>
                  {index < tools.length - 1 && <Separator />}
                </div>
              );
            })
          )}
        </Card>

        <button
          type="button"
          onClick={() => setShowDelete(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-status-red/10 py-3.5 text-[15px] font-semibold text-status-red hover:bg-status-red/20"
        >
          <Trash2 size={15} /> Excluir Obra
        </button>
      </div>

      <SiteEditDialog site={site} open={showEdit} onClose={() => setShowEdit(false)} />
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="border-app-separator bg-app-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir esta obra?</AlertDialogTitle>
            <AlertDialogDescription className="text-app-muted">
              As ferramentas alocadas serão desvinculadas da obra.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-app-separator bg-app-elevated text-white">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-status-red text-white hover:bg-status-red/80"
              onClick={() => {
                void deleteSite(site.id);
                toast.success("Obra excluída");
                navigate("/obras");
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
