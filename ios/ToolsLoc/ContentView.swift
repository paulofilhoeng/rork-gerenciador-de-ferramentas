import SwiftUI
import SwiftData

struct ContentView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            DashboardView()
                .tabItem {
                    Label("Painel", systemImage: "square.grid.2x2.fill")
                }
                .tag(0)

            ToolsView()
                .tabItem {
                    Label("Ferramentas", systemImage: "wrench.and.screwdriver.fill")
                }
                .tag(1)

            RentalCompaniesView()
                .tabItem {
                    Label("Locadoras", systemImage: "building.2.fill")
                }
                .tag(2)

            ConstructionSitesView()
                .tabItem {
                    Label("Obras", systemImage: "hammer.fill")
                }
                .tag(3)

            EmployeesView()
                .tabItem {
                    Label("Funcionários", systemImage: "person.2.fill")
                }
                .tag(4)

            SettingsView()
                .tabItem {
                    Label("Ajustes", systemImage: "gearshape.fill")
                }
                .tag(5)
        }
        .tint(Color.appAccent)
    }
}

#Preview {
    ContentView()
        .modelContainer(for: [Tool.self, RentalCompany.self, ConstructionSite.self, Employee.self, ToolMovement.self, ToolAttachment.self], inMemory: true)
}
