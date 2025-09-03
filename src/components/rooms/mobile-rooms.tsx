'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MobilePropertySection } from '@/components/rooms/mobile-property-section'
import { Plus, DoorOpen, Search, Building2 } from 'lucide-react'
import { RoomFormModal } from '@/components/forms/room-form-modal'
import type { PropertyWithRooms } from '@/types/database'

interface MobileRoomsProps {
  properties: PropertyWithRooms[]
  isLoading: boolean
  onRefresh: () => void
}

export function MobileRooms({
  properties,
  isLoading,
  onRefresh,
}: MobileRoomsProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // Filter properties and rooms based on search term
  const filteredProperties = properties
    .map(property => {
      if (!searchTerm.trim()) {
        return property
      }

      const filteredRooms = (property.rooms || []).filter(
        room =>
          room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.address.toLowerCase().includes(searchTerm.toLowerCase())
      )
      return {
        ...property,
        rooms: filteredRooms,
      }
    })
    .filter(property => {
      if (!searchTerm.trim()) {
        return true
      }

      const hasMatchingRooms = (property.rooms || []).length > 0
      const propertyMatches =
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase())
      return hasMatchingRooms || propertyMatches
    })

  return (
    <div className="md:hidden flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 pt-12">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
            <DoorOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Quản lý phòng
            </h1>
          </div>
        </div>

        {/* Add Room Button */}
        <div className="mb-4">
          <RoomFormModal
            mode="create"
            onSuccess={onRefresh}
            trigger={
              <Button className="w-full bg-cyan-500 hover:bg-cyan-600">
                <Plus className="w-4 h-4 mr-2" />
                Thêm phòng
              </Button>
            }
          />
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm phòng, nhà cho thuê..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:bg-gray-700 dark:text-white text-sm"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-lg p-3 animate-pulse"
              >
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                <div className="space-y-2">
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="space-y-3">
            {filteredProperties.map(property => (
              <MobilePropertySection
                key={property.id}
                propertyId={property.id}
                propertyName={property.name}
                address={property.address}
                totalRooms={property.total_rooms}
                rooms={property.rooms || []}
                onSuccess={onRefresh}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Building2 className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'Không tìm thấy' : 'Chưa có phòng'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm
                ? 'Thay đổi từ khóa tìm kiếm để xem kết quả khác'
                : 'Chưa có nhà cho thuê và phòng nào trong hệ thống'}
            </p>
            {!searchTerm && (
              <RoomFormModal
                mode="create"
                onSuccess={onRefresh}
                trigger={
                  <Button className="bg-cyan-500 hover:bg-cyan-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm phòng đầu tiên
                  </Button>
                }
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
