import { useMemo } from "react";
import { Check, Minus } from "lucide-react";
import { useData } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { Card, SectionHeader } from "@/components/shared";
import { cn } from "@/lib/utils";

/**
 * Permission matrix for a site: rows = standard users, columns = active movement types.
 * Admin-only — lets the admin toggle each cell (site × user × movement type).
 */
export function PermissionMatrix({ siteId }: { siteId: string }) {
  const { db, savePermission } = useData();
  const { profile } = useAuth();

  const standardUsers = useMemo(
    () => db.users.filter((u) => u.active && u.role === "user").sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [db.users],
  );

  const activeTypes = useMemo(
    () => db.movementTypes.filter((m) => m.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    [db.movementTypes],
  );

  const isAllowed = (userId: string, mtId: string): boolean => {
    return db.siteUserPermissions.some(
      (p) => p.siteId === siteId && p.userId === userId && p.movementTypeId === mtId && p.allowed,
    );
  };

  if (standardUsers.length === 0) {
    return (
      <Card className="flex flex-col gap-2">
        <SectionHeader title="Permissões de Movimentação" />
        <p className="py-2 text-sm text-app-muted">
          Nenhum usuário padrão cadastrado. As permissões por obra ficam disponíveis quando houver usuários com perfil "Usuário Padrão".
        </p>
      </Card>
    );
  }

  if (activeTypes.length === 0) {
    return (
      <Card className="flex flex-col gap-2">
        <SectionHeader title="Permissões de Movimentação" />
        <p className="py-2 text-sm text-app-muted">
          Nenhum tipo de movimentação ativo. Cadastre tipos em "Tipos de Movimentação" para configurar permissões.
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-3">
      <SectionHeader title="Permissões de Movimentação" />
      <p className="text-xs text-app-muted">
        Marque quais tipos de movimentação cada usuário padrão pode executar nesta obra.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-app-card px-2 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-app-muted">
                Usuário
              </th>
              {activeTypes.map((mt) => (
                <th
                  key={mt.id}
                  className="min-w-[80px] px-1 py-2 text-center text-[10px] font-bold uppercase leading-tight tracking-wide text-app-muted"
                >
                  {mt.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {standardUsers.map((u) => (
              <tr key={u.id} className="border-t border-app-separator">
                <td className="sticky left-0 z-10 bg-app-card px-2 py-2.5">
                  <p className="text-sm font-semibold text-white">{u.name || u.email}</p>
                  <p className="truncate text-[10px] text-app-muted">{u.email}</p>
                </td>
                {activeTypes.map((mt) => {
                  const allowed = isAllowed(u.id, mt.id);
                  return (
                    <td key={mt.id} className="px-1 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => void savePermission(siteId, u.id, mt.id, !allowed)}
                        className={cn(
                          "mx-auto flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                          allowed
                            ? "bg-status-green/20 text-status-green hover:bg-status-green/30"
                            : "bg-app-elevated text-app-muted/40 hover:bg-app-elevated/70",
                        )}
                      >
                        {allowed ? <Check size={16} strokeWidth={3} /> : <Minus size={14} />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {profile && (
        <p className="text-[10px] text-app-muted/60">
          Admin: {profile.name} · Alterações são registradas no log de atividades.
        </p>
      )}
    </Card>
  );
}
