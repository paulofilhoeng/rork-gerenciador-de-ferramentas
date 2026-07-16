import SwiftUI
import SwiftData

struct ConstructionSitesView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \ConstructionSite.name) private var sites: [ConstructionSite]
    @State private var searchText = ""
    @State private var filterStatus: SiteStatus? = nil
    @State private var showingAddSheet = false

    private var filteredSites: [ConstructionSite] {
        sites.filter { site in
            let matchesSearch = searchText.isEmpty
                || site.name.localizedCaseInsensitiveContains(searchText)
                || site.responsibleName.localizedCaseInsensitiveContains(searchText)
            let matchesStatus = filterStatus == nil || site.status == filterStatus
            return matchesSearch && matchesStatus
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // Filter chips
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            FilterChip(label: "Todas", isActive: filterStatus == nil) {
                                filterStatus = nil
                            }
                            ForEach(SiteStatus.allCases, id: \.self) { status in
                                FilterChip(label: status.rawValue, isActive: filterStatus == status) {
                                    filterStatus = filterStatus == status ? nil : status
                                }
                            }
                        }
                    }

                    if filteredSites.isEmpty {
                        EmptyStateView(
                            icon: "hammer",
                            title: "Nenhuma obra",
                            subtitle: "Toque em + para adicionar uma obra"
                        )
                    } else {
                        LazyVStack(spacing: 10) {
                            ForEach(filteredSites) { site in
                                NavigationLink {
                                    ConstructionSiteDetailView(site: site)
                                } label: {
                                    SiteRowView(site: site)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .padding(.bottom, 24)
            }
            .background(Color.appBg.ignoresSafeArea())
            .navigationTitle("Obras")
            .navigationBarTitleDisplayMode(.inline)
            .searchable(text: $searchText, prompt: "Nome ou responsável")
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
                ConstructionSiteEditView()
            }
        }
    }
}

struct SiteRowView: View {
    let site: ConstructionSite

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 12) {
                Image(systemName: "hammer.fill")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(Color.statusColor(named: site.status.colorName))
                    .frame(width: 40, height: 40)
                    .background(Color.statusColor(named: site.status.colorName).opacity(0.15))
                    .clipShape(.rect(cornerRadius: 10))

                VStack(alignment: .leading, spacing: 3) {
                    Text(site.name)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(.white)
                        .lineLimit(1)
                    Text(site.responsibleName.isEmpty ? "Sem responsável" : site.responsibleName)
                        .font(.system(size: 12))
                        .foregroundStyle(Color.appTextSecondary)
                        .lineLimit(1)
                }
                Spacer()
                StatusBadge(
                    label: site.status.rawValue,
                    colorName: site.status.colorName,
                    iconName: site.status.iconName
                )
            }

            HStack(spacing: 6) {
                Image(systemName: "wrench.and.screwdriver.fill")
                    .font(.system(size: 10))
                Text("\(site.toolCount) ferramenta(s)")
                Spacer()
                if !site.address.isEmpty {
                    Image(systemName: "mappin.circle.fill")
                        .font(.system(size: 10))
                    Text(site.address)
                        .lineLimit(1)
                }
            }
            .font(.system(size: 11, weight: .medium))
            .foregroundStyle(Color.appTextSecondary)
        }
        .cardStyle()
    }
}

#Preview {
    ConstructionSitesView()
        .modelContainer(for: [ConstructionSite.self, Tool.self, ToolAttachment.self], inMemory: true)
}
