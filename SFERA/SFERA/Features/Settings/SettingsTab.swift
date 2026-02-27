//
//  SettingsTab.swift
//  SFERA
//

import SwiftUI

struct SettingsTab: View {
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var themeManager: ThemeManager

    var body: some View {
        NavigationStack {
            List {
                Section("Внешний вид") {
                    Picker("Тема", selection: Binding(
                        get: { themeManager.theme },
                        set: { themeManager.theme = $0 }
                    )) {
                        Text("Тёмная").tag(AppTheme.dark)
                        Text("Светлая").tag(AppTheme.light)
                    }
                    .foregroundColor(themeManager.textPrimary)

                    Picker("Акцент", selection: Binding(
                        get: { themeManager.accentPreset },
                        set: { themeManager.accentPreset = $0 }
                    )) {
                        Text("Синий").tag(AccentPreset.blue)
                        Text("Фиолетовый").tag(AccentPreset.purple)
                        Text("Зелёный").tag(AccentPreset.green)
                        Text("Оранжевый").tag(AccentPreset.orange)
                        Text("Красный").tag(AccentPreset.red)
                    }
                    .foregroundColor(themeManager.textPrimary)
                }

                Section {
                    Button(role: .destructive) {
                        authManager.signOut()
                    } label: {
                        Text("Выйти")
                    }
                }
            }
            .listStyle(.insetGrouped)
            .scrollContentBackground(.hidden)
            .background(themeManager.bgPrimary)
            .foregroundColor(themeManager.textPrimary)
            .navigationTitle("Настройки")
        }
    }
}
