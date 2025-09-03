import { Button } from '@/components/ui/button'
import {
  Home,
  MapPin,
  Edit3,
  Trash2,
  Eye,
  Users,
  Building,
  Key,
} from 'lucide-react'
import { PropertyFormModal } from '@/components/forms/property-form-modal'
import { DeleteConfirmationDialog } from '@/components/forms/delete-confirmation-dialog'
import { deleteProperty } from '@/lib/database'
import type { Property } from '@/types/database'

interface PropertyManagementCardProps {
  id: string
  name: string
  address: string
  totalRooms: number
  occupiedRooms: number
  availableRooms: number
  occupancyPercentage: number
  status?: string
  onView?: (id: string) => void
  onSuccess?: () => void // Callback to refresh the properties list
}

export function PropertyManagementCard({
  id,
  name,
  address,
  totalRooms,
  occupiedRooms,
  availableRooms,
  occupancyPercentage,
  status = 'Hoạt động',
  onView,
  onSuccess,
}: PropertyManagementCardProps) {
  const propertyData: Partial<Property> = {
    id,
    name,
    address,
    total_rooms: totalRooms,
    occupied_rooms: occupiedRooms,
    available_rooms: availableRooms,
    occupancy_percentage: occupancyPercentage,
    status: status === 'Hoạt động' ? 'active' : 'inactive',
  }

  const handleDelete = async () => {
    await deleteProperty(id)
    onSuccess?.() // Refresh the list
  }
  return (
    <div className="card-premium card-hover p-6 appear">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
            <Home className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-xl">
              {name}
            </h3>
            <div className="flex items-center space-x-1 text-sm text-muted-foreground mt-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{address}</span>
            </div>
          </div>
        </div>
        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium rounded-full">
          {status}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl hover:scale-105 transition-transform">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg">
            <Building className="w-5 h-5 text-white" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {totalRooms}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            Tổng phòng
          </div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl hover:scale-105 transition-transform">
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {occupiedRooms}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            Đã thuê
          </div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-2xl hover:scale-105 transition-transform">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg">
            <Key className="w-5 h-5 text-white" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {availableRooms}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            Còn trống
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Tỷ lệ lấp đầy
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
            {occupancyPercentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${occupancyPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 flex items-center justify-center space-x-2"
          onClick={() => onView?.(id)}
        >
          <Eye className="w-4 h-4" />
          <span>Xem chi tiết</span>
        </Button>
        <PropertyFormModal
          mode="edit"
          property={propertyData as Property}
          onSuccess={onSuccess}
          trigger={
            <Button
              variant="outline"
              size="sm"
              className="flex-1 flex items-center justify-center space-x-2"
            >
              <Edit3 className="w-4 h-4" />
              <span>Chỉnh sửa</span>
            </Button>
          }
        />
        <DeleteConfirmationDialog
          title="Xóa nhà cho thuê"
          description="Bạn có chắc chắn muốn xóa nhà cho thuê này? Tất cả các phòng và hợp đồng liên quan cũng sẽ bị xóa."
          itemName={name}
          onConfirm={handleDelete}
          trigger={
            <Button
              variant="outline"
              size="sm"
              className="flex-1 flex items-center justify-center space-x-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa</span>
            </Button>
          }
        />
      </div>
    </div>
  )
}
