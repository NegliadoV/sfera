//
//  UniversesService.swift
//  SFERA
//

import Foundation

final class UniversesService {
    static let shared = UniversesService()

    func fetchUniverses() async throws -> [Universe] {
        let res: [Universe] = try await APIClient.shared.request("/api/universes")
        return res
    }
}
