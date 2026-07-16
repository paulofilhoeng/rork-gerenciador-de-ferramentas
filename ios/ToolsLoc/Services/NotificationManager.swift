import Foundation
import UserNotifications
import Combine

/// Manages local notifications for rental due date alerts.
final class NotificationManager: NSObject, ObservableObject {
    static let shared = NotificationManager()

    @Published var notificationsEnabled = false
    @Published var alertDaysBefore = 3

    private let alertDaysKey = "alertDaysBefore"
    private let notificationsEnabledKey = "notificationsEnabled"

    private override init() {
        super.init()
        alertDaysBefore = UserDefaults.standard.integer(forKey: alertDaysKey)
        if alertDaysBefore == 0 { alertDaysBefore = 3 }
        notificationsEnabled = UserDefaults.standard.bool(forKey: notificationsEnabledKey)
    }

    // MARK: - Permission

    func requestPermission(completion: @escaping (Bool) -> Void) {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, _ in
            DispatchQueue.main.async {
                self.notificationsEnabled = granted
                UserDefaults.standard.set(granted, forKey: self.notificationsEnabledKey)
                completion(granted)
            }
        }
    }

    func checkPermissionStatus(completion: @escaping (Bool) -> Void) {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            DispatchQueue.main.async {
                let enabled = settings.authorizationStatus == .authorized || settings.authorizationStatus == .provisional
                self.notificationsEnabled = enabled
                completion(enabled)
            }
        }
    }

    // MARK: - Settings

    func setAlertDays(_ days: Int) {
        alertDaysBefore = max(1, min(30, days))
        UserDefaults.standard.set(alertDaysBefore, forKey: alertDaysKey)
        rescheduleAllNotifications(tools: [])
    }

    func setNotificationsEnabled(_ enabled: Bool) {
        notificationsEnabled = enabled
        UserDefaults.standard.set(enabled, forKey: notificationsEnabledKey)
        if !enabled {
            cancelAllNotifications()
        }
    }

    // MARK: - Scheduling

    /// Schedules notifications for all rented tools with upcoming return dates.
    func scheduleNotificationsForTools(_ tools: [Tool]) {
        guard notificationsEnabled else { return }

        cancelAllNotifications()

        for tool in tools {
            scheduleNotification(for: tool)
        }
    }

    /// Schedules a notification for a single tool's rental return date.
    func scheduleNotification(for tool: Tool) {
        guard notificationsEnabled,
              tool.ownership == .rented,
              let endDate = tool.rentalEndDate else { return }

        let alertDate = Calendar.current.date(byAdding: .day, value: -alertDaysBefore, to: endDate) ?? endDate

        // Only schedule if the alert date is in the future
        guard alertDate > Date() else {
            // If overdue, schedule an immediate notification
            scheduleOverdueNotification(for: tool)
            return
        }

        let content = UNMutableNotificationContent()
        content.title = "Vencimento de Aluguel"
        content.body = "\"\(tool.name)\" deve ser devolvida em \(formatShortDate(endDate)). Locadora: \(tool.rentalCompany?.name ?? "—")"
        content.sound = .default
        content.badge = 1
        content.userInfo = ["toolId": tool.id.uuidString]

        let components = Calendar.current.dateComponents([.year, .month, .day, .hour], from: alertDate)
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
        let request = UNNotificationRequest(
            identifier: "rental-alert-\(tool.id.uuidString)",
            content: content,
            trigger: trigger
        )

        UNUserNotificationCenter.current().add(request) { _ in }
    }

    /// Schedules an immediate notification for an overdue rental.
    private func scheduleOverdueNotification(for tool: Tool) {
        let content = UNMutableNotificationContent()
        content.title = "Aluguel Atrasado!"
        content.body = "\"\(tool.name)\" está com a devolução atrasada. Contate \(tool.rentalCompany?.name ?? "a locadora") imediatamente."
        content.sound = .default
        content.badge = 1
        content.userInfo = ["toolId": tool.id.uuidString]

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 5, repeats: false)
        let request = UNNotificationRequest(
            identifier: "rental-overdue-\(tool.id.uuidString)",
            content: content,
            trigger: trigger
        )

        UNUserNotificationCenter.current().add(request) { _ in }
    }

    // MARK: - Cancellation

    func cancelNotification(for tool: Tool) {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [
            "rental-alert-\(tool.id.uuidString)",
            "rental-overdue-\(tool.id.uuidString)"
        ])
    }

    func cancelAllNotifications() {
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
    }

    // MARK: - Reschedule

    func rescheduleAllNotifications(tools: [Tool]) {
        guard notificationsEnabled else { return }
        scheduleNotificationsForTools(tools)
    }

    // MARK: - Badge

    func updateBadge(tools: [Tool]) {
        let overdueCount = tools.filter { $0.effectiveStatus == .overdue }.count
        UNUserNotificationCenter.current().setBadgeCount(overdueCount) { _ in }
    }
}
