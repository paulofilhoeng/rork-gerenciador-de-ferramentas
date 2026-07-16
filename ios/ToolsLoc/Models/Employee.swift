import Foundation
import SwiftData

@Model
final class Employee {
    @Attribute(.unique) var id: UUID = UUID()
    var name: String = ""
    var role: String = ""
    var phone: String = ""
    var email: String = ""
    var createdAt: Date = Date()

    @Relationship(inverse: \Tool.currentEmployee)
    var tools: [Tool] = []

    init(
        name: String,
        role: String = "",
        phone: String = "",
        email: String = ""
    ) {
        self.id = UUID()
        self.name = name
        self.role = role
        self.phone = phone
        self.email = email
        self.createdAt = Date()
    }

    var toolCount: Int {
        tools.count
    }
}
