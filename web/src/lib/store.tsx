import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "./supabase";
import { useAuth } from "./auth";
import type {
  ActivityAction,
  ActivityLog,
  AppSettings,
  AuditFrequency,
  AuditRecord,
  AuditStatus,
  ConstructionSite,
  DB,
  Employee,
  MaintenanceRecord,
  MovementTypeEntity,
  RentalCompany,
  SiteUserPermission,
  Tool,
  ToolAttachment,
  ToolMovement,
  UserProfile,
  UserRole,
} from "./types";
import { AUDIT_FREQUENCY_DAYS, computeNextAuditDate, newId } from "./types";

function mapTool(row: Record<string, unknown>): Tool {
  return {
    id: row.id as string,
    name: row.name as string,
    brand: (row.brand as string) ?? "",
    model: (row.model as string) ?? "",
    serialNumber: (row.serial_number as string) ?? "",
    ownership: row.ownership as Tool["ownership"],
    baseStatus: row.base_status as Tool["baseStatus"],
    notes: (row.notes as string) ?? "",
    purchaseDate: row.purchase_date ? (row.purchase_date as string) : null,
    dailyRentalCost: Number(row.daily_rental_cost) ?? 0,
    rentalStartDate: row.rental_start_date ? (row.rental_start_date as string) : null,
    rentalEndDate: row.rental_end_date ? (row.rental_end_date as string) : null,
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    rentalCompanyId: (row.rental_company_id as string) ?? null,
    currentSiteId: (row.current_site_id as string) ?? null,
    currentEmployeeId: (row.current_employee_id as string) ?? null,
    auditFrequency: (row.audit_frequency as AuditFrequency) ?? "monthly",
    lastAuditDate: (row.last_audit_date as string) ?? null,
    nextAuditDate: (row.next_audit_date as string) ?? null,
    statusUpdatedAt: (row.status_updated_at as string) ?? null,
  };
}

function mapCompany(row: Record<string, unknown>): RentalCompany {
  return {
    id: row.id as string,
    name: row.name as string,
    cnpj: (row.cnpj as string) ?? "",
    phone: (row.phone as string) ?? "",
    email: (row.email as string) ?? "",
    address: (row.address as string) ?? "",
    contactPerson: (row.contact_person as string) ?? "",
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
  };
}

function mapSite(row: Record<string, unknown>): ConstructionSite {
  return {
    id: row.id as string,
    name: row.name as string,
    address: (row.address as string) ?? "",
    responsibleName: (row.responsible_name as string) ?? "",
    responsiblePhone: (row.responsible_phone as string) ?? "",
    status: row.status as ConstructionSite["status"],
    startDate: row.start_date ? (row.start_date as string) : null,
    notes: (row.notes as string) ?? "",
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
  };
}

function mapEmployee(row: Record<string, unknown>): Employee {
  return {
    id: row.id as string,
    name: row.name as string,
    role: (row.role as string) ?? "",
    level: (row.level as string) ?? "",
    userId: row.user_id ? (row.user_id as string) : null,
    phone: (row.phone as string) ?? "",
    email: (row.email as string) ?? "",
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
  };
}

function mapMovement(row: Record<string, unknown>): ToolMovement {
  return {
    id: row.id as string,
    toolId: row.tool_id as string,
    type: row.type as ToolMovement["type"],
    description: (row.description as string) ?? "",
    oldValue: (row.old_value as string) ?? "",
    newValue: (row.new_value as string) ?? "",
    timestamp: (row.timestamp as string) ?? new Date().toISOString(),
    attachmentIds: [],
    userId: (row.user_id as string) ?? null,
    userName: (row.user_name as string) ?? "",
  };
}

function mapAttachment(row: Record<string, unknown>): ToolAttachment {
  return {
    id: row.id as string,
    toolId: row.tool_id as string,
    movementId: (row.movement_id as string) ?? null,
    type: row.type as ToolAttachment["type"],
    purpose: row.purpose as ToolAttachment["purpose"],
    dataUrl: row.data_url as string,
    caption: (row.caption as string) ?? "",
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
  };
}

function mapAudit(row: Record<string, unknown>): AuditRecord {
  return {
    id: row.id as string,
    toolId: row.tool_id as string,
    userId: (row.user_id as string) ?? null,
    userName: (row.user_name as string) ?? "",
    status: row.status as AuditStatus,
    damageDescription: (row.damage_description as string) ?? "",
    auditDate: (row.audit_date as string) ?? new Date().toISOString(),
    nextAuditDate: (row.next_audit_date as string) ?? null,
  };
}

