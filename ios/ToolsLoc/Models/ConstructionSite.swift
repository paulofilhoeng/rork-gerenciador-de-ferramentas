import Foundation
import SwiftData

enum SiteStatus: String, Codable, CaseIterable, Sendable {
    case active = "Ativa"
    case paused = "Pausada"
    case completed = "Concluída"

    var colorName: String {
        switch self {
        case .active: "StatusGreen"
        case .paused: "StatusOrange"
        case .completed: "StatusGray"
        }
    }

    var iconName: String {
        switch self {
        case .active: "checkmark.circle.fill"
        case .paused: "pause.circle.fill"
        case .completed: "checkmark.seal.fill"
        }
    }
}

@Model
final class ConstructionSite {
    @Attribute(.unique) var id: UUID = UUID()
    var name: String = ""
    var address: String = ""
    var responsibleName: String = ""
    var responsiblePhone: String = ""
    var status: SiteStatus = SiteStatus.active
    var startDate: Date? = nil
    var notes: String = ""
    var createdAt: Date = Date()

    @Relationship(inverse: \Tool.currentSite)
    var tools: [Tool] = []

    init(
        name: String,
        address: String = "",
        responsibleName: String = "",
        responsiblePhone: String = "",
        status: SiteStatus = .active,
        startDate: Date? = nil,
        notes: String = ""
    ) {
        self.id = UUID()
        self.name = name
        self.address = address
        self.responsibleName = responsibleName
        self.responsiblePhone = responsiblePhone
        self.status = status
        self.startDate = startDate
        self.notes = notes
        self.createdAt = Date()
    }

    var toolCount: Int {
        tools.count
    }
}
