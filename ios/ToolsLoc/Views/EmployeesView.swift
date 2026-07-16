import SwiftUI
import SwiftData

struct EmployeesView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \Employee.name) private var employees: [Employee]
    @State private var searchText = ""
    @State private var showingAddSheet = false

    private var filteredEmployees: [Employee] {
        employees.filter { emp in
            searchText.isEmpty
                || emp.name.localizedCaseInsensitiveContains(searchText)
                || emp.role.localizedCaseInsensitiveContains(searchText)
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                if filteredEmployees.isEmpty {
                    EmptyStateView(
                        icon: "person.2",
                        title: "Nenhum funcionário",
                        subtitle: "Toque em + para adicionar um funcionário"
                    )
                } else {
                    LazyVStack(spacing: 10) {
                        ForEach(filteredEmployees) { emp in
                            NavigationLink {
                                EmployeeDetailView(employee: emp)
                            } label: {
                                EmployeeRowView(employee: emp)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
            .background(Color.appBg.ignoresSafeArea())
            .navigationTitle("Funcionários")
            .navigationBarTitleDisplayMode(.inline)
            .searchable(text: $searchText, prompt: "Nome ou função")
            .overlay(alignment: .bottomTrailing) {
                Button {
                    showingAddSheet = true
                } label: {
                    Image(systemName: "plus")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(Color(red: 0.10, green: 0.10, blue: 0.11))
                        .frame(width: 56, height: 56)
                        .background(Color.appAccent)
                        .clipShape(.rect(cornerRadius: 16))
                        .shadow(color: Color.appAccent.opacity(0.4), radius: 10, y: 4)
                }
                .padding(.trailing, 20)
                .padding(.bottom, 20)
            }
            .sheet(isPresented: $showingAddSheet) {
                EmployeeEditView()
            }
        }
    }
}

struct EmployeeRowView: View {
    let employee: Employee

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "person.crop.circle.fill")
                .font(.system(size: 36))
                .foregroundStyle(Color.appAccent.opacity(0.6))
                .foregroundStyle(.white)
                .frame(width: 44, height: 44)
                .background(Color.appAccent.opacity(0.15))
                .clipShape(.rect(cornerRadius: 22))

            VStack(alignment: .leading, spacing: 3) {
                Text(employee.name)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(.white)
                    .lineLimit(1)
                if !employee.role.isEmpty {
                    Text(employee.role)
                        .font(.system(size: 12))
                        .foregroundStyle(Color.appTextSecondary)
                }
            }
            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text("\(employee.toolCount)")
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundStyle(Color.appAccent)
                Text("ferramenta(s)")
                    .font(.system(size: 10))
                    .foregroundStyle(Color.appTextSecondary)
            }
        }
        .cardStyle()
    }
}

#Preview {
    EmployeesView()
        .modelContainer(for: [Employee.self, Tool.self, ToolAttachment.self], inMemory: true)
}
