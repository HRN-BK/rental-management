'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Home, MapPin, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RoomCard } from '@/components/rooms/room-card'
import { toast } from 'sonner'
import type { Room, RentalContract, Tenant } from '@/types/database'

interface RoomWithContract extends Room {
  rental_contracts?: (RentalContract & {
    tenant?: Tenant
  })[]
}

interface MobilePropertySectionProps {
  propertyId: string
  propertyName: string
  address: string
  totalRooms: number
  rooms: RoomWithContract[]
  onSuccess?: () => void
}

export function MobilePropertySection({
  propertyId,
  propertyName,
  address,
  totalRooms,
  rooms,
  onSuccess,
}: MobilePropertySectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const handleViewRoom = (roomId: string) => {
    console.log('View room:', roomId)
    toast.info('Chức năng xem chi tiết phòng đang được phát triển')
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm mb-3">
      {/* Property Header - Mobile Optimized */}
      <div
        className="p-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Logo */}
            <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Home className="w-5 h-5 text-white" />
            </div>

            {/* Cost Button next to Logo */}
            <Link
              href={`/properties/${propertyId}/utilities`}
              onClick={e => e.stopPropagation()}
            >
              <Button
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-600 text-xs px-2 py-1 h-7"
              >
                <DollarSign className="w-3 h-3 mr-1" />
                Chi phí
              </Button>
            </Link>
          </div>
        </div>

        {/* Property Info below */}
        <div className="mt-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white leading-tight">
            {propertyName}
          </h2>
          <div className="flex items-start gap-1 mt-1">
            <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-gray-600 dark:text-gray-400 leading-tight">
              {address}
            </span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {totalRooms} phòng
          </div>
        </div>
      </div>

      {/* Rooms List */}
      {isExpanded && (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {rooms.map(room => {
            const currentContract = room.rental_contracts?.find(
              contract => contract.status === 'active'
            )
            return (
              <RoomCard
                key={room.id}
                id={room.id}
                roomNumber={room.room_number}
                rentAmount={room.rent_amount}
                status={room.status}
                currentContract={currentContract}
                propertyId={propertyId}
                propertyName={propertyName}
                onSuccess={onSuccess}
                onView={handleViewRoom}
                isMobile={true}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
