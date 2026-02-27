//
//  Config.swift
//  SFERA
//
//  API base URL and WebSocket URL
//

import Foundation

enum Config {
    #if DEBUG
    static let apiBaseURL = "http://192.168.0.210"
    static let wsURL = "http://192.168.0.210"
    #else
    static let apiBaseURL = Bundle.main.object(forInfoDictionaryKey: "API_BASE_URL") as? String ?? "https://sfera.example.com"
    static let wsURL = Bundle.main.object(forInfoDictionaryKey: "WS_URL") as? String ?? "wss://sfera.example.com"
    #endif
}
