import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type {
  AppSettings,
  ConstructionSite,
  DB,
  Employee,
  RentalCompany,
  Tool,
  ToolAttachment,
  ToolMovement,
} from "./types";
import { buildSeedData } from "./seed";

const STORAGE_KEY = "toolsloc-db-v1";

function loadDB(): DB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed && Array.isArray(parsed.tools)) return parsed;
    }
  } catch (error) {
    console.error("Falha ao carregar dados locais", error);
  }
  return buildSeedData();
}

interface DataContextValue {
  db: DB;
  saveTool: (tool: Tool) => void;
  deleteTool: (id: string) => void;
  saveCompany: (company: RentalCompany) => void;
  deleteCompany: (id: string) => void;
  saveSite: (site: ConstructionSite) => void;
  deleteSite: (id: string) => void;
  saveEmployee: (employee: Employee) => void;
  deleteEmployee: (id: string) => void;
  addMovements: (movements: ToolMovement[]) => void;
  addAttachments: (attachments: ToolAttachment[]) => void;
  removeAttachment: (id: string) => void;
  updateSettings: (partial: Partial<AppSettings>) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [db, setDB] = useState<DB>(loadDB);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (error) {
      console.error("Falha ao salvar dados locais", error);
      toast.error("Armazenamento cheio — remova anexos grandes para continuar salvando.");
    }
  }, [db]);

  const saveTool = useCallback((tool: Tool) => {
    setDB((prev) => {
      const exists = prev.tools.some((t) => t.id === tool.id);
      return {
        ...prev,
        tools: exists ? prev.tools.map((t) => (t.id === tool.id ? tool : t)) : [...prev.tools, tool],
      };
    });
  }, []);

  const deleteTool = useCallback((id: string) => {
    setDB((prev) => ({
      ...prev,
      tools: prev.tools.filter((t) => t.id !== id),
      movements: prev.movements.filter((m) => m.toolId !== id),
      attachments: prev.attachments.filter((a) => a.toolId !== id),
    }));
  }, []);

  const saveCompany = useCallback((company: RentalCompany) => {
    setDB((prev) => {
      const exists = prev.companies.some((c) => c.id === company.id);
      return {
        ...prev,
        companies: exists ? prev.companies.map((c) => (c.id === company.id ? company : c)) : [...prev.companies, company],
      };
    });
  }, []);

  const deleteCompany = useCallback((id: string) => {
    setDB((prev) => ({
      ...prev,
      companies: prev.companies.filter((c) => c.id !== id),
      tools: prev.tools.map((t) => (t.rentalCompanyId === id ? { ...t, rentalCompanyId: null } : t)),
    }));
  }, []);

  const saveSite = useCallback((site: ConstructionSite) => {
    setDB((prev) => {
      const exists = prev.sites.some((s) => s.id === site.id);
      return {
        ...prev,
        sites: exists ? prev.sites.map((s) => (s.id === site.id ? site : s)) : [...prev.sites, site],
      };
    });
  }, []);

  const deleteSite = useCallback((id: string) => {
    setDB((prev) => ({
      ...prev,
      sites: prev.sites.filter((s) => s.id !== id),
      tools: prev.tools.map((t) => (t.currentSiteId === id ? { ...t, currentSiteId: null } : t)),
    }));
  }, []);

  const saveEmployee = useCallback((employee: Employee) => {
    setDB((prev) => {
      const exists = prev.employees.some((e) => e.id === employee.id);
      return {
        ...prev,
        employees: exists ? prev.employees.map((e) => (e.id === employee.id ? employee : e)) : [...prev.employees, employee],
      };
    });
  }, []);

  const deleteEmployee = useCallback((id: string) => {
    setDB((prev) => ({
      ...prev,
      employees: prev.employees.filter((e) => e.id !== id),
      tools: prev.tools.map((t) => (t.currentEmployeeId === id ? { ...t, currentEmployeeId: null } : t)),
    }));
  }, []);

  const addMovements = useCallback((movements: ToolMovement[]) => {
    if (movements.length === 0) return;
    setDB((prev) => ({ ...prev, movements: [...prev.movements, ...movements] }));
  }, []);

  const addAttachments = useCallback((attachments: ToolAttachment[]) => {
    if (attachments.length === 0) return;
    setDB((prev) => ({ ...prev, attachments: [...prev.attachments, ...attachments] }));
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setDB((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((a) => a.id !== id),
      movements: prev.movements.map((m) =>
        m.attachmentIds.includes(id) ? { ...m, attachmentIds: m.attachmentIds.filter((aid) => aid !== id) } : m,
      ),
    }));
  }, []);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setDB((prev) => ({ ...prev, settings: { ...prev.settings, ...partial } }));
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      db,
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
      updateSettings,
    }),
    [db, saveTool, deleteTool, saveCompany, deleteCompany, saveSite, deleteSite, saveEmployee, deleteEmployee, addMovements, addAttachments, removeAttachment, updateSettings],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}

// MARK: - Lookup helpers

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
