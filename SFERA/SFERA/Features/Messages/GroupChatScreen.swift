//
//  GroupChatScreen.swift
//  SFERA
//

import SwiftUI

struct GroupChatScreen: View {
    @EnvironmentObject var themeManager: ThemeManager
    let groupId: String

    var body: some View {
        VStack {
            Text("Групповой чат")
                .foregroundColor(themeManager.textPrimary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(themeManager.bgPrimary)
        .navigationTitle("Чат")
    }
}
