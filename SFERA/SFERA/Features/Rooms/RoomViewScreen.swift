//
//  RoomViewScreen.swift
//  SFERA
//
//  Placeholder for room: video sync, chat, voice
//

import SwiftUI

struct RoomViewScreen: View {
    @EnvironmentObject var themeManager: ThemeManager
    let roomId: String

    var body: some View {
        VStack {
            Text("Комната \(roomId)")
                .foregroundColor(themeManager.textPrimary)
            Text("Видео, синхронизация и голос — в разработке")
                .font(.caption)
                .foregroundColor(themeManager.textMuted)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(themeManager.bgPrimary)
        .navigationTitle("Комната")
    }
}
