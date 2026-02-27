//
//  MeService.swift
//  SFERA
//

import Foundation

final class MeService {
    static let shared = MeService()

    func fetchMyContent() async throws -> [UserContentItem] {
        let res: [UserContentItem] = try await APIClient.shared.request("/api/me/content")
        return res
    }
}
