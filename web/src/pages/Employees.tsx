import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Trash2, UserRound, Users, Wrench } from "lucide-react";
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
  Card,
  EmptyState,
  Fab,
  Field,
  IconTile,
  SearchInput,
  SectionHeader,
  Separator,
  StatusBadge,
  TOOL_STATUS_ICON,
  inputClass,
} from "@/components/shared";
import { useData } from "@/lib/store";
import type { Employee } from "@/lib/types";
import { TOOL_STATUS_COLOR, TOOL_STATUS_LABEL, effectiveStatus, newId } from "@/lib/types";

// MARK: - Edit dialog

function EmployeeEditDialog({ employee, open, onClose }: { employee: Employee | null; open: boolean; onClose: () => void }) {
  const { saveEmployee } = useData();
  const isNew = employee === null;

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [level, setLevel] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(employee?.name ?? "");
    setRole(employee?.role ?? "");
    setLevel(employee?.level ?? "");
    setPhone(employee?.phone ?? "");
    setEmail(employee?.email ?? "");
    setShowError(false);
  }, [open, employee]);

  const save = async () => {
    if (!name.trim()) {
      setShowError(true);
      return;
    }
    await saveEmployee({
      id: employee?.id ?? newId(),
      name: name.trim(),
      role,
      level,
      phone,
      email,
      createdAt: employee?.createdAt ?? new Date().toISOString(),
    });
    toast.success(isNew ? "Funcionário criado" : "Funcionário atualizado");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg border-app-separator bg-app-card">
        <DialogHeader>
          <DialogTitle className="text-white">{isNew ? "Novo Funcionário" : "Editar Funcionário"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field label="Nome *">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Função">
            <input className={inputClass} value={role} onChange={(e) => setRole(e.target.value)} />
          </Field>
          <Field label="Alçada">
            <input className={inputClass} value={level} onChange={(e) => setLevel(e.target.value)} placeholder="Ex: Operário, Encarregado, Engenheiro" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Telefone">
              <input type="tel" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field label="E-mail">
              <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
          </div>
          {showError && <p className="text-[13px] font-medium text-status-red">O nome do funcionário é obrigatório.</p>}
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

export default function Employees() {
  const { db } = useData();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...db.employees]
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      .filter((e) => q === "" || e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q));
  }, [db.employees, search]);

  const toolCount = (id: string) => db.tools.filter((t) => t.currentEmployeeId === id).length;

  return (
    <PageContainer title="Funcionários">
      <div className="flex flex-col gap-4 pb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Nome ou função" />
        {filtered.length === 0 ? (
          <EmptyState icon={Users} title="Nenhum funcionário" subtitle="Toque em + para adicionar um funcionário" />
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((employee) => (
              <Link key={employee.id} to={`/funcionarios/${employee.id}`}>
                <Card className="flex items-center gap-3 transition-colors hover:border-app-accent/40">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-app-accent/15 text-app-accent">
                    <UserRound size={22} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-white">{employee.name}</p>
                    {(employee.role || employee.level) && (
                      <p className="truncate text-xs text-app-muted">
                        {employee.role}{employee.role && employee.level ? " • " : ""}{employee.level}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-bold text-app-accent">{toolCount(employee.id)}</span>
                    <span className="text-[10px] text-app-muted">ferramenta(s)</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Fab label="Novo funcionário" onClick={() => setShowAdd(true)} />
      <EmployeeEditDialog employee={null} open={showAdd} onClose={() => setShowAdd(false)} />
    </PageContainer>
  );
}

// MARK: - Detail page

export function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { db, deleteEmployee } = useData();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const employee = db.employees.find((e) => e.id === id);
  const tools = useMemo(
    () => db.tools.filter((t) => t.currentEmployeeId === id).sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [db.tools, id],
  );
  const ownTools = tools.filter((t) => t.ownership === "own");
  const rentedTools = tools.filter((t) => t.ownership === "rented");

  if (!employee) {
    return (
      <PageContainer title="Funcionário">
        <p className="text-app-muted">Funcionário não encontrado.</p>
        <Link to="/funcionarios" className="text-app-accent">
          Voltar
        </Link>
      </PageContainer>
    );
  }

  const siteName = (siteId: string | null) => (siteId ? db.sites.find((s) => s.id === siteId)?.name ?? null : null);

  return (
    <PageContainer
      title={employee.name}
      actions={
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navigate("/funcionarios")} className="flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-sm font-semibold text-app-muted hover:text-white">
            <ArrowLeft size={15} /> Voltar
          </button>
          <button type="button" onClick={() => setShowEdit(true)} className="rounded-[10px] bg-app-accent/15 px-4 py-2 text-sm font-semibold text-app-accent hover:bg-app-accent/25">
            Editar
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pb-6">
        <div className="flex items-center gap-3.5 rounded-[14px] border border-app-accent/25 bg-app-accent/10 p-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-app-accent/25 text-white">
            <UserRound size={32} />
          </span>
          <div>
            <p className="text-xl font-bold text-white">{employee.name}</p>
            {(employee.role || employee.level) && (
              <p className="text-sm font-medium text-app-accent">
                {employee.role}{employee.role && employee.level ? " • " : ""}{employee.level}
              </p>
            )}
          </div>
        </div>

        <Card className="flex flex-col gap-3">
          <SectionHeader title="Contato" />
          {employee.phone && (
            <a href={`tel:${employee.phone.replace(/\D/g, "")}`} className="flex items-center gap-3 hover:opacity-80">
              <IconTile icon={Phone} color="green" size={32} iconSize={14} />
              <div>
                <p className="text-xs text-app-muted">Telefone</p>
                <p className="text-sm font-medium text-white">{employee.phone}</p>
              </div>
            </a>
          )}
          {employee.email && (
            <a href={`mailto:${employee.email}`} className="flex items-center gap-3 hover:opacity-80">
              <IconTile icon={Mail} color="orange" size={32} iconSize={14} />
              <div>
                <p className="text-xs text-app-muted">E-mail</p>
                <p className="text-sm font-medium text-white">{employee.email}</p>
              </div>
            </a>
          )}
          {!employee.phone && !employee.email && <p className="text-sm text-app-muted">Nenhum contato cadastrado.</p>}
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
          <SectionHeader title="Ferramentas Atribuídas" count={tools.length} />
          {tools.length === 0 ? (
            <p className="py-2 text-sm text-app-muted">Nenhuma ferramenta atribuída a este funcionário.</p>
          ) : (
            tools.map((tool, index) => {
              const status = effectiveStatus(tool);
              return (
                <div key={tool.id}>
                  <Link to={`/ferramentas/${tool.id}`} className="flex items-center gap-2.5 py-1">
                    <Wrench size={12} className={`w-7 shrink-0 ${tool.ownership === "rented" ? "text-app-orange" : "text-app-accent"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{tool.name}</p>
                      {siteName(tool.currentSiteId) && (
                        <p className="truncate text-[11px] text-app-muted">{siteName(tool.currentSiteId)}</p>
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
          <Trash2 size={15} /> Excluir Funcionário
        </button>
      </div>

      <EmployeeEditDialog employee={employee} open={showEdit} onClose={() => setShowEdit(false)} />
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="border-app-separator bg-app-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir este funcionário?</AlertDialogTitle>
            <AlertDialogDescription className="text-app-muted">
              As ferramentas atribuídas serão desvinculadas deste funcionário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-app-separator bg-app-elevated text-white">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-status-red text-white hover:bg-status-red/80"
              onClick={() => {
                void deleteEmployee(employee.id);
                toast.success("Funcionário excluído");
                navigate("/funcionarios");
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
