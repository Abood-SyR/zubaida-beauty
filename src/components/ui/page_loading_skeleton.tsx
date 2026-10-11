type PageLoadingSkeletonProps = {
  variant?: 'detail' | 'category';
};

export default function PageLoadingSkeleton({
  variant = 'detail',
}: PageLoadingSkeletonProps) {
  return (
    <main className="min-h-screen bg-lightPinkBg pb-28" dir="rtl" role="status" aria-busy="true">
      <span className="sr-only">جارٍ تحميل المحتوى</span>

      <header className="bg-surfaceWhite border-b border-pink-100 px-4 py-4 mb-6 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="shimmer h-4 w-24 rounded" />
          <div className="shimmer h-6 w-36 rounded" />
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4">
        {variant === 'category' ? (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="shimmer h-12 flex-1 rounded-xl" />
              <div className="shimmer h-12 w-full sm:w-48 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => (
                <div key={item} className="bg-surfaceWhite rounded-2xl p-3 border border-pink-100">
                  <div className="shimmer h-40 rounded-xl mb-3" />
                  <div className="shimmer h-4 w-3/4 rounded mb-3" />
                  <div className="shimmer h-4 w-1/2 rounded" />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="shimmer h-[350px] sm:h-[420px] rounded-3xl" />
            <div className="space-y-4">
              <div className="shimmer h-8 w-3/4 rounded" />
              <div className="shimmer h-5 w-1/2 rounded" />
              <div className="shimmer h-28 rounded-2xl" />
              <div className="shimmer h-16 rounded-2xl" />
              <div className="shimmer h-12 rounded-xl" />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
