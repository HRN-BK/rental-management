'use client'

import { useState, useEffect } from 'react'
import { PropertySection } from '@/components/rooms/property-section'
import { MobileRooms } from '@/components/rooms/mobile-rooms'
import { AlertCircle, Building2, DoorOpen, Search } from 'lucide-react'
import { getRoomsGroupedByProperty } from '@/lib/database'
import type { PropertyWithRooms } from '@/types/database'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { RoomFormModal } from '@/components/forms/room-form-modal'

export default function RoomsPage() {
  const [properties, setProperties] = useState<PropertyWithRooms[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConfigured, setIsConfigured] = useState(false)

  useEffect(() => {
    const configured = isSupabaseConfigured()
    setIsConfigured(configured)

    if (!configured) {
      setIsLoading(false)
      setError('Supabase chưa được cấu hình. Vui lòng kiểm tra file .env.local')
      return
    }

    loadRoomsData()
  }, [])

  const loadRoomsData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const data = await getRoomsGroupedByProperty()
      setProperties(data)
    } catch (err) {
      console.error('Error loading rooms data:', err)
      setError(
        err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi tải dữ liệu'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Filter properties and rooms based on search term
  const filteredProperties = properties
    .map(property => {
      // If no search term, show all rooms
      if (!searchTerm.trim()) {
        return property
      }

      // Filter rooms based on search term
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
      // If no search term, show all properties
      if (!searchTerm.trim()) {
        return true
      }

      // Only show properties that have matching rooms or if the property itself matches
      const hasMatchingRooms = (property.rooms || []).length > 0
      const propertyMatches =
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase())
      return hasMatchingRooms || propertyMatches
    })

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-6">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Cấu hình Supabase
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Vui lòng cấu hình Supabase trước khi sử dụng ứng dụng.
          </p>
          <p className="text-sm text-gray-500">
            Kiểm tra file .env.local và đảm bảo có các biến môi trường cần
            thiết.
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Lỗi tải dữ liệu
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button
            onClick={loadRoomsData}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Thử lại
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Mobile Version */}
      <MobileRooms
        properties={filteredProperties}
        isLoading={isLoading}
        onRefresh={loadRoomsData}
      />

      {/* Desktop Version */}
      <div className="hidden md:block min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
                <DoorOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Quản lý phòng
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Quản lý tất cả các phòng trong các nhà cho thuê
                </p>
              </div>
            </div>
            <RoomFormModal mode="create" onSuccess={loadRoomsData} />
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm phòng, nhà cho thuê..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2].map(i => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse"
                >
                  <div className="h-6 bg-gray-300 rounded mb-4 w-1/3"></div>
                  <div className="h-4 bg-gray-300 rounded mb-6 w-2/3"></div>
                  <div className="space-y-3">
                    {[1, 2, 3].map(j => (
                      <div key={j} className="h-16 bg-gray-300 rounded"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProperties.length > 0 ? (
            <div className="space-y-6">
              {filteredProperties.map(property => (
                <PropertySection
                  key={property.id}
                  propertyId={property.id}
                  propertyName={property.name}
                  address={property.address}
                  totalRooms={property.total_rooms}
                  rooms={property.rooms || []}
                  onSuccess={loadRoomsData}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm ? 'Không tìm thấy phòng' : 'Chưa có phòng'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm
                  ? 'Không có phòng nào phù hợp với từ khóa tìm kiếm.'
                  : 'Chưa có nhà cho thuê và phòng nào được thêm vào hệ thống.'}
              </p>
              {!searchTerm && (
                <p className="text-sm text-gray-500">
                  Bắt đầu bằng cách thêm nhà cho thuê và phòng đầu tiên.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
