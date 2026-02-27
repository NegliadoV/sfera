//
//  NotificationsService.swift
//  SFERA
//

import Foundation

struct NotificationsResponse: Decodable {
    let items: [NotificationItem]
    let unreadCount: Int
}

struct NotificationItem: Identifiable, Codable {
    let id: String
    let contentId: String?
    let slug: String?
    let title: String?
    let read: Bool
    let createdAt: String?
}

struct MessagesBadgeResponse: Decodable {
    let unreadDmCount: Int
    let pendingContactRequests: Int
    let total: Int
}

final class NotificationsService {
    static let shared = NotificationsService()

    func fetchNotifications() async throws -> (items: [NotificationItem], unreadCount: Int) {
        let res: NotificationsResponse = try await APIClient.shared.request("/api/me/notifications")
        return (res.items, res.unreadCount)
    }

    func fetchMessagesBadge() async throws -> MessagesBadgeResponse {
        try await APIClient.shared.request("/api/me/messages-badge")
    }
}
