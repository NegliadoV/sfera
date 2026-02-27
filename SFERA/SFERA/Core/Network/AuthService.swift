//
//  AuthService.swift
//  SFERA
//
//  Login and register API
//

import Foundation

struct LoginRequest: Encodable {
    let email: String
    let password: String
}

struct LoginResponse: Decodable {
    let token: String
    let user: AuthUser
}

struct RegisterRequest: Encodable {
    let email: String
    let password: String
    let name: String?
}

struct RegisterResponse: Decodable {
    let ok: Bool?
    let user: AuthUser?
}

@MainActor
final class AuthService {
    static let shared = AuthService()

    func login(email: String, password: String) async throws -> (token: String, user: AuthUser) {
        let body = LoginRequest(email: email, password: password)
        let res: LoginResponse = try await APIClient.shared.request(
            "/api/auth/mobile/login",
            method: "POST",
            body: body
        )
        return (res.token, res.user)
    }

    /// Register then login to get token and user.
    func register(email: String, password: String, name: String?) async throws -> (token: String, user: AuthUser) {
        let body = RegisterRequest(email: email, password: password, name: name)
        let _: RegisterResponse = try await APIClient.shared.request(
            "/api/auth/register",
            method: "POST",
            body: body
        )
        return try await login(email: email, password: password)
    }
}
