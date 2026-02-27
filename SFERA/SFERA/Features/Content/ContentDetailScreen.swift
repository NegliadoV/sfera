//
//  ContentDetailScreen.swift
//  SFERA
//

import SwiftUI

struct ContentDetailScreen: View {
    @EnvironmentObject var themeManager: ThemeManager
    let universeSlug: String
    let contentId: String
    @State private var item: ContentItem?
    @State private var isLoading = true
    @State private var error: String?

    var body: some View {
        Group {
            if isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let item = item {
                ScrollView {
                    VStack(alignment: .leading, spacing: DesignTokens.spacingMd) {
                        if let title = item.title {
                            Text(title)
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(themeManager.textPrimary)
                        }
                        if let body = item.body {
                            Text(body)
                                .font(.body)
                                .foregroundColor(themeManager.textSecondary)
                        }
                        HStack {
                            if let name = item.authorName {
                                Text(name)
                                    .font(.caption)
                                    .foregroundColor(themeManager.textMuted)
                            }
                            if let created = item.createdAt {
                                Text(created)
                                    .font(.caption)
                                    .foregroundColor(themeManager.textMuted)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(DesignTokens.spacingMd)
                }
            } else if let err = error {
                Text(err)
                    .foregroundColor(themeManager.textSecondary)
                    .padding()
            }
        }
        .background(themeManager.bgPrimary)
        .navigationTitle("Контент")
        .task {
            await loadContent()
        }
    }

    private func loadContent() async {
        isLoading = true
        error = nil
        do {
            item = try await ContentService.shared.fetchContentDetail(contentId: contentId)
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }
}
