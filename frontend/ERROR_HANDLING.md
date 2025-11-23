# Error Handling Documentation

Комплексная система обработки ошибок для Draiver Frontend.

## Компоненты

### 1. ErrorBoundary (Глобальный)
**Расположение**: `src/components/ErrorBoundary.tsx`

Глобальный Error Boundary обрабатывает все React errors в приложении.

**Использование**:
```tsx
import ErrorBoundary from '@/components/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

**С кастомным fallback**:
```tsx
<ErrorBoundary
  fallback={<div>Ваш кастомный UI</div>}
  onError={(error, errorInfo) => {
    // Кастомная обработка ошибки
    logToService(error);
  }}
>
  <YourComponent />
</ErrorBoundary>
```

**Возможности**:
- ✅ Автоматический catch всех JavaScript ошибок
- ✅ Красивый fallback UI с кнопками "Попробовать снова" и "На главную"
- ✅ Детали ошибки в dev mode
- ✅ Логирование в production (готово к интеграции с Sentry)
- ✅ Поддержка темной темы

### 2. RouteErrorBoundary (Для роутов)
**Расположение**: `src/components/RouteErrorBoundary.tsx`

Легковесный Error Boundary для отдельных роутов или компонентов.

**Использование**:
```tsx
import RouteErrorBoundary from '@/components/RouteErrorBoundary';

<RouteErrorBoundary>
  <ComplexFeature />
</RouteErrorBoundary>
```

**Возможности**:
- ✅ Компактный UI для локальных ошибок
- ✅ Кнопки "Повторить" и "Назад"
- ✅ Интеграция с Next.js Router
- ✅ Не перезагружает всю страницу

### 3. Next.js Error Pages

#### error.tsx
**Расположение**: `src/app/error.tsx`

Next.js 14 global error page для обработки ошибок в route segments.

**Автоматическое использование**: Next.js использует этот файл при ошибках в app router.

#### not-found.tsx
**Расположение**: `src/app/not-found.tsx`

Страница 404 с быстрыми ссылками на основные разделы приложения.

**Использование**:
```tsx
import { notFound } from 'next/navigation';

if (!data) {
  notFound(); // Показывает not-found.tsx
}
```

#### loading.tsx
**Расположение**: `src/app/loading.tsx`

Глобальный loading UI для Suspense boundaries.

## Утилиты обработки ошибок

**Расположение**: `src/utils/errorHandler.ts`

### getErrorMessage()
Извлекает текст ошибки из различных форматов.

```tsx
try {
  // ...
} catch (error) {
  const message = getErrorMessage(error);
  console.error(message);
}
```

### parseApiError()
Парсит API ошибки из Response.

```tsx
const response = await fetch('/api/users');
if (!response.ok) {
  const apiError = await parseApiError(response);
  console.error(apiError.message);
  console.error(apiError.errors); // validation errors
}
```

### fetchWithRetry()
Fetch с автоматическим retry для 5xx ошибок.

```tsx
// Retry до 3 раз с exponential backoff
const response = await fetchWithRetry('/api/rides', {
  method: 'GET',
  headers: { 'Authorization': `Bearer ${token}` }
}, 3, 1000);
```

### safeAsync()
Безопасная обертка для async операций.

```tsx
const [data, error] = await safeAsync(
  fetchUserData(userId),
  'Failed to fetch user'
);

if (error) {
  // Обработка ошибки
  return;
}

// Используем data
```

### formatValidationErrors()
Форматирует validation errors из API в читаемый текст.

```tsx
const apiError = await parseApiError(response);
if (apiError.errors) {
  const formatted = formatValidationErrors(apiError.errors);
  alert(formatted);
}
```

### isNetworkError()
Проверяет, является ли ошибка сетевой.

```tsx
try {
  await fetch('/api/data');
} catch (error) {
  if (isNetworkError(error)) {
    alert('Проверьте подключение к интернету');
  }
}
```

### getStatusMessage()
Получает user-friendly сообщение по HTTP status code.

```tsx
const message = getStatusMessage(404);
// "Ресурс не найден."
```

### logError()
Логирует ошибку в external service (готово к Sentry).

```tsx
try {
  // ...
} catch (error) {
  logError(error, { userId, action: 'createRide' });
}
```

## Примеры использования

### API Call с обработкой ошибок

```tsx
async function createRide(data: RideData) {
  try {
    const response = await fetchWithRetry('/api/rides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await parseApiError(response);

      if (error.errors) {
        // Validation errors
        const message = formatValidationErrors(error.errors);
        throw new Error(message);
      }

      throw new Error(error.message);
    }

    return await response.json();
  } catch (error) {
    logError(error as Error, { action: 'createRide', data });
    throw error;
  }
}
```

### Компонент с локальной обработкой ошибок

```tsx
'use client';

import { useState } from 'react';
import RouteErrorBoundary from '@/components/RouteErrorBoundary';
import { getErrorMessage } from '@/utils/errorHandler';

function RideList() {
  const [error, setError] = useState<string | null>(null);

  async function loadRides() {
    try {
      setError(null);
      const response = await fetch('/api/rides');

      if (!response.ok) {
        const apiError = await parseApiError(response);
        throw new Error(apiError.message);
      }

      // Process data...
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded">
        {error}
        <button onClick={loadRides}>Retry</button>
      </div>
    );
  }

  return <div>...</div>;
}

// Wrap with error boundary
export default function RideListPage() {
  return (
    <RouteErrorBoundary>
      <RideList />
    </RouteErrorBoundary>
  );
}
```

### Server Action с обработкой ошибок

```tsx
'use server';

import { logError } from '@/utils/errorHandler';

export async function updateProfile(formData: FormData) {
  try {
    // ... database operations
  } catch (error) {
    logError(error as Error, {
      action: 'updateProfile',
      userId: formData.get('userId'),
    });

    return {
      success: false,
      error: 'Не удалось обновить профиль',
    };
  }
}
```

## Интеграция с Sentry (будущее)

Для продакшена рекомендуется интегрировать Sentry:

1. Установить: `npm install @sentry/nextjs`
2. Настроить в `sentry.client.config.ts` и `sentry.server.config.ts`
3. Раскомментировать TODO в:
   - `ErrorBoundary.tsx` (componentDidCatch)
   - `error.tsx` (useEffect)
   - `errorHandler.ts` (logError)

## Тестирование

Для проверки error boundaries:

```tsx
// Тестовый компонент, который бросает ошибку
function ErrorTest() {
  throw new Error('Test error');
}

// Обернуть в ErrorBoundary и проверить fallback UI
<ErrorBoundary>
  <ErrorTest />
</ErrorBoundary>
```

## Best Practices

1. **Всегда оборачивайте async операции** в try-catch или используйте `safeAsync()`
2. **Используйте RouteErrorBoundary** для feature-specific компонентов
3. **Логируйте все ошибки** через `logError()` для отслеживания
4. **Показывайте user-friendly сообщения**, не технические детали
5. **Предоставляйте способ recovery** - кнопки "Retry", "Назад", "На главную"
6. **Валидируйте на клиенте** перед отправкой на сервер
7. **Используйте TypeScript** для предотвращения ошибок на этапе компиляции

## Статус

✅ **Реализовано**:
- Global ErrorBoundary
- RouteErrorBoundary
- Next.js error.tsx
- Next.js not-found.tsx
- Next.js loading.tsx
- Error handling utilities
- TypeScript типы
- Dark mode support

⏳ **TODO**:
- Интеграция с Sentry
- Интеграция с toast notifications (react-hot-toast)
- Offline error handling
- Unit тесты для error utilities
