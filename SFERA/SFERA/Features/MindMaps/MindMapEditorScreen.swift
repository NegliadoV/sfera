//
//  MindMapEditorScreen.swift
//  SFERA
//
//  Placeholder for mind map editor: nodes, edges, drag & drop
//

import SwiftUI

struct MindMapEditorScreen: View {
    @EnvironmentObject var themeManager: ThemeManager
    let mapId: String

    var body: some View {
        VStack {
            Text("Карта \(mapId)")
                .foregroundColor(themeManager.textPrimary)
            Text("Редактор — в разработке")
                .font(.caption)
                .foregroundColor(themeManager.textMuted)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(themeManager.bgPrimary)
        .navigationTitle("Ментальная карта")
    }
}
