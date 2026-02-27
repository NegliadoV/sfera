//
//  MeTab.swift
//  SFERA
//
//  Personal cabinet tab
//

import SwiftUI

struct MeTab: View {
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var themeManager: ThemeManager

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: DesignTokens.spacingLg) {
                    if let user = authManager.user {
                        HStack(spacing: DesignTokens.spacingMd) {
                            if let img = user.image, let url = URL(string: img) {
                                AsyncImage(url: url) { phase in
                                    if let image = phase.image {
                                        image
                                            .resizable()
                                            .aspectRatio(contentMode: .fill)
                                    } else {
                                        Circle()
                                            .fill(themeManager.bgSecondary)
                                            .overlay(
                                                Text(String((user.name ?? user.email ?? "?").prefix(1)))
                                                    .font(.title2)
                                                    .foregroundColor(themeManager.textPrimary)
                                            )
                                    }
                                }
                                .frame(width: 64, height: 64)
                                .clipShape(Circle())
                            } else {
                                Circle()
                                    .fill(themeManager.bgSecondary)
                                    .frame(width: 64, height: 64)
                                    .overlay(
                                        Text(String((user.name ?? user.email ?? "?").prefix(1)))
                                            .font(.title2)
                                            .foregroundColor(themeManager.textPrimary)
                                    )
                            }
                            VStack(alignment: .leading, spacing: 4) {
                                Text(user.name ?? user.email ?? "Пользователь")
                                    .font(.headline)
                                    .foregroundColor(themeManager.textPrimary)
                                if let email = user.email {
                                    Text(email)
                                        .font(.caption)
                                        .foregroundColor(themeManager.textMuted)
                                }
                            }
                            Spacer()
                        }
                        .padding(DesignTokens.spacingMd)
                        .background(themeManager.bgCard)
                        .cornerRadius(DesignTokens.radiusMd)
                    }

                    NavigationLink {
                        MeContentScreen()
                    } label: {
                        HStack {
                            Image(systemName: "newspaper.fill")
                                .foregroundColor(themeManager.accentColor)
                            Text("Лента контента")
                                .foregroundColor(themeManager.textPrimary)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundColor(themeManager.textMuted)
                        }
                        .padding(DesignTokens.spacingMd)
                        .background(themeManager.bgCard)
                        .cornerRadius(DesignTokens.radiusMd)
                    }
                }
                .padding(DesignTokens.spacingMd)
            }
            .background(themeManager.bgPrimary)
            .navigationTitle("Мой кабинет")
            .navigationBarTitleDisplayMode(.large)
        }
    }
}
