'use client';

import React, { Component, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  children: ReactNode;
  resetOnRouteChange?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Route-specific Error Boundary
 * Lighter version for individual routes/components
 */
class RouteErrorBoundaryClass extends Component<Props & { router?: any }, State> {
  constructor(props: Props & { router?: any }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('RouteErrorBoundary caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  handleGoBack = () => {
    if (this.props.router) {
      this.props.router.back();
    } else {
      window.history.back();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <div className="w-16 h-16 mx-auto bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-yellow-600 dark:text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
              Ошибка загрузки
            </h3>

            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Не удалось загрузить содержимое этого раздела.
            </p>

            <div className="mt-6 flex gap-2">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Повторить
              </button>
              <button
                onClick={this.handleGoBack}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Назад
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper with Next.js router support
 */
export default function RouteErrorBoundary(props: Props) {
  const router = useRouter();
  return <RouteErrorBoundaryClass {...props} router={router} />;
}
