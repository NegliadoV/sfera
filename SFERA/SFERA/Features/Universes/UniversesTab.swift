//
//  UniversesTab.swift
//  SFERA
//
//  Universes (Spheres) list tab
//

import SwiftUI

struct UniversesTab: View {
    @EnvironmentObject var themeManager: ThemeManager
    @State private var universes: [Universe] = []
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
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    List(universes) { u in
                        NavigationLink(value: u) {
                            UniverseRow(universe: u)
                        }
                        .listRowBackground(themeManager.bgCard)
                        .listRowSeparatorTint(themeManager.borderColor)
                    }
                    .listStyle(.plain)
                    .scrollContentBackground(.hidden)
                }
            }
            .background(themeManager.bgPrimary)
            .navigationTitle("Сферы")
            .navigationBarTitleDisplayMode(.large)
            .navigationDestination(for: Universe.self) { u in
                UniverseContentScreen(slug: u.slug, universe: u)
            }
            .refreshable {
                await loadUniverses()
            }
            .task {
                await loadUniverses()
            }
        }
    }

    private func loadUniverses() async {
        isLoading = true
        error = nil
        do {
            universes = try await UniversesService.shared.fetchUniverses()
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }
}
