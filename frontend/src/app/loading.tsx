/**
 * Next.js 14 Global Loading UI
 */
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-300 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">
          Загрузка...
        </p>
      </div>
    </div>
  );
}
