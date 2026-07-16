import Foundation
import SwiftData

enum MovementType: String, Codable, CaseIterable, Sendable {
    case created = "Ferramenta Criada"
    case siteAssigned = "Obra Atribuída"
    case siteRemoved = "Obra Removida"
    case siteChanged = "Obra Alterada"
    case employeeAssigned = "Responsável Atribuído"
    case employeeRemoved = "Responsável Removido"
    case employeeChanged = "Responsável Alterado"
    case statusChanged = "Status Alterado"
    case rentalStarted = "Aluguel Iniciado"
    case rentalEnded = "Aluguel Encerrado"
    case ownershipChanged = "Tipo Alterado"
    case notesChanged = "Observações Atualizadas"

    var iconName: String {
        switch self {
        case .created: "plus.circle.fill"
        case .siteAssigned, .siteChanged: "hammer.fill"
        case .siteRemoved: "hammer"
        case .employeeAssigned, .employeeChanged: "person.badge.plus"
        case .employeeRemoved: "person.badge.minus"
        case .statusChanged: "arrow.triangle.2.circlepath"
        case .rentalStarted: "key.fill"
        case .rentalEnded: "key.slash.fill"
        case .ownershipChanged: "arrow.left.arrow.right"
        case .notesChanged: "note.text"
        }
    }

    var colorName: String {
        switch self {
        case .created: "StatusGreen"
        case .siteAssigned, .siteChanged: "StatusBlue"
        case .siteRemoved: "StatusGray"
        case .employeeAssigned, .employeeChanged: "StatusBlue"
        case .employeeRemoved: "StatusGray"
        case .statusChanged: "StatusOrange"
        case .rentalStarted: "StatusGreen"
        case .rentalEnded: "StatusRed"
        case .ownershipChanged: "StatusOrange"
        case .notesChanged: "StatusGray"
        }
    }
}

@Model
final class ToolMovement {
    @Attribute(.unique) var id: UUID = UUID()
    var type: MovementType = MovementType.created
    var movementDescription: String = ""
    var oldValue: String = ""
    var newValue: String = ""
    var timestamp: Date = Date()

    var tool: Tool? = nil

    @Relationship(inverse: \ToolAttachment.movement)
    var attachments: [ToolAttachment] = []

    init(type: MovementType, description: String, oldValue: String = "", newValue: String = "", tool: Tool? = nil, attachments: [ToolAttachment] = []) {
        self.id = UUID()
        self.type = type
        self.movementDescription = description
        self.oldValue = oldValue
        self.newValue = newValue
        self.timestamp = Date()
        self.tool = tool
        self.attachments = attachments
    }
}
