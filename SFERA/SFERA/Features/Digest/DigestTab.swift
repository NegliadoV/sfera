//
//  DigestTab.swift
//  SFERA
//

import SwiftUI

struct DigestTab: View {
    @EnvironmentObject var themeManager: ThemeManager
    @State private var digestItems: [DigestItem] = []
    @State private var isLoading = true
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if let err = error {
                    Text(err)
                        .foregroundColor(themeManager.textSecondary)
                        .padding()
                } else if digestItems.isEmpty {
                    Text("Нет нового контента")
                        .foregroundColor(themeManager.textMuted)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    List(digestItems) { item in
                        Text(item.title ?? "Контент")
                            .foregroundColor(themeManager.textPrimary)
                    }
                    .listStyle(.plain)
                    .scrollContentBackground(.hidden)
                }
            }
            .background(themeManager.bgPrimary)
            .navigationTitle("Дайджест")
            .task {
                await loadDigest()
            }
            .refreshable {
                await loadDigest()
            }
        }
    }

    private func loadDigest() async {
        isLoading = true
        error = nil
        do {
            digestItems = try await DigestService.shared.fetchDigest()
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }
}
