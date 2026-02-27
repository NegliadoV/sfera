//
//  RoomsService.swift
//  SFERA
//

import Foundation

final class RoomsService {
    static let shared = RoomsService()

    func fetchRooms(universeSlug: String) async throws -> [RoomItem] {
        let path = "/api/universes/\(universeSlug.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? universeSlug)/rooms"
        let res: [RoomItem] = try await APIClient.shared.request(path)
        return res
    }
}
