import Foundation
import SwiftData

enum ToolOwnership: String, Codable, CaseIterable, Sendable {
    case own = "Própria"
    case rented = "Alugada"

    var iconName: String {
        switch self {
        case .own: "wrench.adjustable.fill"
        case .rented: "key.fill"
        }
    }
}

enum ToolStatus: String, Codable, CaseIterable, Sendable {
    case available = "Disponível"
    case inUse = "Em Uso"
    case maintenance = "Manutenção"
    case overdue = "Atrasada"

    var colorName: String {
        switch self {
        case .available: "StatusGreen"
        case .inUse: "StatusBlue"
        case .maintenance: "StatusGray"
        case .overdue: "StatusRed"
        }
    }

    var iconName: String {
        switch self {
        case .available: "checkmark.circle.fill"
        case .inUse: "play.circle.fill"
        case .maintenance: "wrench.fill"
        case .overdue: "exclamationmark.triangle.fill"
        }
    }
}

@Model
final class Tool {
    @Attribute(.unique) var id: UUID = UUID()
    var name: String = ""
    var brand: String = ""
    var model: String = ""
    var serialNumber: String = ""
    var ownership: ToolOwnership = ToolOwnership.own
    var baseStatus: ToolStatus = ToolStatus.available
    var notes: String = ""
    var purchaseDate: Date? = nil
    var dailyRentalCost: Double = 0
    var rentalStartDate: Date? = nil
    var rentalEndDate: Date? = nil
    var createdAt: Date = Date()

    var rentalCompany: RentalCompany? = nil
    var currentSite: ConstructionSite? = nil
    var currentEmployee: Employee? = nil

    @Relationship(inverse: \ToolAttachment.tool)
    var attachments: [ToolAttachment] = []

    init(
        name: String,
        brand: String = "",
        model: String = "",
        serialNumber: String = "",
        ownership: ToolOwnership = .own,
        baseStatus: ToolStatus = .available,
        notes: String = "",
        purchaseDate: Date? = nil,
        dailyRentalCost: Double = 0,
        rentalStartDate: Date? = nil,
        rentalEndDate: Date? = nil,
        rentalCompany: RentalCompany? = nil,
        currentSite: ConstructionSite? = nil,
        currentEmployee: Employee? = nil,
        attachments: [ToolAttachment] = []
    ) {
        self.id = UUID()
        self.name = name
        self.brand = brand
        self.model = model
        self.serialNumber = serialNumber
        self.ownership = ownership
        self.baseStatus = baseStatus
        self.notes = notes
        self.purchaseDate = purchaseDate
        self.dailyRentalCost = dailyRentalCost
        self.rentalStartDate = rentalStartDate
        self.rentalEndDate = rentalEndDate
        self.createdAt = Date()
        self.rentalCompany = rentalCompany
        self.currentSite = currentSite
        self.currentEmployee = currentEmployee
        self.attachments = attachments
    }

    var effectiveStatus: ToolStatus {
        if ownership == .rented, let endDate = rentalEndDate, endDate < Date() {
            return .overdue
        }
        return baseStatus
    }

    var daysRemaining: Int? {
        guard ownership == .rented, let endDate = rentalEndDate else { return nil }
        return Calendar.current.dateComponents([.day], from: Date(), to: endDate).day
    }

    var totalRentalCost: Double {
        guard ownership == .rented, let startDate = rentalStartDate else { return 0 }
        let days = Calendar.current.dateComponents([.day], from: startDate, to: Date()).day ?? 0
        return Double(max(days, 1)) * dailyRentalCost
    }

    var isRentalEndingSoon: Bool {
        guard let days = daysRemaining else { return false }
        return days >= 0 && days <= 3
    }
}
