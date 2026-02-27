//
//  ThemeManager.swift
//  SFERA
//
//  Theme: dark/light, accent color, light style (soft/bright/muted)
//

import SwiftUI

enum AppTheme: String, CaseIterable {
    case dark
    case light
}

enum LightStyle: String, CaseIterable {
    case soft
    case bright
    case muted
}

enum AccentPreset: String, CaseIterable {
    case blue
    case purple
    case green
    case orange
    case red

    var color: Color {
        switch self {
        case .blue: return Color(hex: "2563eb")
        case .purple: return Color(hex: "8b5cf6")
        case .green: return Color(hex: "22c55e")
        case .orange: return Color(hex: "f97316")
        case .red: return Color(hex: "ef4444")
        }
    }
}

@MainActor
final class ThemeManager: ObservableObject {
    static let shared = ThemeManager()

    @Published var theme: AppTheme {
        didSet { UserDefaults.standard.set(theme.rawValue, forKey: "sfera_theme") }
    }
    @Published var lightStyle: LightStyle {
        didSet { UserDefaults.standard.set(lightStyle.rawValue, forKey: "sfera_light_style") }
    }
    @Published var accentPreset: AccentPreset {
        didSet { UserDefaults.standard.set(accentPreset.rawValue, forKey: "sfera_accent") }
    }
    @Published var useSystem: Bool {
        didSet { UserDefaults.standard.set(useSystem, forKey: "sfera_use_system") }
    }

    var colorScheme: ColorScheme? {
        useSystem ? nil : (theme == .dark ? .dark : .light)
    }

    var accentColor: Color {
        accentPreset.color
    }

    var bgPrimary: Color {
        if theme == .dark {
            return .sferaBgPrimaryDark
        }
        switch lightStyle {
        case .soft: return .sferaBgPrimaryLight
        case .bright: return Color(hex: "f8f9fa")
        case .muted: return Color(hex: "e8e9ec")
        }
    }

    var bgSecondary: Color {
        theme == .dark ? .sferaBgSecondaryDark : .sferaBgSecondaryLight
    }

    var bgCard: Color {
        theme == .dark ? .sferaBgCardDark : .sferaBgCardLight
    }

    var bgHeader: Color {
        theme == .dark ? .sferaBgPrimaryDark : Color(hex: "f2f3f5")
    }

    var textPrimary: Color {
        theme == .dark ? .sferaTextPrimaryDark : .sferaTextPrimaryLight
    }

    var textSecondary: Color {
        theme == .dark ? .sferaTextSecondaryDark : .sferaTextSecondaryLight
    }

    var textMuted: Color {
        theme == .dark ? .sferaTextMutedDark : .sferaTextMutedLight
    }

    var borderColor: Color {
        theme == .dark ? .sferaBorderDark : .sferaBorderLight
    }

    var studioStatusLive: Color {
        theme == .dark ? .sferaStudioLiveDark : .sferaStudioLiveLight
    }

    private init() {
        let t = UserDefaults.standard.string(forKey: "sfera_theme") ?? "dark"
        let l = UserDefaults.standard.string(forKey: "sfera_light_style") ?? "soft"
        let a = UserDefaults.standard.string(forKey: "sfera_accent") ?? "blue"
        self.theme = AppTheme(rawValue: t) ?? .dark
        self.lightStyle = LightStyle(rawValue: l) ?? .soft
        self.accentPreset = AccentPreset(rawValue: a) ?? .blue
        self.useSystem = UserDefaults.standard.bool(forKey: "sfera_use_system")
    }
}

