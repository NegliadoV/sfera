//
//  Universe.swift
//  SFERA
//

import Foundation

struct Universe: Identifiable, Codable, Hashable {
    let id: String
    let slug: String
    let name: String
    let description: String?
    let icon: String?
    let sphereColor: String?
    let ownerId: String?
    let createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id, slug, name, description, icon, ownerId, createdAt
        case sphereColor = "sphere_color"
    }
}
