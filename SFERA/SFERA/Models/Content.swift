//
//  Content.swift
//  SFERA
//

import Foundation

struct ContentItem: Identifiable, Codable, Hashable {
    let id: String
    let universeId: String?
    let authorId: String?
    let title: String?
    let body: String?
    let sourceUrl: String?
    let sourceType: String?
    let url: String?
    let createdAt: String?
    let authorName: String?
    let authorImage: String?
}

/// User content from /api/me/content (aggregated sources)
struct UserContentItem: Identifiable, Codable, Hashable {
    let id: String
    let title: String?
    let body: String?
    let url: String?
    let publishedAt: String?
    let externalAuthor: String?
    let createdAt: String?
}
