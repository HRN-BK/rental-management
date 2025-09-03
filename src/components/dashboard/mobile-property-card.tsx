import { cn } from '@/lib/utils'
import { MapPin, Users, Key, Building2 } from 'lucide-react'

interface MobilePropertyCardProps {
  name: string
  address: string
  totalRooms: number
  occupiedRooms: number
  availableRooms: number
  occupancyPercentage: number
  status?: string
  className?: string
}

export function MobilePropertyCard({
  name,
  address,
  totalRooms,
  occupiedRooms,
  availableRooms,
  occupancyPercentage,
  status = 'Tuyệt vời',
  className,
}: MobilePropertyCardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-sm',
        className
      )}
    >
      {/* Header - Name and Status */}
      <div className="mb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-tight flex-1">
            {name}
          </h3>
          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full whitespace-nowrap">
            {status === 'Tuyệt vời'
              ? 'Hoạt động'
              : status === 'Tốt'
                ? 'Hoạt động'
                : 'Hoạt động'}
          </span>
        </div>

        {/* Address */}
        <div className="flex items-start gap-1">
          <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-gray-600 dark:text-gray-400 leading-tight">
            {address}
          </span>
        </div>
      </div>

      {/* Stats - Horizontal Layout */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Building2 className="w-3 h-3 text-blue-600" />
            <span className="text-lg font-bold text-blue-600">
              {totalRooms}
            </span>
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Tổng</span>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users className="w-3 h-3 text-green-600" />
            <span className="text-lg font-bold text-green-600">
              {occupiedRooms}
            </span>
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Đã thuê
          </span>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Key className="w-3 h-3 text-orange-600" />
            <span className="text-lg font-bold text-orange-600">
              {availableRooms}
            </span>
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Trống
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Tỷ lệ lấp đầy
          </span>
          <span className="text-xs font-semibold text-gray-900 dark:text-white">
            {occupancyPercentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${occupancyPercentage}%` }}
          />
        </div>
      </div>
    </div>
  )
}
