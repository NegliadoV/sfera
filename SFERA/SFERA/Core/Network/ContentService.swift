//
//  ContentService.swift
//  SFERA
//

import Foundation

final class ContentService {
    static let shared = ContentService()

    func fetchContent(universeId: String) async throws -> [ContentItem] {
        guard let encoded = "universeId=\(universeId)".addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) else {
            throw APIError.invalidURL
        }
        let res: [ContentItem] = try await APIClient.shared.request("/api/content?\(encoded)")
        return res
    }

    func fetchContentDetail(contentId: String) async throws -> ContentItem {
        let res: ContentItem = try await APIClient.shared.request("/api/content/\(contentId)")
        return res
    }
}
