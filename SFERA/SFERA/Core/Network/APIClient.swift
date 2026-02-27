//
//  APIClient.swift
//  SFERA
//
//  HTTP client with JWT interceptor
//

import Foundation

enum APIError: Error {
    case invalidURL
    case noData
    case decoding(Error)
    case server(Int, String?)
    case unauthorized
}

final class APIClient {
    static let shared = APIClient()

    private let baseURL: String
    private let session: URLSession

    init(baseURL: String = Config.apiBaseURL) {
        self.baseURL = baseURL
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        self.session = URLSession(configuration: config)
    }

    func request<T: Decodable>(
        _ path: String,
        method: String = "GET",
        body: Encodable? = nil
    ) async throws -> T {
        let url = URL(string: baseURL + path)!
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("application/json", forHTTPHeaderField: "Accept")

        if let token = KeychainStorage.loadToken() {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let b = body {
            req.httpBody = try JSONEncoder().encode(AnyEncodable(b))
        }

        let (data, res) = try await session.data(for: req)
        let http = res as! HTTPURLResponse

        if http.statusCode == 401 {
            throw APIError.unauthorized
        }

        guard (200..<300).contains(http.statusCode) else {
            let msg = String(data: data, encoding: .utf8)
            throw APIError.server(http.statusCode, msg)
        }

        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return try decoder.decode(T.self, from: data)
    }

    func requestVoid(
        _ path: String,
        method: String = "GET",
        body: Encodable? = nil
    ) async throws {
        let _: EmptyResponse = try await request(path, method: method, body: body)
    }
}

struct EmptyResponse: Decodable {}

private struct AnyEncodable: Encodable {
    let value: Encodable
    init(_ value: Encodable) { self.value = value }
    func encode(to encoder: Encoder) throws { try value.encode(to: encoder) }
}
