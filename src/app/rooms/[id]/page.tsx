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
  Users,
  Bed,
  Bath,
  Square,
  Zap,
} from 'lucide-react'
// import { getRoomById } from '@/lib/database'
// import type { RoomWithDetails } from '@/types/database'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { formatPrice, formatDate } from '@/lib/utils'
// import { RoomFormModal } from '@/components/forms/room-form-modal'

// Mock data for demo purposes
const mockRoom = {
  id: '1',
  room_number: 'Phòng 102',
  floor: 1,
  area_sqm: 18,
  rent_amount: 3200000,
  deposit_amount: 3200000,
  is_occupied: true,
  utilities: ['Điện', 'Nước', 'Internet', 'Điều hòa'],
  description: 'Phòng đầy đủ nội thất, có ban công, view đẹp',
  property: {
    id: '1',
    name: 'Nhà trọ Minh Trâm',
    address: '123 Đường ABC, Quận 1, TP.HCM',
  },
  tenant: {
    id: '1',
    full_name: 'Trần Thị C',
    phone: '0912345678',
    email: 'tran.c@email.com',
    id_number: '987***321',
  },
  current_contract: {
    id: '1',
    status: 'active',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    monthly_rent: 3200000,
    deposit_amount: 3200000,
  },
}

export default function RoomDetailPage() {
  const params = useParams()
  const [room, setRoom] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRoomData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Mock loading delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      setRoom(mockRoom)
    } catch (err) {
      console.error('Error loading room:', err)
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

    loadRoomData()
  }, [loadRoomData])

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

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Không tìm thấy phòng
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error || 'Phòng không tồn tại hoặc đã bị xóa.'}
          </p>
          <Link href="/rooms">
            <Button>Quay lại danh sách</Button>
          </Link>
        </div>
      </div>
    )
  }

  const getOccupancyStatus = (isOccupied: boolean) => {
    if (isOccupied) {
      return (
        <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
          <Users className="w-3 h-3 mr-1" />
          Đã có người thuê
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
        <CheckCircle className="w-3 h-3 mr-1" />
        Còn trống
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/rooms">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  {room.room_number}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {room.property?.name} - Tầng {room.floor}
                </p>
              </div>
            </div>
            <div className="flex space-x-1">
              <Button variant="outline" size="sm">
                <Edit3 className="w-4 h-4" />
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
              <Link href="/rooms">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Quay lại
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {room.room_number}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {room.property?.name} - Tầng {room.floor}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Edit3 className="w-4 h-4 mr-2" />
                Chỉnh sửa
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Room Info Card */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4">
          <div className="flex items-center space-x-3">
            <Home className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-lg font-bold text-white">
                Thông tin phòng
              </h2>
              <p className="text-orange-100 text-sm">
                {room.room_number}
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
                    <p className="font-medium text-sm">{room.room_number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Tầng:</p>
                    <p className="font-medium text-sm">{room.floor}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Square className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Diện tích:</p>
                    <p className="font-medium text-sm">{room.area_sqm}m²</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-xs text-gray-500">Tiền thuê:</p>
                    <p className="font-bold text-green-600 text-sm">{formatPrice(room.rent_amount)} VNĐ</p>
                  </div>
                </div>
              </div>

              {/* Occupancy Status */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-gray-600">Tình trạng:</span>
                {getOccupancyStatus(room.is_occupied)}
              </div>

              {/* Utilities */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Tiện ích</h4>
                <div className="flex flex-wrap gap-2">
                  {room.utilities?.map((utility: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                    >
                      {utility}
                    </span>
                  ))}
                </div>
              </div>

              {/* Description */}
              {room.description && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Mô tả</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    {room.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tenant Info Card (if occupied) */}
        {room.is_occupied && room.tenant && (
          <>
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 mt-4">
              <div className="flex items-center space-x-3">
                <User className="w-6 h-6 text-white" />
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Người thuê hiện tại
                  </h2>
                  <p className="text-blue-100 text-sm">{room.tenant.full_name}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 space-y-4">
              {/* Tenant Info */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Thông tin liên hệ
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Họ tên</span>
                    </div>
                    <span className="font-medium text-sm">{room.tenant.full_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Điện thoại</span>
                    </div>
                    <span className="font-medium text-sm">{room.tenant.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Email</span>
                    </div>
                    <span className="font-medium text-sm truncate ml-2">{room.tenant.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">CMND/CCCD</span>
                    </div>
                    <span className="font-medium text-sm">{room.tenant.id_number}</span>
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
                    <span className="text-sm text-gray-600">Bắt đầu:</span>
                    <span className="font-medium text-sm">{room.current_contract?.start_date ? formatDate(room.current_contract.start_date) : 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Kết thúc:</span>
                    <span className="font-medium text-sm">{room.current_contract?.end_date ? formatDate(room.current_contract.end_date) : 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tiền cọc:</span>
                    <span className="font-semibold text-orange-600 text-sm">{formatPrice(room.deposit_amount)} VNĐ</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Property Info */}
        <div className="bg-white dark:bg-gray-800 p-4 mt-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Thông tin nhà trọ
          </h3>
          <div className="flex items-start space-x-2">
            <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {room.property?.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {room.property?.address}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Keep existing desktop layout here if needed */}
      <div className="hidden md:block p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Chi tiết phòng</h2>
              {/* Add desktop content here */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
