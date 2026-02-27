//
//  UniverseRow.swift
//  SFERA
//

import SwiftUI

struct UniverseRow: View {
    @EnvironmentObject var themeManager: ThemeManager
    let universe: Universe

    var body: some View {
        HStack(spacing: DesignTokens.spacingMd) {
            Circle()
                .fill(colorFromHex(universe.sphereColor ?? "") ?? themeManager.accentColor)
                .frame(width: 32, height: 32)
            VStack(alignment: .leading, spacing: 2) {
                Text(universe.name)
                    .font(.body)
                    .fontWeight(.medium)
                    .foregroundColor(themeManager.textPrimary)
                if let desc = universe.description, !desc.isEmpty {
                    Text(desc)
                        .font(.caption)
                        .foregroundColor(themeManager.textMuted)
                        .lineLimit(2)
                }
            }
            Spacer()
        }
        .padding(.vertical, DesignTokens.spacingSm)
    }

    private func colorFromHex(_ hex: String) -> Color? {
        guard !hex.isEmpty else { return nil }
        return Color(hex: hex)
    }
}
