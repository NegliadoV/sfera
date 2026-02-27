//
//  SignInView.swift
//  SFERA
//
//  Sign in and register screens
//

import SwiftUI

struct SignInView: View {
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var themeManager: ThemeManager
    @State private var email = ""
    @State private var password = ""
    @State private var errorMessage: String?
    @State private var isLoading = false
    @State private var showRegister = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: DesignTokens.spacingLg) {
                    SferaLogoView()
                        .padding(.top, DesignTokens.spacingXxl)

                    VStack(alignment: .leading, spacing: DesignTokens.spacingSm) {
                        Text("Email")
                            .font(.subheadline)
                            .foregroundColor(themeManager.textSecondary)
                        TextField("", text: $email)
                            .textFieldStyle(SferaTextFieldStyle(theme: themeManager))
                            .textContentType(.emailAddress)
                            .autocapitalization(.none)
                            .keyboardType(.emailAddress)
                    }

                    VStack(alignment: .leading, spacing: DesignTokens.spacingSm) {
                        Text("Пароль")
                            .font(.subheadline)
                            .foregroundColor(themeManager.textSecondary)
                        SecureField("", text: $password)
                            .textFieldStyle(SferaTextFieldStyle(theme: themeManager))
                            .textContentType(.password)
                    }

                    if let err = errorMessage {
                        Text(err)
                            .font(.caption)
                            .foregroundColor(.red)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    Button(action: signIn) {
                        HStack {
                            if isLoading {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Text("Войти")
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, DesignTokens.spacingMd)
                        .background(themeManager.accentColor)
                        .foregroundColor(.white)
                        .cornerRadius(DesignTokens.radiusMd)
                    }
                    .disabled(isLoading || email.isEmpty || password.isEmpty)

                    Button("Создать аккаунт") {
                        showRegister = true
                    }
                    .foregroundColor(themeManager.accentColor)
                }
                .padding(DesignTokens.spacingLg)
            }
            .background(themeManager.bgPrimary)
            .navigationDestination(isPresented: $showRegister) {
                RegisterView()
            }
        }
    }

    private func signIn() {
        errorMessage = nil
        isLoading = true
        Task {
            do {
                let (token, user) = try await AuthService.shared.login(email: email, password: password)
                await MainActor.run {
                    authManager.setSession(token: token, user: user)
                }
            } catch {
                await MainActor.run {
                    errorMessage = "Ошибка входа: \(error.localizedDescription)"
                    isLoading = false
                }
            }
        }
    }
}

struct RegisterView: View {
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var themeManager: ThemeManager
    @Environment(\.dismiss) var dismiss
    @State private var email = ""
    @State private var password = ""
    @State private var name = ""
    @State private var errorMessage: String?
    @State private var isLoading = false

    var body: some View {
        ScrollView {
            VStack(spacing: DesignTokens.spacingLg) {
                VStack(alignment: .leading, spacing: DesignTokens.spacingSm) {
                    Text("Email")
                        .font(.subheadline)
                        .foregroundColor(themeManager.textSecondary)
                    TextField("", text: $email)
                        .textFieldStyle(SferaTextFieldStyle(theme: themeManager))
                        .textContentType(.emailAddress)
                        .autocapitalization(.none)
                        .keyboardType(.emailAddress)
                }

                VStack(alignment: .leading, spacing: DesignTokens.spacingSm) {
                    Text("Пароль")
                        .font(.subheadline)
                        .foregroundColor(themeManager.textSecondary)
                    SecureField("", text: $password)
                        .textFieldStyle(SferaTextFieldStyle(theme: themeManager))
                        .textContentType(.newPassword)
                }

                VStack(alignment: .leading, spacing: DesignTokens.spacingSm) {
                    Text("Имя (необязательно)")
                        .font(.subheadline)
                        .foregroundColor(themeManager.textSecondary)
                    TextField("", text: $name)
                        .textFieldStyle(SferaTextFieldStyle(theme: themeManager))
                }

                if let err = errorMessage {
                    Text(err)
                        .font(.caption)
                        .foregroundColor(.red)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                Button(action: register) {
                    HStack {
                        if isLoading {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Text("Зарегистрироваться")
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, DesignTokens.spacingMd)
                    .background(themeManager.accentColor)
                    .foregroundColor(.white)
                    .cornerRadius(DesignTokens.radiusMd)
                }
                .disabled(isLoading || email.isEmpty || password.isEmpty)
            }
            .padding(DesignTokens.spacingLg)
        }
        .background(themeManager.bgPrimary)
        .navigationTitle("Регистрация")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func register() {
        errorMessage = nil
        isLoading = true
        Task {
            do {
                let (token, user) = try await AuthService.shared.register(
                    email: email,
                    password: password,
                    name: name.isEmpty ? nil : name
                )
                await MainActor.run {
                    authManager.setSession(token: token, user: user)
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    errorMessage = "Ошибка: \(error.localizedDescription)"
                }
            }
            await MainActor.run { isLoading = false }
        }
    }
}
