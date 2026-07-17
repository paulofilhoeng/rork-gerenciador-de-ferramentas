/** Shared domain types for ToolsLoc — now backed by Supabase. */

export type ToolOwnership = "own" | "rented" | "client";
export type ToolStatus = "available" | "inUse" | "maintenance" | "overdue" | "disabled";
export type RentalPeriod = "daily" | "weekly" | "monthly";
export type SiteStatus = "active" | "paused" | "completed";
export type AttachmentType = "photo" | "video";
export type AttachmentPurpose = "general" | "serialNumber" | "delivery" | "receipt" | "condition" | "invoice";
export type StatusColor = "green" | "blue" | "red" | "orange" | "gray";
export type AuditFrequency = "weekly" | "biweekly" | "monthly";
export type AuditStatus = "confirmed" | "damaged";
export type MaintenanceStatus = "active" | "completed";
export type UserRole = "admin" | "user";
export type ActivityAction =
  | "create"
  | "edit"
  | "delete"
  | "move"
  | "audit"
  | "maintenance"
  | "roleChange"
  | "permissionChange"
  | "movementTypeManage"
  | "bulkImport";

export type MovementType =
  | "created"
  | "siteAssigned"
  | "siteRemoved"
  | "siteChanged"
  | "employeeAssigned"
  | "employeeRemoved"
  | "employeeChanged"
  | "statusChanged"
  | "rentalStarted"
  | "rentalEnded"
  | "ownershipChanged"
  | "notesChanged"
  | "auditConfirmed"
  | "auditDamaged"
  | "maintenanceStarted"
  | "maintenanceReturned";

export const OWNERSHIP_LABEL: Record<ToolOwnership, string> = {
  own: "Própria",
  rented: "Alugada",
  client: "Cliente",
};

export const TOOL_STATUS_LABEL: Record<ToolStatus, string> = {
  available: "Disponível",
  inUse: "Em Uso",
  maintenance: "Manutenção",
  overdue: "Atrasada",
  disabled: "Desativada",
};

export const TOOL_STATUS_COLOR: Record<ToolStatus, StatusColor> = {
  available: "green",
  inUse: "blue",
  maintenance: "gray",
  overdue: "red",
  disabled: "gray",
};

export const RENTAL_PERIOD_LABEL: Record<RentalPeriod, string> = {
  daily: "Diário",
  weekly: "Semanal",
  monthly: "Mensal",
};

/** Days covered by each rental period — used for cost conversion. */
export const RENTAL_PERIOD_DAYS: Record<RentalPeriod, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

export const SITE_STATUS_LABEL: Record<SiteStatus, string> = {
  active: "Ativa",
  paused: "Pausada",
  completed: "Concluída",
};

export const SITE_STATUS_COLOR: Record<SiteStatus, StatusColor> = {
  active: "green",
  paused: "orange",
  completed: "gray",
};

export const MOVEMENT_LABEL: Record<MovementType, string> = {
  created: "Ferramenta Criada",
  siteAssigned: "Obra Atribuída",
  siteRemoved: "Obra Removida",
  siteChanged: "Obra Alterada",
  employeeAssigned: "Responsável Atribuído",
  employeeRemoved: "Responsável Removido",
  employeeChanged: "Responsável Alterado",
  statusChanged: "Status Alterado",
  rentalStarted: "Aluguel Iniciado",
  rentalEnded: "Aluguel Encerrado",
  ownershipChanged: "Tipo Alterado",
  notesChanged: "Observações Atualizadas",
  auditConfirmed: "Auditoria Confirmada",
  auditDamaged: "Avaria Registrada",
  maintenanceStarted: "Enviada para Manutenção",
  maintenanceReturned: "Retorno de Manutenção",
};

export const MOVEMENT_COLOR: Record<MovementType, StatusColor> = {
  created: "green",
  siteAssigned: "blue",
  siteRemoved: "gray",
  siteChanged: "blue",
  employeeAssigned: "blue",
  employeeRemoved: "gray",
  employeeChanged: "blue",
  statusChanged: "orange",
  rentalStarted: "green",
  rentalEnded: "red",
  ownershipChanged: "orange",
  notesChanged: "gray",
  auditConfirmed: "green",
  auditDamaged: "red",
  maintenanceStarted: "orange",
  maintenanceReturned: "green",
};

