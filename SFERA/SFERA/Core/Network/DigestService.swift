//
//  DigestService.swift
//  SFERA
//

import Foundation

final class DigestService {
    static let shared = DigestService()

    func fetchDigest() async throws -> [DigestItem] {
        struct DigestResponse: Decodable {
            let items: [DigestItem]
        }
        let res: DigestResponse = try await APIClient.shared.request("/api/me/digest")
        return res.items
    }
}
