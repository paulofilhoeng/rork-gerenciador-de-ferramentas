/**
 * Bulk inventory import utility for ToolsLoc.
 * Handles template generation, spreadsheet parsing, validation, and batch insert.
 */

import * as XLSX from "xlsx";
import type { AuditFrequency, Tool, ToolOwnership, ToolStatus } from "./types";
import { AUDIT_FREQUENCY_LABEL, TOOL_STATUS_LABEL, OWNERSHIP_LABEL, computeNextAuditDate, newId } from "./types";

// MARK: - Column definitions

export const IMPORT_COLUMNS = [
  "Nome *",
  "Marca",
  "Modelo",
  "Codigo/Patrimonio",
  "Propriedade *",
  "Status *",
  "Obra/Estoque",
  "Responsavel",
  "Frequencia Auditoria *",
  "Data Ultima Auditoria",
  "Custo Diario (R$)",
  "Data Compra",
  "Data Inicio Aluguel",
  "Data Fim Aluguel",
  "Observacoes",
] as const;

// MARK: - Template download

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/** Download an .xlsx template with headers and one example row. */
export function downloadTemplate() {
  const exampleRow: Record<string, string> = {
    "Nome *": "Furadeira de Impacto Bosch",
    "Marca": "Bosch",
    "Modelo": "GSB 13 RE",
    "Codigo/Patrimonio": "FERR-001",
    "Propriedade *": "Propria",
    "Status *": "Disponivel",
    "Obra/Estoque": "Obra Centro",
    "Responsavel": "Joao Pereira",
    "Frequencia Auditoria *": "Mensal",
    "Data Ultima Auditoria": new Date().toISOString().split("T")[0],
    "Custo Diario (R$)": "",
    "Data Compra": "2024-01-15",
    "Data Inicio Aluguel": "",
    "Data Fim Aluguel": "",
    "Observacoes": "Furadeira em bom estado",
  };

  const ws = XLSX.utils.json_to_sheet([exampleRow], { header: [...IMPORT_COLUMNS] });
  ws["!cols"] = IMPORT_COLUMNS.map((col) => ({ wch: Math.max(col.length + 2, 18) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inventario");
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  downloadBlob(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "modelo_importacao_ferramentas.xlsx");
}

// MARK: - Parsing

export interface ParsedRow {
  rowNumber: number;
  raw: Record<string, unknown>;
}

/** Parse an uploaded file into rows. Accepts .xlsx, .xls, .csv. */
export async function parseSpreadsheet(file: File): Promise<ParsedRow[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) return [];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  return json.map((raw, index) => ({ rowNumber: index + 2, raw })); // +2 because row 1 is header
}

// MARK: - Validation

export type RowStatus = "ok" | "error";

export interface ValidationRow {
  rowNumber: number;
  status: RowStatus;
  error?: string;
  tool?: Tool;
}

function normalizeText(val: unknown): string {
  return String(val ?? "").trim();
}

function parseDate(val: string): string | null {
  if (!val) return null;
  // Try ISO format YYYY-MM-DD
  const isoMatch = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  // Try DD/MM/YYYY
  const brMatch = val.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
  // Try Excel serial date number
  const num = Number(val);
  if (!isNaN(num) && num > 30000 && num < 80000) {
    const date = XLSX.SSF.parse_date_code(num);
    if (date) {
      const y = String(date.y).padStart(4, "0");
      const m = String(date.m).padStart(2, "0");
      const d = String(date.d).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }
  return null;
}

const STATUS_MAP: Record<string, ToolStatus> = {
  "disponivel": "available",
  "em uso": "inUse",
  "manutencao": "maintenance",
  "atrasada": "overdue",
};

const OWNERSHIP_MAP: Record<string, ToolOwnership> = {
  "propria": "own",
  "proprio": "own",
  "alugada": "rented",
  "alugado": "rented",
};

const AUDIT_MAP: Record<string, AuditFrequency> = {
  "semanal": "weekly",
  "quinzenal": "biweekly",
  "mensal": "monthly",
};

export interface ValidationContext {
  existingSerialNumbers: Set<string>;
  siteNames: Map<string, string>; // lowercased name -> id
  employeeNames: Map<string, string>; // lowercased name -> id
}

/**
 * Validate a single parsed row and produce a Tool object if valid.
 */
export function validateRow(
  parsed: ParsedRow,
  ctx: ValidationContext,
): ValidationRow {
  const raw = parsed.raw;
  const rowNumber = parsed.rowNumber;

  // Helper to get a column value by trying multiple header variants
  const getCol = (keys: string[]): string => {
    for (const key of keys) {
      for (const rawKey of Object.keys(raw)) {
        if (rawKey.toLowerCase().replace(/\s+/g, "") === key.toLowerCase().replace(/\s+/g, "")) {
          return normalizeText(raw[rawKey]);
        }
      }
    }
    return "";
  };

  const name = getCol(["Nome *", "Nome"]);
  const brand = getCol(["Marca"]);
  const model = getCol(["Modelo"]);
  const serialNumber = getCol(["Codigo/Patrimonio", "Codigo", "Patrimonio"]);
  const ownershipStr = getCol(["Propriedade *", "Propriedade"]);
  const statusStr = getCol(["Status *", "Status"]);
  const siteName = getCol(["Obra/Estoque", "Obra", "Estoque"]);
  const employeeName = getCol(["Responsavel", "Responsável"]);
  const auditFreqStr = getCol(["Frequencia Auditoria *", "Frequencia", "Frequência Auditoria"]);
  const lastAuditStr = getCol(["Data Ultima Auditoria", "Data da Ultima Auditoria", "Data Última Auditoria"]);
  const dailyCostStr = getCol(["Custo Diario (R$)", "Custo Diario", "Custo"]);
  const purchaseDateStr = getCol(["Data Compra", "Data de Compra"]);
  const rentalStartStr = getCol(["Data Inicio Aluguel", "Data de Inicio"]);
  const rentalEndStr = getCol(["Data Fim Aluguel", "Data de Fim", "Data Devolucao"]);
  const notes = getCol(["Observacoes", "Observações", "Notas"]);

  // Required: Nome
  if (!name) {
    return { rowNumber, status: "error", error: "Nome da ferramenta é obrigatório" };
  }

  // Required: Propriedade
  if (!ownershipStr) {
    return { rowNumber, status: "error", error: "Propriedade (Própria/Alugada) é obrigatória" };
  }
  const ownership = OWNERSHIP_MAP[ownershipStr.toLowerCase()];
  if (!ownership) {
    return { rowNumber, status: "error", error: `Propriedade inválida: "${ownershipStr}". Use: Própria ou Alugada` };
  }

  // Required: Status
  if (!statusStr) {
    return { rowNumber, status: "error", error: "Status é obrigatório" };
  }
  const baseStatus = STATUS_MAP[statusStr.toLowerCase()];
  if (!baseStatus) {
    return { rowNumber, status: "error", error: `Status inválido: "${statusStr}". Use: Disponível, Em Uso, Manutenção ou Atrasada` };
  }

  // Required: Frequência Auditoria
  if (!auditFreqStr) {
    return { rowNumber, status: "error", error: "Frequência de auditoria é obrigatória" };
  }
  const auditFrequency = AUDIT_MAP[auditFreqStr.toLowerCase()];
  if (!auditFrequency) {
    return { rowNumber, status: "error", error: `Frequência inválida: "${auditFreqStr}". Use: Semanal, Quinzenal ou Mensal` };
  }

  // Duplicate check: serial number
  if (serialNumber) {
    if (ctx.existingSerialNumbers.has(serialNumber.toLowerCase())) {
      return { rowNumber, status: "error", error: `Código/patrimônio "${serialNumber}" já existe no sistema` };
    }
    // Add to set so subsequent rows in the same file can't duplicate either
    ctx.existingSerialNumbers.add(serialNumber.toLowerCase());
  }

  // Site validation (optional field, but if filled must exist)
  let currentSiteId: string | null = null;
  if (siteName) {
    const siteId = ctx.siteNames.get(siteName.toLowerCase());
    if (!siteId) {
      return { rowNumber, status: "error", error: `Obra/estoque não encontrada: "${siteName}"` };
    }
    currentSiteId = siteId;
  }

  // Employee validation (optional field, but if filled must exist)
  let currentEmployeeId: string | null = null;
  if (employeeName) {
    const empId = ctx.employeeNames.get(employeeName.toLowerCase());
    if (!empId) {
      return { rowNumber, status: "error", error: `Responsável não encontrado: "${employeeName}"` };
    }
    currentEmployeeId = empId;
  }

  // Date parsing
  const lastAuditDate = parseDate(lastAuditStr);
  if (lastAuditStr && !lastAuditDate) {
    return { rowNumber, status: "error", error: `Data de última auditoria inválida: "${lastAuditStr}". Use o formato DD/MM/AAAA ou AAAA-MM-DD` };
  }
  const purchaseDate = parseDate(purchaseDateStr);
  if (purchaseDateStr && !purchaseDate) {
    return { rowNumber, status: "error", error: `Data de compra inválida: "${purchaseDateStr}"` };
  }
  const rentalStartDate = parseDate(rentalStartStr);
  if (rentalStartStr && !rentalStartDate) {
    return { rowNumber, status: "error", error: `Data de início do aluguel inválida: "${rentalStartStr}"` };
  }
  const rentalEndDate = parseDate(rentalEndStr);
  if (rentalEndStr && !rentalEndDate) {
    return { rowNumber, status: "error", error: `Data de fim do aluguel inválida: "${rentalEndStr}"` };
  }

  // Daily rental cost
  const dailyRentalCost = dailyCostStr ? Number(dailyCostStr.replace(",", ".").replace(/[^0-9.]/g, "")) || 0 : 0;

  // Compute next audit date from last audit date (or today if not provided)
  const auditBaseDate = lastAuditDate ? new Date(lastAuditDate + "T12:00:00") : new Date();
  const nextAuditDate = computeNextAuditDate(auditFrequency, auditBaseDate);

  const tool: Tool = {
    id: newId(),
    name,
    brand,
    model,
    serialNumber,
    ownership,
    baseStatus,
    notes,
    purchaseDate,
    dailyRentalCost,
    rentalStartDate,
    rentalEndDate,
    createdAt: new Date().toISOString(),
    statusUpdatedAt: new Date().toISOString(),
    rentalCompanyId: null,
    currentSiteId,
    currentEmployeeId,
    auditFrequency,
    lastAuditDate,
    nextAuditDate,
  };

  return { rowNumber, status: "ok", tool };
}

// MARK: - Import summary

export interface ImportSummary {
  totalProcessed: number;
  imported: number;
  failed: number;
  errors: { rowNumber: number; message: string }[];
  importedTools: Tool[];
}