export const ATTACHMENT_PURPOSE_LABEL: Record<AttachmentPurpose, string> = {
  general: "Geral",
  serialNumber: "Número de Registro",
  delivery: "Entrega",
  receipt: "Recebimento",
  condition: "Estado/Condição",
  invoice: "Nota Fiscal/Orçamento",
};

export const AUDIT_FREQUENCY_LABEL: Record<AuditFrequency, string> = {
  weekly: "Semanal",
  biweekly: "Quinzenal",
  monthly: "Mensal",
};

export const AUDIT_FREQUENCY_DAYS: Record<AuditFrequency, number> = {
  weekly: 7,
  biweekly: 15,
  monthly: 30,
};

export const AUDIT_STATUS_LABEL: Record<AuditStatus, string> = {
  confirmed: "Confirmada",
  damaged: "Avariada",
};

export const MAINTENANCE_STATUS_LABEL: Record<MaintenanceStatus, string> = {
  active: "Em Manutenção",
  completed: "Concluída",
};

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  admin: "Administrador",
  user: "Usuário Padrão",
};

export const ACTIVITY_ACTION_LABEL: Record<ActivityAction, string> = {
  create: "Criação",
  edit: "Edição",
  delete: "Exclusão",
  move: "Movimentação",
  audit: "Auditoria",
  maintenance: "Manutenção",
  roleChange: "Alteração de Nível",
  permissionChange: "Alteração de Permissão",
  movementTypeManage: "Gestão de Tipo de Movimentação",
  bulkImport: "Importação de Inventário",
};

export const ACTIVITY_ACTION_COLOR: Record<ActivityAction, StatusColor> = {
  create: "green",
  edit: "blue",
  delete: "red",
  move: "blue",
  audit: "orange",
  maintenance: "gray",
  roleChange: "orange",
  permissionChange: "blue",
  movementTypeManage: "orange",
  bulkImport: "green",
};

export interface Tool {
  id: string;
  name: string;
  brand: string;
  model: string;
  serialNumber: string;
  ownership: ToolOwnership;
  baseStatus: ToolStatus;
  notes: string;
  purchaseDate: string | null;
  dailyRentalCost: number;
  rentalPeriod: RentalPeriod;
  rentalStartDate: string | null;
  rentalEndDate: string | null;
  createdAt: string;
  statusUpdatedAt: string | null;
  rentalCompanyId: string | null;
  currentSiteId: string | null;
  currentUserId: string | null;
  auditFrequency: AuditFrequency;
  lastAuditDate: string | null;
  nextAuditDate: string | null;
}

export interface RentalCompany {
  id: string;
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  contactPerson: string;
  createdAt: string;
}

export interface ConstructionSite {
  id: string;
  name: string;
  address: string;
  responsibleName: string;
  responsiblePhone: string;
  status: SiteStatus;
  startDate: string | null;
  notes: string;
  createdAt: string;
}

export interface ToolMovement {
  id: string;
  toolId: string;
  type: MovementType;
  description: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
  attachmentIds: string[];
  userId: string | null;
  userName: string;
}

export interface ToolAttachment {
  id: string;
  toolId: string;
  movementId: string | null;
  type: AttachmentType;
  purpose: AttachmentPurpose;
  dataUrl: string;
  caption: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  cpf: string;
  jobRole: string;
  level: string;
  siteId: string | null;
  role: UserRole;
  active: boolean;
  hasLoginAccess: boolean;
  authUserId: string | null;
  createdAt: string;
}

export interface AuditRecord {
  id: string;
  toolId: string;
  userId: string | null;
  userName: string;
  status: AuditStatus;
  damageDescription: string;
  auditDate: string;
  nextAuditDate: string | null;
}

export interface MaintenanceRecord {
  id: string;
  toolId: string;
  userId: string | null;
  userName: string;
  repairCost: number;
  invoiceNumber: string;
  invoiceAttachmentId: string | null;
  startDate: string | null;
  returnDate: string | null;
  status: MaintenanceStatus;
}

export interface ActivityLog {
  id: string;
  userId: string | null;
  userEmail: string;
  userName: string;
  action: ActivityAction;
  entityType: string;
  entityId: string;
  entityName: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  siteId: string | null;
  createdAt: string;
}

