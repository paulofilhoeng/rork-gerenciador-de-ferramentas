/** Shared domain types mirroring the iOS ToolsLoc data model. */

export type ToolOwnership = "own" | "rented";
export type ToolStatus = "available" | "inUse" | "maintenance" | "overdue";
export type SiteStatus = "active" | "paused" | "completed";
export type AttachmentType = "photo" | "video";
export type AttachmentPurpose = "general" | "serialNumber" | "delivery" | "receipt" | "condition";
export type StatusColor = "green" | "blue" | "red" | "orange" | "gray";

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
  | "notesChanged";

export const OWNERSHIP_LABEL: Record<ToolOwnership, string> = {
  own: "Própria",
  rented: "Alugada",
};

export const TOOL_STATUS_LABEL: Record<ToolStatus, string> = {
  available: "Disponível",
  inUse: "Em Uso",
  maintenance: "Manutenção",
  overdue: "Atrasada",
};

export const TOOL_STATUS_COLOR: Record<ToolStatus, StatusColor> = {
  available: "green",
  inUse: "blue",
  maintenance: "gray",
  overdue: "red",
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
};

export const ATTACHMENT_PURPOSE_LABEL: Record<AttachmentPurpose, string> = {
  general: "Geral",
  serialNumber: "Número de Registro",
  delivery: "Entrega",
  receipt: "Recebimento",
  condition: "Estado/Condição",
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
  rentalStartDate: string | null;
  rentalEndDate: string | null;
  createdAt: string;
  rentalCompanyId: string | null;
  currentSiteId: string | null;
  currentEmployeeId: string | null;
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

export interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
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

export interface AppSettings {
  notificationsEnabled: boolean;
  alertDaysBefore: number;
}

export interface DB {
  tools: Tool[];
  companies: RentalCompany[];
  sites: ConstructionSite[];
  employees: Employee[];
  movements: ToolMovement[];
  attachments: ToolAttachment[];
  settings: AppSettings;
}

// MARK: - Derived helpers (mirror iOS computed properties)

const DAY_MS = 24 * 60 * 60 * 1000;

/** Effective status: rented tools past their return date are overdue. */
export function effectiveStatus(tool: Tool): ToolStatus {
  if (tool.ownership === "rented" && tool.rentalEndDate && new Date(tool.rentalEndDate).getTime() < Date.now()) {
    return "overdue";
  }
  return tool.baseStatus;
}

/** Days until the rental return date (negative when overdue). */
export function daysRemaining(tool: Tool): number | null {
  if (tool.ownership !== "rented" || !tool.rentalEndDate) return null;
  const diff = new Date(tool.rentalEndDate).getTime() - Date.now();
  return diff >= 0 ? Math.floor(diff / DAY_MS) : -Math.ceil(-diff / DAY_MS);
}

/** Accumulated rental cost since the rental start date. */
export function totalRentalCost(tool: Tool): number {
  if (tool.ownership !== "rented" || !tool.rentalStartDate) return 0;
  const days = Math.floor((Date.now() - new Date(tool.rentalStartDate).getTime()) / DAY_MS);
  return Math.max(days, 1) * tool.dailyRentalCost;
}

/** Whether the rental ends within the next 3 days. */
export function isRentalEndingSoon(tool: Tool): boolean {
  const days = daysRemaining(tool);
  return days !== null && days >= 0 && days <= 3;
}

export function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
