import SwiftUI
import SwiftData
import PhotosUI

struct ToolEditView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    @Query(sort: \RentalCompany.name) private var companies: [RentalCompany]
    @Query(sort: \ConstructionSite.name) private var sites: [ConstructionSite]
    @Query(sort: \Employee.name) private var employees: [Employee]

    var tool: Tool?
    private var isNew: Bool { tool == nil }

    @State private var name = ""
    @State private var brand = ""
    @State private var model = ""
    @State private var serialNumber = ""
    @State private var ownership: ToolOwnership = .own
    @State private var baseStatus: ToolStatus = .available
    @State private var notes = ""
    @State private var purchaseDate: Date = Date()
    @State private var hasPurchaseDate = false
    @State private var dailyRentalCost: Double = 0
    @State private var rentalStartDate: Date = Date()
    @State private var hasRentalStart = false
    @State private var rentalEndDate: Date = Date().addingTimeInterval(7 * 24 * 3600)
    @State private var hasRentalEnd = false
    @State private var selectedCompanyId: UUID? = nil
    @State private var selectedSiteId: UUID? = nil
    @State private var selectedEmployeeId: UUID? = nil
    @State private var showValidationError = false
    @State private var showMediaPicker = false
    @State private var showPhotoValidation = false
    @State private var validationOperation: PhotoValidationView.ValidationOperation? = nil
    @State private var pendingAttachments: [ToolAttachment] = []

    // Store original values for movement tracking
    @State private var originalSiteName: String? = nil
    @State private var originalEmployeeName: String? = nil
    @State private var originalStatusRaw: String = ""
    @State private var originalOwnershipRaw: String = ""
    @State private var originalNotes: String = ""
    @State private var originalRentalEnd: Date? = nil
    @State private var originalRentalStart: Date? = nil
    @State private var originalCompanyName: String? = nil

    var body: some View {
        NavigationStack {
            Form {
                Section("Informações Básicas") {
                    TextField("Nome *", text: $name)
                    TextField("Marca", text: $brand)
                    TextField("Modelo", text: $model)
                    TextField("N° de série", text: $serialNumber)
                }

                Section("Tipo") {
                    Picker("Propriedade", selection: $ownership) {
                        ForEach(ToolOwnership.allCases, id: \.self) { type in
                            Text(type.rawValue).tag(type)
                        }
                    }
                    Picker("Status", selection: $baseStatus) {
                        ForEach(ToolStatus.allCases, id: \.self) { status in
                            Text(status.rawValue).tag(status)
                        }
                    }
                }

                if ownership == .rented {
                    Section("Aluguel") {
                        Picker("Locadora", selection: $selectedCompanyId) {
                            Text("Nenhuma").tag(UUID?.none)
                            ForEach(companies) { company in
                                Text(company.name).tag(Optional(company.id))
                            }
                        }

                        HStack {
                            Text("Custo diário")
                            Spacer()
                            TextField("0", value: $dailyRentalCost, format: .currency(code: "BRL"))
                                .keyboardType(.decimalPad)
                                .multilineTextAlignment(.trailing)
                        }

                        Toggle("Data de início", isOn: $hasRentalStart)
                        if hasRentalStart {
                            DatePicker("Início", selection: $rentalStartDate, displayedComponents: .date)
                        }

                        Toggle("Data de devolução", isOn: $hasRentalEnd)
                        if hasRentalEnd {
                            DatePicker("Devolução", selection: $rentalEndDate, displayedComponents: .date)
                        }
                    }
                } else {
                    Section("Compra") {
                        Toggle("Data de compra", isOn: $hasPurchaseDate)
                        if hasPurchaseDate {
                            DatePicker("Compra", selection: $purchaseDate, displayedComponents: .date)
                        }
                    }
                }

                Section("Alocação") {
                    Picker("Obra", selection: $selectedSiteId) {
                        Text("Nenhuma").tag(UUID?.none)
                        ForEach(sites) { site in
                            Text(site.name).tag(Optional(site.id))
                        }
                    }

                    Picker("Responsável", selection: $selectedEmployeeId) {
                        Text("Ninguém").tag(UUID?.none)
                        ForEach(employees) { emp in
                            Text(emp.name).tag(Optional(emp.id))
                        }
                    }
                }

                if !isNew, let tool {
                    Section("Registro Fotográfico") {
                        Button {
                            validationOperation = .receipt
                            showPhotoValidation = true
                        } label: {
                            HStack(spacing: 12) {
                                Image(systemName: "arrow.down.circle.fill")
                                    .font(.system(size: 16))
                                    .foregroundStyle(Color.statusGreen)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Registrar Recebimento")
                                        .font(.system(size: 15, weight: .semibold))
                                        .foregroundStyle(.white)
                                    Text("3 fotos obrigatórias (incluindo registro)")
                                        .font(.system(size: 12))
                                        .foregroundStyle(Color.appTextSecondary)
                                }
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 12))
                                    .foregroundStyle(Color.appTextSecondary)
                            }
                        }
                        .buttonStyle(.plain)

                        Button {
                            validationOperation = .delivery
                            showPhotoValidation = true
                        } label: {
                            HStack(spacing: 12) {
                                Image(systemName: "arrow.up.circle.fill")
                                    .font(.system(size: 16))
                                    .foregroundStyle(Color.appOrange)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Registrar Entrega")
                                        .font(.system(size: 15, weight: .semibold))
                                        .foregroundStyle(.white)
                                    Text("3 fotos obrigatórias (incluindo registro)")
                                        .font(.system(size: 12))
                                        .foregroundStyle(Color.appTextSecondary)
                                }
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 12))
                                    .foregroundStyle(Color.appTextSecondary)
                            }
                        }
                        .buttonStyle(.plain)

                        Button {
                            showMediaPicker = true
                        } label: {
                            HStack(spacing: 12) {
                                Image(systemName: "photo.on.rectangle.angled")
                                    .font(.system(size: 16))
                                    .foregroundStyle(Color.appAccent)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Anexar Fotos/Vídeos")
                                        .font(.system(size: 15, weight: .semibold))
                                        .foregroundStyle(.white)
                                    Text("Adicione mídias ao relatório da ferramenta")
                                        .font(.system(size: 12))
                                        .foregroundStyle(Color.appTextSecondary)
                                }
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 12))
                                    .foregroundStyle(Color.appTextSecondary)
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }

                Section("Observações") {
                    TextField("Notas", text: $notes, axis: .vertical)
                        .lineLimit(3...6)
                }

                if showValidationError {
                    Section {
                        Text("O nome da ferramenta é obrigatório.")
                            .font(.system(size: 13))
                            .foregroundStyle(Color.statusRed)
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(Color.appBg.ignoresSafeArea())
            .navigationTitle(isNew ? "Nova Ferramenta" : "Editar Ferramenta")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancelar") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Salvar") { save() }
                        .fontWeight(.bold)
                }
            }
            .onAppear(perform: loadExistingData)
            .sheet(isPresented: $showMediaPicker) {
                if let tool {
                    MediaPickerSheet(tool: tool, purpose: .general, allowsVideo: true) { attachment in
                        context.insert(attachment)
                        tool.attachments.append(attachment)
                        try? context.save()
                    }
                }
            }
            .sheet(isPresented: $showPhotoValidation) {
                if let tool, let operation = validationOperation {
                    PhotoValidationView(tool: tool, operation: operation) { attachments in
                        for attachment in attachments {
                            tool.attachments.append(attachment)
                        }
                        let movementType: MovementType = operation == .receipt ? .rentalStarted : .rentalEnded
                        let movement = ToolMovement(
                            type: movementType,
                            description: "\(operation.rawValue) registrado com fotos",
                            tool: tool,
                            attachments: attachments
                        )
                        context.insert(movement)
                        try? context.save()
                    }
                }
            }
        }
    }

    private func loadExistingData() {
        guard let tool else { return }
        name = tool.name
        brand = tool.brand
        model = tool.model
        serialNumber = tool.serialNumber
        ownership = tool.ownership
        baseStatus = tool.baseStatus
        notes = tool.notes
        dailyRentalCost = tool.dailyRentalCost
        selectedCompanyId = tool.rentalCompany?.id
        selectedSiteId = tool.currentSite?.id
        selectedEmployeeId = tool.currentEmployee?.id

        if let date = tool.purchaseDate {
            purchaseDate = date
            hasPurchaseDate = true
        }
        if let date = tool.rentalStartDate {
            rentalStartDate = date
            hasRentalStart = true
        }
        if let date = tool.rentalEndDate {
            rentalEndDate = date
            hasRentalEnd = true
        }

        // Store originals for diff
        originalSiteName = tool.currentSite?.name
        originalEmployeeName = tool.currentEmployee?.name
        originalStatusRaw = tool.baseStatus.rawValue
        originalOwnershipRaw = tool.ownership.rawValue
        originalNotes = tool.notes
        originalRentalEnd = tool.rentalEndDate
        originalRentalStart = tool.rentalStartDate
        originalCompanyName = tool.rentalCompany?.name
    }

    private func save() {
        guard !name.trimmingCharacters(in: .whitespaces).isEmpty else {
            showValidationError = true
            return
        }

        let target = tool ?? Tool(name: name)
        let wasNew = tool == nil
        if tool == nil {
            context.insert(target)
        }

        target.name = name
        target.brand = brand
        target.model = model
        target.serialNumber = serialNumber
        target.ownership = ownership
        target.baseStatus = baseStatus
        target.notes = notes
        target.dailyRentalCost = dailyRentalCost
        target.purchaseDate = hasPurchaseDate ? purchaseDate : nil
        target.rentalStartDate = hasRentalStart ? rentalStartDate : nil
        target.rentalEndDate = hasRentalEnd ? rentalEndDate : nil

        let newCompany = companies.first { $0.id == selectedCompanyId }
        let newSite = sites.first { $0.id == selectedSiteId }
        let newEmployee = employees.first { $0.id == selectedEmployeeId }

        target.rentalCompany = newCompany
        target.currentSite = newSite
        target.currentEmployee = newEmployee

        // Record movements
        if wasNew {
            recordMovement(.created, description: "Ferramenta criada", tool: target)
        } else {
            recordChanges(target: target, newSite: newSite, newEmployee: newEmployee, newCompany: newCompany)
        }

        try? context.save()
        dismiss()
    }

    // MARK: - Movement Recording

    private func recordChanges(target: Tool, newSite: ConstructionSite?, newEmployee: Employee?, newCompany: RentalCompany?) {
        // Site changes
        let newSiteName = newSite?.name
        if newSiteName != originalSiteName {
            if let old = originalSiteName, let newS = newSiteName {
                recordMovement(.siteChanged, description: "Obra alterada", oldValue: old, newValue: newS, tool: target)
            } else if newSiteName != nil {
                recordMovement(.siteAssigned, description: "Atribuída à obra", newValue: newSiteName ?? "", tool: target)
            } else if originalSiteName != nil {
                recordMovement(.siteRemoved, description: "Removida da obra", oldValue: originalSiteName ?? "", tool: target)
            }
        }

        // Employee changes
        let newEmpName = newEmployee?.name
        if newEmpName != originalEmployeeName {
            if let old = originalEmployeeName, let newE = newEmpName {
                recordMovement(.employeeChanged, description: "Responsável alterado", oldValue: old, newValue: newE, tool: target)
            } else if newEmpName != nil {
                recordMovement(.employeeAssigned, description: "Responsável atribuído", newValue: newEmpName ?? "", tool: target)
            } else if originalEmployeeName != nil {
                recordMovement(.employeeRemoved, description: "Responsável removido", oldValue: originalEmployeeName ?? "", tool: target)
            }
        }

        // Status change
        if baseStatus.rawValue != originalStatusRaw {
            recordMovement(.statusChanged, description: "Status alterado", oldValue: originalStatusRaw, newValue: baseStatus.rawValue, tool: target)
        }

        // Ownership change
        if ownership.rawValue != originalOwnershipRaw {
            recordMovement(.ownershipChanged, description: "Tipo de propriedade alterado", oldValue: originalOwnershipRaw, newValue: ownership.rawValue, tool: target)
        }

        // Notes change
        if notes != originalNotes {
            recordMovement(.notesChanged, description: "Observações atualizadas", tool: target)
        }

        // Rental end date change
        let newRentalEnd = hasRentalEnd ? rentalEndDate : nil
        if newRentalEnd != originalRentalEnd {
            let oldStr = originalRentalEnd != nil ? formatShortDate(originalRentalEnd) : "—"
            let newStr = newRentalEnd != nil ? formatShortDate(newRentalEnd) : "—"
            recordMovement(.rentalStarted, description: "Data de devolução alterada", oldValue: oldStr, newValue: newStr, tool: target)
        }

        // Company change
        let newCompanyName = newCompany?.name
        if newCompanyName != originalCompanyName {
            let oldStr = originalCompanyName ?? "—"
            let newStr = newCompanyName ?? "—"
            recordMovement(.rentalStarted, description: "Locadora alterada", oldValue: oldStr, newValue: newStr, tool: target)
        }
    }

    private func recordMovement(_ type: MovementType, description: String, oldValue: String = "", newValue: String = "", tool: Tool?) {
        let movement = ToolMovement(type: type, description: description, oldValue: oldValue, newValue: newValue, tool: tool)
        context.insert(movement)
    }
}
