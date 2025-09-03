'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronDown,
  ChevronRight,
  Home,
  MapPin,
  DollarSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RoomCard } from '@/components/rooms/room-card'
import { toast } from 'sonner'
import type { Room, RentalContract, Tenant } from '@/types/database'

interface RoomWithContract extends Room {
  rental_contracts?: (RentalContract & {
    tenant?: Tenant
  })[]
}

interface PropertySectionProps {
  propertyId: string
  propertyName: string
  address: string
  totalRooms: number
  rooms: RoomWithContract[]
  onSuccess?: () => void // Callback to refresh the rooms list
}

export function PropertySection({
  propertyId,
  propertyName,
  address,
  totalRooms,
  rooms,
  onSuccess,
}: PropertySectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const handleViewRoom = (roomId: string) => {
    console.log('View room:', roomId)
    toast.info('Chức năng xem chi tiết phòng đang được phát triển')
    // TODO: Navigate to room details page
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border mb-6">
      {/* Property Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center justify-center w-6 h-6 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {propertyName}
                </h2>
                <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                  <MapPin className="w-3 h-3" />
                  <span>{address}</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {totalRooms} phòng
                </div>
              </div>
            </div>
          </div>

          <Link href={`/properties/${propertyId}/utilities`}>
            <Button className="bg-emerald-500 hover:bg-emerald-600">
              <DollarSign className="w-4 h-4 mr-2" />
              Chi phí nhà
            </Button>
          </Link>
        </div>
      </div>

      {/* Rooms List */}
      {isExpanded && (
        <div className="divide-y">
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
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
