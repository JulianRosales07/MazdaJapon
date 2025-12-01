interface ComparativaSkeletonTableProps {
  rows?: number;
  maxProveedores?: number;
}

export default function ComparativaSkeletonTable({ rows = 5, maxProveedores = 3 }: ComparativaSkeletonTableProps) {
  return (
    <div className="animate-pulse overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr>
            <th className="py-4 px-6 border-b border-gray-200 min-w-[100px]">
              <div className="h-4 bg-gray-200 rounded w-12"></div>
            </th>
            <th className="py-4 px-6 border-b border-gray-200 min-w-[250px]">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </th>
            {Array.from({ length: maxProveedores }).map((_, i) => (
              <th key={i} className="py-4 px-6 border-b border-gray-200 min-w-[200px]">
                <div className="h-4 bg-gray-200 rounded w-28"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-gray-100">
              <td className="py-6 px-6">
                <div className="h-4 bg-gray-100 rounded w-16"></div>
              </td>
              <td className="py-6 px-6">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-40"></div>
                  <div className="h-3 bg-gray-100 rounded w-24"></div>
                </div>
              </td>
              {Array.from({ length: maxProveedores }).map((_, colIndex) => (
                <td key={colIndex} className="py-6 px-6">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-32"></div>
                    <div className="h-5 bg-gray-100 rounded w-20"></div>
                    <div className="h-6 bg-gray-100 rounded w-24"></div>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