export interface AppSettings {
  notificationsEnabled: boolean;
  alertDaysBefore: number;
}

export interface MovementTypeEntity {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  isSystem: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SiteUserPermission {
  id: string;
  siteId: string;
  userId: string;
  movementTypeId: string;
  allowed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DB {
  tools: Tool[];
  companies: RentalCompany[];
  sites: ConstructionSite[];
  movements: ToolMovement[];
  attachments: ToolAttachment[];
  audits: AuditRecord[];
  maintenance: MaintenanceRecord[];
  activityLogs: ActivityLog[];
  users: UserProfile[];
  movementTypes: MovementTypeEntity[];
  siteUserPermissions: SiteUserPermission[];
  settings: AppSettings;
}

// MARK: - Derived helpers

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whether a tool is rented or belongs to a client (both use rental tracking logic). */
export function isRentalTracked(tool: Tool): boolean {
  return tool.ownership === "rented" || tool.ownership === "client";
}

export function effectiveStatus(tool: Tool): ToolStatus {
  if (tool.baseStatus === "disabled") return "disabled";
  if (isRentalTracked(tool) && tool.rentalEndDate && new Date(tool.rentalEndDate).getTime() < Date.now()) {
    return "overdue";
  }
  return tool.baseStatus;
}

export function daysRemaining(tool: Tool): number | null {
  if (!isRentalTracked(tool) || !tool.rentalEndDate) return null;
  const diff = new Date(tool.rentalEndDate).getTime() - Date.now();
  return diff >= 0 ? Math.floor(diff / DAY_MS) : -Math.ceil(-diff / DAY_MS);
}

/** Convert the period-based rental cost into a daily cost for accumulation. */
export function dailyCostFromPeriod(tool: Tool): number {
  const periodDays = RENTAL_PERIOD_DAYS[tool.rentalPeriod] ?? 1;
  return tool.dailyRentalCost / periodDays;
}

export function totalRentalCost(tool: Tool): number {
  if (!isRentalTracked(tool) || !tool.rentalStartDate) return 0;
  const days = Math.floor((Date.now() - new Date(tool.rentalStartDate).getTime()) / DAY_MS);
  return Math.max(days, 1) * dailyCostFromPeriod(tool);
}

export function isRentalEndingSoon(tool: Tool): boolean {
  if (!isRentalTracked(tool)) return false;
  const days = daysRemaining(tool);
  return days !== null && days >= 0 && days <= 3;
}

/** Whether the audit due date has passed (disabled tools are never due). */
export function isAuditDue(tool: Tool): boolean {
  if (tool.baseStatus === "disabled") return false;
  if (!tool.nextAuditDate) return false;
  return new Date(tool.nextAuditDate).getTime() < Date.now();
}

/** Days until the next audit (negative = overdue). Returns null for disabled tools. */
export function auditDaysRemaining(tool: Tool): number | null {
  if (tool.baseStatus === "disabled") return null;
  if (!tool.nextAuditDate) return null;
  const diff = new Date(tool.nextAuditDate).getTime() - Date.now();
  return diff >= 0 ? Math.floor(diff / DAY_MS) : -Math.ceil(-diff / DAY_MS);
}

/** Compute the next audit date based on frequency. */
export function computeNextAuditDate(frequency: AuditFrequency, from: Date = new Date()): string {
  const days = AUDIT_FREQUENCY_DAYS[frequency];
  const next = new Date(from.getTime() + days * DAY_MS);
  return next.toISOString().split("T")[0];
}

/** Get audit status label for a tool. */
export function auditStatusLabel(tool: Tool): string {
  if (tool.baseStatus === "disabled") return "Desativada";
  if (tool.baseStatus === "maintenance") return "Em Manutenção";
  const days = auditDaysRemaining(tool);
  if (days === null) return "Sem auditoria";
  if (days < 0) return `Atrasada ${Math.abs(days)}d`;
  if (days === 0) return "Vence hoje";
  return `Em ${days}d`;
}

export function auditStatusColor(tool: Tool): StatusColor {
  if (tool.baseStatus === "disabled") return "gray";
  if (tool.baseStatus === "maintenance") return "gray";
  const days = auditDaysRemaining(tool);
  if (days === null) return "gray";
  if (days < 0) return "red";
  if (days <= 3) return "orange";
  return "green";
}

export function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
