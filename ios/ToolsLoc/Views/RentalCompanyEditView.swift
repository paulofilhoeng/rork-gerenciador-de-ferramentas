import SwiftUI
import SwiftData

struct RentalCompanyEditView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    var company: RentalCompany?
    private var isNew: Bool { company == nil }

    @State private var name = ""
    @State private var cnpj = ""
    @State private var phone = ""
    @State private var email = ""
    @State private var address = ""
    @State private var contactPerson = ""
    @State private var showValidationError = false

    var body: some View {
        NavigationStack {
            Form {
                Section("Identificação") {
                    TextField("Nome *", text: $name)
                    TextField("CNPJ", text: $cnpj)
                }
                Section("Contato") {
                    TextField("Pessoa de contato", text: $contactPerson)
                    TextField("Telefone", text: $phone)
                        .keyboardType(.phonePad)
                    TextField("E-mail", text: $email)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                }
                Section("Endereço") {
                    TextField("Endereço", text: $address)
                }
                if showValidationError {
                    Section {
                        Text("O nome da locadora é obrigatório.")
                            .font(.system(size: 13))
                            .foregroundStyle(Color.statusRed)
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(Color.appBg.ignoresSafeArea())
            .navigationTitle(isNew ? "Nova Locadora" : "Editar Locadora")
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
        guard let company else { return }
        name = company.name
        cnpj = company.cnpj
        phone = company.phone
        email = company.email
        address = company.address
        contactPerson = company.contactPerson
    }

    private func save() {
        guard !name.trimmingCharacters(in: .whitespaces).isEmpty else {
            showValidationError = true
            return
        }

        let target = company ?? RentalCompany(name: name)
        if company == nil {
            context.insert(target)
        }
        target.name = name
        target.cnpj = cnpj
        target.phone = phone
        target.email = email
        target.address = address
        target.contactPerson = contactPerson
        try? context.save()
        dismiss()
    }
}
