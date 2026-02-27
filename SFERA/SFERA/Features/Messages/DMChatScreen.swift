//
//  DMChatScreen.swift
//  SFERA
//

import SwiftUI

struct DMChatScreen: View {
    @EnvironmentObject var themeManager: ThemeManager
    let userId: String

    var body: some View {
        VStack {
            Text("Чат с пользователем")
                .foregroundColor(themeManager.textPrimary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(themeManager.bgPrimary)
        .navigationTitle("Сообщения")
    }
}
