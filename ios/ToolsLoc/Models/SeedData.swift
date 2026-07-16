import Foundation
import SwiftData

enum SeedData {
    static func populateIfNeeded(context: ModelContext) {
        let descriptor = FetchDescriptor<RentalCompany>()
        let existingCount = (try? context.fetchCount(descriptor)) ?? 0
        guard existingCount == 0 else { return }

        // Locadoras
        let techRent = RentalCompany(
            name: "TechRent Locações",
            cnpj: "12.345.678/0001-90",
            phone: "(11) 3456-7890",
            email: "contato@techrent.com.br",
            address: "Av. Industrial, 500 - São Paulo, SP",
            contactPerson: "Carlos Mendes"
        )
        let obraPrime = RentalCompany(
            name: "ObraPrime Equipamentos",
            cnpj: "98.765.432/0001-10",
            phone: "(11) 98765-4321",
            email: "locacao@obraprime.com.br",
            address: "Rua das Construtoras, 1200 - Guarulhos, SP",
            contactPerson: "Ana Paula Souza"
        )
        let buildMax = RentalCompany(
            name: "BuildMax Ferramentas",
            cnpj: "45.678.901/0001-23",
            phone: "(21) 2345-6789",
            email: "vendas@buildmax.com.br",
            address: "Av. Brasil, 3000 - Rio de Janeiro, RJ",
            contactPerson: "Roberto Lima"
        )
        context.insert(techRent)
        context.insert(obraPrime)
        context.insert(buildMax)

        // Obras
        let torreNorte = ConstructionSite(
            name: "Torre Norte - Edifício Corporativo",
            address: "Av. Paulista, 2000 - São Paulo, SP",
            responsibleName: "Marcos Antunes",
            responsiblePhone: "(11) 91234-5678",
            status: .active,
            startDate: Calendar.current.date(byAdding: .month, value: -3, to: Date()),
            notes: "Edifício de 20 andares, fundação concluída"
        )
        let residencialVerde = ConstructionSite(
            name: "Residencial Verde Vale",
            address: "Estrada Rural, 800 - Campinas, SP",
            responsibleName: "Juliana Reis",
            responsiblePhone: "(19) 98765-1234",
            status: .active,
            startDate: Calendar.current.date(byAdding: .month, value: -1, to: Date()),
            notes: "Condomínio de 4 blocres residenciais"
        )
        let shoppingSul = ConstructionSite(
            name: "Shopping Center Sul",
            address: "Rod. Anhanguera, km 25 - Jundiaí, SP",
            responsibleName: "Paulo Cardoso",
            responsiblePhone: "(11) 95555-4444",
            status: .paused,
            startDate: Calendar.current.date(byAdding: .month, value: -6, to: Date()),
            notes: "Obra pausada por reformulação de projeto"
        )
        context.insert(torreNorte)
        context.insert(residencialVerde)
        context.insert(shoppingSul)

        // Funcionários
        let joao = Employee(name: "João Pereira", role: "Mestre de Obras", phone: "(11) 98888-1111", email: "joao@ferragest.com.br")
        let pedro = Employee(name: "Pedro Alves", role: "Pedreiro", phone: "(11) 98888-2222", email: "pedro@ferragest.com.br")
        let maria = Employee(name: "Maria Fernandes", role: "Encarregada", phone: "(11) 98888-3333", email: "maria@ferragest.com.br")
        let jose = Employee(name: "José Carlos", role: "Eletricista", phone: "(11) 98888-4444", email: "jose@ferragest.com.br")
        let lucas = Employee(name: "Lucas Oliveira", role: "Ajudante", phone: "(11) 98888-5555", email: "lucas@ferragest.com.br")
        context.insert(joao)
        context.insert(pedro)
        context.insert(maria)
        context.insert(jose)
        context.insert(lucas)

        // Ferramentas próprias
        let betoneira = Tool(name: "Betoneira 400L", brand: "Schwinn", model: "MX-400", serialNumber: "SN-001-BET", ownership: .own, baseStatus: .inUse, purchaseDate: Calendar.current.date(byAdding: .year, value: -2, to: Date()), currentSite: torreNorte, currentEmployee: pedro)
        let andaime = Tool(name: "Andaime Tubular 20m²", brand: "Gerdau", model: "AT-200", serialNumber: "SN-002-AND", ownership: .own, baseStatus: .inUse, currentSite: residencialVerde, currentEmployee: joao)
        let furadeira = Tool(name: "Furadeira de Impacto", brand: "Bosch", model: "GSB 13 RE", serialNumber: "SN-003-FUR", ownership: .own, baseStatus: .available, purchaseDate: Calendar.current.date(byAdding: .month, value: -8, to: Date()))
        let nivel = Tool(name: "Nível a Laser", brand: "Bosch", model: "GLL 3-80", serialNumber: "SN-004-NIV", ownership: .own, baseStatus: .inUse, currentSite: torreNorte, currentEmployee: jose)
        let compactador = Tool(name: "Compactador de Solo", brand: "Wacker Neuson", model: "DPU 6555", serialNumber: "SN-005-COM", ownership: .own, baseStatus: .maintenance, notes: "Motor com vazamento de óleo, em revisão técnica", currentSite: nil, currentEmployee: nil)
        context.insert(betoneira)
        context.insert(andaime)
        context.insert(furadeira)
        context.insert(nivel)
        context.insert(compactador)

        // Ferramentas alugadas
        let guindaste = Tool(name: "Guindaste Telescópico 30t", brand: "Liebherr", model: "LTM 1030", serialNumber: "TR-001-GUI", ownership: .rented, baseStatus: .inUse, dailyRentalCost: 850.0, rentalStartDate: Calendar.current.date(byAdding: .day, value: -12, to: Date()), rentalEndDate: Calendar.current.date(byAdding: .day, value: 5, to: Date()), rentalCompany: techRent, currentSite: torreNorte, currentEmployee: joao)
        let plataforma = Tool(name: "Plataforma Elevatória 12m", brand: "Genie", model: "GS-3246", serialNumber: "TR-002-PLA", ownership: .rented, baseStatus: .inUse, dailyRentalCost: 320.0, rentalStartDate: Calendar.current.date(byAdding: .day, value: -20, to: Date()), rentalEndDate: Calendar.current.date(byAdding: .day, value: 2, to: Date()), rentalCompany: obraPrime, currentSite: residencialVerde, currentEmployee: maria)
        let escavadeira = Tool(name: "Mini Escavadeira 1.7t", brand: "Bobcat", model: "E17", serialNumber: "TR-003-ESC", ownership: .rented, baseStatus: .inUse, dailyRentalCost: 280.0, rentalStartDate: Calendar.current.date(byAdding: .day, value: -15, to: Date()), rentalEndDate: Calendar.current.date(byAdding: .day, value: -1, to: Date()), rentalCompany: buildMax, currentSite: shoppingSul, currentEmployee: lucas)
        let gerador = Tool(name: "Gerador 15 kVA", brand: "Honda", model: "EU15", serialNumber: "TR-004-GER", ownership: .rented, baseStatus: .inUse, dailyRentalCost: 150.0, rentalStartDate: Calendar.current.date(byAdding: .day, value: -5, to: Date()), rentalEndDate: Calendar.current.date(byAdding: .day, value: 25, to: Date()), rentalCompany: techRent, currentSite: torreNorte, currentEmployee: jose)
        let compressor = Tool(name: "Compressor de Ar 100 PSI", brand: "Atlas Copco", model: "XAS 47", serialNumber: "TR-005-COMP", ownership: .rented, baseStatus: .available, dailyRentalCost: 95.0, rentalStartDate: Calendar.current.date(byAdding: .day, value: -3, to: Date()), rentalEndDate: Calendar.current.date(byAdding: .day, value: 10, to: Date()), rentalCompany: obraPrime, currentSite: nil, currentEmployee: nil)
        context.insert(guindaste)
        context.insert(plataforma)
        context.insert(escavadeira)
        context.insert(gerador)
        context.insert(compressor)

        // Movimentações iniciais
        let allTools = [betoneira, andaime, furadeira, nivel, compactador, guindaste, plataforma, escavadeira, gerador, compressor]
        for tool in allTools {
            let mov = ToolMovement(
                type: .created,
                description: "Ferramenta cadastrada no sistema",
                tool: tool
            )
            mov.timestamp = Calendar.current.date(byAdding: .day, value: -30, to: Date()) ?? Date()
            context.insert(mov)
        }

        // Movimentações de alocação
        let mov1 = ToolMovement(type: .siteAssigned, description: "Atribuída à obra", newValue: torreNorte.name, tool: guindaste)
        mov1.timestamp = Calendar.current.date(byAdding: .day, value: -12, to: Date()) ?? Date()
        context.insert(mov1)

        let mov2 = ToolMovement(type: .employeeAssigned, description: "Responsável atribuído", newValue: joao.name, tool: guindaste)
        mov2.timestamp = Calendar.current.date(byAdding: .day, value: -12, to: Date()) ?? Date()
        context.insert(mov2)

        let mov3 = ToolMovement(type: .rentalStarted, description: "Aluguel iniciado", newValue: formatShortDate(guindaste.rentalEndDate), tool: guindaste)
        mov3.timestamp = Calendar.current.date(byAdding: .day, value: -12, to: Date()) ?? Date()
        context.insert(mov3)

        let mov4 = ToolMovement(type: .siteAssigned, description: "Atribuída à obra", newValue: residencialVerde.name, tool: plataforma)
        mov4.timestamp = Calendar.current.date(byAdding: .day, value: -20, to: Date()) ?? Date()
        context.insert(mov4)

        let mov5 = ToolMovement(type: .employeeAssigned, description: "Responsável atribuído", newValue: maria.name, tool: plataforma)
        mov5.timestamp = Calendar.current.date(byAdding: .day, value: -20, to: Date()) ?? Date()
        context.insert(mov5)

        let mov6 = ToolMovement(type: .statusChanged, description: "Status alterado", oldValue: ToolStatus.available.rawValue, newValue: ToolStatus.maintenance.rawValue, tool: compactador)
        mov6.timestamp = Calendar.current.date(byAdding: .day, value: -5, to: Date()) ?? Date()
        context.insert(mov6)

        let mov7 = ToolMovement(type: .siteAssigned, description: "Atribuída à obra", newValue: shoppingSul.name, tool: escavadeira)
        mov7.timestamp = Calendar.current.date(byAdding: .day, value: -15, to: Date()) ?? Date()
        context.insert(mov7)

        let mov8 = ToolMovement(type: .employeeAssigned, description: "Responsável atribuído", newValue: lucas.name, tool: escavadeira)
        mov8.timestamp = Calendar.current.date(byAdding: .day, value: -15, to: Date()) ?? Date()
        context.insert(mov8)

        let mov9 = ToolMovement(type: .siteAssigned, description: "Atribuída à obra", newValue: torreNorte.name, tool: gerador)
        mov9.timestamp = Calendar.current.date(byAdding: .day, value: -5, to: Date()) ?? Date()
        context.insert(mov9)

        let mov10 = ToolMovement(type: .employeeAssigned, description: "Responsável atribuído", newValue: jose.name, tool: gerador)
        mov10.timestamp = Calendar.current.date(byAdding: .day, value: -5, to: Date()) ?? Date()
        context.insert(mov10)

        try? context.save()
    }
}
