//
//  SferaTextFieldStyle.swift
//  SFERA
//
//  Text field style matching web design
//

import SwiftUI

struct SferaTextFieldStyle: TextFieldStyle {
    let theme: ThemeManager

    func _body(configuration: TextFieldStyleConfiguration) -> some View {
        configuration.label
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
