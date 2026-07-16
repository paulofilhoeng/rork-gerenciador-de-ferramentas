import Foundation
import SwiftData

@Model
final class RentalCompany {
    @Attribute(.unique) var id: UUID = UUID()
    var name: String = ""
    var cnpj: String = ""
    var phone: String = ""
    var email: String = ""
    var address: String = ""
    var contactPerson: String = ""
    var createdAt: Date = Date()

    @Relationship(inverse: \Tool.rentalCompany)
    var tools: [Tool] = []

    init(
        name: String,
        cnpj: String = "",
        phone: String = "",
        email: String = "",
        address: String = "",
        contactPerson: String = ""
    ) {
        self.id = UUID()
        self.name = name
        self.cnpj = cnpj
        self.phone = phone
        self.email = email
        self.address = address
        self.contactPerson = contactPerson
        self.createdAt = Date()
    }

    var activeRentalCount: Int {
        tools.filter { $0.ownership == .rented }.count
    }

    var overdueRentalCount: Int {
        tools.filter { $0.effectiveStatus == .overdue }.count
    }
}
