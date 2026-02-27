//
//  ContentView.swift
//  SFERA
//
//  Main navigation: TabView + NavigationStack
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authManager: AuthManager

    var body: some View {
        Group {
            if authManager.isAuthenticated {
                MainTabView()
            } else {
                SignInView()
            }
        }
        .animation(.easeInOut, value: authManager.isAuthenticated)
    }
}

struct MainTabView: View {
    @EnvironmentObject var themeManager: ThemeManager
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            UniversesTab()
                .tabItem {
                    Label("Сферы", systemImage: "globe.americas.fill")
                }
                .tag(0)

            MeTab()
                .tabItem {
                    Label("Кабинет", systemImage: "person.crop.circle.fill")
                }
                .tag(1)

            MessagesTabWithBadge()
                .tabItem {
                    Label("Сообщения", systemImage: "bubble.left.and.bubble.right.fill")
                }
                .tag(2)

            DigestTab()
                .tabItem {
                    Label("Дайджест", systemImage: "newspaper.fill")
                }
                .tag(3)

            SettingsTab()
                .tabItem {
                    Label("Настройки", systemImage: "gearshape.fill")
                }
                .tag(4)
        }
        .tint(themeManager.accentColor)
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthManager.shared)
}
