//
//  Message.swift
//  SFERA
//

import Foundation

struct ConversationItem: Identifiable, Codable {
    var id: String { userId ?? UUID().uuidString }
    let userId: String?
    let userName: String?
    let lastMessage: LastMessage?
}

struct LastMessage: Codable {
    let body: String?
}

struct GroupChatItem: Identifiable, Codable {
    let id: String
    let name: String
}
