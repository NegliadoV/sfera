//
//  MeContentScreen.swift
//  SFERA
//

import SwiftUI

struct MeContentScreen: View {
    @EnvironmentObject var themeManager: ThemeManager
    @State private var contents: [UserContentItem] = []
    @State private var isLoading = true
    @State private var error: String?

    var body: some View {
        Group {
            if isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let err = error {
                Text(err)
                    .foregroundColor(themeManager.textSecondary)
                    .padding()
            } else {
                ScrollView {
                    LazyVStack(spacing: DesignTokens.spacingMd) {
                        ForEach(contents) { item in
                            UserContentCardView(item: item)
                        }
                    }
                    .padding(DesignTokens.spacingMd)
                }
            }
        }
        .background(themeManager.bgPrimary)
        .navigationTitle("Лента контента")
        .task {
            await loadContent()
        }
    }

    private func loadContent() async {
        isLoading = true
        error = nil
        do {
            contents = try await MeService.shared.fetchMyContent()
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }
}
