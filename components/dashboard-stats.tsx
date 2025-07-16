const VersionBadge = () => (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
    Latest
  </span>
)

const DashboardStats = () => {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-3xl font-bold text-gray-900">Call Center Analytics</h1>
        <VersionBadge />
      </div>
      <p className="text-gray-600">AI-Powered Call Analysis Platform</p>
    </div>
  )
}

export { DashboardStats }
