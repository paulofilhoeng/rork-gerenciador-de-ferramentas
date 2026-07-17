import JSZip from "jszip";
import type { ConstructionSite, DB, UserProfile, RentalCompany, Tool, ToolAttachment, ToolMovement } from "./types";
import {
  ATTACHMENT_PURPOSE_LABEL,
  MOVEMENT_LABEL,
  OWNERSHIP_LABEL,
  TOOL_STATUS_LABEL,
  daysRemaining,
  effectiveStatus,
  totalRentalCost,
} from "./types";
import { formatDateTime, formatShortDate } from "./format";
import { dataUrlToBlob, extensionForDataUrl } from "./media";

function timestampSuffix(): string {
  return new Date().toISOString().split(":").join("-").slice(0, 19);
}

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

function downloadCSV(content: string, filename: string) {
  // BOM so Excel pt_BR opens UTF-8 correctly
  const blob = new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, `${filename}-${timestampSuffix()}.csv`);
}

interface Lookups {
  companyName: (id: string | null) => string;
  siteName: (id: string | null) => string;
  userName: (id: string | null) => string;
}

function buildLookups(db: DB): Lookups {
  const companies = new Map(db.companies.map((c: RentalCompany) => [c.id, c.name]));
  const sites = new Map(db.sites.map((s: ConstructionSite) => [s.id, s.name]));
  const users = new Map(db.users.map((u: UserProfile) => [u.id, u.name]));
  return {
    companyName: (id) => (id ? companies.get(id) ?? "" : ""),
    siteName: (id) => (id ? sites.get(id) ?? "" : ""),
    userName: (id) => (id ? users.get(id) ?? "" : ""),
  };
}

/** Full inventory CSV; packaged in a ZIP with media when attachments exist. */
export async function generateToolsReport(db: DB): Promise<void> {
  const lookups = buildLookups(db);
  let csv = "Ferramenta;Marca;Modelo;N Serie;Tipo;Status;Obra;Responsavel;Locadora;Custo Diario;Inicio Aluguel;Devolucao;Dias Restantes;Custo Acumulado;Observacoes;Fotos;Videos\n";

  const sorted = [...db.tools].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  const allAttachments: ToolAttachment[] = [];

  for (const tool of sorted) {
    const attachments = db.attachments.filter((a) => a.toolId === tool.id);
    const photos = attachments.filter((a) => a.type === "photo").length;
    const videos = attachments.filter((a) => a.type === "video").length;
    const days = daysRemaining(tool);
    const row = [
      tool.name,
      tool.brand,
      tool.model,
      tool.serialNumber,
      OWNERSHIP_LABEL[tool.ownership],
      TOOL_STATUS_LABEL[effectiveStatus(tool)],
      lookups.siteName(tool.currentSiteId),
      lookups.userName(tool.currentUserId),
      lookups.companyName(tool.rentalCompanyId),
      tool.ownership === "rented" ? totalToFixed(tool.dailyRentalCost) : "",
      tool.rentalStartDate ? formatShortDate(tool.rentalStartDate) : "",
      tool.rentalEndDate ? formatShortDate(tool.rentalEndDate) : "",
      days !== null ? String(days) : "",
      tool.ownership === "rented" ? totalToFixed(totalRentalCost(tool)) : "",
      tool.notes.split(";").join(","),
      String(photos),
      String(videos),
    ];
    csv += row.join(";") + "\n";
    allAttachments.push(...attachments);
  }

  if (allAttachments.length === 0) {
    downloadCSV(csv, "relatorio-ferramentas");
    return;
  }

  const zip = new JSZip();
  zip.file("relatorio-ferramentas.csv", "\uFEFF" + csv);
  const media = zip.folder("midia");
  const toolNames = new Map(db.tools.map((t: Tool) => [t.id, t.name]));

  for (const attachment of allAttachments) {
    const blob = dataUrlToBlob(attachment.dataUrl);
    if (!blob || !media) continue;
    const purposeSlug = ATTACHMENT_PURPOSE_LABEL[attachment.purpose]
      .toLowerCase()
      .normalize("NFD")
      .replace(/[^\w]+/g, "-");
    const toolName = (toolNames.get(attachment.toolId) ?? "ferramenta").replace(/[^\w\u00C0-\u017F -]+/g, "");
    const ext = extensionForDataUrl(attachment.dataUrl);
    media.file(`${toolName}-${purposeSlug}-${attachment.id.slice(0, 8)}.${ext}`, blob);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  downloadBlob(zipBlob, `relatorio-ferramentas-${timestampSuffix()}.zip`);
}

/** Rental-focused CSV report (rented tools only). */
export function generateRentalReport(db: DB): void {
  const lookups = buildLookups(db);
  const rented = db.tools
    .filter((t) => t.ownership === "rented")
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  let csv = "Relatorio de Alugueis\n";
  csv += `Gerado em: ${formatShortDate(new Date())}\n\n`;
  csv += "Ferramenta;Locadora;Obra;Responsavel;Custo Diario;Inicio;Devolucao;Dias Restantes;Custo Acumulado;Status\n";

  let totalCost = 0;
  for (const tool of rented) {
    const days = daysRemaining(tool) ?? 0;
    let statusText = "No prazo";
    if (days < 0) statusText = `Atrasado ${Math.abs(days)} dia(s)`;
    else if (days <= 3) statusText = `Vencendo em ${days} dia(s)`;

    const cost = totalRentalCost(tool);
    const row = [
      tool.name,
      lookups.companyName(tool.rentalCompanyId) || "—",
      lookups.siteName(tool.currentSiteId) || "—",
      lookups.userName(tool.currentUserId) || "—",
      totalToFixed(tool.dailyRentalCost),
      formatShortDate(tool.rentalStartDate),
      formatShortDate(tool.rentalEndDate),
      String(days),
      totalToFixed(cost),
      statusText,
    ];
    csv += row.join(";") + "\n";
    totalCost += cost;
  }

  csv += `\n;Total;;;;;;;${totalToFixed(totalCost)};\n`;
  downloadCSV(csv, "relatorio-alugueis");
}

/** Movements history CSV report. */
export function generateMovementsReport(db: DB, movements?: ToolMovement[]): void {
  const toolNames = new Map(db.tools.map((t: Tool) => [t.id, t.name]));
  const source = movements ?? db.movements;

  let csv = "Data;Ferramenta;Tipo;Descricao;Valor Anterior;Novo Valor\n";
  for (const mov of [...source].sort((a, b) => b.timestamp.localeCompare(a.timestamp))) {
    const row = [
      formatDateTime(mov.timestamp),
      toolNames.get(mov.toolId) ?? "—",
      MOVEMENT_LABEL[mov.type],
      mov.description,
      mov.oldValue,
      mov.newValue,
    ];
    csv += row.join(";") + "\n";
  }

  downloadCSV(csv, "relatorio-movimentacoes");
}

function totalToFixed(value: number): string {
  return value.toFixed(2);
}
