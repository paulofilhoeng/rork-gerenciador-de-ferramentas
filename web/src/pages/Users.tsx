import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Trash2, UserCog, UserRound, Users as UsersIcon, Plus, Lock, Unlock, Mail, Phone, Briefcase, Building, HardHat, Eye, EyeOff } from "lucide-react";
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
import { Card, EmptyState, IconTile, SearchInput, SectionHeader, Separator, StatusBadge, inputClass } from "@/components/shared";
import { useData } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import type { UserProfile, UserRole } from "@/lib/types";
import { USER_ROLE_LABEL, newId } from "@/lib/types";
import { formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const emptyUser: UserProfile = {
  id: "",
  name: "",
  email: null,
  phone: "",
  cpf: "",
  jobRole: "",
  level: "",
  siteId: null,
  role: "user",
  active: true,
  hasLoginAccess: false,
  authUserId: null,
  createdAt: "",
};

function UserEditDialog({
  user,
  open,
  onClose,
}: {
  user: UserProfile | null;
  open: boolean;
  onClose: () => void;
}) {
  const { saveUser, db, grantLoginAccess, revokeLoginAccess, deleteUser } = useData();
  const { profile: currentUser, refreshProfile } = useAuth();
  const isNew = user?.id === "";
  const [form, setForm] = useState<UserProfile>(emptyUser);
  const [grantOpen, setGrantOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(user ?? emptyUser);
    setLoginEmail(user?.email ?? "");
    setLoginPassword("");
    setGrantOpen(false);
    setDeleteOpen(false);
  }, [open, user]);

  const isSelf = form.id === currentUser?.id;

  const update = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    const target: UserProfile = { ...form, name: form.name.trim() };
    if (isNew) {
      target.id = newId();
      target.createdAt = new Date().toISOString();
      await saveUser(target);
      toast.success("Usuário cadastrado");
    } else {
      // Role change safeguards
      if (form.role === "user" && user?.role === "admin") {
        const adminCount = db.users.filter((u) => u.role === "admin" && u.active).length;
        if (adminCount <= 1) {
          toast.error("Este é o único administrador ativo. Não pode ser rebaixado.");
          return;
        }
      }
      await saveUser(target, user?.role);
      if (isSelf) await refreshProfile();
      toast.success("Usuário atualizado");
    }
    onClose();
  };

  const handleGrant = async () => {
    if (!form.id || !loginEmail.trim() || !loginPassword) {
      toast.error("Preencha e-mail e senha");
      return;
    }
    await grantLoginAccess(form.id, loginEmail.trim(), loginPassword, form.role);
    setGrantOpen(false);
  };

  const handleRevoke = async () => {
    if (!form.id) return;
    await revokeLoginAccess(form.id);
    toast.success("Acesso revogado");
  };

  const handleDelete = async () => {
    if (!form.id) return;
    if (form.id === currentUser?.id) {
      toast.error("Você não pode excluir a própria conta");
      setDeleteOpen(false);
      return;
    }
    if (form.role === "admin" && db.users.filter((u) => u.role === "admin" && u.active).length <= 1) {
      toast.error("Não é possível excluir o último administrador ativo");
      setDeleteOpen(false);
      return;
    }
    await deleteUser(form.id);
    setDeleteOpen(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-app-separator bg-app-card">
        <DialogHeader>
          <DialogTitle className="text-white">{isNew ? "Novo Usuário" : "Editar Usuário"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {/* Identity */}
          <p className="text-xs font-bold uppercase tracking-wider text-app-accent">Identidade</p>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Nome completo *</span>
            <input className={inputClass} value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Ex: João Pereira" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">CPF</span>
              <input className={inputClass} value={form.cpf} onChange={(e) => update("cpf", e.target.value)} placeholder="000.000.000-00" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Telefone</span>
              <input className={inputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(11) 98888-1111" />
            </label>
          </div>

          {/* Job */}
          <p className="text-xs font-bold uppercase tracking-wider text-app-accent">Cargo / Lotação</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Cargo</span>
              <input className={inputClass} value={form.jobRole} onChange={(e) => update("jobRole", e.target.value)} placeholder="Ex: Mestre de Obras" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Alçada</span>
              <input className={inputClass} value={form.level} onChange={(e) => update("level", e.target.value)} placeholder="Ex: Líder de Equipe" />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Obra de Lotação</span>
            <select className={inputClass} value={form.siteId ?? ""} onChange={(e) => update("siteId", e.target.value || null)}>
              <option value="">Nenhuma</option>
              {db.sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>

          {/* Access */}
          <p className="text-xs font-bold uppercase tracking-wider text-app-accent">Acesso ao Sistema</p>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Nível de Acesso</span>
            <select className={inputClass} value={form.role} onChange={(e) => update("role", e.target.value as UserRole)} disabled={isSelf}>
              <option value="user">Usuário Padrão</option>
              <option value="admin">Administrador</option>
            </select>
            {isSelf && <span className="text-[11px] text-app-muted">Você não pode alterar seu próprio nível</span>}
          </label>
          <label className={cn("flex items-center gap-3", isSelf ? "opacity-50" : "")}>
            <input type="checkbox" checked={form.active} onChange={(e) => update("active", e.target.checked)} disabled={isSelf} className="h-5 w-5 accent-app-accent" />
            <span className="text-sm font-medium text-white">Conta ativa</span>
          </label>

          {/* Login status */}
          <div className="rounded-xl border border-app-separator bg-app-elevated p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {form.hasLoginAccess ? <Unlock size={16} className="text-status-green" /> : <Lock size={16} className="text-app-muted" />}
                <div>
                  <p className="text-sm font-semibold text-white">{form.hasLoginAccess ? "Acesso ao app" : "Sem acesso ao app"}</p>
                  <p className="text-[11px] text-app-muted">{form.hasLoginAccess ? `Login: ${form.email ?? "—"}` : "Apenas registro de funcionário"}</p>
                </div>
              </div>
              {form.hasLoginAccess ? (
                <button
                  type="button"
                  onClick={() => void handleRevoke()}
                  className="rounded-lg border border-status-red/30 px-3 py-1.5 text-xs font-semibold text-status-red hover:bg-status-red/10"
                >
                  Revogar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setGrantOpen(true)}
                  className="rounded-lg bg-app-accent/15 px-3 py-1.5 text-xs font-semibold text-app-accent hover:bg-app-accent/25"
                >
                  Conceder acesso
                </button>
              )}
            </div>
          </div>

          {/* Grant login inline */}
          {grantOpen && !form.hasLoginAccess && (
            <div className="flex flex-col gap-3 rounded-xl border border-app-accent/30 bg-app-accent/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-app-accent">Credenciais de Acesso</p>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">E-mail de login</span>
                <input className={inputClass} type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="usuario@empresa.com" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Senha</span>
                <div className="relative">
                  <input
                    className={cn(inputClass, "pr-10")}
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-app-muted"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setGrantOpen(false)} className="flex-1 rounded-lg border border-app-separator bg-app-elevated py-2 text-xs font-semibold text-app-muted">Cancelar</button>
                <button type="button" onClick={() => void handleGrant()} className="flex-1 rounded-lg bg-app-accent py-2 text-xs font-bold text-app-bg">Criar login</button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 rounded-xl border-[0.5px] border-app-separator bg-app-elevated py-3 text-sm font-semibold text-app-muted hover:text-white">
                Cancelar
              </button>
              <button type="button" onClick={() => void handleSave()} className="flex-1 rounded-xl bg-app-accent py-3 text-sm font-bold text-app-bg hover:opacity-90">
                Salvar
              </button>
            </div>
            {!isNew && (
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="flex items-center justify-center gap-2 rounded-xl border border-status-red/30 py-3 text-sm font-semibold text-status-red hover:bg-status-red/10"
              >
                <Trash2 size={15} /> Excluir usuário
              </button>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={(o) => !o && setDeleteOpen(false)}>
        <AlertDialogContent className="border-app-separator bg-app-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription className="text-app-muted">
              O registro será removido. Ferramentas, movimentações e histórico vinculados permanecem no sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-app-separator bg-app-elevated text-white">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-status-red text-white hover:bg-status-red/80" onClick={() => void handleDelete()}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

export default function Users() {
  const { db } = useData();
  const { profile: currentUser } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<UserProfile | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...db.users]
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      .filter((u) => q === "" || u.name.toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q) || u.cpf.toLowerCase().includes(q));
  }, [db.users, search]);

  return (
    <PageContainer
      title="Usuários"
      actions={
        <button
          type="button"
          onClick={() => setEditUser(emptyUser)}
          className="flex items-center gap-2 rounded-[10px] bg-app-accent/15 px-3.5 py-2 text-sm font-semibold text-app-accent hover:bg-app-accent/25"
        >
          <Plus size={16} /> Novo
        </button>
      }
    >
      <div className="flex flex-col gap-4 pb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Nome, e-mail ou CPF" />

        <Card className="flex items-center gap-3 border-app-accent/30 bg-app-accent/5">
          <IconTile icon={Shield} color="accent" size={36} iconSize={18} />
          <div>
            <p className="text-sm font-semibold text-white">Gestão de Usuários</p>
            <p className="text-xs text-app-muted">Cadastre colaboradores e conceda/revoque acesso ao app</p>
          </div>
        </Card>

        {filtered.length === 0 ? (
          <EmptyState icon={UsersIcon} title="Nenhum usuário" subtitle="Cadastre colaboradores ou funcionários para vincular a ferramentas" />
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((user) => (
              <Card key={user.id} className="flex items-center gap-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${user.hasLoginAccess ? "bg-app-accent/15 text-app-accent" : "bg-status-gray/15 text-status-gray"}`}>
                  {user.name?.charAt(0).toUpperCase() ?? <UserRound size={20} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-white">{user.name || "Sem nome"}</p>
                  <p className="truncate text-xs text-app-muted">{user.email ?? user.jobRole ?? "Sem login/cargo"}</p>
                  <p className="text-[10px] text-app-muted/60">Cadastrado em {formatShortDate(user.createdAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <StatusBadge
                    label={user.hasLoginAccess ? USER_ROLE_LABEL[user.role] : "Sem acesso"}
                    color={user.role === "admin" ? "orange" : user.hasLoginAccess ? "blue" : "gray"}
                    icon={user.role === "admin" ? Shield : user.hasLoginAccess ? UserRound : Lock}
                  />
                  {!user.active && user.hasLoginAccess && (
                    <span className="text-[10px] font-semibold text-status-red">Inativo</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setEditUser(user)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-app-accent/15 text-app-accent hover:bg-app-accent/25"
                  title={user.id === currentUser?.id ? "Editar meu perfil" : "Editar usuário"}
                >
                  <UserCog size={16} />
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>

      <UserEditDialog user={editUser} open={editUser !== null} onClose={() => setEditUser(null)} />
    </PageContainer>
  );
}
