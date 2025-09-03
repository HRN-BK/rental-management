'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MobilePropertyManagementCard } from '@/components/properties/mobile-property-management-card'
import { Plus, Home, Search, AlertCircle } from 'lucide-react'
import { PropertyFormModal } from '@/components/forms/property-form-modal'
import type { Property } from '@/types/database'

interface MobilePropertiesProps {
  properties: Property[]
  isLoading: boolean
  onRefresh: () => void
  onViewProperty: (id: string) => void
}

export function MobileProperties({
  properties,
  isLoading,
  onRefresh,
  onViewProperty,
}: MobilePropertiesProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredProperties = properties.filter(
    property =>
      property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="md:hidden flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 pt-12">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Quản lý nhà cho thuê
            </h1>
          </div>
        </div>

        {/* Add Property Button */}
        <div className="mb-4">
          <PropertyFormModal
            mode="create"
            onSuccess={onRefresh}
            trigger={
              <Button className="w-full bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Thêm nhà cho thuê
              </Button>
            }
          />
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm nhà cho thuê..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white text-sm"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-lg p-3 animate-pulse"
              >
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="space-y-3">
            {filteredProperties.map(property => (
              <MobilePropertyManagementCard
                key={property.id}
                id={property.id}
                name={property.name}
                address={property.address}
                totalRooms={property.total_rooms}
                occupiedRooms={property.occupied_rooms}
                availableRooms={property.available_rooms}
                occupancyPercentage={property.occupancy_percentage}
                status={
                  property.status === 'active' ? 'Hoạt động' : 'Không hoạt động'
                }
                onView={onViewProperty}
                onSuccess={onRefresh}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Home className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'Không tìm thấy' : 'Chưa có nhà cho thuê'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm
                ? 'Thay đổi từ khóa tìm kiếm để xem kết quả khác'
                : 'Thêm nhà cho thuê đầu tiên để bắt đầu'}
            </p>
            {!searchTerm && (
              <PropertyFormModal
                mode="create"
                onSuccess={onRefresh}
                trigger={
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm nhà cho thuê đầu tiên
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
