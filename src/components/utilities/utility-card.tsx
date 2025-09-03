'use client'

import { Button } from '@/components/ui/button'
import {
  Zap,
  Droplets,
  Wifi,
  Tv,
  Trash2,
  Fuel,
  FileText,
  Edit3,
  Phone,
} from 'lucide-react'
import type { Utility, UtilityBill } from '@/types/database'

interface UtilityCardProps {
  utility: Utility & {
    bills?: UtilityBill[]
  }
  onEdit?: (utility: Utility) => void
  onAddBill?: (utility: Utility) => void
}

const getUtilityIcon = (utility: Utility) => {
  // Use specific icon based on name if it's TV type, otherwise use type
  if (utility.type === 'tv') {
    if (
      utility.name.toLowerCase().includes('điện thoại') ||
      utility.name.toLowerCase().includes('phone')
    ) {
      return <Phone className="w-5 h-5 text-blue-600" />
    } else {
      return <Tv className="w-5 h-5 text-red-600" />
    }
  }

  switch (utility.type) {
    case 'electricity':
      return <Zap className="w-5 h-5 text-yellow-500" />
    case 'water':
      return <Droplets className="w-5 h-5 text-blue-500" />
    case 'internet':
      return <Wifi className="w-5 h-5 text-purple-500" />
    case 'trash':
      return <Trash2 className="w-5 h-5 text-green-500" />
    case 'gas':
      return <Fuel className="w-5 h-5 text-orange-500" />
    default:
      return <FileText className="w-5 h-5 text-gray-500" />
  }
}

const getUtilityDisplayName = (utility: Utility) => {
  // Use the actual name from the utility object
  return utility.name
}

export function UtilityCard({ utility, onEdit, onAddBill }: UtilityCardProps) {
  const nextDueDate = utility.monthly_due_date
    ? `${utility.monthly_due_date.toString().padStart(2, '0')} hàng tháng`
    : '-'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200">
      {/* Header with icon and title */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {getUtilityIcon(utility)}
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {getUtilityDisplayName(utility)}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit?.(utility)}
          className="text-gray-400 hover:text-gray-600"
        >
          <Edit3 className="w-4 h-4" />
          Sửa
        </Button>
      </div>

      {/* Content */}
      <div className="space-y-3 mb-4">
        {/* Provider */}
        <div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Đơn vị cung cấp:
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
            {utility.provider}
          </span>
        </div>

        {/* Customer Code */}
        {utility.customer_code && (
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Mã Khách Hàng:
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400 ml-1 font-mono">
              {utility.customer_code}
            </span>
          </div>
        )}

        {/* Due Date */}
        <div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Ngày đóng tiền hàng tháng:
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
            {nextDueDate}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div>
        <Button
          onClick={() => onAddBill?.(utility)}
          className="w-full bg-teal-500 hover:bg-teal-600 text-white"
          size="sm"
        >
          Thêm Hóa Đơn
        </Button>
      </div>
    </div>
  )
}
