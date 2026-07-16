import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Trash2, UserCog, UserRound, Users as UsersIcon } from "lucide-react";
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
import { USER_ROLE_LABEL } from "@/lib/types";
import { formatShortDate } from "@/lib/format";

function UserEditDialog({ user, open, onClose }: { user: UserProfile | null; open: boolean; onClose: () => void }) {
  const { saveUser, db } = useData();
  const { profile: currentUser, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [active, setActive] = useState(true);

  const isSelf = user?.id === currentUser?.id;

  useEffect(() => {
    if (!open || !user) return;
    setName(user.name);
    setRole(user.role);
    setActive(user.active);
  }, [open, user]);

  const save = async () => {
    if (!user) return;

    // Prevent self-demotion if last admin
    if (
      user.id === currentUser?.id &&
      user.role === "admin" &&
      role === "user"
    ) {
      const adminCount = db.users.filter((u) => u.role === "admin" && u.active).length;
      if (adminCount <= 1) {
        toast.error("Você é o único administrador ativo. Não pode se rebaixar.");
        return;
      }
    }

    // Also prevent demoting the last other admin
    if (user.role === "admin" && role === "user" && user.id !== currentUser?.id) {
      const adminCount = db.users.filter((u) => u.role === "admin" && u.active).length;
      if (adminCount <= 1) {
        toast.error("Este é o único administrador ativo. Não pode ser rebaixado.");
        return;
      }
    }

    await saveUser({ ...user, name, role, active }, user.role);
    if (isSelf) await refreshProfile();
    toast.success("Usuário atualizado");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md border-app-separator bg-app-card">
        <DialogHeader>
          <DialogTitle className="text-white">Editar Usuário</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">E-mail</p>
            <p className="text-sm font-medium text-white">{user?.email}</p>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Nome</span>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Nível de Acesso</span>
            <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value as UserRole)} disabled={isSelf}>
              <option value="user">Usuário Padrão</option>
              <option value="admin">Administrador</option>
            </select>
            {isSelf && <span className="text-[11px] text-app-muted">Você não pode alterar seu próprio nível de acesso</span>}
          </label>
          <label className={`flex items-center gap-3 ${isSelf ? "opacity-50" : ""}`}>
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} disabled={isSelf} className="h-5 w-5 accent-app-accent" />
            <span className="text-sm font-medium text-white">Conta ativa</span>
          </label>
          {isSelf && <p className="text-[11px] text-app-muted">Você não pode desativar sua própria conta</p>}
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

export default function Users() {
  const { db } = useData();
  const { profile: currentUser } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserProfile | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...db.users]
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      .filter((u) => q === "" || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [db.users, search]);

  return (
    <PageContainer title="Usuários">
      <div className="flex flex-col gap-4 pb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Nome ou e-mail" />

        <Card className="flex items-center gap-3 border-app-accent/30 bg-app-accent/5">
          <IconTile icon={Shield} color="accent" size={36} iconSize={18} />
          <div>
            <p className="text-sm font-semibold text-white">Gestão de Usuários</p>
            <p className="text-xs text-app-muted">Defina níveis de acesso e ative/desative colaboradores</p>
          </div>
        </Card>

        {filtered.length === 0 ? (
          <EmptyState icon={UsersIcon} title="Nenhum usuário" subtitle="Os colaboradores aparecerão aqui após se cadastrarem" />
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((user) => (
              <Card key={user.id} className="flex items-center gap-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${user.active ? "bg-app-accent/15 text-app-accent" : "bg-status-gray/15 text-status-gray"}`}>
                  {user.name?.charAt(0).toUpperCase() ?? <UserRound size={20} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-white">{user.name || "Sem nome"}</p>
                  <p className="truncate text-xs text-app-muted">{user.email}</p>
                  <p className="text-[10px] text-app-muted/60">Cadastrado em {formatShortDate(user.createdAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <StatusBadge
                    label={USER_ROLE_LABEL[user.role]}
                    color={user.role === "admin" ? "orange" : "blue"}
                    icon={user.role === "admin" ? Shield : UserRound}
                  />
                  {!user.active && (
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
      <AlertDialog open={deleteUser !== null} onOpenChange={(o) => !o && setDeleteUser(null)}>
        <AlertDialogContent className="border-app-separator bg-app-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Remover este usuário?</AlertDialogTitle>
            <AlertDialogDescription className="text-app-muted">
              A conta será permanentemente removida do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-app-separator bg-app-elevated text-white">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-status-red text-white hover:bg-status-red/80"
              onClick={() => {
                if (deleteUser) {
                  db.users;
                  toast.success("Usuário removido");
                }
                setDeleteUser(null);
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