function mapMaintenance(row: Record<string, unknown>): MaintenanceRecord {
  return {
    id: row.id as string,
    toolId: row.tool_id as string,
    userId: (row.user_id as string) ?? null,
    userName: (row.user_name as string) ?? "",
    repairCost: Number(row.repair_cost) ?? 0,
    invoiceNumber: (row.invoice_number as string) ?? "",
    invoiceAttachmentId: (row.invoice_attachment_id as string) ?? null,
    startDate: (row.start_date as string) ?? null,
    returnDate: (row.return_date as string) ?? null,
    status: row.status as MaintenanceRecord["status"],
  };
}

function mapActivityLog(row: Record<string, unknown>): ActivityLog {
  return {
    id: row.id as string,
    userId: (row.user_id as string) ?? null,
    userEmail: (row.user_email as string) ?? "",
    userName: (row.user_name as string) ?? "",
    action: row.action as ActivityAction,
    entityType: (row.entity_type as string) ?? "",
    entityId: (row.entity_id as string) ?? "",
    entityName: (row.entity_name as string) ?? "",
    oldValues: (row.old_values as Record<string, unknown>) ?? null,
    newValues: (row.new_values as Record<string, unknown>) ?? null,
    siteId: (row.site_id as string) ?? null,
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
  };
}

function mapProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    email: row.email as string,
    name: (row.name as string) ?? "",
    role: (row.role as string) as UserProfile["role"],
    active: row.active as boolean,
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
  };
}

function mapSettings(row: Record<string, unknown>): AppSettings {
  return {
    notificationsEnabled: Boolean(row.notifications_enabled),
    alertDaysBefore: Number(row.alert_days_before) ?? 3,
  };
}

function mapMovementType(row: Record<string, unknown>): MovementTypeEntity {
  return {
    id: row.id as string,
    name: (row.name as string) ?? "",
    description: (row.description as string) ?? "",
    isActive: Boolean(row.is_active),
    isSystem: Boolean(row.is_system),
    sortOrder: Number(row.sort_order) ?? 0,
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
  };
}

function mapSiteUserPermission(row: Record<string, unknown>): SiteUserPermission {
  return {
    id: row.id as string,
    siteId: (row.site_id as string) ?? "",
    userId: (row.user_id as string) ?? "",
    movementTypeId: (row.movement_type_id as string) ?? "",
    allowed: Boolean(row.allowed),
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
  };
}

const EMPTY_DB: DB = {
  tools: [],
  companies: [],
  sites: [],
  employees: [],
  movements: [],
  attachments: [],
  audits: [],
  maintenance: [],
  activityLogs: [],
  users: [],
  movementTypes: [],
  siteUserPermissions: [],
  settings: { notificationsEnabled: false, alertDaysBefore: 3 },
};

interface DataContextValue {
  db: DB;
  loading: boolean;
  saveTool: (tool: Tool) => Promise<void>;
  deleteTool: (id: string) => Promise<void>;
  saveCompany: (company: RentalCompany) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  saveSite: (site: ConstructionSite) => Promise<void>;
  deleteSite: (id: string) => Promise<void>;
  saveEmployee: (employee: Employee) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  addMovements: (movements: ToolMovement[]) => Promise<void>;
  addAttachments: (attachments: ToolAttachment[]) => Promise<void>;
  removeAttachment: (id: string) => Promise<void>;
  confirmAudit: (toolId: string) => Promise<void>;
  reportDamage: (toolId: string, description: string) => Promise<void>;
  startMaintenance: (toolId: string) => Promise<void>;
  returnFromMaintenance: (toolId: string, repairCost: number, invoiceNumber: string, invoiceAttachment: ToolAttachment | null) => Promise<void>;
  saveUser: (user: UserProfile, previousRole?: UserRole) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  saveMovementType: (mt: MovementTypeEntity) => Promise<void>;
  toggleMovementType: (id: string, isActive: boolean) => Promise<void>;
  savePermission: (siteId: string, userId: string, movementTypeId: string, allowed: boolean) => Promise<void>;
  hasPermission: (userId: string, siteId: string | null, movementTypeName: string) => boolean;
}

