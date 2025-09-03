'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { PropertyCard } from '@/components/dashboard/property-card'
import { MobileDashboard } from '@/components/mobile-dashboard'
import {
  Home,
  Building2,
  Key,
  Plus,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Activity,
  Eye,
} from 'lucide-react'
import { getDashboardStats, getProperties } from '@/lib/database'
import type { DashboardStats, Property } from '@/types/database'
import { isSupabaseConfigured } from '@/lib/supabase/client'

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConfigured, setIsConfigured] = useState(false)

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [statsData, propertiesData] = await Promise.all([
        getDashboardStats(),
        getProperties(),
      ])

      setStats(statsData)
      setProperties(propertiesData)
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError(
        err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi tải dữ liệu'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    await loadData()
  }

  useEffect(() => {
    const configured = isSupabaseConfigured()
    setIsConfigured(configured)

    if (!configured) {
      setIsLoading(false)
      setError('Supabase chưa được cấu hình. Vui lòng kiểm tra file .env.local')
      return
    }

    loadData()
  }, [])

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
            onClick={() => window.location.reload()}
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
      <MobileDashboard
        stats={stats}
        properties={properties}
        isLoading={isLoading}
        onRefresh={handleRefresh}
      />

      {/* Desktop Version */}
      <div className="hidden md:block min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="mobile-optimized max-w-7xl mx-auto mobile-scale-container">
          <div className="mobile-scale">
            {/* Header */}
            <div className="sm:mb-8 mb-4 appear">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-4 gap-2">
                <div>
                  <div className="flex items-center sm:space-x-3 space-x-2 sm:mb-2 mb-1">
                    <div className="sm:w-12 sm:h-12 w-10 h-10 gradient-primary mobile-no-radius sm:rounded-2xl flex items-center justify-center shadow-lg float">
                      <Home className="sm:w-6 sm:h-6 w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h1 className="mobile-header bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        Tổng quan
                      </h1>
                      <p className="sm:text-sm text-xs text-muted-foreground">
                        Quản lý tài sản cho thuê
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center sm:space-x-3 space-x-2">
                  <Button
                    variant="outline"
                    className="mobile-button hover:scale-105 transition-transform"
                  >
                    <Eye className="sm:w-4 sm:h-4 w-3 h-3 sm:mr-2 mr-1" />
                    <span className="hidden sm:inline">Báo cáo</span>
                    <span className="sm:hidden">BC</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 mobile-grid sm:mb-8 mb-4">
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="card-premium mobile-card mobile-padding"
                  >
                    <div className="shimmer h-4 rounded mb-3"></div>
                    <div className="shimmer h-8 rounded mb-2"></div>
                    <div className="shimmer h-3 rounded w-20"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 mobile-grid sm:mb-8 mb-4">
                {/* Enhanced Stats Cards */}
                <div
                  className="card-premium card-hover mobile-card mobile-padding appear"
                  style={{ animationDelay: '0.1s' }}
                >
                  <div className="flex items-center justify-between sm:mb-4 mb-2">
                    <div className="sm:w-12 sm:h-12 w-8 h-8 gradient-primary mobile-no-radius sm:rounded-2xl flex items-center justify-center shadow-lg">
                      <Building2 className="sm:w-6 sm:h-6 w-4 h-4 text-white" />
                    </div>
                    <span className="sm:text-xs text-[10px] font-medium text-green-600 bg-green-100 dark:bg-green-900/30 sm:px-2 px-1 sm:py-1 py-0.5 rounded-full flex items-center">
                      <TrendingUp className="sm:w-3 sm:h-3 w-2 h-2 sm:mr-1 mr-0.5" />
                      +12%
                    </span>
                  </div>
                  <h3 className="sm:text-2xl text-lg font-bold text-gray-900 dark:text-white sm:mb-1 mb-0.5">
                    {stats?.total_properties || '0'}
                  </h3>
                  <p className="mobile-text text-gray-600 dark:text-gray-400">
                    Nhà cho thuê
                  </p>
                </div>

                <div
                  className="card-premium card-hover mobile-card mobile-padding appear"
                  style={{ animationDelay: '0.2s' }}
                >
                  <div className="flex items-center justify-between sm:mb-4 mb-2">
                    <div className="sm:w-12 sm:h-12 w-8 h-8 gradient-success mobile-no-radius sm:rounded-2xl flex items-center justify-center shadow-lg">
                      <Home className="sm:w-6 sm:h-6 w-4 h-4 text-white" />
                    </div>
                    <span className="sm:text-xs text-[10px] font-medium text-blue-600 bg-blue-100 dark:bg-blue-900/30 sm:px-2 px-1 sm:py-1 py-0.5 rounded-full flex items-center">
                      <Activity className="sm:w-3 sm:h-3 w-2 h-2 sm:mr-1 mr-0.5" />
                      {Math.round(stats?.occupancy_rate || 0)}%
                    </span>
                  </div>
                  <h3 className="sm:text-2xl text-lg font-bold text-gray-900 dark:text-white sm:mb-1 mb-0.5">
                    {stats?.total_rooms || '0'}
                  </h3>
                  <p className="mobile-text text-gray-600 dark:text-gray-400">
                    Tổng phòng
                  </p>
                </div>

                <div
                  className="card-premium card-hover mobile-card mobile-padding appear"
                  style={{ animationDelay: '0.3s' }}
                >
                  <div className="flex items-center justify-between sm:mb-4 mb-2">
                    <div className="sm:w-12 sm:h-12 w-8 h-8 gradient-warning mobile-no-radius sm:rounded-2xl flex items-center justify-center shadow-lg">
                      <Key className="sm:w-6 sm:h-6 w-4 h-4 text-white" />
                    </div>
                    <span className="sm:text-xs text-[10px] font-medium text-orange-600 bg-orange-100 dark:bg-orange-900/30 sm:px-2 px-1 sm:py-1 py-0.5 rounded-full">
                      <span className="hidden sm:inline">Sẵn sàng</span>
                      <span className="sm:hidden">SS</span>
                    </span>
                  </div>
                  <h3 className="sm:text-2xl text-lg font-bold text-gray-900 dark:text-white sm:mb-1 mb-0.5">
                    {stats?.available_rooms || '0'}
                  </h3>
                  <p className="mobile-text text-gray-600 dark:text-gray-400">
                    Phòng trống
                  </p>
                </div>

                <div
                  className="card-premium card-hover mobile-card mobile-padding appear"
                  style={{ animationDelay: '0.4s' }}
                >
                  <div className="flex items-center justify-between sm:mb-4 mb-2">
                    <div className="sm:w-12 sm:h-12 w-8 h-8 gradient-secondary mobile-no-radius sm:rounded-2xl flex items-center justify-center shadow-lg">
                      <DollarSign className="sm:w-6 sm:h-6 w-4 h-4 text-white" />
                    </div>
                    <span className="sm:text-xs text-[10px] font-medium text-green-600 bg-green-100 dark:bg-green-900/30 sm:px-2 px-1 sm:py-1 py-0.5 rounded-full flex items-center">
                      <TrendingUp className="sm:w-3 sm:h-3 w-2 h-2 sm:mr-1 mr-0.5" />
                      +8%
                    </span>
                  </div>
                  <h3 className="sm:text-2xl text-lg font-bold text-gray-900 dark:text-white sm:mb-1 mb-0.5">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                      maximumFractionDigits: 0,
                      notation: 'compact',
                    }).format(stats?.monthly_revenue || 0)}
                  </h3>
                  <p className="mobile-text text-gray-600 dark:text-gray-400">
                    Doanh thu/tháng
                  </p>
                </div>
              </div>
            )}

            {/* Properties Overview */}
            <div
              className="sm:mb-6 mb-4 appear"
              style={{ animationDelay: '0.5s' }}
            >
              <div className="flex items-center justify-between sm:mb-6 mb-4">
                <div className="flex items-center sm:space-x-3 space-x-2">
                  <div className="sm:w-8 sm:h-8 w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 mobile-no-radius sm:rounded-xl flex items-center justify-center">
                    <Building2 className="sm:w-4 sm:h-4 w-3 h-3 text-white" />
                  </div>
                  <div>
                    <h2 className="mobile-subheader font-semibold text-gray-900 dark:text-white">
                      Nhà cho thuê
                    </h2>
                    <p className="mobile-text text-muted-foreground">
                      Tổng quan tài sản
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="mobile-button hover:scale-105 transition-transform"
                >
                  <span className="hidden sm:inline">Xem tất cả</span>
                  <span className="sm:hidden">Xem</span>
                </Button>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[1, 2].map(i => (
                    <div key={i} className="card-premium p-6">
                      <div className="shimmer h-6 rounded mb-4"></div>
                      <div className="shimmer h-4 rounded mb-2"></div>
                      <div className="shimmer h-4 rounded mb-4 w-3/4"></div>
                      <div className="shimmer h-20 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : properties.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {properties.map((property, index) => (
                    <div
                      key={property.id}
                      className="appear"
                      style={{ animationDelay: `${0.6 + index * 0.1}s` }}
                    >
                      <PropertyCard
                        name={property.name}
                        address={property.address}
                        totalRooms={property.total_rooms}
                        occupiedRooms={property.occupied_rooms}
                        availableRooms={property.available_rooms}
                        occupancyPercentage={property.occupancy_percentage}
                        status={
                          property.occupancy_percentage >= 80
                            ? 'Tuyệt vời'
                            : property.occupancy_percentage >= 50
                              ? 'Tốt'
                              : 'Cần cải thiện'
                        }
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card-premium p-8 text-center">
                  <div className="w-16 h-16 gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-4 float">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Chưa có nhà cho thuê
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Bắt đầu xây dựng danh mục tài sản của bạn ngay hôm nay.
                  </p>
                  <Button className="btn-gradient text-white border-0 hover:scale-105">
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm nhà cho thuê đầu tiên
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
