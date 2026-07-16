import type { DB, Tool, ToolMovement } from "./types";
import { newId } from "./types";

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function monthsAgo(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString();
}

/** Builds the initial demo dataset, mirroring SeedData.swift. */
export function buildSeedData(): DB {
  const now = new Date().toISOString();

  const techRent = {
    id: newId(),
    name: "TechRent Locações",
    cnpj: "12.345.678/0001-90",
    phone: "(11) 3456-7890",
    email: "contato@techrent.com.br",
    address: "Av. Industrial, 500 - São Paulo, SP",
    contactPerson: "Carlos Mendes",
    createdAt: now,
  };
  const obraPrime = {
    id: newId(),
    name: "ObraPrime Equipamentos",
    cnpj: "98.765.432/0001-10",
    phone: "(11) 98765-4321",
    email: "locacao@obraprime.com.br",
    address: "Rua das Construtoras, 1200 - Guarulhos, SP",
    contactPerson: "Ana Paula Souza",
    createdAt: now,
  };
  const buildMax = {
    id: newId(),
    name: "BuildMax Ferramentas",
    cnpj: "45.678.901/0001-23",
    phone: "(21) 2345-6789",
    email: "vendas@buildmax.com.br",
    address: "Av. Brasil, 3000 - Rio de Janeiro, RJ",
    contactPerson: "Roberto Lima",
    createdAt: now,
  };

  const torreNorte = {
    id: newId(),
    name: "Torre Norte - Edifício Corporativo",
    address: "Av. Paulista, 2000 - São Paulo, SP",
    responsibleName: "Marcos Antunes",
    responsiblePhone: "(11) 91234-5678",
    status: "active" as const,
    startDate: monthsAgo(3),
    notes: "Edifício de 20 andares, fundação concluída",
    createdAt: now,
  };
  const residencialVerde = {
    id: newId(),
    name: "Residencial Verde Vale",
    address: "Estrada Rural, 800 - Campinas, SP",
    responsibleName: "Juliana Reis",
    responsiblePhone: "(19) 98765-1234",
    status: "active" as const,
    startDate: monthsAgo(1),
    notes: "Condomínio de 4 blocos residenciais",
    createdAt: now,
  };
  const shoppingSul = {
    id: newId(),
    name: "Shopping Center Sul",
    address: "Rod. Anhanguera, km 25 - Jundiaí, SP",
    responsibleName: "Paulo Cardoso",
    responsiblePhone: "(11) 95555-4444",
    status: "paused" as const,
    startDate: monthsAgo(6),
    notes: "Obra pausada por reformulação de projeto",
    createdAt: now,
  };

  const joao = { id: newId(), name: "João Pereira", role: "Mestre de Obras", phone: "(11) 98888-1111", email: "joao@ferragest.com.br", createdAt: now };
  const pedro = { id: newId(), name: "Pedro Alves", role: "Pedreiro", phone: "(11) 98888-2222", email: "pedro@ferragest.com.br", createdAt: now };
  const maria = { id: newId(), name: "Maria Fernandes", role: "Encarregada", phone: "(11) 98888-3333", email: "maria@ferragest.com.br", createdAt: now };
  const jose = { id: newId(), name: "José Carlos", role: "Eletricista", phone: "(11) 98888-4444", email: "jose@ferragest.com.br", createdAt: now };
  const lucas = { id: newId(), name: "Lucas Oliveira", role: "Ajudante", phone: "(11) 98888-5555", email: "lucas@ferragest.com.br", createdAt: now };

  const base = {
    notes: "",
    purchaseDate: null as string | null,
    dailyRentalCost: 0,
    rentalStartDate: null as string | null,
    rentalEndDate: null as string | null,
    rentalCompanyId: null as string | null,
    currentSiteId: null as string | null,
    currentEmployeeId: null as string | null,
    createdAt: now,
  };

  const tools: Tool[] = [
    { ...base, id: newId(), name: "Betoneira 400L", brand: "Schwinn", model: "MX-400", serialNumber: "SN-001-BET", ownership: "own", baseStatus: "inUse", purchaseDate: monthsAgo(24), currentSiteId: torreNorte.id, currentEmployeeId: pedro.id },
    { ...base, id: newId(), name: "Andaime Tubular 20m²", brand: "Gerdau", model: "AT-200", serialNumber: "SN-002-AND", ownership: "own", baseStatus: "inUse", currentSiteId: residencialVerde.id, currentEmployeeId: joao.id },
    { ...base, id: newId(), name: "Furadeira de Impacto", brand: "Bosch", model: "GSB 13 RE", serialNumber: "SN-003-FUR", ownership: "own", baseStatus: "available", purchaseDate: monthsAgo(8) },
    { ...base, id: newId(), name: "Nível a Laser", brand: "Bosch", model: "GLL 3-80", serialNumber: "SN-004-NIV", ownership: "own", baseStatus: "inUse", currentSiteId: torreNorte.id, currentEmployeeId: jose.id },
    { ...base, id: newId(), name: "Compactador de Solo", brand: "Wacker Neuson", model: "DPU 6555", serialNumber: "SN-005-COM", ownership: "own", baseStatus: "maintenance", notes: "Motor com vazamento de óleo, em revisão técnica" },
    { ...base, id: newId(), name: "Guindaste Telescópico 30t", brand: "Liebherr", model: "LTM 1030", serialNumber: "TR-001-GUI", ownership: "rented", baseStatus: "inUse", dailyRentalCost: 850, rentalStartDate: daysAgo(12), rentalEndDate: daysFromNow(5), rentalCompanyId: techRent.id, currentSiteId: torreNorte.id, currentEmployeeId: joao.id },
    { ...base, id: newId(), name: "Plataforma Elevatória 12m", brand: "Genie", model: "GS-3246", serialNumber: "TR-002-PLA", ownership: "rented", baseStatus: "inUse", dailyRentalCost: 320, rentalStartDate: daysAgo(20), rentalEndDate: daysFromNow(2), rentalCompanyId: obraPrime.id, currentSiteId: residencialVerde.id, currentEmployeeId: maria.id },
    { ...base, id: newId(), name: "Mini Escavadeira 1.7t", brand: "Bobcat", model: "E17", serialNumber: "TR-003-ESC", ownership: "rented", baseStatus: "inUse", dailyRentalCost: 280, rentalStartDate: daysAgo(15), rentalEndDate: daysAgo(1), rentalCompanyId: buildMax.id, currentSiteId: shoppingSul.id, currentEmployeeId: lucas.id },
    { ...base, id: newId(), name: "Gerador 15 kVA", brand: "Honda", model: "EU15", serialNumber: "TR-004-GER", ownership: "rented", baseStatus: "inUse", dailyRentalCost: 150, rentalStartDate: daysAgo(5), rentalEndDate: daysFromNow(25), rentalCompanyId: techRent.id, currentSiteId: torreNorte.id, currentEmployeeId: jose.id },
    { ...base, id: newId(), name: "Compressor de Ar 100 PSI", brand: "Atlas Copco", model: "XAS 47", serialNumber: "TR-005-COMP", ownership: "rented", baseStatus: "available", dailyRentalCost: 95, rentalStartDate: daysAgo(3), rentalEndDate: daysFromNow(10), rentalCompanyId: obraPrime.id },
  ];

  const movements: ToolMovement[] = tools.map((tool) => ({
    id: newId(),
    toolId: tool.id,
    type: "created",
    description: "Ferramenta cadastrada no sistema",
    oldValue: "",
    newValue: "",
    timestamp: daysAgo(30),
    attachmentIds: [],
  }));

  const guindaste = tools[5];
  const plataforma = tools[6];
  const escavadeira = tools[7];
  const gerador = tools[8];
  const compactador = tools[4];

  const extraMovements: ToolMovement[] = [
    { id: newId(), toolId: guindaste.id, type: "siteAssigned", description: "Atribuída à obra", oldValue: "", newValue: torreNorte.name, timestamp: daysAgo(12), attachmentIds: [] },
    { id: newId(), toolId: guindaste.id, type: "employeeAssigned", description: "Responsável atribuído", oldValue: "", newValue: joao.name, timestamp: daysAgo(12), attachmentIds: [] },
    { id: newId(), toolId: guindaste.id, type: "rentalStarted", description: "Aluguel iniciado", oldValue: "", newValue: "", timestamp: daysAgo(12), attachmentIds: [] },
    { id: newId(), toolId: plataforma.id, type: "siteAssigned", description: "Atribuída à obra", oldValue: "", newValue: residencialVerde.name, timestamp: daysAgo(20), attachmentIds: [] },
    { id: newId(), toolId: plataforma.id, type: "employeeAssigned", description: "Responsável atribuído", oldValue: "", newValue: maria.name, timestamp: daysAgo(20), attachmentIds: [] },
    { id: newId(), toolId: compactador.id, type: "statusChanged", description: "Status alterado", oldValue: "Disponível", newValue: "Manutenção", timestamp: daysAgo(5), attachmentIds: [] },
    { id: newId(), toolId: escavadeira.id, type: "siteAssigned", description: "Atribuída à obra", oldValue: "", newValue: shoppingSul.name, timestamp: daysAgo(15), attachmentIds: [] },
    { id: newId(), toolId: escavadeira.id, type: "employeeAssigned", description: "Responsável atribuído", oldValue: "", newValue: lucas.name, timestamp: daysAgo(15), attachmentIds: [] },
    { id: newId(), toolId: gerador.id, type: "siteAssigned", description: "Atribuída à obra", oldValue: "", newValue: torreNorte.name, timestamp: daysAgo(5), attachmentIds: [] },
    { id: newId(), toolId: gerador.id, type: "employeeAssigned", description: "Responsável atribuído", oldValue: "", newValue: jose.name, timestamp: daysAgo(5), attachmentIds: [] },
  ];

  return {
    tools,
    companies: [techRent, obraPrime, buildMax],
    sites: [torreNorte, residencialVerde, shoppingSul],
    employees: [joao, pedro, maria, jose, lucas],
    movements: [...movements, ...extraMovements],
    attachments: [],
    settings: { notificationsEnabled: false, alertDaysBefore: 3 },
  };
}
