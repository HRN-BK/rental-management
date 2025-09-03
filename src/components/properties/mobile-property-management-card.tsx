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

interface MobilePropertyManagementCardProps {
  id: string
  name: string
  address: string
  totalRooms: number
  occupiedRooms: number
  availableRooms: number
  occupancyPercentage: number
  status?: string
  onView?: (id: string) => void
  onSuccess?: () => void
}

export function MobilePropertyManagementCard({
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
}: MobilePropertyManagementCardProps) {
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
    onSuccess?.()
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-sm">
      {/* Header - Name and Address */}
      <div className="mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-tight mb-1">
          {name}
        </h3>
        <div className="flex items-start gap-1">
          <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-gray-600 dark:text-gray-400 leading-tight">
            {address}
          </span>
        </div>
      </div>

      {/* Stats - Horizontal Layout */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Building className="w-3 h-3 text-blue-600" />
            <span className="text-lg font-bold text-blue-600">
              {totalRooms}
            </span>
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Tổng</span>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users className="w-3 h-3 text-green-600" />
            <span className="text-lg font-bold text-green-600">
              {occupiedRooms}
            </span>
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Đã thuê
          </span>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Key className="w-3 h-3 text-orange-600" />
            <span className="text-lg font-bold text-orange-600">
              {availableRooms}
            </span>
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Trống
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Tỷ lệ lấp đầy
          </span>
          <span className="text-xs font-semibold text-gray-900 dark:text-white">
            {occupancyPercentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${occupancyPercentage}%` }}
          />
        </div>
      </div>

      {/* Action Buttons - Icons Only */}
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 flex items-center justify-center"
          onClick={() => onView?.(id)}
        >
          <Eye className="w-4 h-4" />
        </Button>
        <PropertyFormModal
          mode="edit"
          property={propertyData as Property}
          onSuccess={onSuccess}
          trigger={
            <Button
              variant="outline"
              size="sm"
              className="flex-1 flex items-center justify-center"
            >
              <Edit3 className="w-4 h-4" />
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
              className="flex-1 flex items-center justify-center text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          }
        />
      </div>
    </div>
  )
}
