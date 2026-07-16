import SwiftUI
import SwiftData

struct ToolsView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \Tool.name) private var tools: [Tool]
    @State private var searchText = ""
    @State private var filterOwnership: ToolOwnership? = nil
    @State private var filterStatus: ToolStatus? = nil
    @State private var showingAddSheet = false

    private var filteredTools: [Tool] {
        tools.filter { tool in
            let matchesSearch = searchText.isEmpty
                || tool.name.localizedCaseInsensitiveContains(searchText)
                || tool.brand.localizedCaseInsensitiveContains(searchText)
                || tool.serialNumber.localizedCaseInsensitiveContains(searchText)
            let matchesOwnership = filterOwnership == nil || tool.ownership == filterOwnership
            let matchesStatus = filterStatus == nil || tool.effectiveStatus == filterStatus
            return matchesSearch && matchesOwnership && matchesStatus
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // Filter chips
                    filterChips

                    if filteredTools.isEmpty {
                        EmptyStateView(
                            icon: "wrench.and.screwdriver",
                            title: "Nenhuma ferramenta",
                            subtitle: "Toque em + para adicionar a primeira ferramenta"
                        )
                    } else {
                        LazyVStack(spacing: 10) {
                            ForEach(filteredTools) { tool in
                                NavigationLink {
                                    ToolDetailView(tool: tool)
                                } label: {
                                    ToolRowView(tool: tool)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .padding(.bottom, 24)
            }
            .background(Color.appBg.ignoresSafeArea())
            .navigationTitle("Ferramentas")
            .navigationBarTitleDisplayMode(.inline)
            .searchable(text: $searchText, prompt: "Nome, marca ou série")
        }
        .overlay(alignment: .bottomTrailing) {
            Button {
                showingAddSheet = true
            } label: {
                Image(systemName: "plus")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(Color(red: 0.10, green: 0.10, blue: 0.11))
                    .frame(width: 56, height: 56)
                    .background(Color.appAccent)
                    .clipShape(.rect(cornerRadius: 16))
                    .shadow(color: Color.appAccent.opacity(0.4), radius: 10, y: 4)
            }
            .padding(.trailing, 20)
            .padding(.bottom, 20)
        }
        .sheet(isPresented: $showingAddSheet) {
            ToolEditView()
        }
    }

    private var filterChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                FilterChip(label: "Todas", isActive: filterOwnership == nil && filterStatus == nil) {
                    filterOwnership = nil
                    filterStatus = nil
                }
                FilterChip(label: "Próprias", isActive: filterOwnership == .own) {
                    filterOwnership = filterOwnership == .own ? nil : .own
                }
                FilterChip(label: "Alugadas", isActive: filterOwnership == .rented) {
                    filterOwnership = filterOwnership == .rented ? nil : .rented
                }
                FilterChip(label: "Em Uso", isActive: filterStatus == .inUse) {
                    filterStatus = filterStatus == .inUse ? nil : .inUse
                }
                FilterChip(label: "Disponíveis", isActive: filterStatus == .available) {
                    filterStatus = filterStatus == .available ? nil : .available
                }
                FilterChip(label: "Atrasadas", isActive: filterStatus == .overdue) {
                    filterStatus = filterStatus == .overdue ? nil : .overdue
                }
                FilterChip(label: "Manutenção", isActive: filterStatus == .maintenance) {
                    filterStatus = filterStatus == .maintenance ? nil : .maintenance
                }
            }
        }
    }
}

// MARK: - Filter Chip

struct FilterChip: View {
    let label: String
    let isActive: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(isActive ? Color(red: 0.10, green: 0.10, blue: 0.11) : Color.appTextSecondary)
                .padding(.horizontal, 14)
                .padding(.vertical, 7)
                .background(isActive ? Color.appAccent : Color.appCard)
                .clipShape(.rect(cornerRadius: 8))
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(isActive ? Color.clear : Color.appSeparator, lineWidth: 0.5)
                )
        }
    }
}

// MARK: - Tool Row

struct ToolRowView: View {
    let tool: Tool

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .top) {
                Image(systemName: tool.ownership.iconName)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(tool.ownership == .rented ? Color.appOrange : Color.appAccent)
                    .frame(width: 40, height: 40)
                    .background((tool.ownership == .rented ? Color.appOrange : Color.appAccent).opacity(0.15))
                    .clipShape(.rect(cornerRadius: 10))

                VStack(alignment: .leading, spacing: 3) {
                    Text(tool.name)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(.white)
                        .lineLimit(1)
                    if !tool.brand.isEmpty {
                        Text("\(tool.brand) · \(tool.model)")
                            .font(.system(size: 12))
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

            HStack(spacing: 6) {
                if let site = tool.currentSite {
                    Label(site.name, systemImage: "hammer.fill")
                        .labelStyle(.titleAndIcon)
                } else {
                    Label("Sem obra", systemImage: "hammer")
                        .labelStyle(.titleAndIcon)
                }
                Spacer()
                if let employee = tool.currentEmployee {
                    Label(employee.name, systemImage: "person.fill")
                        .labelStyle(.titleAndIcon)
                } else if tool.baseStatus != .maintenance {
                    Label("Sem responsável", systemImage: "person")
                        .labelStyle(.titleAndIcon)
                }
            }
            .font(.system(size: 11, weight: .medium))
            .foregroundStyle(Color.appTextSecondary)
            .lineLimit(1)

            if tool.ownership == .rented, let days = tool.daysRemaining {
                HStack {
                    Image(systemName: "calendar")
                        .font(.system(size: 10))
                    if days < 0 {
                        Text("Atrasado \(abs(days)) dia(s) · \(formatCurrency(tool.totalRentalCost))")
                            .foregroundStyle(Color.statusRed)
                    } else {
                        Text("Faltam \(days) dia(s) · \(formatCurrency(tool.totalRentalCost))")
                            .foregroundStyle(days <= 3 ? Color.statusOrange : Color.appTextSecondary)
                    }
                }
                .font(.system(size: 11, weight: .semibold))
            }
        }
        .cardStyle()
    }
}

#Preview {
    ToolsView()
        .modelContainer(for: [Tool.self, RentalCompany.self, ConstructionSite.self, Employee.self, ToolMovement.self, ToolAttachment.self], inMemory: true)
}
