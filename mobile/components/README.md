# Компоненты мобильного приложения

## Структура

- **`screen/`** — обёртки для экранов:
  - `ScreenContainer` — контейнер с фоном из темы (`forceDark` для принудительно тёмного фона).
  - `LoadingScreen` — полноэкранный индикатор загрузки.
  - `EmptyState` — блок «пусто» с текстом (`message`).

- **`platform/`** — переиспользуемые UI-компоненты:
  - `PlatformCard`, `PlatformCardTitle`, `PlatformCardDesc` — карточка и текст внутри.
  - `ListCard` — карточка списка: `title`, опционально `subtitle`, опционально `onPress`.
  - `PlatformButton`, `PlatformButtonPrimary`, `PlatformInput`, `PlatformTag`, `PlatformSectionHeading`, `PlatformHeroTitle`, `PlatformHeroDesc`.

## Использование

Экраны-списки (лента, чаты, контент, комнаты, ментальные карты, сборка, «Я») используют:

- `ScreenContainer` как корневой контейнер.
- `LoadingScreen` при загрузке.
- `EmptyState` для пустого списка.
- `ListCard` для каждого элемента списка (с `title`, при необходимости `subtitle` и `onPress`).

Цвета и отступы берутся из `@/constants/Theme` и хука `useThemeColors()`.
