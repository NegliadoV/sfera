//
//  SferaTextFieldStyle.swift
//  SFERA
//
//  Text field styling matching web design (ViewModifier for stable API)
//

import SwiftUI

/// Applies SFERA styling to a TextField. Use: `TextField(...).modifier(SferaTextFieldModifier(theme: themeManager))`
struct SferaTextFieldModifier: ViewModifier {
    let theme: ThemeManager

    func body(content: Content) -> some View {
        content
            .padding(DesignTokens.spacingMd)
            .background(theme.bgCard)
            .foregroundColor(theme.textPrimary)
            .cornerRadius(DesignTokens.radiusMd)
            .overlay(
                RoundedRectangle(cornerRadius: DesignTokens.radiusMd)
                    .stroke(theme.borderColor, lineWidth: 1)
            )
    }
}
