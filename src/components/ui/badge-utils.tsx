import React from 'react'

// Contract status badge utility
export function getContractStatusBadge(status: string): React.ReactNode {
  switch (status) {
    case 'active':
      return (
        <span className="px-3 py-1.5 bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-800/20 text-green-700 dark:text-green-400 text-xs font-medium rounded-full flex items-center gap-1 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          Đang thuê
        </span>
      )
    case 'expired':
      return (
        <span className="px-3 py-1.5 bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900/40 dark:to-red-800/20 text-red-700 dark:text-red-400 text-xs font-medium rounded-full flex items-center gap-1 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
          Hết hạn
        </span>
      )
    case 'terminated':
      return (
        <span className="px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800/40 dark:to-gray-700/20 text-gray-700 dark:text-gray-400 text-xs font-medium rounded-full flex items-center gap-1 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
          Đã kết thúc
        </span>
      )
    default:
      return null
  }
}

// Room status badge utility
export function getRoomStatusBadge(
  status?: 'available' | 'occupied' | 'maintenance'
): React.ReactNode {
  switch (status) {
    case 'available':
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1"></span>
          Trống
        </span>
      )
    case 'occupied':
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1"></span>
          Đã thuê
        </span>
      )
    case 'maintenance':
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1"></span>
          Bảo trì
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-500 mr-1"></span>
          Không xác định
        </span>
      )
  }
}
