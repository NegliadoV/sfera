//
//  MindMapsService.swift
//  SFERA
//

import Foundation

final class MindMapsService {
    static let shared = MindMapsService()

    func fetchMaps(universeSlug: String) async throws -> [MindMapItem] {
        let path = "/api/universes/\(universeSlug.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? universeSlug)/mind-maps"
        let res: [MindMapItem] = try await APIClient.shared.request(path)
        return res
    }
}
