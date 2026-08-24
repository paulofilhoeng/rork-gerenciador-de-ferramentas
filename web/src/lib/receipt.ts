/**
 * Rental return receipt printing.
 *
 * Builds a self-contained HTML document (A4, industrial amber branding) and
 * sends it to the browser print dialog via a hidden iframe — the user can
 * print it or save it as PDF. The delivery photo (data URL) is embedded
 * directly in the document.
 */
import { formatCurrency, formatDateTime, formatShortDate } from "@/lib/format";
import { OWNERSHIP_LABEL, RENTAL_PERIOD_LABEL, dailyCostFromPeriod, type RentalReturn, type Tool } from "@/lib/types";

export interface RentalReturnReceiptData {
  tool: Tool;
  rentalReturn: RentalReturn;
  companyName: string;
  siteName: string;
  photoDataUrl: string | null;
}

const ACCENT = "#F59E0A";
const INK = "#1c1917";

/** Escapes user-provided text so it can be embedded safely in the HTML document. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label: string, value: string): string {
  return `<tr><td class="lbl">${esc(label)}</td><td class="val">${value}</td></tr>`;
}

function buildReceiptHtml(data: RentalReturnReceiptData): string {
  const { tool, rentalReturn: r, companyName, siteName, photoDataUrl } = data;
  const isDamaged = r.conditionStatus === "damaged";
  const dailyCost = dailyCostFromPeriod(tool);

  const toolRows = [
    row("Ferramenta", esc(tool.name)),
    row("Marca / Modelo", esc(`${tool.brand || "—"} ${tool.model ? `/ ${tool.model}` : ""}`.trim() || "—")),
    row("Nº de Série", esc(tool.serialNumber || "—")),
    row("Posse", esc(OWNERSHIP_LABEL[tool.ownership] ?? tool.ownership)),
    row("Locadora", esc(companyName)),
    row("Obra de Origem", esc(siteName)),
    row("Período de Locação", `${formatShortDate(tool.rentalStartDate)} → ${formatShortDate(tool.rentalEndDate)}`),
    row("Cobrança", `${esc(RENTAL_PERIOD_LABEL[tool.rentalPeriod] ?? tool.rentalPeriod)} · ${formatCurrency(dailyCost)}`),
  ].join("");

  const returnRows = [
    row("Data / Hora da Devolução", esc(formatDateTime(r.returnDate))),
    row(
      "Condição da Ferramenta",
      isDamaged
        ? `<span class="badge badge-damaged">AVARIADA</span>`
        : `<span class="badge badge-ok">BOAS CONDIÇÕES</span>`,
    ),
    row("Observações da Condição", r.conditionNotes ? esc(r.conditionNotes) : "—"),
    row("Acessórios Devolvidos", r.accessoriesReturned ? esc(r.accessoriesReturned) : "—"),
    row("Recebido por (Locadora)", esc(r.recipientName + (r.recipientPhone ? ` · ${r.recipientPhone}` : ""))),
    row("Registrado por", esc(r.userName || "—")),
  ].join("");

  const photoBlock = photoDataUrl
    ? `<img src="${photoDataUrl}" alt="Foto da entrega" />`
    : `<p class="no-photo">Sem foto registrada.</p>`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Comprovante de Devolução — ${esc(tool.name)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: #fff; color: ${INK}; font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  .page { max-width: 720px; margin: 0 auto; padding: 32px 36px; }
  .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid ${ACCENT}; padding-bottom: 14px; }
  .brand { font-size: 22px; font-weight: 800; letter-spacing: 2px; }
  .brand span { color: ${ACCENT}; }
  .doc-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; text-align: right; line-height: 1.5; }
  .doc-title small { display: block; font-weight: 400; color: #78716c; text-transform: none; letter-spacing: 0; }
  h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: ${ACCENT}; margin: 22px 0 6px; border-bottom: 1px solid #e7e5e4; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 6px 0; vertical-align: top; font-size: 12.5px; border-bottom: 1px solid #f0efee; }
  td.lbl { width: 200px; color: #78716c; font-weight: 600; }
  td.val { font-weight: 500; word-break: break-word; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 10.5px; font-weight: 800; letter-spacing: 1px; }
  .badge-ok { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
  .badge-damaged { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
  .photo { text-align: center; margin-top: 6px; }
  .photo img { max-width: 460px; max-height: 320px; border: 1px solid #d6d3d1; border-radius: 6px; padding: 4px; }
  .no-photo { color: #78716c; font-style: italic; font-size: 12px; }
  .signatures { display: flex; gap: 40px; margin-top: 44px; }
  .sig { flex: 1; text-align: center; }
  .sig .line { border-top: 1px solid ${INK}; margin-bottom: 6px; }
  .sig p { font-size: 11px; color: #78716c; line-height: 1.5; }
  .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #e7e5e4; display: flex; justify-content: space-between; font-size: 10px; color: #a8a29e; }
  @media print {
    .page { padding: 0; }
    .photo img { page-break-inside: avoid; }
  }
</style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="brand">TOOLS<span>LOC</span></div>
      <div class="doc-title">
        Comprovante de Devolução
        <small>Documento nº ${esc(r.id.slice(0, 8).toUpperCase())} · Emitido em ${esc(formatDateTime(new Date()))}</small>
      </div>
    </div>

    <h2>Ferramenta</h2>
    <table>${toolRows}</table>

    <h2>Detalhes da Devolução</h2>
    <table>${returnRows}</table>

    <h2>Foto da Entrega</h2>
    <div class="photo">${photoBlock}</div>

    <div class="signatures">
      <div class="sig"><div class="line"></div><p>Recebido por (Locadora)</p><p>${esc(r.recipientName)}</p></div>
      <div class="sig"><div class="line"></div><p>Responsável pela Devolução</p><p>${esc(r.userName || "")}</p></div>
    </div>

    <div class="footer">
      <span>ToolsLoc · Gestão de Ferramentas</span>
      <span>Registro: ${esc(r.id)}</span>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Opens the browser print dialog with the rental return receipt.
 * The print dialog allows saving the document as PDF.
 */
export function printRentalReturnReceipt(data: RentalReturnReceiptData): void {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(buildReceiptHtml(data));
  doc.close();

  let printed = false;
  const doPrint = () => {
    if (printed) return;
    printed = true;
    try {
      win.focus();
      win.print();
    } finally {
      // Keep the iframe alive while the print dialog renders, then remove it.
      window.setTimeout(() => iframe.remove(), 60_000);
    }
  };

  // Wait until every embedded image has decoded before printing; fall back
  // to a timeout so the dialog always opens even if an image fails.
  const images = Array.from(doc.images);
  const pending = images.filter((img) => !img.complete);
  if (pending.length === 0) {
    window.setTimeout(doPrint, 200);
    return;
  }
  let remaining = pending.length;
  const onSettled = () => {
    remaining -= 1;
    if (remaining <= 0) window.setTimeout(doPrint, 200);
  };
  pending.forEach((img) => {
    img.addEventListener("load", onSettled);
    img.addEventListener("error", onSettled);
  });
  window.setTimeout(doPrint, 4_000);
}
