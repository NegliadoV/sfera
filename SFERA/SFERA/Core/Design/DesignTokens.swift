//
//  DesignTokens.swift
//  SFERA
//
//  Design tokens matching web app (app/globals.css)
//

import SwiftUI

enum DesignTokens {

    // MARK: - Radius
    static let radiusSm: CGFloat = 10
    static let radiusMd: CGFloat = 14
    static let radiusLg: CGFloat = 18
    static let radiusXl: CGFloat = 24
    static let radiusFull: CGFloat = 30

    // MARK: - Spacing
    static let spacingXs: CGFloat = 4
    static let spacingSm: CGFloat = 8
    static let spacingMd: CGFloat = 16
    static let spacingLg: CGFloat = 24
    static let spacingXl: CGFloat = 32
    static let spacingXxl: CGFloat = 48

    // MARK: - Transitions
    static let transitionFast: Double = 0.1
    static let transitionMedium: Double = 0.2
    static let transitionSlow: Double = 0.3
}

// MARK: - Raw Color Values (for ThemeManager)

extension Color {

    // Dark theme defaults
    static let sferaAccentPrimary = Color(hex: "2563eb")
    static let sferaBgPrimaryDark = Color(hex: "25262a")
    static let sferaBgSecondaryDark = Color(hex: "323439")
    static let sferaBgCardDark = Color(hex: "2e3035")
    static let sferaTextPrimaryDark = Color(hex: "e4e6e9")
    static let sferaTextSecondaryDark = Color(hex: "a8aaaf")
    static let sferaTextMutedDark = Color(hex: "7a7d84")
    static let sferaBorderDark = Color(hex: "43454b")
    static let sferaStudioLiveDark = Color(hex: "2ecc71")

    // Light theme defaults
    static let sferaBgPrimaryLight = Color(hex: "f2f3f5")
    static let sferaBgSecondaryLight = Color(hex: "ffffff")
    static let sferaBgCardLight = Color(hex: "ffffff")
    static let sferaTextPrimaryLight = Color(hex: "1e1f22")
    static let sferaTextSecondaryLight = Color(hex: "4e5058")
    static let sferaTextMutedLight = Color(hex: "6d7078")
    static let sferaBorderLight = Color(hex: "d4d5d9")
    static let sferaStudioLiveLight = Color(hex: "1e8e4a")

    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
