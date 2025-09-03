import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  icon: ReactNode
  iconColor?: string
  className?: string
}

export function StatsCard({
  title,
  value,
  icon,
  iconColor = 'bg-blue-500',
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {title}
          </p>
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center text-white',
            iconColor
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}
