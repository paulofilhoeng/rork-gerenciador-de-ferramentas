import SwiftUI
import SwiftData

struct DashboardView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \Tool.name) private var tools: [Tool]
    @Query(sort: \RentalCompany.name) private var companies: [RentalCompany]
    @Query(sort: \ConstructionSite.name) private var sites: [ConstructionSite]
    @Query(sort: \Employee.name) private var employees: [Employee]
    @Query(sort: \ToolMovement.timestamp, order: .reverse) private var allMovements: [ToolMovement]
    @EnvironmentObject private var notificationManager: NotificationManager

    @State private var showingShareSheet = false
    @State private var sharedFileURL: URL? = nil

    private var ownTools: [Tool] { tools.filter { $0.ownership == .own } }
    private var rentedTools: [Tool] { tools.filter { $0.ownership == .rented } }
    private var overdueTools: [Tool] { tools.filter { $0.effectiveStatus == .overdue } }
    private var endingSoonTools: [Tool] { tools.filter { $0.isRentalEndingSoon } }
    private var inMaintenance: [Tool] { tools.filter { $0.baseStatus == .maintenance } }
    private var inUseTools: [Tool] { tools.filter { $0.baseStatus == .inUse } }
    private var availableTools: [Tool] { tools.filter { $0.effectiveStatus == .available } }

    private var totalRentalCost: Double {
        rentedTools.reduce(0) { $0 + $1.totalRentalCost }
    }

    private var activeSites: [ConstructionSite] {
        sites.filter { $0.status == .active }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    headerSection
                    statsGrid

                    if !overdueTools.isEmpty || !endingSoonTools.isEmpty || !inMaintenance.isEmpty {
                        alertsSection
                    }

                    if !rentedTools.isEmpty {
                        rentalCostSection
                    }

                    if !activeSites.isEmpty {
                        activeSitesSection
                    }

                    if !allMovements.isEmpty {
                        recentMovementsSection
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .padding(.bottom, 24)
            }
            .background(Color.appBg.ignoresSafeArea())
            .navigationTitle("ToolsLoc")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        Button {
                            if let url = ReportGenerator.generateToolsReport(tools: tools) {
                                sharedFileURL = url
                                showingShareSheet = true
                            }
                        } label: {
                            Label("Inventário Completo", systemImage: "wrench.and.screwdriver.fill")
                        }
                        Button {
                            if let url = ReportGenerator.generateRentalReport(tools: tools) {
                                sharedFileURL = url
                                showingShareSheet = true
                            }
                        } label: {
                            Label("Relatório de Alugueis", systemImage: "key.fill")
                        }
                        Button {
                            if let url = ReportGenerator.generateMovementsReport(movements: allMovements) {
                                sharedFileURL = url
                                showingShareSheet = true
                            }
                        } label: {
                            Label("Histórico de Movimentações", systemImage: "clock.arrow.circlepath")
                        }
                    } label: {
                        Image(systemName: "square.and.arrow.up")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(Color.appAccent)
                    }
                }
            }
            .sheet(isPresented: $showingShareSheet) {
                if let url = sharedFileURL {
                    ShareSheet(items: [url])
                }
            }
            .onAppear {
                notificationManager.scheduleNotificationsForTools(tools)
            }
        }
    }

    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Gestão de Ferramentas")
                .font(.system(size: 28, weight: .heavy, design: .rounded))
                .foregroundStyle(.white)
            Text("\(tools.count) ferramentas · \(activeSites.count) obras ativas")
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(Color.appTextSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, 8)
    }

    private var statsGrid: some View {
        LazyVGrid(columns: [
            GridItem(.flexible(), spacing: 12),
            GridItem(.flexible(), spacing: 12),
        ], spacing: 12) {
            StatCard(title: "Próprias", value: ownTools.count, icon: "wrench.adjustable.fill", color: .appAccent)
            StatCard(title: "Alugadas", value: rentedTools.count, icon: "key.fill", color: .appOrange)
            StatCard(title: "Em Uso", value: inUseTools.count, icon: "play.circle.fill", color: .statusBlue)
            StatCard(title: "Disponíveis", value: availableTools.count, icon: "checkmark.circle.fill", color: .statusGreen)
            StatCard(title: "Locadoras", value: companies.count, icon: "building.2.fill", color: .appAccent)
            StatCard(title: "Funcionários", value: employees.count, icon: "person.2.fill", color: .appOrange)
        }
    }

    private var alertsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Alertas")

            if !overdueTools.isEmpty {
                AlertCard(
                    title: "\(overdueTools.count) aluguel(éis) atrasado(s)",
                    subtitle: "Devolução vencida — contate a locadora",
                    icon: "exclamationmark.triangle.fill",
                    color: .statusRed,
                    tools: overdueTools
                )
            }

            if !endingSoonTools.isEmpty {
                AlertCard(
                    title: "\(endingSoonTools.count) aluguel(éis) vencendo",
                    subtitle: "Devolução nos próximos 3 dias",
                    icon: "clock.badge.exclamationmark.fill",
                    color: .statusOrange,
                    tools: endingSoonTools
                )
            }

            if !inMaintenance.isEmpty {
                AlertCard(
                    title: "\(inMaintenance.count) em manutenção",
                    subtitle: "Ferramentas indisponíveis para uso",
                    icon: "wrench.fill",
                    color: .statusGray,
                    tools: inMaintenance
                )
            }
        }
    }

    private var rentalCostSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Custo de Aluguel")

            VStack(spacing: 10) {
                HStack {
                    VStack(alignment: .leading, spacing: 3) {
                        Text("Custo acumulado")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(Color.appTextSecondary)
                        Text(formatCurrency(totalRentalCost))
                            .font(.system(size: 26, weight: .bold, design: .rounded))
                            .foregroundStyle(Color.appAccent)
                    }
                    Spacer()
                    Image(systemName: "chart.bar.fill")
                        .font(.system(size: 32))
                        .foregroundStyle(Color.appAccent.opacity(0.3))
                }

                Divider().overlay(Color.appSeparator)

                ForEach(rentedTools.prefix(4)) { tool in
                    HStack {
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
                        Text(formatCurrency(tool.totalRentalCost))
                            .font(.system(size: 14, weight: .semibold, design: .monospaced))
                            .foregroundStyle(Color.appTextSecondary)
                    }
                }
            }
            .cardStyle()
        }
    }

    private var activeSitesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Obras Ativas")

            VStack(spacing: 10) {
                ForEach(activeSites) { site in
                    HStack(spacing: 12) {
                        Image(systemName: "hammer.fill")
                            .font(.system(size: 16))
                            .foregroundStyle(Color.statusGreen)
                            .frame(width: 32, height: 32)
                            .background(Color.statusGreen.opacity(0.15))
                            .clipShape(.rect(cornerRadius: 8))

                        VStack(alignment: .leading, spacing: 2) {
                            Text(site.name)
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundStyle(.white)
                                .lineLimit(1)
                            Text("\(site.toolCount) ferramentas · \(site.responsibleName)")
                                .font(.system(size: 12))
                                .foregroundStyle(Color.appTextSecondary)
                                .lineLimit(1)
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.system(size: 12))
                            .foregroundStyle(Color.appTextSecondary.opacity(0.5))
                    }
                }
            }
            .cardStyle()
        }
    }

    // MARK: - Recent Movements

    private var recentMovementsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Movimentações Recentes")

            VStack(spacing: 0) {
                ForEach(Array(allMovements.prefix(5).enumerated()), id: \.element.id) { index, mov in
                    HStack(spacing: 12) {
                        Image(systemName: mov.type.iconName)
                            .font(.system(size: 13))
                            .foregroundStyle(Color.statusColor(named: mov.type.colorName))
                            .frame(width: 30, height: 30)
                            .background(Color.statusColor(named: mov.type.colorName).opacity(0.15))
                            .clipShape(.rect(cornerRadius: 7))

                        VStack(alignment: .leading, spacing: 2) {
                            Text(mov.type.rawValue)
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(.white)
                                .lineLimit(1)
                            Text(mov.tool?.name ?? "—")
                                .font(.system(size: 12))
                                .foregroundStyle(Color.appTextSecondary)
                                .lineLimit(1)
                        }
                        Spacer()
                        Text(formatRelativeTime(mov.timestamp))
                            .font(.system(size: 11))
                            .foregroundStyle(Color.appTextSecondary.opacity(0.6))
                    }
                    .padding(.vertical, 6)

                    if index < min(allMovements.count, 5) - 1 {
                        Divider().overlay(Color.appSeparator)
                    }
                }
            }
            .cardStyle()
        }
    }
}

