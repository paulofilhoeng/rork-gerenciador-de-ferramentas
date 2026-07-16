import SwiftUI
import SwiftData

struct RentalCompaniesView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \RentalCompany.name) private var companies: [RentalCompany]
    @State private var searchText = ""
    @State private var showingAddSheet = false

    private var filteredCompanies: [RentalCompany] {
        companies.filter { company in
            searchText.isEmpty
                || company.name.localizedCaseInsensitiveContains(searchText)
                || company.contactPerson.localizedCaseInsensitiveContains(searchText)
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                if filteredCompanies.isEmpty {
                    EmptyStateView(
                        icon: "building.2",
                        title: "Nenhuma locadora",
                        subtitle: "Toque em + para adicionar uma locadora"
                    )
                } else {
                    LazyVStack(spacing: 10) {
                        ForEach(filteredCompanies) { company in
                            NavigationLink {
                                RentalCompanyDetailView(company: company)
                            } label: {
                                RentalCompanyRow(company: company)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
            .background(Color.appBg.ignoresSafeArea())
            .navigationTitle("Locadoras")
            .navigationBarTitleDisplayMode(.inline)
            .searchable(text: $searchText, prompt: "Nome ou contato")
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
                RentalCompanyEditView()
            }
        }
    }
}

struct RentalCompanyRow: View {
    let company: RentalCompany

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 12) {
                Image(systemName: "building.2.fill")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(Color.appAccent)
                    .frame(width: 40, height: 40)
                    .background(Color.appAccent.opacity(0.15))
                    .clipShape(.rect(cornerRadius: 10))

                VStack(alignment: .leading, spacing: 3) {
                    Text(company.name)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(.white)
                        .lineLimit(1)
                    Text(company.contactPerson.isEmpty ? company.phone : company.contactPerson)
                        .font(.system(size: 12))
                        .foregroundStyle(Color.appTextSecondary)
                        .lineLimit(1)
                }
                Spacer()
            }

            HStack(spacing: 12) {
                Label("\(company.activeRentalCount) aluguel(is)", systemImage: "key.fill")
                    .labelStyle(.titleAndIcon)
                if company.overdueRentalCount > 0 {
                    Label("\(company.overdueRentalCount) atrasado(s)", systemImage: "exclamationmark.triangle.fill")
                        .labelStyle(.titleAndIcon)
                        .foregroundStyle(Color.statusRed)
                }
                Spacer()
            }
            .font(.system(size: 11, weight: .medium))
            .foregroundStyle(Color.appTextSecondary)
        }
        .cardStyle()
    }
}

#Preview {
    RentalCompaniesView()
        .modelContainer(for: [RentalCompany.self, Tool.self, ToolAttachment.self], inMemory: true)
}
