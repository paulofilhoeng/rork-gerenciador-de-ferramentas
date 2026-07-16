import SwiftUI
import SwiftData

struct RentalCompanyDetailView: View {
    @Environment(\.modelContext) private var context
    @Bindable var company: RentalCompany
    @State private var showingEditSheet = false
    @State private var showingDeleteConfirm = false

    private var rentedTools: [Tool] {
        company.tools.filter { $0.ownership == .rented }.sorted { $0.name < $1.name }
    }

    private var overdueTools: [Tool] {
        rentedTools.filter { $0.effectiveStatus == .overdue }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                infoCard
                contactCard
                toolsCard

                Button(role: .destructive) {
                    showingDeleteConfirm = true
                } label: {
                    Label("Excluir Locadora", systemImage: "trash.fill")
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
        .navigationTitle(company.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Editar") { showingEditSheet = true }
            }
        }
        .sheet(isPresented: $showingEditSheet) {
            RentalCompanyEditView(company: company)
        }
        .confirmationDialog("Excluir esta locadora?", isPresented: $showingDeleteConfirm) {
            Button("Excluir", role: .destructive) {
                context.delete(company)
            }
            Button("Cancelar", role: .cancel) {}
        } message: {
            Text("As ferramentas associadas permanecerão, mas sem locadora vinculada.")
        }
    }

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 14) {
                Image(systemName: "building.2.fill")
                    .font(.system(size: 24))
                    .foregroundStyle(Color.appAccent)
                    .frame(width: 52, height: 52)
                    .background(Color.appAccent.opacity(0.15))
                    .clipShape(.rect(cornerRadius: 13))

                VStack(alignment: .leading, spacing: 3) {
                    Text(company.name)
                        .font(.system(size: 20, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                    if !company.cnpj.isEmpty {
                        Text("CNPJ: \(company.cnpj)")
                            .font(.system(size: 13))
                            .foregroundStyle(Color.appTextSecondary)
                    }
                }
                Spacer()
            }

            HStack(spacing: 16) {
                VStack {
                    Text("\(rentedTools.count)")
                        .font(.system(size: 22, weight: .bold, design: .rounded))
                        .foregroundStyle(Color.appAccent)
                    Text("Alugadas")
                        .font(.system(size: 11))
                        .foregroundStyle(Color.appTextSecondary)
                }
                .frame(maxWidth: .infinity)

                Rectangle()
                    .fill(Color.appSeparator)
                    .frame(width: 0.5, height: 32)

                VStack {
                    Text("\(overdueTools.count)")
                        .font(.system(size: 22, weight: .bold, design: .rounded))
                        .foregroundStyle(overdueTools.count > 0 ? Color.statusRed : .white)
                    Text("Atrasadas")
                        .font(.system(size: 11))
                        .foregroundStyle(Color.appTextSecondary)
                }
                .frame(maxWidth: .infinity)
            }
            .padding(.top, 4)
        }
        .cardStyle()
    }

    private var contactCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Contato")

            if !company.contactPerson.isEmpty {
                contactRow(icon: "person.fill", label: "Contato", value: company.contactPerson, color: .statusBlue)
            }
            if !company.phone.isEmpty {
                if let url = URL(string: "tel:\(company.phone.filter { $0.isNumber })") {
                    Link(destination: url) {
                        contactRow(icon: "phone.fill", label: "Telefone", value: company.phone, color: .statusGreen)
                    }
                    .buttonStyle(.plain)
                }
            }
            if !company.email.isEmpty {
                if let url = URL(string: "mailto:\(company.email)") {
                    Link(destination: url) {
                        contactRow(icon: "envelope.fill", label: "E-mail", value: company.email, color: .appOrange)
                    }
                    .buttonStyle(.plain)
                }
            }
            if !company.address.isEmpty {
                contactRow(icon: "mappin.and.ellipse", label: "Endereço", value: company.address, color: .appAccent)
            }
        }
        .cardStyle()
    }

    private var toolsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionHeader(title: "Ferramentas Alugadas", count: rentedTools.count)

            if rentedTools.isEmpty {
                Text("Nenhuma ferramenta alugada desta locadora.")
                    .font(.system(size: 14))
                    .foregroundStyle(Color.appTextSecondary)
                    .padding(.vertical, 8)
            } else {
                ForEach(rentedTools) { tool in
                    NavigationLink {
                        ToolDetailView(tool: tool)
                    } label: {
                        HStack(spacing: 10) {
                            Image(systemName: tool.ownership.iconName)
                                .font(.system(size: 12))
                                .foregroundStyle(Color.appOrange)
                                .frame(width: 28)

                            VStack(alignment: .leading, spacing: 2) {
                                Text(tool.name)
                                    .font(.system(size: 14, weight: .medium))
                                    .foregroundStyle(.white)
                                    .lineLimit(1)
                                if let days = tool.daysRemaining {
                                    Text(days < 0 ? "Atrasado \(abs(days))d" : "Faltam \(days)d")
                                        .font(.system(size: 11, weight: .medium))
                                        .foregroundStyle(days < 0 ? Color.statusRed : Color.appTextSecondary)
                                }
                            }
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.system(size: 11))
                                .foregroundStyle(Color.appTextSecondary.opacity(0.5))
                        }
                    }
                    .buttonStyle(.plain)

                    if tool.id != rentedTools.last?.id {
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
