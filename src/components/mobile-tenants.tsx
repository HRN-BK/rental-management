'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Users,
  Search,
  Filter,
  Plus,
  User,
  Phone,
  Home,
  DollarSign,
  MapPin,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  RefreshCw,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { TenantWithContract } from '@/types/database'
import { formatPrice } from '@/lib/utils'
import { useMobileGestures } from '@/hooks/use-mobile-gestures'

interface MobileTenantsProps {
  tenants: TenantWithContract[]
  searchTerm: string
  statusFilter: string
  isLoading: boolean
  onSearchChange: (value: string) => void
  onStatusFilterChange: (value: string) => void
  onViewTenant: (id: string) => void
  getStatusCount: (status: string) => number
  onRefresh?: () => void
}

export function MobileTenants({
  tenants,
  searchTerm,
  statusFilter,
  isLoading,
  onSearchChange,
  onStatusFilterChange,
  onViewTenant,
  getStatusCount,
  onRefresh,
}: MobileTenantsProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const { elementRef, isPulling, pullDistance, isRefreshing } =
    useMobileGestures({
      onPullToRefresh: onRefresh,
    })

  if (isLoading) {
    return <MobileTenantsSkeleton />
  }

  return (
    <div className="md:hidden flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Pull to Refresh Indicator */}
      {(isPulling || isRefreshing) && (
        <div
          className="absolute top-0 left-0 right-0 z-30 bg-blue-600 text-white text-center py-2 transition-transform duration-300"
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
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 pt-12">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Người thuê
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {tenants.length} người thuê
              </p>
            </div>
          </div>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Thêm
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex space-x-2">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm người thuê..."
              value={searchTerm}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
            />
          </div>

          {/* Filter Button */}
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="px-3 h-12 relative"
              >
                <Filter className="w-4 h-4" />
                {statusFilter !== 'all' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full"></div>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto">
              <div className="p-4">
                <SheetHeader className="mb-4">
                  <SheetTitle>Bộ lọc</SheetTitle>
                </SheetHeader>

                <div className="space-y-2">
                  {[
                    {
                      value: 'all',
                      label: `Tất cả (${getStatusCount('all')})`,
                    },
                    {
                      value: 'active',
                      label: `Đang thuê (${getStatusCount('active')})`,
                    },
                    {
                      value: 'expired',
                      label: `Hết hạn (${getStatusCount('expired')})`,
                    },
                    {
                      value: 'terminated',
                      label: `Đã kết thúc (${getStatusCount('terminated')})`,
                    },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onStatusFilterChange(option.value)
                        setIsFilterOpen(false)
                      }}
                      className={`w-full text-left p-4 rounded-lg transition-colors touch-manipulation min-h-[48px] flex items-center ${
                        statusFilter === option.value
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Tenants List */}
      <div ref={elementRef} className="flex-1 p-4 overflow-y-auto">
        {tenants.length > 0 ? (
          <div className="space-y-3">
            {tenants.map(tenant => (
              <MobileTenantCard
                key={tenant.id}
                tenant={tenant}
                onView={() => onViewTenant(tenant.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Users className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm || statusFilter !== 'all'
                ? 'Không tìm thấy'
                : 'Chưa có người thuê'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm || statusFilter !== 'all'
                ? 'Thay đổi bộ lọc để xem kết quả khác'
                : 'Thêm người thuê đầu tiên để bắt đầu'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Thêm người thuê đầu tiên
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 z-50">
        <div className="grid grid-cols-3 gap-3">
          {/* Add Tenant Button */}
          <Button 
            className="flex flex-col items-center gap-1 h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            onClick={() => console.log('Add tenant')}
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs font-medium">Thêm mới</span>
          </Button>
          
          {/* Refresh Button */}
          <Button 
            variant="outline"
            className="flex flex-col items-center gap-1 h-14 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={onRefresh}
          >
            <RefreshCw className="w-5 h-5" />
            <span className="text-xs font-medium">Làm mới</span>
          </Button>
          
          {/* Filter/Sort Button */}
          <Button 
            variant="outline"
            className="flex flex-col items-center gap-1 h-14 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={() => setIsFilterOpen(true)}
          >
            <Filter className="w-5 h-5" />
            <span className="text-xs font-medium">Bộ lọc</span>
            {statusFilter !== 'all' && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

function MobileTenantCard({
  tenant,
  onView,
}: {
  tenant: TenantWithContract
  onView: () => void
}) {
  const contractStatus = tenant.current_contract?.status || 'terminated'

  return (
    <Card className="group hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 relative overflow-hidden backdrop-blur-sm h-[220px] min-h-[220px] max-h-[220px]">
      <CardContent className="p-4 pb-0 h-full flex flex-col">
        <div className="flex items-start gap-3 flex-shrink-0">
          {/* Modern Avatar */}
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-white dark:ring-gray-800 shadow-md ${
              contractStatus === 'active'
                ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                : contractStatus === 'expired'
                  ? 'bg-gradient-to-br from-orange-500 to-red-600'
                  : 'bg-gradient-to-br from-gray-500 to-gray-600'
            }`}
          >
            <User className="w-6 h-6 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Name and Status */}
            <div className="mb-2">
              <h3 className="font-bold text-base text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {tenant.full_name}
              </h3>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    contractStatus === 'active'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : contractStatus === 'expired'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                  }`}
                >
                  {contractStatus === 'active'
                    ? '🟢 Đang thuê'
                    : contractStatus === 'expired'
                      ? '🔴 Hết hạn'
                      : '⚫ Đã kết thúc'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Fixed content area with strict spacing */}
        <div className="py-3 space-y-2 flex-shrink-0">
          {/* Rent Amount Highlight - Always show, fixed height */}
          <div className="h-8 flex items-center mb-2">
            {tenant.current_contract && tenant.current_contract.monthly_rent > 0 ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-lg border border-green-200 dark:border-green-800/30">
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="font-bold text-green-700 dark:text-green-400">
                  {formatPrice(tenant.current_contract.monthly_rent)}
                </span>
                <span className="text-xs text-green-600 dark:text-green-500">
                  VNĐ/tháng
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500">
                  Chưa có hợp đồng
                </span>
              </div>
            )}
          </div>

          {/* Info Grid - Absolutely fixed height and spacing */}
          <div className="space-y-2">
            {/* Room & Property - Fixed height row */}
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400 h-5">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-orange-500 shrink-0" />
                <span className="truncate font-medium">
                  Phòng {tenant.current_contract?.room?.room_number || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="truncate">
                  {tenant.current_contract?.room?.property?.name || 'N/A'}
                </span>
              </div>
            </div>

            {/* Phone - Always show, fixed height */}
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 h-5">
              <Phone className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="font-mono truncate">
                {tenant.phone || 'Chưa có số điện thoại'}
              </span>
            </div>
            
            {/* CCCD - Always show, fixed height */}
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 h-5">
              <svg className="w-4 h-4 text-purple-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-2 10a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
              <span className="font-mono truncate">
                {tenant.id_number || 'N/A'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Spacer to push buttons to bottom */}
        <div className="flex-1"></div>
        
        {/* Fixed Action Buttons */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 pb-3 flex-shrink-0">
          <div className="grid grid-cols-3 gap-2">
            {/* View Details Button */}
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center justify-center gap-1 h-8 text-xs hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
              onClick={(e) => {
                e.stopPropagation()
                onView()
              }}
            >
              <Eye className="w-3 h-3" />
              Chi tiết
            </Button>
            
            {/* Edit Button */}
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center justify-center gap-1 h-8 text-xs hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400"
              onClick={(e) => {
                e.stopPropagation()
                console.log('Edit tenant:', tenant.id)
              }}
            >
              <Edit3 className="w-3 h-3" />
              Sửa
            </Button>
            
            {/* Delete Button */}
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center justify-center gap-1 h-8 text-xs hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              onClick={(e) => {
                e.stopPropagation()
                console.log('Delete tenant:', tenant.id)
              }}
            >
              <Trash2 className="w-3 h-3" />
              Xóa
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MobileTenantsSkeleton() {
  return (
    <div className="md:hidden flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header Skeleton */}
      <div className="bg-white dark:bg-gray-900 border-b p-4 pt-12">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
              <div>
                <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="flex space-x-2">
            <div className="flex-1 h-12 bg-gray-200 rounded-lg"></div>
            <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>

      {/* List Skeleton */}
      <div className="flex-1 p-4 space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-36"></div>
                    <div className="h-4 bg-gray-200 rounded w-28"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
