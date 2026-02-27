//
//  UniverseContentScreen.swift
//  SFERA
//
//  Universe content feed
//

import SwiftUI

struct UniverseContentScreen: View {
    @EnvironmentObject var themeManager: ThemeManager
    let slug: String
    let universe: Universe
    @State private var contents: [ContentItem] = []
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
                            NavigationLink(value: item) {
                                ContentCardView(item: item)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(DesignTokens.spacingMd)
                }
            }
        }
        .background(themeManager.bgPrimary)
        .navigationTitle(universe.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Menu {
                    NavigationLink { RoomsListScreen(universeSlug: slug) } label: {
                        Label("Комнаты", systemImage: "video.fill")
                    }
                    NavigationLink { MindMapsListScreen(universeSlug: slug) } label: {
                        Label("Ментальные карты", systemImage: "point.3.connected.trianglepath.dotted")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .navigationDestination(for: ContentItem.self) { item in
            ContentDetailScreen(universeSlug: slug, contentId: item.id)
        }
        .task {
            await loadContent()
        }
    }

    private func loadContent() async {
        isLoading = true
        error = nil
        do {
            contents = try await ContentService.shared.fetchContent(universeId: universe.id)
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }
}
