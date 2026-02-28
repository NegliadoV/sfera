//
//  MessagesTab.swift
//  SFERA
//

import SwiftUI

struct MessagesTabWithBadge: View {
    @State private var badgeCount = 0

    var body: some View {
        MessagesTab()
            .badge(badgeCount > 0 ? badgeCount : 0)
            .task {
                await loadBadge()
            }
    }

    private func loadBadge() async {
        do {
            let res = try await NotificationsService.shared.fetchMessagesBadge()
            await MainActor.run { badgeCount = res.total }
        } catch {}
    }
}

struct MessagesTab: View {
    @EnvironmentObject var themeManager: ThemeManager
    @State private var conversations: [ConversationItem] = []
    @State private var groups: [GroupChatItem] = []
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
                } else if conversations.isEmpty && groups.isEmpty {
                    Text("Нет сообщений")
                        .foregroundColor(themeManager.textMuted)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    List {
                        ForEach(groups) { g in
                            NavigationLink {
                                GroupChatScreen(groupId: g.id)
                            } label: {
                                HStack {
                                    Image(systemName: "person.3.fill")
                                        .foregroundColor(themeManager.accentColor)
                                    Text(g.name)
                                        .foregroundColor(themeManager.textPrimary)
                                }
                            }
                            .listRowBackground(themeManager.bgCard)
                        }
                        ForEach(conversations) { c in
                            NavigationLink {
                                DMChatScreen(userId: c.userId ?? "")
                            } label: {
                                HStack {
                                    Text(c.userName ?? "Пользователь")
                                        .foregroundColor(themeManager.textPrimary)
                                }
                            }
                            .listRowBackground(themeManager.bgCard)
                        }
                    }
                    .listStyle(.plain)
                    .scrollContentBackground(.hidden)
                }
            }
            .background(themeManager.bgPrimary)
            .navigationTitle("Сообщения")
            .task {
                await loadConversations()
            }
            .refreshable {
                await loadConversations()
            }
        }
    }

    private func loadConversations() async {
        isLoading = true
        error = nil
        do {
            async let convs = MessagesService.shared.fetchConversations()
            async let grps = MessagesService.shared.fetchGroupChats()
            conversations = try await convs
            groups = try await grps
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }
}
