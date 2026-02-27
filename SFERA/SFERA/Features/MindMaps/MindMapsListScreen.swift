//
//  MindMapsListScreen.swift
//  SFERA
//

import SwiftUI

struct MindMapsListScreen: View {
    @EnvironmentObject var themeManager: ThemeManager
    let universeSlug: String
    @State private var maps: [MindMapItem] = []
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
            } else if maps.isEmpty {
                Text("Нет ментальных карт")
                    .foregroundColor(themeManager.textMuted)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                List(maps) { map in
                    NavigationLink {
                        MindMapEditorScreen(mapId: map.id)
                    } label: {
                        Text(map.name ?? "Карта")
                            .foregroundColor(themeManager.textPrimary)
                    }
                    .listRowBackground(themeManager.bgCard)
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
            }
        }
        .background(themeManager.bgPrimary)
        .navigationTitle("Ментальные карты")
        .task {
            await loadMaps()
        }
    }

    private func loadMaps() async {
        isLoading = true
        error = nil
        do {
            maps = try await MindMapsService.shared.fetchMaps(universeSlug: universeSlug)
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }
}
