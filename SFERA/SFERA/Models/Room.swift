//
//  Room.swift
//  SFERA
//

import Foundation

struct RoomItem: Identifiable, Codable {
    let id: String
    let title: String?
    var name: String? { title }
}
