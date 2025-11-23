/**
 * Frontend Error Handling Utilities
 */

export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

/**
 * Extract error message from various error formats
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return 'Произошла неизвестная ошибка';
}

/**
 * Parse API error response
 */
export async function parseApiError(response: Response): Promise<ApiError> {
  let errorData: any;

  try {
    errorData = await response.json();
  } catch {
    errorData = { message: 'Ошибка сервера' };
  }

  return {
    message: errorData.message || `HTTP Error ${response.status}`,
    statusCode: response.status,
    errors: errorData.errors,
  };
}

/**
 * Handle fetch errors with automatic retry
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  delay = 1000
): Promise<Response> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      // Don't retry client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        return response;
      }

      // Retry server errors (5xx) or network errors
      throw new Error(`HTTP ${response.status}`);
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Safe async error wrapper
 */
export async function safeAsync<T>(
  promise: Promise<T>,
  errorMessage?: string
): Promise<[T | null, Error | null]> {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    console.error(errorMessage || 'Async error:', error);
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
}

/**
 * Format validation errors from API
 */
export function formatValidationErrors(
  errors: Record<string, string[]> | undefined
): string {
  if (!errors) return '';

  return Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('\n');
}

/**
 * Check if error is network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return (
      error.message.includes('network') ||
      error.message.includes('NetworkError') ||
      error.message.includes('Failed to fetch')
    );
  }

  return false;
}

/**
 * Get user-friendly error message based on status code
 */
export function getStatusMessage(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return 'Неверный запрос. Проверьте введенные данные.';
    case 401:
      return 'Требуется авторизация. Пожалуйста, войдите в систему.';
    case 403:
      return 'Доступ запрещен. У вас нет прав для этого действия.';
    case 404:
      return 'Ресурс не найден.';
    case 409:
      return 'Конфликт данных. Возможно, ресурс уже существует.';
    case 422:
      return 'Ошибка валидации данных.';
    case 429:
      return 'Слишком много запросов. Пожалуйста, попробуйте позже.';
    case 500:
      return 'Внутренняя ошибка сервера. Попробуйте позже.';
    case 502:
      return 'Сервер временно недоступен.';
    case 503:
      return 'Сервис временно недоступен. Ведутся технические работы.';
    default:
      return `Ошибка сервера (${statusCode})`;
  }
}

/**
 * Log error to external service (Sentry, etc.)
 */
export function logError(error: Error, context?: Record<string, any>): void {
  // In development, just console.error
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error);
    if (context) {
      console.error('Context:', context);
    }
    return;
  }

  // In production, send to error tracking service
  // TODO: Integrate with Sentry or similar service
  // if (window.Sentry) {
  //   window.Sentry.captureException(error, { extra: context });
  // }
}

/**
 * Create error toast notification
 */
export function showErrorToast(message: string): void {
  // This should be integrated with your toast notification system
  // For now, just alert in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Toast:', message);
  }

  // TODO: Integrate with react-hot-toast or similar
  // toast.error(message);
}
