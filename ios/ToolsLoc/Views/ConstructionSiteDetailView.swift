import SwiftUI
import SwiftData

struct ConstructionSiteDetailView: View {
    @Environment(\.modelContext) private var context
    @Bindable var site: ConstructionSite
    @State private var showingEditSheet = false
    @State private var showingDeleteConfirm = false

    private var sortedTools: [Tool] {
        site.tools.sorted { $0.name < $1.name }
    }

    private var ownTools: [Tool] { sortedTools.filter { $0.ownership == .own } }
    private var rentedTools: [Tool] { sortedTools.filter { $0.ownership == .rented } }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                headerCard
                infoCard
                toolsBreakdownCard
                toolsListCard

                Button(role: .destructive) {
                    showingDeleteConfirm = true
                } label: {
                    Label("Excluir Obra", systemImage: "trash.fill")
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
        .navigationTitle(site.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Editar") { showingEditSheet = true }
            }
        }
        .sheet(isPresented: $showingEditSheet) {
            ConstructionSiteEditView(site: site)
        }
        .confirmationDialog("Excluir esta obra?", isPresented: $showingDeleteConfirm) {
            Button("Excluir", role: .destructive) {
                context.delete(site)
            }
            Button("Cancelar", role: .cancel) {}
        } message: {
            Text("As ferramentas alocadas serão desvinculadas da obra.")
        }
    }

    private var headerCard: some View {
        HStack(spacing: 14) {
            Image(systemName: "hammer.fill")
                .font(.system(size: 28))
                .foregroundStyle(.white)
                .frame(width: 56, height: 56)
                .background(Color.statusColor(named: site.status.colorName))
                .clipShape(.rect(cornerRadius: 14))

            VStack(alignment: .leading, spacing: 3) {
                Text(site.name)
                    .font(.system(size: 20, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                    .lineLimit(2)
                Text(site.status.rawValue)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(Color.statusColor(named: site.status.colorName))
            }
            Spacer()
        }
        .padding(16)
        .background(Color.statusColor(named: site.status.colorName).opacity(0.12))
        .clipShape(.rect(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.statusColor(named: site.status.colorName).opacity(0.25), lineWidth: 1)
        )
    }

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Informações")

            if !site.address.isEmpty {
                infoRow(icon: "mappin.and.ellipse", label: "Endereço", value: site.address)
            }
            if !site.responsibleName.isEmpty {
                infoRow(icon: "person.fill", label: "Responsável", value: site.responsibleName)
            }
            if !site.responsiblePhone.isEmpty {
                infoRow(icon: "phone.fill", label: "Telefone", value: site.responsiblePhone)
            }
            if let start = site.startDate {
                infoRow(icon: "calendar", label: "Início", value: formatShortDate(start))
            }
            if !site.notes.isEmpty {
                Divider().overlay(Color.appSeparator)
                VStack(alignment: .leading, spacing: 4) {
                    Text("Observações")
                        .font(.system(size: 12))
                        .foregroundStyle(Color.appTextSecondary)
                    Text(site.notes)
                        .font(.system(size: 14))
                        .foregroundStyle(.white)
                }
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
            SectionHeader(title: "Ferramentas Alocadas", count: sortedTools.count)

            if sortedTools.isEmpty {
                Text("Nenhuma ferramenta alocada nesta obra.")
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
                                if let emp = tool.currentEmployee {
                                    Text(emp.name)
                                        .font(.system(size: 11))
                                        .foregroundStyle(Color.appTextSecondary)
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

    private func infoRow(icon: String, label: String, value: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundStyle(Color.appTextSecondary)
                .frame(width: 28)
            Text(label)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(Color.appTextSecondary)
            Spacer()
            Text(value)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(.white)
                .multilineTextAlignment(.trailing)
        }
    }
}
