import SwiftUI
import SwiftData

struct SettingsView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \Tool.name) private var tools: [Tool]
    @Query(sort: \ToolMovement.timestamp, order: .reverse) private var allMovements: [ToolMovement]
    @StateObject private var notificationManager = NotificationManager.shared

    @State private var showingShareSheet = false
    @State private var sharedFileURL: URL? = nil
    @State private var reportType: ReportType? = nil
    @State private var showPermissionDenied = false

    enum ReportType: String, CaseIterable {
        case tools = "Inventário Completo"
        case rentals = "Relatório de Alugueis"
        case movements = "Histórico de Movimentações"
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    notificationsSection
                    reportSection
                    aboutSection
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .padding(.bottom, 24)
            }
            .background(Color.appBg.ignoresSafeArea())
            .navigationTitle("Configurações")
            .navigationBarTitleDisplayMode(.inline)
        }
        .sheet(isPresented: $showingShareSheet) {
            if let url = sharedFileURL {
                ShareSheet(items: [url])
            }
        }
        .alert("Notificações Negadas", isPresented: $showPermissionDenied) {
            Button("Abrir Ajustes") {
                if let url = URL(string: UIApplication.openSettingsURLString) {
                    UIApplication.shared.open(url)
                }
            }
            Button("OK", role: .cancel) {}
        } message: {
            Text("Habilite as notificações em Ajustes para receber alertas de vencimento de aluguel.")
        }
    }

    // MARK: - Notifications

    private var notificationsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Notificações")

            VStack(spacing: 14) {
                HStack {
                    VStack(alignment: .leading, spacing: 3) {
                        Text("Alertas de Vencimento")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(.white)
                        Text("Receba notificações antes do vencimento de aluguéis")
                            .font(.system(size: 12))
                            .foregroundStyle(Color.appTextSecondary)
                    }
                    Spacer()
                    Toggle("", isOn: Binding(
                        get: { notificationManager.notificationsEnabled },
                        set: { newValue in
                            if newValue {
                                notificationManager.requestPermission { granted in
                                    if granted {
                                        notificationManager.scheduleNotificationsForTools(tools)
                                    } else {
                                        showPermissionDenied = true
                                    }
                                }
                            } else {
                                notificationManager.setNotificationsEnabled(false)
                            }
                        }
                    ))
                    .tint(Color.appAccent)
                }

                if notificationManager.notificationsEnabled {
                    Divider().overlay(Color.appSeparator)

                    HStack {
                        Text("Alertar com")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(Color.appTextSecondary)
                        Spacer()
                        Picker("", selection: Binding(
                            get: { notificationManager.alertDaysBefore },
                            set: { newValue in
                                notificationManager.setAlertDays(newValue)
                                notificationManager.scheduleNotificationsForTools(tools)
                            }
                        )) {
                            Text("1 dia").tag(1)
                            Text("2 dias").tag(2)
                            Text("3 dias").tag(3)
                            Text("5 dias").tag(5)
                            Text("7 dias").tag(7)
                            Text("15 dias").tag(15)
                        }
                        .tint(Color.appAccent)
                        Text("de antecedência")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(Color.appTextSecondary)
                    }

                    HStack {
                        Image(systemName: "bell.badge.fill")
                            .font(.system(size: 12))
                            .foregroundStyle(Color.appAccent)
                        Text("\(tools.filter { $0.ownership == .rented && $0.rentalEndDate != nil }.count) alerta(s) programado(s)")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(Color.appTextSecondary)
                        Spacer()
                        Button("Reagendar") {
                            notificationManager.scheduleNotificationsForTools(tools)
                        }
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(Color.appAccent)
                    }
                }
            }
            .cardStyle()
        }
    }

    // MARK: - Reports

    private var reportSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Relatórios")

            VStack(spacing: 10) {
                ForEach(ReportType.allCases, id: \.self) { type in
                    Button {
                        generateReport(type)
                    } label: {
                        HStack(spacing: 12) {
                            Image(systemName: reportIcon(for: type))
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundStyle(Color.appAccent)
                                .frame(width: 36, height: 36)
                                .background(Color.appAccent.opacity(0.15))
                                .clipShape(.rect(cornerRadius: 9))

                            VStack(alignment: .leading, spacing: 2) {
                                Text(type.rawValue)
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundStyle(.white)
                                Text(reportDescription(for: type))
                                    .font(.system(size: 12))
                                    .foregroundStyle(Color.appTextSecondary)
                            }
                            Spacer()
                            Image(systemName: "square.and.arrow.up")
                                .font(.system(size: 14))
                                .foregroundStyle(Color.appTextSecondary)
                        }
                    }
                    .buttonStyle(.plain)

                    if type != ReportType.allCases.last {
                        Divider().overlay(Color.appSeparator)
                    }
                }
            }
            .cardStyle()
        }
    }

    private func reportIcon(for type: ReportType) -> String {
        switch type {
        case .tools: "wrench.and.screwdriver.fill"
        case .rentals: "key.fill"
        case .movements: "clock.arrow.circlepath"
        }
    }

    private func reportDescription(for type: ReportType) -> String {
        switch type {
        case .tools: "Todas as ferramentas com status e localização"
        case .rentals: "Ferramentas alugadas com custos e prazos"
        case .movements: "Todas as movimentações registradas (\(allMovements.count))"
        }
    }

    private func generateReport(_ type: ReportType) {
        let url: URL?
        switch type {
        case .tools:
            url = ReportGenerator.generateToolsReport(tools: tools)
        case .rentals:
            url = ReportGenerator.generateRentalReport(tools: tools)
        case .movements:
            url = ReportGenerator.generateMovementsReport(movements: allMovements)
        }
        if let url = url {
            sharedFileURL = url
            showingShareSheet = true
        }
    }

    // MARK: - About

    private var aboutSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Sobre")

            VStack(spacing: 10) {
                infoRow(icon: "app.fill", label: "Versão", value: "1.0.0")
                Divider().overlay(Color.appSeparator)
                infoRow(icon: "wrench.adjustable.fill", label: "Ferramentas", value: "\(tools.count)")
                Divider().overlay(Color.appSeparator)
                infoRow(icon: "clock.arrow.circlepath", label: "Movimentações", value: "\(allMovements.count)")
            }
            .cardStyle()
        }
    }

    private func infoRow(icon: String, label: String, value: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundStyle(Color.appAccent)
                .frame(width: 28)
            Text(label)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(Color.appTextSecondary)
            Spacer()
            Text(value)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(.white)
        }
    }
}

#Preview {
    SettingsView()
        .modelContainer(for: [Tool.self, RentalCompany.self, ConstructionSite.self, Employee.self, ToolMovement.self, ToolAttachment.self], inMemory: true)
}
