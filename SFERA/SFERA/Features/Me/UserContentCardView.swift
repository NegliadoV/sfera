//
//  UserContentCardView.swift
//  SFERA
//

import SwiftUI

struct UserContentCardView: View {
    @EnvironmentObject var themeManager: ThemeManager
    let item: UserContentItem

    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spacingSm) {
            if let title = item.title, !title.isEmpty {
                Text(title)
                    .font(.headline)
                    .foregroundColor(themeManager.textPrimary)
                    .lineLimit(2)
            }
            if let body = item.body, !body.isEmpty {
                Text(body)
                    .font(.subheadline)
                    .foregroundColor(themeManager.textSecondary)
                    .lineLimit(3)
            }
            HStack {
                if let author = item.externalAuthor {
                    Text(author)
                        .font(.caption)
                        .foregroundColor(themeManager.textMuted)
                }
                if let created = item.createdAt ?? item.publishedAt {
                    Text(formatDate(created))
                        .font(.caption)
                        .foregroundColor(themeManager.textMuted)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(DesignTokens.spacingMd)
        .background(themeManager.bgCard)
        .cornerRadius(DesignTokens.radiusMd)
        .overlay(
            RoundedRectangle(cornerRadius: DesignTokens.radiusMd)
                .stroke(themeManager.borderColor.opacity(0.5), lineWidth: 1)
        )
    }

    private func formatDate(_ iso: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatter.date(from: iso) ?? ISO8601DateFormatter().date(from: iso) {
            let f = DateFormatter()
            f.dateStyle = .short
            f.timeStyle = .short
            return f.string(from: date)
        }
        return iso
    }
}
