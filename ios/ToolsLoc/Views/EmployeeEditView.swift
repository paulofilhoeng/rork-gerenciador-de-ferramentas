import SwiftUI
import SwiftData

struct EmployeeEditView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    var employee: Employee?
    private var isNew: Bool { employee == nil }

    @State private var name = ""
    @State private var role = ""
    @State private var phone = ""
    @State private var email = ""
    @State private var showValidationError = false

    var body: some View {
        NavigationStack {
            Form {
                Section("Identificação") {
                    TextField("Nome *", text: $name)
                    TextField("Função", text: $role)
                }
                Section("Contato") {
                    TextField("Telefone", text: $phone)
                        .keyboardType(.phonePad)
                    TextField("E-mail", text: $email)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                }
                if showValidationError {
                    Section {
                        Text("O nome do funcionário é obrigatório.")
                            .font(.system(size: 13))
                            .foregroundStyle(Color.statusRed)
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(Color.appBg.ignoresSafeArea())
            .navigationTitle(isNew ? "Novo Funcionário" : "Editar Funcionário")
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
        guard let employee else { return }
        name = employee.name
        role = employee.role
        phone = employee.phone
        email = employee.email
    }

    private func save() {
        guard !name.trimmingCharacters(in: .whitespaces).isEmpty else {
            showValidationError = true
            return
        }

        let target = employee ?? Employee(name: name)
        if employee == nil {
            context.insert(target)
        }
        target.name = name
        target.role = role
        target.phone = phone
        target.email = email
        try? context.save()
        dismiss()
    }
}
