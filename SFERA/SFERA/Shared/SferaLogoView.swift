//
//  SferaLogoView.swift
//  SFERA
//
//  Logo component matching web
//

import SwiftUI

struct SferaLogoView: View {
    @EnvironmentObject var themeManager: ThemeManager

    var body: some View {
        HStack(spacing: DesignTokens.spacingSm) {
            Image(systemName: "globe.americas.fill")
                .font(.title2)
                .foregroundColor(themeManager.accentColor)
            Text("SFERA")
                .font(.title)
                .fontWeight(.bold)
                .foregroundColor(themeManager.textPrimary)
        }
        .padding(.vertical, DesignTokens.spacingMd)
    }
}
