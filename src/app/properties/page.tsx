'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { PropertyManagementCard } from '@/components/properties/property-management-card'
import { MobileProperties } from '@/components/properties/mobile-properties'
import { Plus, Home, Search, AlertCircle } from 'lucide-react'
import { getProperties } from '@/lib/database'
import type { Property, PropertyFilters } from '@/types/database'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { PropertyFormModal } from '@/components/forms/property-form-modal'

export default function PropertiesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConfigured, setIsConfigured] = useState(false)

  const loadProperties = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const filters: PropertyFilters = {}
      if (searchTerm) filters.search = searchTerm

      const data = await getProperties(filters)
      setProperties(data)
    } catch (err) {
      console.error('Error loading properties:', err)
      setError(
        err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi tải dữ liệu'
      )
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm])

  useEffect(() => {
    const configured = isSupabaseConfigured()
    setIsConfigured(configured)

    if (!configured) {
      setIsLoading(false)
      setError('Supabase chưa được cấu hình. Vui lòng kiểm tra file .env.local')
      return
    }

    loadProperties()
  }, [loadProperties])

  useEffect(() => {
    if (isConfigured) {
      const delayedSearch = setTimeout(() => {
        loadProperties()
      }, 300)

      return () => clearTimeout(delayedSearch)
    }
  }, [searchTerm, isConfigured, loadProperties])

  const handleViewProperty = (id: string) => {
    console.log('View property:', id)
    toast.info('Chức năng xem chi tiết nhà cho thuê đang được phát triển')
    // TODO: Navigate to property details page
  }

  const filteredProperties = properties.filter(
    property =>
      property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
            onClick={loadProperties}
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
      <MobileProperties
        properties={filteredProperties}
        isLoading={isLoading}
        onRefresh={loadProperties}
        onViewProperty={handleViewProperty}
      />

      {/* Desktop Version */}
      <div className="hidden md:block min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Quản lý nhà cho thuê
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Quản lý tất cả các tài sản cho thuê của bạn
                </p>
              </div>
            </div>
            <PropertyFormModal mode="create" onSuccess={loadProperties} />
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm nhà cho thuê..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse"
                >
                  <div className="h-6 bg-gray-300 rounded mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded mb-4"></div>
                  <div className="h-20 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Properties Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredProperties.map(property => (
                  <PropertyManagementCard
                    key={property.id}
                    id={property.id}
                    name={property.name}
                    address={property.address}
                    totalRooms={property.total_rooms}
                    occupiedRooms={property.occupied_rooms}
                    availableRooms={property.available_rooms}
                    occupancyPercentage={property.occupancy_percentage}
                    status={
                      property.status === 'active'
                        ? 'Hoạt động'
                        : 'Không hoạt động'
                    }
                    onView={handleViewProperty}
                    onSuccess={loadProperties}
                  />
                ))}
              </div>

              {/* Empty State */}
              {filteredProperties.length === 0 && (
                <div className="text-center py-12">
                  <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {searchTerm
                      ? 'Không tìm thấy nhà cho thuê'
                      : 'Chưa có nhà cho thuê'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {searchTerm
                      ? 'Không có nhà cho thuê nào phù hợp với từ khóa tìm kiếm.'
                      : 'Bắt đầu bằng cách thêm nhà cho thuê đầu tiên của bạn.'}
                  </p>
                  {!searchTerm && (
                    <PropertyFormModal
                      mode="create"
                      onSuccess={loadProperties}
                      trigger={
                        <Button className="bg-emerald-500 hover:bg-emerald-600">
                          <Plus className="w-4 h-4 mr-2" />
                          Thêm nhà cho thuê đầu tiên
                        </Button>
                      }
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
