import SwiftUI
import SwiftData

struct EmployeeDetailView: View {
    @Environment(\.modelContext) private var context
    @Bindable var employee: Employee
    @State private var showingEditSheet = false
    @State private var showingDeleteConfirm = false

    private var sortedTools: [Tool] {
        employee.tools.sorted { $0.name < $1.name }
    }

    private var ownTools: [Tool] { sortedTools.filter { $0.ownership == .own } }
    private var rentedTools: [Tool] { sortedTools.filter { $0.ownership == .rented } }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                headerCard
                contactCard
                toolsBreakdownCard
                toolsListCard

                Button(role: .destructive) {
                    showingDeleteConfirm = true
                } label: {
                    Label("Excluir Funcionário", systemImage: "trash.fill")
                        .font(.system(size: 15, weight: .semibold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.statusRed.opacity(0.12))
                        .clipShape(.rect(cornerRadius: 12))
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
            .padding(.bottom, 24)
        }
        .background(Color.appBg.ignoresSafeArea())
        .navigationTitle(employee.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Editar") { showingEditSheet = true }
            }
        }
        .sheet(isPresented: $showingEditSheet) {
            EmployeeEditView(employee: employee)
        }
        .confirmationDialog("Excluir este funcionário?", isPresented: $showingDeleteConfirm) {
            Button("Excluir", role: .destructive) {
                context.delete(employee)
            }
            Button("Cancelar", role: .cancel) {}
        } message: {
            Text("As ferramentas atribuídas serão desvinculadas deste funcionário.")
        }
    }

    private var headerCard: some View {
        HStack(spacing: 14) {
            Image(systemName: "person.crop.circle.fill")
                .font(.system(size: 36))
                .foregroundStyle(.white)
                .frame(width: 64, height: 64)
                .background(Color.appAccent.opacity(0.25))
                .clipShape(.rect(cornerRadius: 32))

            VStack(alignment: .leading, spacing: 3) {
                Text(employee.name)
                    .font(.system(size: 20, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                    .lineLimit(2)
                if !employee.role.isEmpty {
                    Text(employee.role)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(Color.appAccent)
                }
            }
            Spacer()
        }
        .padding(16)
        .background(Color.appAccent.opacity(0.12))
        .clipShape(.rect(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.appAccent.opacity(0.25), lineWidth: 1)
        )
    }

    private var contactCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Contato")

            if !employee.phone.isEmpty {
                if let url = URL(string: "tel:\(employee.phone.filter { $0.isNumber })") {
                    Link(destination: url) {
                        contactRow(icon: "phone.fill", label: "Telefone", value: employee.phone, color: .statusGreen)
                    }
                    .buttonStyle(.plain)
                }
            }
            if !employee.email.isEmpty {
                if let url = URL(string: "mailto:\(employee.email)") {
                    Link(destination: url) {
                        contactRow(icon: "envelope.fill", label: "E-mail", value: employee.email, color: .appOrange)
                    }
                    .buttonStyle(.plain)
                }
            }
            if employee.phone.isEmpty && employee.email.isEmpty {
                Text("Nenhum contato cadastrado.")
                    .font(.system(size: 14))
                    .foregroundStyle(Color.appTextSecondary)
            }
        }
        .cardStyle()
    }

    private var toolsBreakdownCard: some View {
        HStack(spacing: 16) {
            VStack {
                Text("\(ownTools.count)")
                    .font(.system(size: 24, weight: .bold, design: .rounded))
                    .foregroundStyle(Color.appAccent)
                Text("Próprias")
                    .font(.system(size: 11))
                    .foregroundStyle(Color.appTextSecondary)
            }
            .frame(maxWidth: .infinity)

            Rectangle()
                .fill(Color.appSeparator)
                .frame(width: 0.5, height: 36)

            VStack {
                Text("\(rentedTools.count)")
                    .font(.system(size: 24, weight: .bold, design: .rounded))
                    .foregroundStyle(Color.appOrange)
                Text("Alugadas")
                    .font(.system(size: 11))
                    .foregroundStyle(Color.appTextSecondary)
            }
            .frame(maxWidth: .infinity)

            Rectangle()
                .fill(Color.appSeparator)
                .frame(width: 0.5, height: 36)

            VStack {
                Text("\(sortedTools.count)")
                    .font(.system(size: 24, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                Text("Total")
                    .font(.system(size: 11))
                    .foregroundStyle(Color.appTextSecondary)
            }
            .frame(maxWidth: .infinity)
        }
        .cardStyle()
    }

    private var toolsListCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionHeader(title: "Ferramentas Atribuídas", count: sortedTools.count)

            if sortedTools.isEmpty {
                Text("Nenhuma ferramenta atribuída a este funcionário.")
                    .font(.system(size: 14))
                    .foregroundStyle(Color.appTextSecondary)
                    .padding(.vertical, 8)
            } else {
                ForEach(sortedTools) { tool in
                    NavigationLink {
                        ToolDetailView(tool: tool)
                    } label: {
                        HStack(spacing: 10) {
                            Image(systemName: tool.ownership.iconName)
                                .font(.system(size: 12))
                                .foregroundStyle(tool.ownership == .rented ? Color.appOrange : Color.appAccent)
                                .frame(width: 28)

                            VStack(alignment: .leading, spacing: 2) {
                                Text(tool.name)
                                    .font(.system(size: 14, weight: .medium))
                                    .foregroundStyle(.white)
                                    .lineLimit(1)
                                if let site = tool.currentSite {
                                    Text(site.name)
                                        .font(.system(size: 11))
                                        .foregroundStyle(Color.appTextSecondary)
                                        .lineLimit(1)
                                }
                            }
                            Spacer()
                            StatusBadge(
                                label: tool.effectiveStatus.rawValue,
                                colorName: tool.effectiveStatus.colorName,
                                iconName: tool.effectiveStatus.iconName
                            )
                        }
                    }
                    .buttonStyle(.plain)

                    if tool.id != sortedTools.last?.id {
                        Divider().overlay(Color.appSeparator)
                    }
                }
            }
        }
        .cardStyle()
    }

    private func contactRow(icon: String, label: String, value: String, color: Color) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundStyle(color)
                .frame(width: 32, height: 32)
                .background(color.opacity(0.15))
                .clipShape(.rect(cornerRadius: 8))
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.system(size: 12))
                    .foregroundStyle(Color.appTextSecondary)
                Text(value)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(.white)
            }
            Spacer()
        }
    }
}
