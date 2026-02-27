//
//  RoomsListScreen.swift
//  SFERA
//

import SwiftUI

struct RoomsListScreen: View {
    @EnvironmentObject var themeManager: ThemeManager
    let universeSlug: String
    @State private var rooms: [RoomItem] = []
    @State private var isLoading = true
    @State private var error: String?

    var body: some View {
        Group {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let err = error {
                Text(err).foregroundColor(themeManager.textSecondary).padding()
            } else if rooms.isEmpty {
                Text("Нет комнат").foregroundColor(themeManager.textMuted)
            } else {
                List(rooms) { room in
                    NavigationLink { RoomViewScreen(roomId: room.id) } label: {
                        Text(room.name ?? "Комната").foregroundColor(themeManager.textPrimary)
                    }.listRowBackground(themeManager.bgCard)
                }.listStyle(.plain).scrollContentBackground(.hidden)
            }
        }.background(themeManager.bgPrimary).navigationTitle("Комнаты")
        .task { await loadRooms() }
    }

    private func loadRooms() async {
        isLoading = true
        error = nil
        do {
            rooms = try await RoomsService.shared.fetchRooms(universeSlug: universeSlug)
        } catch { self.error = error.localizedDescription }
        isLoading = false
    }
}