// MARK: - Relative Time

func formatRelativeTime(_ date: Date) -> String {
    let formatter = RelativeDateTimeFormatter()
    formatter.unitsStyle = .short
    formatter.locale = Locale(identifier: "pt_BR")
    return formatter.localizedString(for: date, relativeTo: Date())
}

// MARK: - Stat Card

struct StatCard: View {
    let title: String
    let value: Int
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(color)
                .frame(width: 38, height: 38)
                .background(color.opacity(0.15))
                .clipShape(.rect(cornerRadius: 10))

            Text("\(value)")
                .font(.system(size: 30, weight: .bold, design: .rounded))
                .foregroundStyle(.white)

            Text(title)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(Color.appTextSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .cardStyle(padding: 14)
    }
}

// MARK: - Alert Card

struct AlertCard: View {
    let title: String
    let subtitle: String
    let icon: String
    let color: Color
    let tools: [Tool]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 10) {
                Image(systemName: icon)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(color)
                    .frame(width: 36, height: 36)
                    .background(color.opacity(0.15))
                    .clipShape(.rect(cornerRadius: 9))

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(.white)
                    Text(subtitle)
                        .font(.system(size: 12))
                        .foregroundStyle(Color.appTextSecondary)
                }
                Spacer()
            }

            ForEach(tools.prefix(3)) { tool in
                HStack {
                    Text(tool.name)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(Color.appTextSecondary)
                    Spacer()
                    if let company = tool.rentalCompany {
                        Text(company.name)
                            .font(.system(size: 11))
                            .foregroundStyle(Color.appTextSecondary.opacity(0.6))
                            .lineLimit(1)
                    }
                }
                .padding(.leading, 46)
            }

            if tools.count > 3 {
                Text("+ \(tools.count - 3) outra(s)")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(color)
                    .padding(.leading, 46)
            }
        }
        .cardStyle()
    }
}

#Preview {
    DashboardView()
        .modelContainer(for: [Tool.self, RentalCompany.self, ConstructionSite.self, Employee.self, ToolMovement.self, ToolAttachment.self], inMemory: true)
        .environmentObject(NotificationManager.shared)
}
