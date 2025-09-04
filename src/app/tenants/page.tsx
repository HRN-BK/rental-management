'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { TenantCard } from '@/components/tenants/tenant-card'
import { MobileTenants } from '@/components/mobile-tenants'
import { Users, Search, Filter, AlertCircle, Plus } from 'lucide-react'
import { getTenants } from '@/lib/database'
import type { TenantWithContract, TenantFilters } from '@/types/database'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { TenantFormModal } from '@/components/forms/tenant-form-modal'
import { LoadingCards, EmptyState } from '@/components/common/list-state'

export default function TenantsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [tenants, setTenants] = useState<TenantWithContract[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConfigured, setIsConfigured] = useState(false)

  const loadTenants = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const filters: TenantFilters = {}
      if (searchTerm) filters.search = searchTerm
      if (statusFilter !== 'all')
        filters.contract_status = statusFilter as
          | 'active'
          | 'expired'
          | 'terminated'

      const data = await getTenants(filters)
      setTenants(data)
    } catch (err) {
      console.error('Error loading tenants:', err)
      setError(
        err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi tải dữ liệu'
      )
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm, statusFilter])

  useEffect(() => {
    const configured = isSupabaseConfigured()
    setIsConfigured(configured)

    if (!configured) {
      setIsLoading(false)
      setError('Supabase chưa được cấu hình. Vui lòng kiểm tra file .env.local')
      return
    }

    loadTenants()
  }, [loadTenants])

  useEffect(() => {
    if (isConfigured) {
      const delayedSearch = setTimeout(() => {
        loadTenants()
      }, 300)

      return () => clearTimeout(delayedSearch)
    }
  }, [searchTerm, statusFilter, isConfigured])

  const handleViewTenant = useCallback((id: string) => {
    router.push(`/tenants/${id}`)
  }, [router])

  const getStatusCount = useCallback((status: string) => {
    if (status === "all") return tenants.length
    return tenants.filter(t => t.current_contract?.status === status).length
  }, [tenants])

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-6">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Cấu hình Supabase
          </h2>
          <p className="text-muted-foreground mb-4">
            Vui lòng cấu hình Supabase trước khi sử dụng ứng dụng.
          </p>
          <p className="text-sm text-muted-foreground">
            Kiểm tra file .env.local và đảm bảo có các biến môi trường cần
            thiết.
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-6">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Lỗi tải dữ liệu
          </h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadTenants}>
            Thử lại
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Mobile Version */}
      <MobileTenants
        tenants={tenants}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        isLoading={isLoading}
        onSearchChange={setSearchTerm}
        onStatusFilterChange={setStatusFilter}
        onViewTenant={handleViewTenant}
        getStatusCount={getStatusCount}
        onRefresh={loadTenants}
        onTenantSuccess={loadTenants}
      />

      {/* Desktop Version */}
      <div className="hidden md:block min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Clean Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Người thuê
                </h1>
                <p className="text-muted-foreground text-sm">
                  {tenants.length} người thuê
                </p>
              </div>
            </div>
            <div data-tenant-form-modal>
              <TenantFormModal mode="create" onSuccess={loadTenants} />
            </div>
          </div>

          {/* Clean Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, số điện thoại..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-input text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                disabled={isLoading}
              />
            </div>

            {/* Status Filter */}
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'Tất cả' },
                { value: 'active', label: 'Đang thuê' },
                { value: 'expired', label: 'Hết hạn' },
                { value: 'terminated', label: 'Đã kết thúc' },
              ].map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    statusFilter === filter.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                  disabled={isLoading}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Content */}
          {isLoading ? (
            <LoadingCards itemCount={8} />
          ) : tenants.length === 0 ? (
            <EmptyState
              title={
                searchTerm || statusFilter !== 'all'
                  ? 'Không tìm thấy người thuê'
                  : 'Chưa có người thuê nào'
              }
              description={
                searchTerm || statusFilter !== 'all'
                  ? 'Không có người thuê nào phù hợp với bộ lọc hiện tại. Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.'
                  : 'Bắt đầu quản lý người thuê bằng cách thêm người thuê đầu tiên vào hệ thống.'
              }
              icon={
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-primary" />
                </div>
              }
              action={
                !searchTerm && statusFilter === 'all'
                  ? {
                      label: 'Thêm người thuê đầu tiên',
                      onClick: () => {
                        // This will be handled by the modal trigger
                        const addButton = document.querySelector(
                          '[data-tenant-form-modal]'
                        ) as HTMLElement
                        addButton?.click()
                      },
                    }
                  : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {tenants.map(tenant => (
                <TenantCard
                  key={tenant.id}
                  id={tenant.id}
                  name={tenant.full_name}
                  phone={tenant.phone}
                  email={tenant.email}
                  idNumber={tenant.id_number}
                  roomNumber={
                    tenant.current_contract?.room?.room_number || 'N/A'
                  }
                  propertyName={
                    tenant.current_contract?.room?.property?.name || 'N/A'
                  }
                  monthlyRent={tenant.current_contract?.monthly_rent || 0}
                  contractStatus={
                    tenant.current_contract?.status || 'terminated'
                  }
                  avatar={tenant.avatar_url}
                  currentContract={tenant.current_contract}
                  onView={handleViewTenant}
                  onSuccess={loadTenants}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
