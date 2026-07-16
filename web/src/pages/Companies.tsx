import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2, ChevronRight, KeyRound, Mail, MapPin, Phone, Trash2, TriangleAlert, User } from "lucide-react";
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
import { Card, EmptyState, Fab, Field, IconTile, SearchInput, SectionHeader, Separator, inputClass } from "@/components/shared";
import { useData } from "@/lib/store";
import type { RentalCompany } from "@/lib/types";
import { daysRemaining, effectiveStatus, newId } from "@/lib/types";
import { cn } from "@/lib/utils";

// MARK: - Edit dialog

function CompanyEditDialog({ company, open, onClose }: { company: RentalCompany | null; open: boolean; onClose: () => void }) {
  const { saveCompany } = useData();
  const isNew = company === null;

  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(company?.name ?? "");
    setCnpj(company?.cnpj ?? "");
    setPhone(company?.phone ?? "");
    setEmail(company?.email ?? "");
    setAddress(company?.address ?? "");
    setContactPerson(company?.contactPerson ?? "");
    setShowError(false);
  }, [open, company]);

  const save = async () => {
    if (!name.trim()) {
      setShowError(true);
      return;
    }
    await saveCompany({
      id: company?.id ?? newId(),
      name: name.trim(),
      cnpj,
      phone,
      email,
      address,
      contactPerson,
      createdAt: company?.createdAt ?? new Date().toISOString(),
    });
    toast.success(isNew ? "Locadora criada" : "Locadora atualizada");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-app-separator bg-app-card">
        <DialogHeader>
          <DialogTitle className="text-white">{isNew ? "Nova Locadora" : "Editar Locadora"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field label="Nome *">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="CNPJ">
            <input className={inputClass} value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
          </Field>
          <Field label="Pessoa de contato">
            <input className={inputClass} value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Telefone">
              <input type="tel" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field label="E-mail">
              <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
          </div>
          <Field label="Endereço">
            <input className={inputClass} value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>
          {showError && <p className="text-[13px] font-medium text-status-red">O nome da locadora é obrigatório.</p>}
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

export default function Companies() {
  const { db } = useData();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...db.companies]
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      .filter((c) => q === "" || c.name.toLowerCase().includes(q) || c.contactPerson.toLowerCase().includes(q));
  }, [db.companies, search]);

  const rentalCount = (id: string) => db.tools.filter((t) => t.rentalCompanyId === id && t.ownership === "rented").length;
  const overdueCount = (id: string) => db.tools.filter((t) => t.rentalCompanyId === id && effectiveStatus(t) === "overdue").length;

  return (
    <PageContainer title="Locadoras">
      <div className="flex flex-col gap-4 pb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Nome ou contato" />
        {filtered.length === 0 ? (
          <EmptyState icon={Building2} title="Nenhuma locadora" subtitle="Toque em + para adicionar uma locadora" />
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((company) => (
              <Link key={company.id} to={`/locadoras/${company.id}`}>
                <Card className="flex flex-col gap-2 transition-colors hover:border-app-accent/40">
                  <div className="flex items-center gap-3">
                    <IconTile icon={Building2} color="accent" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-white">{company.name}</p>
                      <p className="truncate text-xs text-app-muted">{company.contactPerson || company.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-medium text-app-muted">
                    <span className="flex items-center gap-1.5">
                      <KeyRound size={11} /> {rentalCount(company.id)} aluguel(is)
                    </span>
                    {overdueCount(company.id) > 0 && (
                      <span className="flex items-center gap-1.5 text-status-red">
                        <TriangleAlert size={11} /> {overdueCount(company.id)} atrasado(s)
                      </span>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Fab label="Nova locadora" onClick={() => setShowAdd(true)} />
      <CompanyEditDialog company={null} open={showAdd} onClose={() => setShowAdd(false)} />
    </PageContainer>
  );
}

// MARK: - Detail page

export function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { db, deleteCompany } = useData();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const company = db.companies.find((c) => c.id === id);
  const rentedTools = useMemo(
    () =>
      db.tools
        .filter((t) => t.rentalCompanyId === id && t.ownership === "rented")
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [db.tools, id],
  );
  const overdueTools = rentedTools.filter((t) => effectiveStatus(t) === "overdue");

  if (!company) {
    return (
      <PageContainer title="Locadora">
        <p className="text-app-muted">Locadora não encontrada.</p>
        <Link to="/locadoras" className="text-app-accent">
          Voltar
        </Link>
      </PageContainer>
    );
  }

  const contactRow = (icon: typeof Phone, label: string, value: string, color: "green" | "blue" | "orange" | "accent", href?: string) => {
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
      <a key={label} href={href} className="transition-opacity hover:opacity-80">
        {content}
      </a>
    ) : (
      <div key={label}>{content}</div>
    );
  };

  return (
    <PageContainer
      title={company.name}
      actions={
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navigate("/locadoras")} className="flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-sm font-semibold text-app-muted hover:text-white">
            <ArrowLeft size={15} /> Voltar
          </button>
          <button type="button" onClick={() => setShowEdit(true)} className="rounded-[10px] bg-app-accent/15 px-4 py-2 text-sm font-semibold text-app-accent hover:bg-app-accent/25">
            Editar
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pb-6">
        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-3.5">
            <IconTile icon={Building2} color="accent" size={52} iconSize={24} />
            <div>
              <p className="text-xl font-bold text-white">{company.name}</p>
              {company.cnpj && <p className="text-[13px] text-app-muted">CNPJ: {company.cnpj}</p>}
            </div>
          </div>
          <div className="flex items-center pt-1">
            <div className="flex flex-1 flex-col items-center">
              <span className="text-[22px] font-bold text-app-accent">{rentedTools.length}</span>
              <span className="text-[11px] text-app-muted">Alugadas</span>
            </div>
            <div className="h-8 w-px bg-app-separator" />
            <div className="flex flex-1 flex-col items-center">
              <span className={cn("text-[22px] font-bold", overdueTools.length > 0 ? "text-status-red" : "text-white")}>
                {overdueTools.length}
              </span>
              <span className="text-[11px] text-app-muted">Atrasadas</span>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col gap-3">
          <SectionHeader title="Contato" />
          {company.contactPerson && contactRow(User, "Contato", company.contactPerson, "blue")}
          {company.phone && contactRow(Phone, "Telefone", company.phone, "green", `tel:${company.phone.replace(/\D/g, "")}`)}
          {company.email && contactRow(Mail, "E-mail", company.email, "orange", `mailto:${company.email}`)}
          {company.address && contactRow(MapPin, "Endereço", company.address, "accent")}
        </Card>

        <Card className="flex flex-col gap-2">
          <SectionHeader title="Ferramentas Alugadas" count={rentedTools.length} />
          {rentedTools.length === 0 ? (
            <p className="py-2 text-sm text-app-muted">Nenhuma ferramenta alugada desta locadora.</p>
          ) : (
            rentedTools.map((tool, index) => {
              const days = daysRemaining(tool);
              return (
                <div key={tool.id}>
                  <Link to={`/ferramentas/${tool.id}`} className="flex items-center gap-2.5 py-1">
                    <KeyRound size={12} className="w-7 shrink-0 text-app-orange" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{tool.name}</p>
                      {days !== null && (
                        <p className={cn("text-[11px] font-medium", days < 0 ? "text-status-red" : "text-app-muted")}>
                          {days < 0 ? `Atrasado ${Math.abs(days)}d` : `Faltam ${days}d`}
                        </p>
                      )}
                    </div>
                    <ChevronRight size={12} className="shrink-0 text-app-muted/50" />
                  </Link>
                  {index < rentedTools.length - 1 && <Separator />}
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
          <Trash2 size={15} /> Excluir Locadora
        </button>
      </div>

      <CompanyEditDialog company={company} open={showEdit} onClose={() => setShowEdit(false)} />
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="border-app-separator bg-app-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir esta locadora?</AlertDialogTitle>
            <AlertDialogDescription className="text-app-muted">
              As ferramentas associadas permanecerão, mas sem locadora vinculada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-app-separator bg-app-elevated text-white">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-status-red text-white hover:bg-status-red/80"
              onClick={() => {
                void deleteCompany(company.id);
                toast.success("Locadora excluída");
                navigate("/locadoras");
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
