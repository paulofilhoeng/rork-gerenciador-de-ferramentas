import SwiftUI
import SwiftData

struct PhotoValidationView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    let tool: Tool
    let operation: ValidationOperation
    let onComplete: ([ToolAttachment]) -> Void

    @State private var attachments: [ToolAttachment] = []
    @State private var showPicker = false
    @State private var pickerPurpose: AttachmentPurpose = .general
    @State private var errorMessage: String? = nil

    enum ValidationOperation: String, CaseIterable {
        case delivery = "Entrega"
        case receipt = "Recebimento"

        var purpose: AttachmentPurpose {
            switch self {
            case .delivery: return .delivery
            case .receipt: return .receipt
            }
        }
    }

    private var serialPhotoAdded: Bool {
        attachments.contains { $0.purpose == .serialNumber }
    }

    private var isValid: Bool {
        attachments.count >= 3 && serialPhotoAdded
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    headerCard

                    requirementsCard

                    attachmentsSection

                    if let errorMessage {
                        Text(errorMessage)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(Color.statusRed)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 16)
                    }

                    Button {
                        if isValid {
                            for attachment in attachments {
                                context.insert(attachment)
                            }
                            onComplete(attachments)
                            dismiss()
                        } else {
                            errorMessage = "Adicione 3 fotos, incluindo uma do número de registro."
                        }
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "checkmark.circle.fill")
                            Text("Confirmar \(operation.rawValue.lowercased())")
                        }
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(Color(red: 0.10, green: 0.10, blue: 0.11))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(isValid ? Color.appAccent : Color.appTextSecondary.opacity(0.3))
                        .clipShape(.rect(cornerRadius: 12))
                    }
                    .disabled(!isValid)
                    .padding(.horizontal, 16)
                    .padding(.top, 8)
                }
                .padding(.vertical, 16)
            }
            .background(Color.appBg.ignoresSafeArea())
            .navigationTitle("Validar Fotos")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancelar") { dismiss() }
                }
            }
            .sheet(isPresented: $showPicker) {
                MediaPickerSheet(
                    tool: tool,
                    purpose: pickerPurpose,
                    allowsVideo: false,
                    onAdded: { attachment in
                        attachments.append(attachment)
                    }
                )
            }
        }
    }

    private var headerCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                Image(systemName: "camera.fill")
                    .font(.system(size: 24))
                    .foregroundStyle(Color.appAccent)
                    .frame(width: 48, height: 48)
                    .background(Color.appAccent.opacity(0.15))
                    .clipShape(.rect(cornerRadius: 12))

                VStack(alignment: .leading, spacing: 3) {
                    Text("\(operation.rawValue) de \(tool.name)")
                        .font(.system(size: 18, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                    Text("Registro fotográfico obrigatório")
                        .font(.system(size: 13))
                        .foregroundStyle(Color.appTextSecondary)
                }
                Spacer()
            }
        }
        .padding(16)
        .cardStyle()
        .padding(.horizontal, 16)
    }

    private var requirementsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Requisitos")

            VStack(alignment: .leading, spacing: 10) {
                requirementRow(
                    icon: serialPhotoAdded ? "checkmark.circle.fill" : "1.circle.fill",
                    text: "Foto do número de registro da ferramenta",
                    isMet: serialPhotoAdded
                )
                requirementRow(
                    icon: attachments.count >= 2 ? "checkmark.circle.fill" : "2.circle.fill",
                    text: "Foto geral do estado da ferramenta",
                    isMet: attachments.count >= 2
                )
                requirementRow(
                    icon: attachments.count >= 3 ? "checkmark.circle.fill" : "3.circle.fill",
                    text: "Foto adicional (local, acessórios, etc.)",
                    isMet: attachments.count >= 3
                )
            }
        }
        .padding(16)
        .cardStyle()
        .padding(.horizontal, 16)
    }

    private func requirementRow(icon: String, text: String, isMet: Bool) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(isMet ? Color.statusGreen : Color.appTextSecondary)
                .frame(width: 28)
            Text(text)
                .font(.system(size: 14, weight: isMet ? .semibold : .medium))
                .foregroundStyle(isMet ? .white : Color.appTextSecondary)
            Spacer()
        }
    }

    private var attachmentsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(
                title: "Fotos",
                count: attachments.count,
                actionTitle: "Adicionar",
                action: { showAddOptions() }
            )

            if attachments.isEmpty {
                Text("Nenhuma foto adicionada.")
                    .font(.system(size: 14))
                    .foregroundStyle(Color.appTextSecondary)
                    .padding(.vertical, 8)
            } else {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 72))], spacing: 12) {
                    ForEach(attachments) { attachment in
                        attachmentCell(attachment)
                    }
                }
            }

            Button {
                pickerPurpose = .serialNumber
                showPicker = true
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "textformat.123")
                    Text(serialPhotoAdded ? "Refazer foto do registro" : "Foto do número de registro")
                }
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(Color.appAccent)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(Color.appAccent.opacity(0.12))
                .clipShape(.rect(cornerRadius: 10))
            }
            .padding(.top, 4)
        }
        .padding(16)
        .cardStyle()
        .padding(.horizontal, 16)
    }

    private func showAddOptions() {
        pickerPurpose = operation.purpose
        showPicker = true
    }

    private func attachmentCell(_ attachment: ToolAttachment) -> some View {
        VStack(spacing: 4) {
            AttachmentThumbnail(attachment: attachment)
            Text(attachment.purpose == .serialNumber ? "Registro" : "Geral")
                .font(.system(size: 10, weight: .medium))
                .foregroundStyle(Color.appTextSecondary)
        }
        .overlay(alignment: .topTrailing) {
            Button {
                if let filename = attachment.localPath.nilIfEmpty {
                    AttachmentStorage.delete(filename: filename)
                }
                attachments.removeAll { $0.id == attachment.id }
            } label: {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 16))
                    .foregroundStyle(Color.statusRed)
                    .background(Color.appBg.clipShape(.circle))
            }
            .offset(x: 6, y: -6)
        }
    }
}

private extension String {
    var nilIfEmpty: String? {
        isEmpty ? nil : self
    }
}
