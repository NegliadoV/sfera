//
//  AuthManager.swift
//  SFERA
//
//  Auth state and session management
//

import Foundation
import SwiftUI

struct AuthUser: Codable {
    let id: String
    let email: String?
    let name: String?
    let image: String?
}

@MainActor
final class AuthManager: ObservableObject {
    static let shared = AuthManager()

    @Published private(set) var isAuthenticated = false
    @Published private(set) var user: AuthUser?
    @Published var themeManager: ThemeManager { ThemeManager.shared }

    private(set) var token: String?

    init() {
        token = KeychainStorage.loadToken()
        isAuthenticated = token != nil
        if isAuthenticated {
            loadUserFromDefaults()
        }
    }

    func setSession(token: String, user: AuthUser) {
        KeychainStorage.saveToken(token)
        self.token = token
        self.user = user
        isAuthenticated = true
        saveUserToDefaults(user)
    }

    func signOut() {
        KeychainStorage.deleteToken()
        token = nil
        user = nil
        isAuthenticated = false
        UserDefaults.standard.removeObject(forKey: "sfera_auth_user")
    }

    private func saveUserToDefaults(_ user: AuthUser) {
        if let data = try? JSONEncoder().encode(user) {
            UserDefaults.standard.set(data, forKey: "sfera_auth_user")
        }
    }

    private func loadUserFromDefaults() {
        guard let data = UserDefaults.standard.data(forKey: "sfera_auth_user"),
              let u = try? JSONDecoder().decode(AuthUser.self, from: data) else {
            return
        }
        user = u
    }
}
