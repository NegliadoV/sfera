//
//  WebSocketService.swift
//  SFERA
//
//  Add SocketIO package: https://github.com/socketio/socket.io-client-swift
//

import Foundation

@MainActor
final class WebSocketService: ObservableObject {
    static let shared = WebSocketService()

    @Published private(set) var isConnected = false
    @Published private(set) var error: String?
    private var wsToken: String?

    private init() {}

    func connect() async {
        do {
            struct TokenResponse: Decodable { let token: String }
            let res: TokenResponse = try await APIClient.shared.request("/api/me/ws-token")
            wsToken = res.token
            isConnected = false
            error = "WebSocket: add SocketIO package to enable real-time"
        } catch {
            self.error = error.localizedDescription
            isConnected = false
        }
    }

    func disconnect() { isConnected = false }
}
