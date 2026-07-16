import Foundation
import SwiftData
import UniformTypeIdentifiers

enum AttachmentType: String, Codable, CaseIterable, Sendable {
    case photo = "Foto"
    case video = "Vídeo"

    var iconName: String {
        switch self {
        case .photo: "photo.fill"
        case .video: "video.fill"
        }
    }
}

enum AttachmentPurpose: String, Codable, CaseIterable, Sendable {
    case general = "Geral"
    case serialNumber = "Número de Registro"
    case delivery = "Entrega"
    case receipt = "Recebimento"
    case condition = "Estado/Condição"

    var label: String { rawValue }
}

@Model
final class ToolAttachment {
    @Attribute(.unique) var id: UUID = UUID()
    var type: AttachmentType = AttachmentType.photo
    var purpose: AttachmentPurpose = AttachmentPurpose.general
    var localPath: String = ""
    var caption: String = ""
    var createdAt: Date = Date()

    var tool: Tool? = nil
    var movement: ToolMovement? = nil

    init(
        type: AttachmentType,
        purpose: AttachmentPurpose = .general,
        localPath: String,
        caption: String = "",
        tool: Tool? = nil,
        movement: ToolMovement? = nil
    ) {
        self.id = UUID()
        self.type = type
        self.purpose = purpose
        self.localPath = localPath
        self.caption = caption
        self.createdAt = Date()
        self.tool = tool
        self.movement = movement
    }

    var fileURL: URL? {
        guard !localPath.isEmpty else { return nil }
        return AttachmentStorage.url(for: localPath)
    }

    var fileName: String {
        fileURL?.lastPathComponent ?? "anexo"
    }

    var utType: UTType {
        switch type {
        case .photo: .jpeg
        case .video: .mpeg4Movie
        }
    }
}

enum AttachmentStorage {
    static var baseDirectory: URL? {
        let fm = FileManager.default
        guard let docs = fm.urls(for: .documentDirectory, in: .userDomainMask).first else { return nil }
        let dir = docs.appendingPathComponent("ToolAttachments", isDirectory: true)
        try? fm.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
    }

    static func saveData(_ data: Data, type: AttachmentType, purpose: AttachmentPurpose) -> String? {
        guard let dir = baseDirectory else { return nil }
        let ext = type == .photo ? "jpg" : "mp4"
        let prefix = purpose == .serialNumber ? "registro" : (purpose == .delivery ? "entrega" : (purpose == .receipt ? "recebimento" : "anexo"))
        let filename = "\(prefix)-\(UUID().uuidString).\(ext)"
        let url = dir.appendingPathComponent(filename)
        do {
            try data.write(to: url)
            return filename
        } catch {
            return nil
        }
    }

    static func url(for filename: String) -> URL? {
        baseDirectory?.appendingPathComponent(filename)
    }

    static func delete(filename: String) {
        guard let url = url(for: filename) else { return }
        try? FileManager.default.removeItem(at: url)
    }
}
