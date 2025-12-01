export default function DashboardSkeleton() {
  return (
    <div className="animate-pulse px-8 pb-8">
      {/* Mazda Gallery Section Skeleton */}
      <div className="mb-6 mt-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <div className="h-40 md:h-52 bg-gray-200"></div>
            <div className="h-40 md:h-52 bg-gray-200"></div>
          </div>
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {[1, 2, 3].map((index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-lg border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
              <div className="w-16 h-6 bg-gray-200 rounded"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-20"></div>
          </div>
        ))}
      </div>

      {/* Recent Activity & User Info Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Products Skeleton */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded w-40"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div>
                  <div className="h-3 bg-gray-200 rounded w-20 ml-auto"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Info Card Skeleton */}
        <div className="bg-gray-200 rounded-xl shadow-lg p-6 flex flex-col justify-center h-full">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-6 h-6 bg-gray-300 rounded"></div>
            <div className="h-6 bg-gray-300 rounded w-24"></div>
          </div>
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-gray-300 rounded-full"></div>
            <div className="w-full space-y-2">
              <div className="h-6 bg-gray-300 rounded w-32 mx-auto"></div>
              <div className="h-4 bg-gray-300 rounded w-40 mx-auto"></div>
            </div>
            <div className="w-full pt-6 border-t border-gray-300">
              <div className="flex justify-center items-center gap-3">
                <div className="h-4 bg-gray-300 rounded w-12"></div>
                <div className="h-10 bg-gray-300 rounded w-32"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
