import SwiftUI
import SwiftData

struct ConstructionSiteEditView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    var site: ConstructionSite?
    private var isNew: Bool { site == nil }

    @State private var name = ""
    @State private var address = ""
    @State private var responsibleName = ""
    @State private var responsiblePhone = ""
    @State private var status: SiteStatus = .active
    @State private var startDate: Date = Date()
    @State private var hasStartDate = false
    @State private var notes = ""
    @State private var showValidationError = false

    var body: some View {
        NavigationStack {
            Form {
                Section("Identificação") {
                    TextField("Nome *", text: $name)
                    Picker("Status", selection: $status) {
                        ForEach(SiteStatus.allCases, id: \.self) { s in
                            Text(s.rawValue).tag(s)
                        }
                    }
                }
                Section("Responsável") {
                    TextField("Nome do responsável", text: $responsibleName)
                    TextField("Telefone", text: $responsiblePhone)
                        .keyboardType(.phonePad)
                }
                Section("Localização") {
                    TextField("Endereço", text: $address)
                }
                Section("Datas") {
                    Toggle("Data de início", isOn: $hasStartDate)
                    if hasStartDate {
                        DatePicker("Início", selection: $startDate, displayedComponents: .date)
                    }
                }
                Section("Observações") {
                    TextField("Notas", text: $notes, axis: .vertical)
                        .lineLimit(3...6)
                }
                if showValidationError {
                    Section {
                        Text("O nome da obra é obrigatório.")
                            .font(.system(size: 13))
                            .foregroundStyle(Color.statusRed)
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(Color.appBg.ignoresSafeArea())
            .navigationTitle(isNew ? "Nova Obra" : "Editar Obra")
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
            .onAppear(perform: load)
        }
    }

    private func load() {
        guard let site else { return }
        name = site.name
        address = site.address
        responsibleName = site.responsibleName
        responsiblePhone = site.responsiblePhone
        status = site.status
        notes = site.notes
        if let date = site.startDate {
            startDate = date
            hasStartDate = true
        }
    }

    private func save() {
        guard !name.trimmingCharacters(in: .whitespaces).isEmpty else {
            showValidationError = true
            return
        }

        let target = site ?? ConstructionSite(name: name)
        if site == nil {
            context.insert(target)
        }
        target.name = name
        target.address = address
        target.responsibleName = responsibleName
        target.responsiblePhone = responsiblePhone
        target.status = status
        target.notes = notes
        target.startDate = hasStartDate ? startDate : nil
        try? context.save()
        dismiss()
    }
}
