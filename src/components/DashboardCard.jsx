export default function DashboardCard({ title, value, icon, color = 'primary', onClick }) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-700 ring-primary-600/20',
    secondary: 'bg-purple-50 text-purple-700 ring-purple-600/20',
    success: 'bg-green-50 text-green-700 ring-green-600/20',
    warning: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
    danger: 'bg-red-50 text-red-700 ring-red-600/20'
  }

  return (
    <div
      className={`relative group overflow-hidden rounded-lg ${
        onClick ? 'cursor-pointer transform transition-transform hover:scale-105' : ''
      }`}
      onClick={onClick}
    >
      <div className={`p-6 ${colorClasses[color]} ring-1 ring-inset`}>
        <div className="flex items-center gap-x-4">
          <div className="flex-none rounded-lg bg-white p-2 ring-1 ring-inset ring-gray-200">
            {icon}
          </div>
          <div>
            <div className="font-medium leading-6">{title}</div>
            <div className="mt-1 text-3xl font-semibold tracking-tight">{value}</div>
          </div>
        </div>
      </div>
      {onClick && (
        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
      )}
    </div>
  )
}