'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  /** Кастомный fallback. Если не задан — показывает встроенный экран ошибки. */
  fallback?: React.ReactNode;
  /** Контекстное имя компонента для логирования */
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary — перехватывает ошибки рендера в дочерних компонентах.
 * Без него ошибка в любом компоненте роняет всё приложение.
 *
 * Использование:
 *   <ErrorBoundary name="Sidebar">
 *     <AppSidebar />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // В production можно заменить на Sentry/Datadog
    console.error(`[ErrorBoundary:${this.props.name ?? 'unknown'}]`, error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        role="alert"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: '40px 24px',
          minHeight: 200,
          textAlign: 'center',
          color: 'var(--text-secondary)',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
          }}
        >
          <i className="fas fa-triangle-exclamation" style={{ color: '#ef4444' }} />
        </div>

        <div>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem' }}>
            Что-то пошло не так
          </p>
          {this.state.error?.message && (
            <p
              style={{
                margin: '6px 0 0',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-jetbrains-mono)',
                maxWidth: 360,
                wordBreak: 'break-word',
              }}
            >
              {this.state.error.message}
            </p>
          )}
        </div>

        <button
          onClick={this.handleReset}
          style={{
            padding: '8px 20px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-accent)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 500,
            transition: 'all 0.2s ease',
          }}
        >
          <i className="fas fa-rotate-right" style={{ marginRight: 8 }} />
          Попробовать снова
        </button>
      </div>
    );
  }
}

/**
 * withErrorBoundary — HOC-обёртка для быстрого добавления ErrorBoundary.
 *
 * const SafeSidebar = withErrorBoundary(AppSidebar, { name: 'Sidebar' });
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: { name?: string; fallback?: React.ReactNode }
): React.FC<P> {
  const Wrapped: React.FC<P> = (props) => (
    <ErrorBoundary name={options?.name} fallback={options?.fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  Wrapped.displayName = `withErrorBoundary(${options?.name ?? Component.displayName ?? Component.name})`;
  return Wrapped;
}
