export default function POSLoading() {
  return (
    <div className="flex h-screen bg-[#F8FAF9] overflow-hidden">
      <div className="flex-1 flex flex-col h-full border-r border-gray-200 bg-white">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-4">
          <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
          <div className="h-9 flex-1 max-w-sm bg-gray-100 rounded-lg animate-pulse" />
        </div>
        <div className="flex gap-2 px-5 py-3 border-b border-gray-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-7 w-20 bg-gray-100 rounded-full animate-pulse" />
          ))}
        </div>
        <div className="flex-1 p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-white p-3 space-y-2">
              <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      <div className="w-80 xl:w-96 flex flex-col h-full bg-white">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="h-5 w-28 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 border-2 border-[#1B4332] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    </div>
  )
}
