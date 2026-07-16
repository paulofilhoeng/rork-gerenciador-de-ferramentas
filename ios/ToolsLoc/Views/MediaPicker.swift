import SwiftUI
import PhotosUI
import AVKit

struct MediaPickerSheet: View {
    @Environment(\.dismiss) private var dismiss
    let tool: Tool
    let purpose: AttachmentPurpose
    let allowsVideo: Bool
    let onAdded: (ToolAttachment) -> Void

    @State private var selectedItems: [PhotosPickerItem] = []
    @State private var isLoading = false
    @State private var showCamera = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                Text(purpose == .serialNumber ? "Fotografe o número de registro" : "Anexar foto ou vídeo")
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.center)
                    .padding(.top, 8)

                if purpose == .serialNumber {
                    HStack(spacing: 8) {
                        Image(systemName: "textformat.123")
                            .font(.system(size: 14))
                            .foregroundStyle(Color.appAccent)
                        Text("A imagem deve mostrar claramente o número de registro da ferramenta (\(tool.serialNumber.isEmpty ? "N/S" : tool.serialNumber)).")
                            .font(.system(size: 13))
                            .foregroundStyle(Color.appTextSecondary)
                    }
                    .padding(.horizontal, 16)
                }

                Button {
                    showCamera = true
                } label: {
                    HStack(spacing: 10) {
                        Image(systemName: "camera.fill")
                            .font(.system(size: 18))
                        Text("Usar Câmera")
                            .font(.system(size: 15, weight: .semibold))
                    }
                    .foregroundStyle(Color(red: 0.10, green: 0.10, blue: 0.11))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color.appAccent)
                    .clipShape(.rect(cornerRadius: 12))
                }
                .padding(.horizontal, 16)

                PhotosPicker(
                    selection: $selectedItems,
                    maxSelectionCount: 5,
                    matching: allowsVideo ? .any(of: [.images, .videos]) : .images,
                    photoLibrary: .shared()
                ) {
                    HStack(spacing: 10) {
                        Image(systemName: "photo.on.rectangle.angled")
                            .font(.system(size: 18))
                        Text("Escolher da Biblioteca")
                            .font(.system(size: 15, weight: .semibold))
                    }
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color.appCardElevated)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.appSeparator, lineWidth: 0.5)
                    )
                    .clipShape(.rect(cornerRadius: 12))
                }
                .padding(.horizontal, 16)

                if isLoading {
                    ProgressView()
                        .tint(Color.appAccent)
                        .padding(.top, 12)
                }

                Spacer()
            }
            .frame(maxWidth: .infinity)
            .background(Color.appBg.ignoresSafeArea())
            .navigationTitle("Anexar Mídia")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancelar") { dismiss() }
                }
            }
            .onChange(of: selectedItems) { oldValue, newValue in
                Task { await loadSelectedItems(newValue) }
            }
            .sheet(isPresented: $showCamera) {
                CameraCaptureView(purpose: purpose) { data, type in
                    if let filename = AttachmentStorage.saveData(data, type: type, purpose: purpose) {
                        let attachment = ToolAttachment(
                            type: type,
                            purpose: purpose,
                            localPath: filename,
                            tool: tool
                        )
                        onAdded(attachment)
                    }
                    dismiss()
                }
            }
        }
    }

    private func loadSelectedItems(_ items: [PhotosPickerItem]) async {
        guard !items.isEmpty else { return }
        isLoading = true
        for item in items {
            if let data = try? await item.loadTransferable(type: Data.self) {
                let isVideo = item.supportedContentTypes.contains(where: { $0.conforms(to: .movie) })
                let type: AttachmentType = isVideo ? .video : .photo
                if let filename = AttachmentStorage.saveData(data, type: type, purpose: purpose) {
                    let attachment = ToolAttachment(
                        type: type,
                        purpose: purpose,
                        localPath: filename,
                        tool: tool
                    )
                    await MainActor.run {
                        onAdded(attachment)
                    }
                }
            }
        }
        isLoading = false
        await MainActor.run { dismiss() }
    }
}

struct CameraCaptureView: UIViewControllerRepresentable {
    let purpose: AttachmentPurpose
    let onCapture: (Data, AttachmentType) -> Void

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.mediaTypes = ["public.image"]
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(onCapture: onCapture)
    }

    final class Coordinator: NSObject, UINavigationControllerDelegate, UIImagePickerControllerDelegate {
        let onCapture: (Data, AttachmentType) -> Void

        init(onCapture: @escaping (Data, AttachmentType) -> Void) {
            self.onCapture = onCapture
        }

        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            picker.dismiss(animated: true)
            guard let image = info[.originalImage] as? UIImage,
                  let data = image.jpegData(compressionQuality: 0.85) else { return }
            onCapture(data, .photo)
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            picker.dismiss(animated: true)
        }
    }
}

struct AttachmentThumbnail: View {
    let attachment: ToolAttachment
    @State private var image: UIImage? = nil

    var body: some View {
        Group {
            if attachment.type == .video {
                VideoThumbnail(url: attachment.fileURL)
            } else if let image {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } else {
                Color.appCardElevated
                    .overlay(
                        Image(systemName: "photo")
                            .font(.system(size: 20))
                            .foregroundStyle(Color.appTextSecondary)
                    )
            }
        }
        .frame(width: 64, height: 64)
        .clipShape(.rect(cornerRadius: 8))
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.appSeparator, lineWidth: 0.5)
        )
        .task {
            if let url = attachment.fileURL, let data = try? Data(contentsOf: url) {
                image = UIImage(data: data)
            }
        }
    }
}

struct VideoThumbnail: View {
    let url: URL?

    var body: some View {
        ZStack {
            Color.appCardElevated
            Image(systemName: "play.fill")
                .font(.system(size: 20))
                .foregroundStyle(.white)
        }
    }
}

struct AttachmentViewer: View {
    let attachment: ToolAttachment
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()
                if attachment.type == .video, let url = attachment.fileURL {
                    VideoPlayer(player: AVPlayer(url: url))
                } else if let url = attachment.fileURL, let image = UIImage(contentsOfFile: url.path) {
                    Image(uiImage: image)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                } else {
                    Text("Não foi possível carregar o anexo.")
                        .foregroundStyle(Color.appTextSecondary)
                }
            }
            .navigationTitle(attachment.purpose.label)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Fechar") { dismiss() }
                }
            }
        }
    }
}
