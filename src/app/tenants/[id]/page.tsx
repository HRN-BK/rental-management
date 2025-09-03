'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Home,
  Calendar,
  DollarSign,
  FileText,
  Edit3,
  Trash2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { getTenantById } from '@/lib/database'
import type { TenantWithContract } from '@/types/database'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { formatPrice, formatDate } from '@/lib/utils'
import { TenantFormModal } from '@/components/forms/tenant-form-modal'

export default function TenantDetailPage() {
  const params = useParams()
  const [tenant, setTenant] = useState<TenantWithContract | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTenantData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await getTenantById(params.id as string)
      if (data) {
        setTenant(data)
      } else {
        setError('Không tìm thấy thông tin người thuê')
      }
    } catch (err) {
      console.error('Error loading tenant:', err)
      setError(
        err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi tải dữ liệu'
      )
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    const configured = isSupabaseConfigured()

    if (!configured) {
      setLoading(false)
      setError('Supabase chưa được cấu hình. Vui lòng kiểm tra file .env.local')
      return
    }

    loadTenantData()
  }, [loadTenantData])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Đang tải thông tin...
          </p>
        </div>
      </div>
    )
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Không tìm thấy người thuê
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error || 'Người thuê không tồn tại hoặc đã bị xóa.'}
          </p>
          <Link href="/tenants">
            <Button>Quay lại danh sách</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Create safe accessors for nested data
  const room = tenant.current_contract?.room
  const property = room?.property
  const contract = tenant.current_contract

  const getContractStatus = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
            <CheckCircle className="w-3 h-3 mr-1" />
            Đang hiệu lực
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/tenants">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  {tenant.full_name}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  Phòng {tenant.current_contract?.room?.room_number || 'N/A'} - {tenant.current_contract?.room?.property?.name || 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex space-x-1">
              <TenantFormModal
                mode="edit"
                tenant={tenant}
                onSuccess={loadTenantData}
                trigger={
                  <Button variant="outline" size="sm">
                    <Edit3 className="w-4 h-4" />
                  </Button>
                }
              />
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/tenants">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Quay lại
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tenant.full_name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Phòng {tenant.current_contract?.room?.room_number || 'N/A'} -{' '}
                  {tenant.current_contract?.room?.property?.name || 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <TenantFormModal
                mode="edit"
                tenant={tenant}
                onSuccess={loadTenantData}
                trigger={
                  <Button variant="outline" size="sm">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Chỉnh sửa
                  </Button>
                }
              />
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden pb-20">
        {/* Room Info Card */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4">
          <div className="flex items-center space-x-3">
            <Home className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-lg font-bold text-white">
                Thông tin phòng
              </h2>
              <p className="text-orange-100 text-sm">
                Phòng {tenant.current_contract?.room?.room_number || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800">
          {/* Room Image */}
          <div className="p-4">
            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 overflow-hidden">
              <img 
                src="/images/rooms/hinh_phong.png" 
                alt="Hình ảnh phòng"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback nếu không load được ảnh
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              {/* Fallback content */}
              <div className="hidden w-full h-full flex items-center justify-center text-gray-500 text-center">
                <div>
                  <Home className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Hình ảnh phòng</p>
                </div>
              </div>
            </div>

            {/* Room Details Grid */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Chi tiết phòng
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Số phòng:</p>
                    <p className="font-medium text-sm">{room?.room_number || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Tầng:</p>
                    <p className="font-medium text-sm">{room?.floor || '1'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Diện tích:</p>
                    <p className="font-medium text-sm">{room?.area_sqm ? `${room.area_sqm}m²` : '18m²'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-xs text-gray-500">Tiền thuê:</p>
                    <p className="font-bold text-green-600 text-sm">{formatPrice(room?.rent_amount || contract?.monthly_rent || 0)} VNĐ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tenant Info Card */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 mt-4">
          <div className="flex items-center space-x-3">
            <User className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-lg font-bold text-white">
                Thông tin người thuê
              </h2>
              <p className="text-blue-100 text-sm">{tenant.full_name}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 space-y-4">
          {/* Tenant Avatar */}
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
              <User className="w-10 h-10 text-gray-400" />
            </div>
          </div>
          
          {/* Personal Info */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Thông tin cá nhân
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Họ tên</span>
                </div>
                <span className="font-medium text-sm">{tenant.full_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Điện thoại</span>
                </div>
                <span className="font-medium text-sm">{tenant.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Email</span>
                </div>
                <span className="font-medium text-sm truncate ml-2">{tenant.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">CMND/CCCD</span>
                </div>
                <span className="font-medium text-sm">{tenant.id_number || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Contract Info */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Hợp đồng thuê
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Trạng thái:</span>
                {contract ? getContractStatus(contract.status) : 'N/A'}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Bắt đầu:</span>
                <span className="font-medium text-sm">{contract?.start_date ? formatDate(contract.start_date) : 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Kết thúc:</span>
                <span className="font-medium text-sm">{contract?.end_date ? formatDate(contract.end_date) : 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tiền cọc:</span>
                <span className="font-semibold text-orange-600 text-sm">{contract?.deposit_amount ? formatPrice(contract.deposit_amount) : 'N/A'} VNĐ</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {tenant.notes && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Ghi chú
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {tenant.notes}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Navigation - Mobile Only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 z-50">
        <div className="grid grid-cols-3 gap-3">
          {/* Home Button */}
          <Link href="/tenants">
            <Button 
              className="flex flex-col items-center gap-1 h-14 w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-xs font-medium">Quay lại</span>
            </Button>
          </Link>
          
          {/* Edit Button */}
          <TenantFormModal
            mode="edit"
            tenant={tenant}
            onSuccess={loadTenantData}
            trigger={
              <Button 
                variant="outline"
                className="flex flex-col items-center gap-1 h-14 w-full border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Edit3 className="w-5 h-5" />
                <span className="text-xs font-medium">Chỉnh sửa</span>
              </Button>
            }
          />
          
          {/* Delete Button */}
          <Button 
            variant="outline"
            className="flex flex-col items-center gap-1 h-14 border-2 border-red-300 dark:border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={() => {
              // TODO: Implement delete confirmation
              console.log('Delete tenant:', tenant.id)
            }}
          >
            <Trash2 className="w-5 h-5" />
            <span className="text-xs font-medium">Xóa</span>
          </Button>
        </div>
      </div>

      {/* Desktop Book-style Layout */}
      <div className="hidden md:block p-6">
        <div className="max-w-7xl mx-auto">
          {/* Book Container with Shadow */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden transform perspective-1000 rotate-y-1">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Left Page - Room Information */}
              <div className="relative">
                {/* Spine Effect */}
                <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent lg:block hidden"></div>

                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6">
                  <div className="flex items-center space-x-3">
                    <Home className="w-8 h-8 text-white" />
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Thông tin phòng
                      </h2>
                      <p className="text-orange-100">
                        Phòng{' '}
                        {tenant.current_contract?.room?.room_number || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Room Image */}
                <div className="p-6">
                  <div className="aspect-video bg-gray-200 rounded-lg mb-6 overflow-hidden">
                    <img 
                      src="/images/rooms/hinh_phong.png" 
                      alt="Hình ảnh phòng"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback nếu không load được ảnh
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    {/* Fallback content */}
                    <div className="hidden w-full h-full flex items-center justify-center text-gray-500 text-center">
                      <div>
                        <Home className="w-12 h-12 mx-auto mb-2" />
                        <p>Hình ảnh phòng</p>
                      </div>
                    </div>
                  </div>

                  {/* Room Details */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Chi tiết phòng
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Home className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Số phòng:
                          </span>
                          <span className="font-medium">
                            {room?.room_number || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Tầng:
                          </span>
                          <span className="font-medium">
                            {room?.floor || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Diện tích:
                          </span>
                          <span className="font-medium">
                            {room?.area_sqm ? `${room.area_sqm}m²` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Tiền thuê:
                          </span>
                          <span className="font-semibold text-green-600">
                            {formatPrice(
                              room?.rent_amount || contract?.monthly_rent || 0
                            )}{' '}
                            VNĐ
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Property Info */}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Thông tin nhà
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {property?.name || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {property?.address || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Utilities */}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Tiện ích
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {room?.utilities && room.utilities.length > 0 ? (
                          room.utilities.map(
                            (utility: string, index: number) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                              >
                                {utility}
                              </span>
                            )
                          )
                        ) : (
                          <span className="text-sm text-gray-500">
                            Không có thông tin tiện ích
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Page - Tenant Information */}
              <div className="relative">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6">
                  <div className="flex items-center space-x-3">
                    <User className="w-8 h-8 text-white" />
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Thông tin người thuê
                      </h2>
                      <p className="text-blue-100">{tenant.full_name}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Tenant Avatar */}
                  <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                      <User className="w-12 h-12 text-gray-400" />
                    </div>
                  </div>
                  
                  {/* Personal Info */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Thông tin cá nhân
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Họ tên:
                          </span>
                          <span className="font-medium">
                            {tenant.full_name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Điện thoại:
                          </span>
                          <span className="font-medium">{tenant.phone}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Email:
                          </span>
                          <span className="font-medium">{tenant.email}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            CMND/CCCD:
                          </span>
                          <span className="font-medium">
                            {tenant.id_number || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Ngày sinh:
                          </span>
                          <span className="font-medium">
                            {tenant.birth_date
                              ? formatDate(tenant.birth_date)
                              : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Liên hệ khẩn cấp
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">
                            {tenant.emergency_contact || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">
                            {tenant.emergency_phone || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contract Info */}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Hợp đồng thuê
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Trạng thái:
                          </span>
                          {contract
                            ? getContractStatus(contract.status)
                            : 'N/A'}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Bắt đầu:
                          </span>
                          <span className="font-medium">
                            {contract?.start_date
                              ? formatDate(contract.start_date)
                              : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Kết thúc:
                          </span>
                          <span className="font-medium">
                            {contract?.end_date
                              ? formatDate(contract.end_date)
                              : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Tiền cọc:
                          </span>
                          <span className="font-semibold text-orange-600">
                            {contract?.deposit_amount
                              ? formatPrice(contract.deposit_amount)
                              : 'N/A'}{' '}
                            VNĐ
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {tenant.notes && (
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                          Ghi chú
                        </h3>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {tenant.notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
