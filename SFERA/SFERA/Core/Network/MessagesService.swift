//
//  MessagesService.swift
//  SFERA
//

import Foundation

final class MessagesService {
    static let shared = MessagesService()

    func fetchConversations() async throws -> [ConversationItem] {
        let res: [ConversationItem] = try await APIClient.shared.request("/api/me/conversations")
        return res
    }

    func fetchGroupChats() async throws -> [GroupChatItem] {
        let res: [GroupChatItem] = try await APIClient.shared.request("/api/me/group-chats")
        return res
    }
}
