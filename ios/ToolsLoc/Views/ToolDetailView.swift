import SwiftUI
import SwiftData

struct ToolDetailView: View {
    @Environment(\.modelContext) private var context
    @Bindable var tool: Tool
    @Query(
        filter: #Predicate<ToolMovement> { _ in true },
        sort: \ToolMovement.timestamp,
        order: .reverse
    )
    private var allMovements: [ToolMovement]
    @State private var showingEditSheet = false
    @State private var showingDeleteConfirm = false
    @State private var showingShareSheet = false
    @State private var sharedFileURL: URL? = nil
    @State private var showingAttachmentViewer = false
    @State private var selectedAttachment: ToolAttachment? = nil
    @State private var showingAddMediaSheet = false

    private var toolMovements: [ToolMovement] {
        allMovements.filter { $0.tool?.id == tool.id }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                statusBanner
                ownershipCard
                assignmentCard
                detailsCard

                if !tool.notes.isEmpty {
                    notesCard
                }

                if !tool.attachments.isEmpty {
                    attachmentsCard
                }

                movementHistoryCard

                Button(role: .destructive) {
                    showingDeleteConfirm = true
                } label: {
                    Label("Excluir Ferramenta", systemImage: "trash.fill")
                        .font(.system(size: 15, weight: .semibold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.statusRed.opacity(0.12))
                        .clipShape(.rect(cornerRadius: 12))
                }
                .padding(.top, 8)
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
            .padding(.bottom, 24)
        }
        .background(Color.appBg.ignoresSafeArea())
        .navigationTitle(tool.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Editar") {
                    showingEditSheet = true
                }
            }
        }
        .sheet(isPresented: $showingEditSheet) {
            ToolEditView(tool: tool)
        }
        .sheet(isPresented: $showingAddMediaSheet) {
            MediaPickerSheet(tool: tool, purpose: .general, allowsVideo: true) { attachment in
                context.insert(attachment)
                tool.attachments.append(attachment)
                try? context.save()
            }
        }
        .sheet(item: $selectedAttachment) { attachment in
            AttachmentViewer(attachment: attachment)
        }
        .sheet(isPresented: $showingShareSheet) {
            if let url = sharedFileURL {
                ShareSheet(items: [url])
            }
        }
        .confirmationDialog("Excluir esta ferramenta?", isPresented: $showingDeleteConfirm) {
            Button("Excluir", role: .destructive) {
                context.delete(tool)
            }
            Button("Cancelar", role: .cancel) {}
        } message: {
            Text("Esta ação não pode ser desfeita.")
        }
    }

    private var statusBanner: some View {
        HStack(spacing: 12) {
            Image(systemName: tool.effectiveStatus.iconName)
                .font(.system(size: 28))
                .foregroundStyle(.white)
                .frame(width: 56, height: 56)
                .background(Color.statusColor(named: tool.effectiveStatus.colorName))
                .clipShape(.rect(cornerRadius: 14))

            VStack(alignment: .leading, spacing: 3) {
                Text(tool.effectiveStatus.rawValue)
                    .font(.system(size: 22, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                Text(tool.ownership == .rented ? "Ferramenta Alugada" : "Ferramenta Própria")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(Color.appTextSecondary)
            }
            Spacer()
        }
        .padding(16)
        .background(Color.statusColor(named: tool.effectiveStatus.colorName).opacity(0.15))
        .clipShape(.rect(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.statusColor(named: tool.effectiveStatus.colorName).opacity(0.3), lineWidth: 1)
        )
    }

    private var ownershipCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: tool.ownership == .rented ? "Aluguel" : "Propriedade")

            if tool.ownership == .rented {
                detailRow(label: "Locadora", value: tool.rentalCompany?.name ?? "—")
                detailRow(label: "Custo diário", value: formatCurrency(tool.dailyRentalCost))
                detailRow(label: "Início", value: formatShortDate(tool.rentalStartDate))
                detailRow(label: "Devolução", value: formatShortDate(tool.rentalEndDate))

                if let days = tool.daysRemaining {
                    HStack {
                        Text(days < 0 ? "Atrasado" : "Dias restantes")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(Color.appTextSecondary)
                        Spacer()
                        Text("\(abs(days)) dia(s)")
                            .font(.system(size: 16, weight: .bold, design: .rounded))
                            .foregroundStyle(days < 0 ? Color.statusRed : (days <= 3 ? Color.statusOrange : .white))
                    }
                    .padding(.top, 4)

                    detailRow(label: "Custo acumulado", value: formatCurrency(tool.totalRentalCost))
                }
            } else {
                detailRow(label: "Data de compra", value: formatShortDate(tool.purchaseDate))
                detailRow(label: "Tempo de uso", value: ownershipDuration)
            }
        }
        .cardStyle()
    }

    private var ownershipDuration: String {
        guard let purchase = tool.purchaseDate else { return "—" }
        let months = Calendar.current.dateComponents([.month], from: purchase, to: Date()).month ?? 0
        if months < 12 {
            return "\(months) mês(es)"
        }
        let years = months / 12
        let remMonths = months % 12
        return remMonths == 0 ? "\(years) ano(s)" : "\(years) ano(s) e \(remMonths) mês(es)"
    }

    private var assignmentCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Alocação")

            HStack(spacing: 12) {
                Image(systemName: "hammer.fill")
                    .font(.system(size: 16))
                    .foregroundStyle(Color.statusGreen)
                    .frame(width: 32, height: 32)
                    .background(Color.statusGreen.opacity(0.15))
                    .clipShape(.rect(cornerRadius: 8))
                VStack(alignment: .leading, spacing: 2) {
                    Text("Obra")
                        .font(.system(size: 12))
                        .foregroundStyle(Color.appTextSecondary)
                    Text(tool.currentSite?.name ?? "Não alocada")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(.white)
                }
                Spacer()
            }

            Divider().overlay(Color.appSeparator)

            HStack(spacing: 12) {
                Image(systemName: "person.fill")
                    .font(.system(size: 16))
                    .foregroundStyle(Color.statusBlue)
                    .frame(width: 32, height: 32)
                    .background(Color.statusBlue.opacity(0.15))
                    .clipShape(.rect(cornerRadius: 8))
                VStack(alignment: .leading, spacing: 2) {
                    Text("Responsável")
                        .font(.system(size: 12))
                        .foregroundStyle(Color.appTextSecondary)
                    Text(tool.currentEmployee?.name ?? "Sem responsável")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(.white)
                }
                Spacer()
            }
        }
        .cardStyle()
    }

    private var detailsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Detalhes")

            detailRow(label: "Marca", value: tool.brand.isEmpty ? "—" : tool.brand)
            detailRow(label: "Modelo", value: tool.model.isEmpty ? "—" : tool.model)
            detailRow(label: "N° de série", value: tool.serialNumber.isEmpty ? "—" : tool.serialNumber)
        }
        .cardStyle()
    }

    private var notesCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            SectionHeader(title: "Observações")
            Text(tool.notes)
                .font(.system(size: 14))
                .foregroundStyle(Color.appTextSecondary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .cardStyle()
    }

    private var attachmentsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(
                title: "Anexos",
                count: tool.attachments.count,
                actionTitle: "Adicionar",
                action: { showingAddMediaSheet = true }
            )

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 72))], spacing: 12) {
                ForEach(tool.attachments) { attachment in
                    Button {
                        selectedAttachment = attachment
                    } label: {
                        VStack(spacing: 4) {
                            AttachmentThumbnail(attachment: attachment)
                            Text(attachment.purpose == .serialNumber ? "Registro" : (attachment.type == .video ? "Vídeo" : "Foto"))
                                .font(.system(size: 10, weight: .medium))
                                .foregroundStyle(Color.appTextSecondary)
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .cardStyle()
    }

    // MARK: - Movement History

    private var movementHistoryCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                SectionHeader(title: "Histórico", count: toolMovements.count)
                Spacer()
                if !toolMovements.isEmpty {
                    Button {
                        if let url = ReportGenerator.generateMovementsReport(movements: toolMovements) {
                            sharedFileURL = url
                            showingShareSheet = true
                        }
                    } label: {
                        Image(systemName: "square.and.arrow.up")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(Color.appAccent)
                    }
                }
            }

            if toolMovements.isEmpty {
                Text("Nenhuma movimentação registrada.")
                    .font(.system(size: 14))
                    .foregroundStyle(Color.appTextSecondary)
                    .padding(.vertical, 8)
            } else {
                VStack(spacing: 0) {
                    ForEach(Array(toolMovements.prefix(20).enumerated()), id: \.element.id) { index, mov in
                        movementRow(mov)
                        if index < min(toolMovements.count, 20) - 1 {
                            Divider().overlay(Color.appSeparator)
                        }
                    }

                    if toolMovements.count > 20 {
                        Text("+ \(toolMovements.count - 20) movimentação(ões) anterior(es)")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(Color.appTextSecondary)
                            .padding(.top, 8)
                    }
                }
            }
        }
        .cardStyle()
    }

    private func movementRow(_ mov: ToolMovement) -> some View {
        HStack(spacing: 12) {
            Image(systemName: mov.type.iconName)
                .font(.system(size: 14))
                .foregroundStyle(Color.statusColor(named: mov.type.colorName))
                .frame(width: 32, height: 32)
                .background(Color.statusColor(named: mov.type.colorName).opacity(0.15))
                .clipShape(.rect(cornerRadius: 8))

            VStack(alignment: .leading, spacing: 2) {
                Text(mov.type.rawValue)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.white)
                if !mov.oldValue.isEmpty || !mov.newValue.isEmpty {
                    Text("\(mov.oldValue) → \(mov.newValue)")
                        .font(.system(size: 12))
                        .foregroundStyle(Color.appTextSecondary)
                }
                Text(formatDateTime(mov.timestamp))
                    .font(.system(size: 11))
                    .foregroundStyle(Color.appTextSecondary.opacity(0.6))
            }
            Spacer()
        }
        .padding(.vertical, 6)
    }

    private func detailRow(label: String, value: String) -> some View {
        HStack {
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

// MARK: - Share Sheet

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

#Preview {
    NavigationStack {
        ToolDetailView(tool: Tool(name: "Furadeira", brand: "Bosch"))
    }
    .modelContainer(for: [Tool.self, RentalCompany.self, ConstructionSite.self, Employee.self, ToolMovement.self, ToolAttachment.self], inMemory: true)
}
