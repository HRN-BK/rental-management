'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MobilePropertyCard } from '@/components/dashboard/mobile-property-card'
import {
  Building2,
  Home,
  Key,
  TrendingUp,
  Activity,
  Plus,
  Eye,
  Users,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import { getDashboardStats, getProperties } from '@/lib/database'
import type { DashboardStats, Property } from '@/types/database'
import { useMobileGestures } from '@/hooks/use-mobile-gestures'

interface MobileDashboardProps {
  stats: DashboardStats | null
  properties: Property[]
  isLoading: boolean
  onRefresh?: () => void
}

export function MobileDashboard({
  stats,
  properties,
  isLoading,
  onRefresh,
}: MobileDashboardProps) {
  const router = useRouter()
  // Temporarily disable mobile gestures to fix scroll issue
  const elementRef = { current: null }
  const isPulling = false
  const pullDistance = 0
  const isRefreshing = false
  
  // const { elementRef, isPulling, pullDistance, isRefreshing } =
  //   useMobileGestures({
  //     onPullToRefresh: onRefresh,
  //   })

  if (isLoading) {
    return <MobileDashboardSkeleton />
  }

  return (
    <div
      ref={elementRef}
      className="md:hidden flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 overflow-y-auto"
    >
      {/* Pull to Refresh Indicator */}
      {(isPulling || isRefreshing) && (
        <div
          className="absolute top-0 left-0 right-0 z-10 bg-blue-600 text-white text-center py-2 transition-transform duration-300"
          style={{
            transform: `translateY(${isPulling ? pullDistance - 40 : isRefreshing ? 0 : -40}px)`,
          }}
        >
          <RefreshCw
            className={`w-4 h-4 inline mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          {isRefreshing ? 'Đang làm mới...' : 'Kéo để làm mới'}
        </div>
      )}
      {/* Mobile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 pt-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">RentalPro</h1>
            <p className="text-blue-100">Quản lý cho thuê</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <Eye className="w-4 h-4 mr-2" />
              Báo cáo
            </Button>
          </div>
        </div>

        {/* Quick Stats - Only Properties */}
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Nhà cho thuê</p>
              <p className="text-2xl font-bold">
                {stats?.total_properties || '0'}
              </p>
            </div>
            <Building2 className="w-8 h-8 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 space-y-4">
        {/* Detailed Stats */}
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-600" />
              Thống kê chi tiết
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Building2 className="w-5 h-5 mx-auto mb-2 text-blue-600" />
                <p className="text-xl font-bold text-blue-600">
                  {stats?.total_properties || '0'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Nhà cho thuê
                </p>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Users className="w-5 h-5 mx-auto mb-2 text-green-600" />
                <p className="text-xl font-bold text-green-600">
                  {stats?.total_tenants || '0'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Người thuê
                </p>
              </div>
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Home className="w-5 h-5 mx-auto mb-2 text-purple-600" />
                <p className="text-xl font-bold text-purple-600">
                  {(stats?.total_rooms || 0) - (stats?.available_rooms || 0)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Phòng thuê
                </p>
              </div>
              <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <Key className="w-5 h-5 mx-auto mb-2 text-orange-600" />
                <p className="text-xl font-bold text-orange-600">
                  {stats?.available_rooms || '0'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Phòng trống
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Tỷ lệ lấp đầy
                </span>
                <span className="text-lg font-bold text-blue-600">
                  {Math.round(stats?.occupancy_rate || 0)}%
                </span>
              </div>
              <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats?.occupancy_rate || 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold mb-4 flex items-center">
              <Plus className="w-5 h-5 mr-2 text-blue-600" />
              Thao tác nhanh
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Button
                className="h-16 flex flex-col gap-2 bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push('/properties')}
              >
                <Building2 className="w-6 h-6" />
                <span className="text-sm">Thêm nhà</span>
              </Button>
              <Button
                className="h-16 flex flex-col gap-2 bg-green-600 hover:bg-green-700"
                onClick={() => router.push('/tenants')}
              >
                <Users className="w-6 h-6" />
                <span className="text-sm">Thêm người thuê</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Properties */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                Nhà cho thuê
              </h2>
              <Button variant="ghost" size="sm">
                Xem tất cả
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {properties.length > 0 ? (
              <div className="space-y-3">
                {properties.slice(0, 3).map(property => (
                  <MobilePropertyCard
                    key={property.id}
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
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Chưa có nhà cho thuê</p>
                <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm nhà đầu tiên
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MobileDashboardSkeleton() {
  return (
    <div className="md:hidden flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 pt-12">
        <div className="animate-pulse">
          <div className="h-8 bg-white/20 rounded w-32 mb-2"></div>
          <div className="h-4 bg-white/20 rounded w-24 mb-6"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="h-4 bg-white/30 rounded w-20 mb-2"></div>
              <div className="h-8 bg-white/30 rounded w-12"></div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="h-4 bg-white/30 rounded w-20 mb-2"></div>
              <div className="h-8 bg-white/30 rounded w-16"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="flex-1 p-4 space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
