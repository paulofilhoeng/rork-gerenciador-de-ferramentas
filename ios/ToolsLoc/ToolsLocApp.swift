import SwiftUI
import SwiftData
import UserNotifications

@main
struct ToolsLocApp: App {
    let container: ModelContainer
    @StateObject private var notificationManager = NotificationManager.shared

    init() {
        let schema = Schema([
            Tool.self,
            RentalCompany.self,
            ConstructionSite.self,
            Employee.self,
            ToolMovement.self,
            ToolAttachment.self,
        ])
        let config = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)
        do {
            container = try ModelContainer(for: schema, configurations: [config])
        } catch {
            fatalError("Failed to create ModelContainer: \(error)")
        }
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(.dark)
                .tint(Color.appAccent)
                .environmentObject(notificationManager)
                .onAppear {
                    SeedData.populateIfNeeded(context: container.mainContext)
                    notificationManager.checkPermissionStatus { _ in }
                }
        }
        .modelContainer(container)
    }
}
