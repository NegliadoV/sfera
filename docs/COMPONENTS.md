# Документация компонентов

## Структура компонентов

### Компоненты сфер (`components/universe/`)

#### UniverseCard
Карточка сферы для каталога.

```tsx
import { UniverseCard } from '@/components/universe';

<UniverseCard
  slug="quantum-physics"
  name="Квантовая физика"
  description="Описание сферы"
  icon={null}
  sphereColor={null}
/>
```

#### CabinetUniverseItem
Элемент списка сфер в личном кабинете.

```tsx
import { CabinetUniverseItem } from '@/components/universe';

<CabinetUniverseItem
  slug="quantum-physics"
  name="Квантовая физика"
  description="Описание"
  icon={null}
  updatedAt={new Date()}
  isOwner={true}
  showDelete={true}
/>
```

#### CabinetTrackedUniverseItem
Элемент отслеживаемой сферы в личном кабинете.

```tsx
import { CabinetTrackedUniverseItem } from '@/components/universe/CabinetTrackedUniverseItem';

<CabinetTrackedUniverseItem slug="quantum" name="Квантовая физика" ... />
```

### Компоненты навигации (`components/navigation/`)

#### AnimatedTabBar
Кастомный таб-бар с анимированным индикатором (Expo Router Tabs).

```tsx
import { AnimatedTabBar } from '@/components/navigation';

<Tabs tabBar={(props) => <AnimatedTabBar {...props} tabBarPaddingBottom={32} />} />
```

#### TabIconWrap
Обёртка иконки таба с анимацией scale/opacity и неоновой подсветкой активного состояния.

```tsx
import { TabIconWrap } from '@/components/navigation';

<TabIconWrap focused={isFocused}>
  <Icon color={iconColor} size={26} />
</TabIconWrap>
```

Токены таб-бара: `@/constants/Theme` — `tabBarTokens` (iconSize, indicatorWidth, springConfig, rowHeight и т.д.).

---

## Утилиты (`lib/utils/`)

### Иконки (`lib/utils/icons.ts`)

#### normalizeIconForStorage
Нормализует иконку перед сохранением в БД.

```tsx
import { normalizeIconForStorage } from '@/lib/utils/icons';

const normalized = normalizeIconForStorage('fa-solid fa-globe');
// Возвращает: 'fa-globe'
```

### Даты (`lib/utils/date.ts`)

#### formatUpdated
Форматирует дату обновления в читаемый формат.

```tsx
import { formatUpdated } from '@/lib/utils/date';

const formatted = formatUpdated(new Date());
// Возвращает: 'сегодня', '1д назад', '5д назад' или дату
```

## Стандарты кодирования

### Именование
- Компоненты: PascalCase (`UniverseCard`)
- Файлы компонентов: PascalCase (`UniverseCard.tsx`)
- Утилиты: camelCase (`formatUpdated`)
- Файлы утилит: camelCase (`icons.ts`)

### Структура компонента
1. Импорты
2. Типы/интерфейсы
3. Компонент
4. Экспорт

### Стилизация
- Используйте CSS классы из `globals.css`
- Избегайте inline стилей, кроме динамических значений
- Используйте CSS переменные для цветов (`var(--accent-blue)`)

### Типизация
- Всегда используйте TypeScript типы
- Экспортируйте типы для переиспользования
- Используйте `forwardRef` для компонентов с ref