function useDataHook() {
  const { user, profile } = useAuth();
  const [db, setDB] = useState<DB>(EMPTY_DB);
  const [loading, setLoading] = useState(true);

  // Load all data when user changes
  useEffect(() => {
    if (!user) {
      setDB(EMPTY_DB);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadAll() {
      setLoading(true);
      try {
        const [
          toolsRes,
          companiesRes,
          sitesRes,
          employeesRes,
          movementsRes,
          attachmentsRes,
          auditsRes,
          maintenanceRes,
          activityRes,
          profilesRes,
          settingsRes,
          movementTypesRes,
          permissionsRes,
        ] = await Promise.all([
          supabase.from("tools").select("*"),
          supabase.from("rental_companies").select("*"),
          supabase.from("construction_sites").select("*"),
          supabase.from("employees").select("*"),
          supabase.from("tool_movements").select("*"),
          supabase.from("tool_attachments").select("*"),
          supabase.from("audit_records").select("*"),
          supabase.from("maintenance_records").select("*"),
          supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(500),
          supabase.from("profiles").select("*"),
          supabase.from("app_settings").select("*").eq("id", 1).maybeSingle(),
          supabase.from("movement_types").select("*").order("sort_order", { ascending: true }),
          supabase.from("site_user_permissions").select("*"),
        ]);

        if (cancelled) return;

        if (cancelled) return;

        // Link movement attachment IDs
        const movements = (movementsRes.data ?? []).map((r) => {
          const m = mapMovement(r as Record<string, unknown>);
          m.attachmentIds = (attachmentsRes.data ?? [])
            .filter((a) => a.movement_id === m.id)
            .map((a) => a.id as string);
          return m;
        });

        setDB({
          tools: (toolsRes.data ?? []).map((r) => mapTool(r as Record<string, unknown>)),
          companies: (companiesRes.data ?? []).map((r) => mapCompany(r as Record<string, unknown>)),
          sites: (sitesRes.data ?? []).map((r) => mapSite(r as Record<string, unknown>)),
          employees: (employeesRes.data ?? []).map((r) => mapEmployee(r as Record<string, unknown>)),
          movements,
          attachments: (attachmentsRes.data ?? []).map((r) => mapAttachment(r as Record<string, unknown>)),
          audits: (auditsRes.data ?? []).map((r) => mapAudit(r as Record<string, unknown>)),
          maintenance: (maintenanceRes.data ?? []).map((r) => mapMaintenance(r as Record<string, unknown>)),
          activityLogs: (activityRes.data ?? []).map((r) => mapActivityLog(r as Record<string, unknown>)),
          users: (profilesRes.data ?? []).map((r) => mapProfile(r as Record<string, unknown>)),
          movementTypes: (movementTypesRes.data ?? []).map((r) => mapMovementType(r as Record<string, unknown>)),
          siteUserPermissions: (permissionsRes.data ?? []).map((r) => mapSiteUserPermission(r as Record<string, unknown>)),
          settings: settingsRes.data ? mapSettings(settingsRes.data as Record<string, unknown>) : { notificationsEnabled: false, alertDaysBefore: 3 },
        });
      } catch (error) {
        console.error("Failed to load data", error);
        toast.error("Falha ao carregar dados do servidor");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadAll();

    // Realtime subscriptions
    const channel = supabase
      .channel("toolsloc-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tools" }, (payload) => {
        setDB((prev) => {
          if (payload.eventType === "DELETE") {
            return { ...prev, tools: prev.tools.filter((t) => t.id !== (payload.old as Record<string, unknown>).id) };
          }
          const newRow = mapTool(payload.new as Record<string, unknown>);
          const exists = prev.tools.some((t) => t.id === newRow.id);
          return { ...prev, tools: exists ? prev.tools.map((t) => (t.id === newRow.id ? newRow : t)) : [...prev.tools, newRow] };
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "rental_companies" }, (payload) => {
        setDB((prev) => {
          if (payload.eventType === "DELETE") return { ...prev, companies: prev.companies.filter((c) => c.id !== (payload.old as Record<string, unknown>).id) };
          const newRow = mapCompany(payload.new as Record<string, unknown>);
          const exists = prev.companies.some((c) => c.id === newRow.id);
          return { ...prev, companies: exists ? prev.companies.map((c) => (c.id === newRow.id ? newRow : c)) : [...prev.companies, newRow] };
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "construction_sites" }, (payload) => {
        setDB((prev) => {
          if (payload.eventType === "DELETE") return { ...prev, sites: prev.sites.filter((s) => s.id !== (payload.old as Record<string, unknown>).id) };
          const newRow = mapSite(payload.new as Record<string, unknown>);
          const exists = prev.sites.some((s) => s.id === newRow.id);
          return { ...prev, sites: exists ? prev.sites.map((s) => (s.id === newRow.id ? newRow : s)) : [...prev.sites, newRow] };
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "employees" }, (payload) => {
        setDB((prev) => {
          if (payload.eventType === "DELETE") return { ...prev, employees: prev.employees.filter((e) => e.id !== (payload.old as Record<string, unknown>).id) };
          const newRow = mapEmployee(payload.new as Record<string, unknown>);
          const exists = prev.employees.some((e) => e.id === newRow.id);
          return { ...prev, employees: exists ? prev.employees.map((e) => (e.id === newRow.id ? newRow : e)) : [...prev.employees, newRow] };
        });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "tool_movements" }, (payload) => {
        const newRow = mapMovement(payload.new as Record<string, unknown>);
        setDB((prev) => ({
          ...prev,
          movements: prev.movements.some((m) => m.id === newRow.id) ? prev.movements : [...prev.movements, newRow],
        }));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "tool_attachments" }, (payload) => {
        setDB((prev) => {
          if (payload.eventType === "DELETE") return { ...prev, attachments: prev.attachments.filter((a) => a.id !== (payload.old as Record<string, unknown>).id) };
          const newRow = mapAttachment(payload.new as Record<string, unknown>);
          const exists = prev.attachments.some((a) => a.id === newRow.id);
          return { ...prev, attachments: exists ? prev.attachments.map((a) => (a.id === newRow.id ? newRow : a)) : [...prev.attachments, newRow] };
        });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_records" }, (payload) => {
        const newRow = mapAudit(payload.new as Record<string, unknown>);
        setDB((prev) => ({
          ...prev,
          audits: prev.audits.some((a) => a.id === newRow.id) ? prev.audits : [...prev.audits, newRow],
        }));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "maintenance_records" }, (payload) => {
        setDB((prev) => {
          if (payload.eventType === "DELETE") return { ...prev, maintenance: prev.maintenance.filter((m) => m.id !== (payload.old as Record<string, unknown>).id) };
          const newRow = mapMaintenance(payload.new as Record<string, unknown>);
          const exists = prev.maintenance.some((m) => m.id === newRow.id);
          return { ...prev, maintenance: exists ? prev.maintenance.map((m) => (m.id === newRow.id ? newRow : m)) : [...prev.maintenance, newRow] };
        });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_logs" }, (payload) => {
        const newRow = mapActivityLog(payload.new as Record<string, unknown>);
        setDB((prev) => ({
          ...prev,
          activityLogs: [newRow, ...prev.activityLogs].slice(0, 500),
        }));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, (payload) => {
        setDB((prev) => {
          if (payload.eventType === "DELETE") return { ...prev, users: prev.users.filter((u) => u.id !== (payload.old as Record<string, unknown>).id) };
          const newRow = mapProfile(payload.new as Record<string, unknown>);
          const exists = prev.users.some((u) => u.id === newRow.id);
          return { ...prev, users: exists ? prev.users.map((u) => (u.id === newRow.id ? newRow : u)) : [...prev.users, newRow] };
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "app_settings" }, (payload) => {
        if (payload.new) {
          setDB((prev) => ({ ...prev, settings: mapSettings(payload.new as Record<string, unknown>) }));
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "movement_types" }, (payload) => {
        setDB((prev) => {
          if (payload.eventType === "DELETE") return { ...prev, movementTypes: prev.movementTypes.filter((m) => m.id !== (payload.old as Record<string, unknown>).id) };
          const newRow = mapMovementType(payload.new as Record<string, unknown>);
          const exists = prev.movementTypes.some((m) => m.id === newRow.id);
          return { ...prev, movementTypes: exists ? prev.movementTypes.map((m) => (m.id === newRow.id ? newRow : m)) : [...prev.movementTypes, newRow] };
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "site_user_permissions" }, (payload) => {
        setDB((prev) => {
          if (payload.eventType === "DELETE") return { ...prev, siteUserPermissions: prev.siteUserPermissions.filter((p) => p.id !== (payload.old as Record<string, unknown>).id) };
          const newRow = mapSiteUserPermission(payload.new as Record<string, unknown>);
          const exists = prev.siteUserPermissions.some((p) => p.id === newRow.id);
          return { ...prev, siteUserPermissions: exists ? prev.siteUserPermissions.map((p) => (p.id === newRow.id ? newRow : p)) : [...prev.siteUserPermissions, newRow] };
        });
      })
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [user]);

  // Logging helper
  const logActivity = useCallback(
    async (
      action: ActivityAction,
      entityType: string,
      entityId: string,
      entityName: string,
      oldValues?: Record<string, unknown>,
      newValues?: Record<string, unknown>,
      siteId?: string | null,
    ) => {
      if (!user || !profile) return;
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        user_email: profile.email,
        user_name: profile.name || profile.email,
        action,
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        old_values: oldValues ?? null,
        new_values: newValues ?? null,
        site_id: siteId ?? null,
      });
    },
    [user, profile],
  );

  const insertMovements = useCallback(
    async (movements: ToolMovement[]) => {
      if (movements.length === 0) return;
      const rows = movements.map((m) => ({
        id: m.id,
        tool_id: m.toolId,
        type: m.type,
        description: m.description,
        old_value: m.oldValue,
        new_value: m.newValue,
        timestamp: m.timestamp,
        user_id: user?.id ?? null,
        user_name: profile?.name ?? profile?.email ?? "",
      }));
      const { error } = await supabase.from("tool_movements").insert(rows);
      if (error) console.error("Failed to insert movements", error);
    },
    [user, profile],
  );

  const saveTool = useCallback(
    async (tool: Tool) => {
      const { data: existingTool } = await supabase.from("tools").select("id, base_status").eq("id", tool.id).maybeSingle();
      const isNew = !existingTool;
      const statusChanged = !isNew && (existingTool as Record<string, unknown>)?.base_status !== tool.baseStatus;

      const row = {
        id: tool.id,
        name: tool.name,
        brand: tool.brand,
        model: tool.model,
        serial_number: tool.serialNumber,
        ownership: tool.ownership,
        base_status: tool.baseStatus,
        notes: tool.notes,
        purchase_date: tool.purchaseDate,
        daily_rental_cost: tool.dailyRentalCost,
        rental_start_date: tool.rentalStartDate,
        rental_end_date: tool.rentalEndDate,
        rental_company_id: tool.rentalCompanyId,
        current_site_id: tool.currentSiteId,
        current_employee_id: tool.currentEmployeeId,
        audit_frequency: tool.auditFrequency,
        last_audit_date: tool.lastAuditDate,
        next_audit_date: tool.nextAuditDate ?? computeNextAuditDate(tool.auditFrequency),
        status_updated_at: statusChanged ? new Date().toISOString() : isNew ? new Date().toISOString() : undefined,
      };

      const { error } = await supabase.from("tools").upsert(row);
      if (error) {
        toast.error("Falha ao salvar ferramenta");
        console.error(error);
        return;
      }

      if (isNew) {
        await insertMovements([
          {
            id: newId(),
            toolId: tool.id,
            type: "created",
            description: "Ferramenta criada",
            oldValue: "",
            newValue: "",
            timestamp: new Date().toISOString(),
            attachmentIds: [],
            userId: user?.id ?? null,
            userName: profile?.name ?? "",
          },
        ]);
        await logActivity("create", "tool", tool.id, tool.name, undefined, { name: tool.name, ownership: tool.ownership });
      } else {
        await logActivity("edit", "tool", tool.id, tool.name, undefined, { name: tool.name });
      }
    },
    [insertMovements, logActivity, user, profile],
  );

  const deleteTool = useCallback(
    async (id: string) => {
      const tool = db.tools.find((t) => t.id === id);
      const { error } = await supabase.from("tools").delete().eq("id", id);
      if (error) {
        toast.error("Falha ao excluir ferramenta");
        return;
      }
      if (tool) await logActivity("delete", "tool", id, tool.name, { name: tool.name });
    },
    [db.tools, logActivity],
  );

  const saveCompany = useCallback(
    async (company: RentalCompany) => {
      const { data: existing } = await supabase.from("rental_companies").select("id").eq("id", company.id).maybeSingle();
      const isNew = !existing;
      const { error } = await supabase.from("rental_companies").upsert({
        id: company.id,
        name: company.name,
        cnpj: company.cnpj,
        phone: company.phone,
        email: company.email,
        address: company.address,
        contact_person: company.contactPerson,
      });
      if (error) {
        toast.error("Falha ao salvar locadora");
        return;
      }
      await logActivity(isNew ? "create" : "edit", "company", company.id, company.name);
    },
    [logActivity],
  );

  const deleteCompany = useCallback(
    async (id: string) => {
      const company = db.companies.find((c) => c.id === id);
      const { error } = await supabase.from("rental_companies").delete().eq("id", id);
      if (error) {
        toast.error("Falha ao excluir locadora");
        return;
      }
      if (company) await logActivity("delete", "company", id, company.name);
    },
    [db.companies, logActivity],
  );

  const saveSite = useCallback(
    async (site: ConstructionSite) => {
      const { data: existing } = await supabase.from("construction_sites").select("id").eq("id", site.id).maybeSingle();
      const isNew = !existing;
      const { error } = await supabase.from("construction_sites").upsert({
        id: site.id,
        name: site.name,
        address: site.address,
        responsible_name: site.responsibleName,
        responsible_phone: site.responsiblePhone,
        status: site.status,
        start_date: site.startDate,
        notes: site.notes,
      });
      if (error) {
        toast.error("Falha ao salvar obra");
        return;
      }
      await logActivity(isNew ? "create" : "edit", "site", site.id, site.name, undefined, undefined, site.id);
    },
    [logActivity],
  );

  const deleteSite = useCallback(
    async (id: string) => {
      const site = db.sites.find((s) => s.id === id);
      const { error } = await supabase.from("construction_sites").delete().eq("id", id);
      if (error) {
        toast.error("Falha ao excluir obra");
        return;
      }
      if (site) await logActivity("delete", "site", id, site.name, undefined, undefined, id);
    },
    [db.sites, logActivity],
  );

  const saveEmployee = useCallback(
    async (employee: Employee) => {
      const { data: existing } = await supabase.from("employees").select("id").eq("id", employee.id).maybeSingle();
      const isNew = !existing;
      const { error } = await supabase.from("employees").upsert({
        id: employee.id,
        name: employee.name,
        role: employee.role,
        level: employee.level,
        user_id: employee.userId,
        phone: employee.phone,
        email: employee.email,
      });
      if (error) {
        toast.error("Falha ao salvar funcionário");
        return;
      }
      await logActivity(isNew ? "create" : "edit", "employee", employee.id, employee.name);
    },
    [logActivity],
  );

  const deleteEmployee = useCallback(
    async (id: string) => {
      const emp = db.employees.find((e) => e.id === id);
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) {
        toast.error("Falha ao excluir funcionário");
        return;
      }
      if (emp) await logActivity("delete", "employee", id, emp.name);
    },
    [db.employees, logActivity],
  );

  const addMovements = useCallback(
    async (movements: ToolMovement[]) => {
      await insertMovements(movements);
    },
    [insertMovements],
  );

  const addAttachments = useCallback(async (attachments: ToolAttachment[]) => {
    if (attachments.length === 0) return;
    const rows = attachments.map((a) => ({
      id: a.id,
      tool_id: a.toolId,
      movement_id: a.movementId,
      type: a.type,
      purpose: a.purpose,
      data_url: a.dataUrl,
      caption: a.caption,
    }));
    const { error } = await supabase.from("tool_attachments").insert(rows);
    if (error) {
      toast.error("Falha ao salvar anexo");
      console.error(error);
    }
  }, []);

  const removeAttachment = useCallback(async (id: string) => {
    const { error } = await supabase.from("tool_attachments").delete().eq("id", id);
    if (error) toast.error("Falha ao remover anexo");
  }, []);

  const confirmAudit = useCallback(
    async (toolId: string) => {
      const tool = db.tools.find((t) => t.id === toolId);
      if (!tool) return;
      const now = new Date();
      const nextDate = computeNextAuditDate(tool.auditFrequency, now);

      await supabase.from("audit_records").insert({
        tool_id: toolId,
        user_id: user?.id ?? null,
        user_name: profile?.name ?? "",
        status: "confirmed",
        audit_date: now.toISOString(),
        next_audit_date: nextDate,
      });

      await supabase
        .from("tools")
        .update({ last_audit_date: now.toISOString(), next_audit_date: nextDate })
        .eq("id", toolId);

      await insertMovements([
        {
          id: newId(),
          toolId,
          type: "auditConfirmed",
          description: "Auditoria confirmada — ferramenta conferida no local",
          oldValue: "",
          newValue: "",
          timestamp: now.toISOString(),
          attachmentIds: [],
          userId: user?.id ?? null,
          userName: profile?.name ?? "",
        },
      ]);

      await logActivity("audit", "audit", toolId, tool.name, undefined, { status: "confirmed" }, tool.currentSiteId);
    },
    [db.tools, user, profile, insertMovements, logActivity],
  );

  const reportDamage = useCallback(
    async (toolId: string, description: string) => {
      const tool = db.tools.find((t) => t.id === toolId);
      if (!tool) return;
      const now = new Date();
      const nextDate = computeNextAuditDate(tool.auditFrequency, now);

      await supabase.from("audit_records").insert({
        tool_id: toolId,
        user_id: user?.id ?? null,
        user_name: profile?.name ?? "",
        status: "damaged",
        damage_description: description,
        audit_date: now.toISOString(),
        next_audit_date: nextDate,
      });

      await supabase
        .from("tools")
        .update({
          base_status: "maintenance",
          status_updated_at: now.toISOString(),
          last_audit_date: now.toISOString(),
          next_audit_date: nextDate,
        })
        .eq("id", toolId);

      await insertMovements([
        {
          id: newId(),
          toolId,
          type: "auditDamaged",
          description: `Avaria registrada: ${description}`,
          oldValue: tool.baseStatus,
          newValue: "maintenance",
          timestamp: now.toISOString(),
          attachmentIds: [],
          userId: user?.id ?? null,
          userName: profile?.name ?? "",
        },
      ]);

      await logActivity("audit", "audit", toolId, tool.name, { status: tool.baseStatus }, { status: "damaged", description }, tool.currentSiteId);
    },
    [db.tools, user, profile, insertMovements, logActivity],
  );

  const startMaintenance = useCallback(
    async (toolId: string) => {
      const tool = db.tools.find((t) => t.id === toolId);
      if (!tool) return;
      const now = new Date();

      await supabase.from("maintenance_records").insert({
        tool_id: toolId,
        user_id: user?.id ?? null,
        user_name: profile?.name ?? "",
        start_date: now.toISOString(),
        status: "active",
      });

      const oldSite = tool.currentSiteId;
      await supabase.from("tools").update({ base_status: "maintenance", status_updated_at: now.toISOString(), current_site_id: null }).eq("id", toolId);

      const siteName = oldSite ? db.sites.find((s) => s.id === oldSite)?.name ?? "—" : "—";
      await insertMovements([
        {
          id: newId(),
          toolId,
          type: "maintenanceStarted",
          description: "Transferida para manutenção",
          oldValue: siteName,
          newValue: "Manutenção",
          timestamp: now.toISOString(),
          attachmentIds: [],
          userId: user?.id ?? null,
          userName: profile?.name ?? "",
        },
      ]);

      await logActivity("maintenance", "maintenance", toolId, tool.name, { status: tool.baseStatus, site: oldSite }, { status: "maintenance" }, oldSite);
    },
    [db.tools, db.sites, user, profile, insertMovements, logActivity],
  );

  const returnFromMaintenance = useCallback(
    async (toolId: string, repairCost: number, invoiceNumber: string, invoiceAttachment: ToolAttachment | null) => {
      const tool = db.tools.find((t) => t.id === toolId);
      if (!tool) return;
      const now = new Date();

      // Find active maintenance record
      const activeRecord = db.maintenance.find((m) => m.toolId === toolId && m.status === "active");

      if (invoiceAttachment) {
        await addAttachments([invoiceAttachment]);
      }

      if (activeRecord) {
        await supabase
          .from("maintenance_records")
          .update({
            repair_cost: repairCost,
            invoice_number: invoiceNumber,
            invoice_attachment_id: invoiceAttachment?.id ?? null,
            return_date: now.toISOString(),
            status: "completed",
          })
          .eq("id", activeRecord.id);
      }

      await supabase.from("tools").update({ base_status: "available", status_updated_at: now.toISOString() }).eq("id", toolId);

      await insertMovements([
        {
          id: newId(),
          toolId,
          type: "maintenanceReturned",
          description: `Retorno de manutenção — NF: ${invoiceNumber}, custo: R$ ${repairCost.toFixed(2)}`,
          oldValue: "Manutenção",
          newValue: "Disponível",
          timestamp: now.toISOString(),
          attachmentIds: invoiceAttachment ? [invoiceAttachment.id] : [],
          userId: user?.id ?? null,
          userName: profile?.name ?? "",
        },
      ]);

      await logActivity("maintenance", "maintenance", toolId, tool.name, { status: "maintenance" }, { status: "available", repairCost, invoiceNumber });
    },
    [db.tools, db.maintenance, user, profile, insertMovements, logActivity, addAttachments],
  );

  const saveUser = useCallback(
    async (updatedUser: UserProfile, previousRole?: UserRole) => {
      const { error } = await supabase
        .from("profiles")
        .update({ name: updatedUser.name, role: updatedUser.role, active: updatedUser.active })
        .eq("id", updatedUser.id);
      if (error) {
        toast.error("Falha ao atualizar usuário");
        return;
      }
      if (previousRole && previousRole !== updatedUser.role) {
        await logActivity("roleChange", "user", updatedUser.id, updatedUser.name, { role: previousRole }, { role: updatedUser.role });
      } else {
        await logActivity("edit", "user", updatedUser.id, updatedUser.name);
      }
    },
    [logActivity],
  );

  const deleteUser = useCallback(
    async (id: string) => {
      const u = db.users.find((x) => x.id === id);
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) {
        toast.error("Falha ao remover usuário");
        return;
      }
      if (u) await logActivity("delete", "user", id, u.name || u.email);
    },
    [db.users, logActivity],
  );

  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    const current = db.settings;
    const { error } = await supabase
      .from("app_settings")
      .upsert({
        id: 1,
        notifications_enabled: partial.notificationsEnabled ?? current.notificationsEnabled,
        alert_days_before: partial.alertDaysBefore ?? current.alertDaysBefore,
      });
    if (error) toast.error("Falha ao salvar configurações");
  }, [db.settings]);

  // MARK: - Movement types CRUD

  const saveMovementType = useCallback(
    async (mt: MovementTypeEntity) => {
      const { data: existing } = await supabase.from("movement_types").select("id").eq("id", mt.id).maybeSingle();
      const isNew = !existing;
      const { error } = await supabase.from("movement_types").upsert({
        id: mt.id,
        name: mt.name,
        description: mt.description,
        is_active: mt.isActive,
        is_system: mt.isSystem,
        sort_order: mt.sortOrder,
      });
      if (error) {
        toast.error("Falha ao salvar tipo de movimentação");
        return;
      }
      await logActivity("movementTypeManage", "movement_type", mt.id, mt.name, undefined, { name: mt.name, description: mt.description, isNew });
    },
    [logActivity],
  );

  const toggleMovementType = useCallback(
    async (id: string, isActive: boolean) => {
      const mt = db.movementTypes.find((m) => m.id === id);
      const { error } = await supabase.from("movement_types").update({ is_active: isActive, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) {
        toast.error("Falha ao atualizar tipo de movimentação");
        return;
      }
      if (mt) await logActivity("movementTypeManage", "movement_type", id, mt.name, { isActive: mt.isActive }, { isActive });
    },
    [db.movementTypes, logActivity],
  );

  // MARK: - Site user permissions

  const savePermission = useCallback(
    async (siteId: string, userId: string, movementTypeId: string, allowed: boolean) => {
      const { data: existing } = await supabase
        .from("site_user_permissions")
        .select("id")
        .eq("site_id", siteId)
        .eq("user_id", userId)
        .eq("movement_type_id", movementTypeId)
        .maybeSingle();

      if (existing) {
        await supabase.from("site_user_permissions").update({ allowed, updated_at: new Date().toISOString() }).eq("id", (existing as Record<string, unknown>).id as string);
      } else {
        await supabase.from("site_user_permissions").insert({ site_id: siteId, user_id: userId, movement_type_id: movementTypeId, allowed });
      }

      const mt = db.movementTypes.find((m) => m.id === movementTypeId);
      const site = db.sites.find((s) => s.id === siteId);
      const targetUser = db.users.find((u) => u.id === userId);
      if (mt && site && targetUser) {
        await logActivity("permissionChange", "permission", `${siteId}:${userId}:${movementTypeId}`, `${targetUser.name} — ${site.name} — ${mt.name}`, undefined, { allowed, movementType: mt.name, site: site.name, user: targetUser.name }, siteId);
      }
    },
    [db.movementTypes, db.sites, db.users, logActivity],
  );

  const hasPermission = useCallback(
    (userId: string, siteId: string | null, movementTypeName: string): boolean => {
      if (!siteId) return false;
      const mt = db.movementTypes.find((m) => m.name === movementTypeName && m.isActive);
      if (!mt) return false;
      return db.siteUserPermissions.some(
        (p) => p.siteId === siteId && p.userId === userId && p.movementTypeId === mt.id && p.allowed,
      );
    },
    [db.movementTypes, db.siteUserPermissions],
  );

  return {
    db,
    loading,
    saveTool,
    deleteTool,
    saveCompany,
    deleteCompany,
    saveSite,
    deleteSite,
    saveEmployee,
    deleteEmployee,
    addMovements,
    addAttachments,
    removeAttachment,
    confirmAudit,
    reportDamage,
    startMaintenance,
    returnFromMaintenance,
    saveUser,
    deleteUser,
    updateSettings,
    saveMovementType,
    toggleMovementType,
    savePermission,
    hasPermission,
  };
}

export const [DataProvider, useData] = createContextHook(useDataHook);

export function useToolRelations() {
  const { db } = useData();
  return useMemo(
    () => ({
      companyById: (id: string | null) => (id ? db.companies.find((c) => c.id === id) ?? null : null),
      siteById: (id: string | null) => (id ? db.sites.find((s) => s.id === id) ?? null : null),
      employeeById: (id: string | null) => (id ? db.employees.find((e) => e.id === id) ?? null : null),
    }),
    [db.companies, db.sites, db.employees],
  );
}
