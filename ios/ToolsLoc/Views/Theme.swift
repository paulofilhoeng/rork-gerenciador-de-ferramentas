import SwiftUI

// MARK: - Theme Colors

extension Color {
    static let appBg = Color(red: 0.07, green: 0.07, blue: 0.08)
    static let appCard = Color(red: 0.12, green: 0.12, blue: 0.14)
    static let appCardElevated = Color(red: 0.16, green: 0.16, blue: 0.18)
    static let appAccent = Color(red: 0.96, green: 0.62, blue: 0.04)
    static let appAccentDim = Color(red: 0.96, green: 0.62, blue: 0.04).opacity(0.18)
    static let appOrange = Color(red: 0.95, green: 0.36, blue: 0.13)
    static let appSeparator = Color(red: 0.20, green: 0.20, blue: 0.22)
    static let appTextSecondary = Color(red: 0.60, green: 0.60, blue: 0.64)

    static let statusGreen = Color(red: 0.24, green: 0.74, blue: 0.42)
    static let statusBlue = Color(red: 0.24, green: 0.59, blue: 0.93)
    static let statusRed = Color(red: 0.91, green: 0.28, blue: 0.28)
    static let statusOrange = Color(red: 0.95, green: 0.57, blue: 0.15)
    static let statusGray = Color(red: 0.52, green: 0.52, blue: 0.56)

    static func statusColor(named name: String) -> Color {
        switch name {
        case "StatusGreen": return .statusGreen
        case "StatusBlue": return .statusBlue
        case "StatusRed": return .statusRed
        case "StatusOrange": return .statusOrange
        case "StatusGray": return .statusGray
        default: return .statusGray
        }
    }
}

// MARK: - View Modifiers

struct CardModifier: ViewModifier {
    var padding: CGFloat = 16

    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(Color.appCard)
            .clipShape(.rect(cornerRadius: 14))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(Color.appSeparator, lineWidth: 0.5)
            )
    }
}

extension View {
    func cardStyle(padding: CGFloat = 16) -> some View {
        modifier(CardModifier(padding: padding))
    }
}

// MARK: - Status Badge

struct StatusBadge: View {
    let label: String
    let colorName: String
    let iconName: String

    var body: some View {
        HStack(spacing: 5) {
            Image(systemName: iconName)
                .font(.system(size: 9, weight: .bold))
            Text(label)
                .font(.system(size: 11, weight: .semibold))
        }
        .padding(.horizontal, 9)
        .padding(.vertical, 4)
        .foregroundStyle(.white)
        .background(Color.statusColor(named: colorName))
        .clipShape(.rect(cornerRadius: 6))
    }
}

// MARK: - Section Header

struct SectionHeader: View {
    let title: String
    var count: Int? = nil
    var actionTitle: String? = nil
    var action: (() -> Void)? = nil

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(title)
                .font(.system(size: 22, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
            if let count {
                Text("\(count)")
                    .font(.system(size: 14, weight: .semibold, design: .monospaced))
                    .foregroundStyle(Color.appAccent)
            }
            Spacer()
            if let actionTitle, let action {
                Button(actionTitle, action: action)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Color.appAccent)
            }
        }
    }
}

// MARK: - Empty State

struct EmptyStateView: View {
    let icon: String
    let title: String
    let subtitle: String

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 44))
                .foregroundStyle(Color.appTextSecondary.opacity(0.5))
            Text(title)
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(Color.appTextSecondary)
            Text(subtitle)
                .font(.system(size: 14))
                .foregroundStyle(Color.appTextSecondary.opacity(0.7))
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 48)
    }
}

// MARK: - Currency Format

func formatCurrency(_ value: Double) -> String {
    let formatter = NumberFormatter()
    formatter.numberStyle = .currency
    formatter.locale = Locale(identifier: "pt_BR")
    return formatter.string(from: NSNumber(value: value)) ?? "R$ 0,00"
}

// MARK: - Date Format

func formatShortDate(_ date: Date?) -> String {
    guard let date else { return "—" }
    let formatter = DateFormatter()
    formatter.dateStyle = .short
    formatter.locale = Locale(identifier: "pt_BR")
    return formatter.string(from: date)
}

func formatDateTime(_ date: Date) -> String {
    let formatter = DateFormatter()
    formatter.dateStyle = .short
    formatter.timeStyle = .short
    formatter.locale = Locale(identifier: "pt_BR")
    return formatter.string(from: date)
}
