import { useCallback, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Upload,
  XCircle,
  Loader2,
  FileUp,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/Layout";
import { Card, IconTile, SectionHeader, Separator, inputClass } from "@/components/shared";
import { useData } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import type { Tool } from "@/lib/types";
import {
  downloadTemplate,
  parseSpreadsheet,
  validateRow,
  type ValidationContext,
  type ImportSummary,
  type ValidationRow,
} from "@/lib/bulkImport";
import { cn } from "@/lib/utils";

export default function BulkImport() {
  const { db, bulkInsertTools } = useData();
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<ValidationRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const validRows = previewRows.filter((r) => r.status === "ok");
  const errorRows = previewRows.filter((r) => r.status === "error");

  const validationContext: ValidationContext = useMemo(() => {
    const existingSerialNumbers = new Set(
      db.tools
        .filter((t) => t.serialNumber)
        .map((t) => t.serialNumber.toLowerCase()),
    );
    const siteNames = new Map(
      db.sites.map((s) => [s.name.toLowerCase(), s.id]),
    );
    const userNames = new Map(
      db.users.map((u) => [u.name.toLowerCase(), u.id]),
    );
    return { existingSerialNumbers, siteNames, userNames };
  }, [db.tools, db.sites, db.users]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      const validExtensions = [".xlsx", ".xls", ".csv"];
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      if (!validExtensions.includes(ext)) {
        toast.error("Formato não suportado. Use .xlsx, .xls ou .csv");
        return;
      }

      setSelectedFile(file);
      setSummary(null);
      setBackendError(null);
      setPreviewRows([]);

      try {
        const parsed = await parseSpreadsheet(file);
        if (parsed.length === 0) {
          toast.error("A planilha está vazia ou não possui dados");
          return;
        }

        // Validate each row — use a fresh context copy so intra-file duplicates are caught
        const ctx: ValidationContext = {
          existingSerialNumbers: new Set(validationContext.existingSerialNumbers),
          siteNames: validationContext.siteNames,
          userNames: validationContext.userNames,
        };

        const rows = parsed.map((p) => validateRow(p, ctx));
        setPreviewRows(rows);

        const okCount = rows.filter((r) => r.status === "ok").length;
        const errCount = rows.filter((r) => r.status === "error").length;
        toast.success(`${parsed.length} linha(s) processada(s): ${okCount} válida(s), ${errCount} com erro(s)`);
      } catch (err) {
        console.error("Parse error", err);
        toast.error("Falha ao ler a planilha. Verifique o formato do arquivo.");
      }
    },
    [validationContext],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) void handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleImport = async () => {
    if (validRows.length === 0) {
      toast.error("Nenhuma linha válida para importar");
      return;
    }

    setImporting(true);
    try {
      const toolsToImport: Tool[] = validRows
        .map((r) => r.tool)
        .filter((t): t is Tool => t !== null && t !== undefined);

      const { count: importedCount, error: importError } = await bulkInsertTools(toolsToImport);

      const newSummary: ImportSummary = {
        totalProcessed: previewRows.length,
        imported: importedCount,
        failed: previewRows.length - importedCount,
        errors: errorRows.map((r) => ({ rowNumber: r.rowNumber, message: r.error ?? "Erro desconhecido" })),
        importedTools: toolsToImport.slice(0, importedCount),
        backendError: importError ?? null,
      };
      setSummary(newSummary);
      setBackendError(importError ?? null);
      setPreviewRows([]);
      setSelectedFile(null);

      if (importedCount > 0) {
        toast.success(`${importedCount} ferramenta(s) importada(s) com sucesso`);
      }
      if (importError) {
        toast.error(importError);
      } else if (errorRows.length > 0) {
        toast.warning(`${errorRows.length} linha(s) rejeitada(s) por erro de validação`);
      }
    } catch (err) {
      console.error("Import error", err);
      const msg = err instanceof Error ? err.message : "Falha durante a importação";
      setBackendError(msg);
      toast.error(msg);
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewRows([]);
    setSummary(null);
    setBackendError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <PageContainer title="Importação de Inventário">
      <div className="flex flex-col gap-5 pb-6">
        {/* Intro card */}
        <Card className="flex items-start gap-3 border-app-accent/25 bg-app-accent/[0.04]">
          <IconTile icon={FileUp} color="accent" size={40} iconSize={20} />
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Onboarding de Inventário</p>
            <p className="text-xs text-app-muted">
              Importe em massa as ferramentas/equipamentos do seu inventário existente usando uma planilha.
              Baixe o modelo, preencha e faça o upload.
            </p>
          </div>
        </Card>

        {/* Step 1: Download template */}
        <div className="flex flex-col gap-3">
          <SectionHeader title="Passo 1 — Baixar Modelo" />
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <IconTile icon={FileSpreadsheet} color="accent" size={38} iconSize={18} />
              <div className="flex-1">
                <p className="text-[15px] font-semibold text-white">Planilha-modelo (.xlsx)</p>
                <p className="text-xs text-app-muted">
                  Contém todas as colunas necessárias com uma linha de exemplo preenchida
                </p>
              </div>
              <button
                type="button"
                onClick={downloadTemplate}
                className="flex items-center gap-2 rounded-xl bg-app-accent/15 px-4 py-2.5 text-sm font-semibold text-app-accent hover:bg-app-accent/25"
              >
                <Download size={15} /> Baixar
              </button>
            </div>
            <Separator />
            <div className="flex items-start gap-2">
              <Info size={14} className="mt-0.5 shrink-0 text-app-muted" />
              <div className="text-[12px] text-app-muted">
                <p className="font-semibold text-white/80">Colunas da planilha:</p>
                <p className="mt-1">
                  <span className="text-app-accent">Nome *</span> — descrição da ferramenta (obrigatório) ·{" "}
                  <span className="text-app-accent">Propriedade *</span> — Própria ou Alugada ·{" "}
                  <span className="text-app-accent">Status *</span> — Disponível, Em Uso, Manutenção ou Atrasada ·{" "}
                  <span className="text-app-accent">Frequência Auditoria *</span> — Semanal, Quinzenal ou Mensal ·{" "}
                  Código/Patrimônio · Marca · Modelo · Obra/Estoque · Responsável · Data da Última Auditoria ·{" "}
                  Custo Diário · Data de Compra · Datas de Aluguel · Observações
                </p>
                <p className="mt-1.5">
                  A <strong>Data da Última Auditoria</strong> pode ser preenchida com a data da importação
                  caso não haja registro anterior. Ela serve de base para calcular quando a próxima auditoria vence.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Step 2: Upload */}
        <div className="flex flex-col gap-3">
          <SectionHeader title="Passo 2 — Enviar Planilha" />
          <Card className="flex flex-col gap-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 transition-colors",
                dragOver ? "border-app-accent bg-app-accent/10" : "border-app-separator bg-app-elevated/50",
              )}
            >
              <Upload size={32} className="text-app-accent" />
              <div className="text-center">
                <p className="text-sm font-semibold text-white">Arraste a planilha aqui</p>
                <p className="text-xs text-app-muted">ou clique para selecionar um arquivo</p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl bg-app-accent/15 px-5 py-2.5 text-sm font-semibold text-app-accent hover:bg-app-accent/25"
              >
                Selecionar arquivo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFileSelect(file);
                }}
              />
              <p className="text-[11px] text-app-muted/60">Formatos aceitos: .xlsx, .xls, .csv</p>
            </div>

            {selectedFile && !summary && (
              <div className="flex items-center gap-3 rounded-xl bg-app-elevated px-4 py-3">
                <FileSpreadsheet size={20} className="shrink-0 text-app-accent" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{selectedFile.name}</p>
                  <p className="text-xs text-app-muted">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-semibold text-app-muted hover:text-white"
                >
                  Remover
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* Step 3: Validation preview */}
        {previewRows.length > 0 && !summary && (
          <div className="flex flex-col gap-3">
            <SectionHeader title="Passo 3 — Revisão e Importação" />
            <Card className="flex flex-col gap-3">
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center rounded-lg bg-app-elevated py-3">
                  <span className="text-2xl font-bold text-white">{previewRows.length}</span>
                  <span className="text-[11px] font-medium text-app-muted">Total</span>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-status-green/10 py-3">
                  <span className="text-2xl font-bold text-status-green">{validRows.length}</span>
                  <span className="text-[11px] font-medium text-status-green">Válidas</span>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-status-red/10 py-3">
                  <span className="text-2xl font-bold text-status-red">{errorRows.length}</span>
                  <span className="text-[11px] font-medium text-status-red">Com erro</span>
                </div>
              </div>

              {/* Error list */}
              {errorRows.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-status-red">Erros encontrados</p>
                  <div className="max-h-48 overflow-y-auto rounded-lg bg-status-red/5 p-3">
                    {errorRows.map((row) => (
                      <div key={row.rowNumber} className="flex items-start gap-2 py-1">
                        <XCircle size={14} className="mt-0.5 shrink-0 text-status-red" />
                        <p className="text-[12px] text-app-muted">
                          <span className="font-semibold text-white">Linha {row.rowNumber}:</span> {row.error}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Valid rows preview */}
              {validRows.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-status-green">Ferramentas a importar</p>
                  <div className="max-h-48 overflow-y-auto rounded-lg bg-status-green/5 p-3">
                    {validRows.slice(0, 20).map((row) => (
                      <div key={row.rowNumber} className="flex items-center gap-2 py-1">
                        <CheckCircle2 size={14} className="shrink-0 text-status-green" />
                        <p className="text-[12px] text-app-muted">
                          <span className="font-semibold text-white">{row.tool?.name}</span>
                          {row.tool?.serialNumber && ` · ${row.tool.serialNumber}`}
                        </p>
                      </div>
                    ))}
                    {validRows.length > 20 && (
                      <p className="py-1 text-[12px] text-app-muted/60">+ {validRows.length - 20} outra(s)...</p>
                    )}
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 rounded-xl border-[0.5px] border-app-separator bg-app-elevated py-3 text-sm font-semibold text-app-muted hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void handleImport()}
                  disabled={importing || validRows.length === 0}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-app-accent py-3 text-sm font-bold text-app-bg hover:opacity-90 disabled:opacity-50"
                >
                  {importing ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Importando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} /> Importar {validRows.length} ferramenta(s)
                    </>
                  )}
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* Final summary */}
        {summary && (
          <div className="flex flex-col gap-3">
            <SectionHeader title="Resumo da Importação" />
            <Card className="flex flex-col gap-4 p-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center rounded-lg bg-app-elevated py-4">
                  <span className="text-3xl font-extrabold text-white">{summary.totalProcessed}</span>
                  <span className="text-[11px] font-medium text-app-muted">Processadas</span>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-status-green/10 py-4">
                  <span className="text-3xl font-extrabold text-status-green">{summary.imported}</span>
                  <span className="text-[11px] font-medium text-status-green">Importadas</span>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-status-red/10 py-4">
                  <span className="text-3xl font-extrabold text-status-red">{summary.failed}</span>
                  <span className="text-[11px] font-medium text-status-red">Rejeitadas</span>
                </div>
              </div>

              {summary.imported > 0 && (
                <div className="flex items-start gap-2 rounded-lg bg-status-green/10 p-3">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-status-green" />
                  <p className="text-[13px] text-status-green">
                    {summary.imported} ferramenta(s) cadastrada(s) com sucesso no sistema.
                    {profile && ` Ação registrada no log por ${profile.name}.`}
                  </p>
                </div>
              )}

              {summary.errors.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-status-red">Linhas rejeitadas</p>
                  <div className="max-h-60 overflow-y-auto rounded-lg bg-status-red/5 p-3">
                    {summary.errors.map((err, i) => (
                      <div key={i} className="flex items-start gap-2 py-1">
                        <AlertCircle size={14} className="mt-0.5 shrink-0 text-status-red" />
                        <p className="text-[12px] text-app-muted">
                          <span className="font-semibold text-white">Linha {err.rowNumber}:</span> {err.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {summary.backendError && (
                <div className="flex flex-col gap-2 rounded-lg bg-status-red/10 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-status-red">Erro do servidor</p>
                  <p className="text-[13px] text-status-red">{summary.backendError}</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl bg-app-accent/15 py-3 text-sm font-semibold text-app-accent hover:bg-app-accent/25"
              >
                Nova importação
              </button>
            </Card>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
