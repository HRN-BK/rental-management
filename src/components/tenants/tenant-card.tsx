import { useState, memo, useCallback } from "react"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  User,
  Edit3,
  Trash2,
  Eye,
  Home,
  Phone,
  CreditCard,
  DollarSign,
  Building,
} from 'lucide-react'
import { TenantFormModal } from '@/components/forms/tenant-form-modal'
import { AssignRoomModal } from '@/components/forms/assign-room-modal'
import { DeleteConfirmationDialog } from '@/components/forms/delete-confirmation-dialog'
import { deleteTenant } from '@/lib/database'
import type { Tenant, RentalContract } from '@/types/database'
import { formatPrice } from '@/lib/utils'

/**
 * Props for the TenantCard component
 */
interface TenantCardProps {
  /** Unique identifier for the tenant */
  id: string
  /** Full name of the tenant */
  name: string
  /** Phone number (optional) */
  phone?: string
  /** Email address (optional) */
  email?: string
  /** ID number/CCCD (optional) */
  idNumber?: string
  /** Room number where tenant is staying */
  roomNumber: string
  /** Name of the property */
  propertyName: string
  /** Monthly rent amount in VND */
  monthlyRent: number
  /** Current contract status */
  contractStatus: 'active' | 'expired' | 'terminated'
  /** Avatar URL (optional) */
  avatar?: string
  /** Current contract details (optional) */
  currentContract?: RentalContract & {
    room?: {
      id: string
      room_number: string
      rent_amount: number
      property?: { name: string }
    }
  }
  /** Callback when card is clicked to view details */
  onView?: (id: string) => void
  /** Callback after successful operations (edit, delete, etc.) */
  onSuccess?: () => void
}

/**
 * Modern tenant card component with shadcn/ui design system.
 * Displays tenant information in a responsive card layout with action buttons.
 * 
 * Features:
 * - Modern card design with gradient accents and hover effects
 * - Avatar with fallback icons
 * - Status badges with color coding
 * - Responsive action buttons with tooltips
 * - Keyboard accessibility
 * - Mobile-friendly touch targets
 * - Performance optimized with React.memo
 * 
 * @param props - TenantCardProps
 * @returns Memoized TenantCard component
 */
const TenantCard = memo(function TenantCard({
  id,
  name,
  phone,
  email,
  idNumber,
  roomNumber,
  propertyName,
  monthlyRent,
  contractStatus,
  avatar,
  currentContract,
  onView,
  onSuccess,
}: TenantCardProps) {
  const [showAssignRoomModal, setShowAssignRoomModal] = useState(false)
  const tenantData: Tenant = {
    id,
    full_name: name,
    phone: phone || undefined,
    email: email || undefined,
    avatar_url: avatar || undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    id_number: idNumber || undefined,
    birth_date: undefined,
    address: undefined,
    occupation: undefined,
    emergency_contact: undefined,
    emergency_phone: undefined,
    notes: undefined,
  }

  const handleDelete = useCallback(async () => {
    await deleteTenant(id)
    onSuccess?.() // Refresh the list
  }, [id, onSuccess])

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons or interactive elements
    if ((e.target as HTMLElement).closest('button, [role="button"]')) {
      return
    }
    onView?.(id)
  }, [id, onView])

  return (
    <TooltipProvider>
      <Card
        className="group hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 cursor-pointer relative overflow-hidden backdrop-blur-sm"
        onClick={handleCardClick}
      >
        <CardContent className="p-4 flex flex-col min-h-[260px]">
          <div className="flex items-start gap-3">
            {/* Modern Avatar - giống mobile */}
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
              {/* Name and Status - giống mobile */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {name}
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

              {/* Rent Amount Highlight - giống mobile */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-lg border border-green-200 dark:border-green-800/30">
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="font-bold text-green-700 dark:text-green-400">
                  {formatPrice(monthlyRent)}
                </span>
                <span className="text-xs text-green-600 dark:text-green-500">
                  VNĐ/tháng
                </span>
              </div>

              {/* Lines: Property and Room each on its own line */}
              <div className="space-y-2">
                {/* Property line */}
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Building className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="truncate font-medium">{propertyName}</span>
                </div>
                {/* Room line */}
                <button
                  className="flex items-center gap-2 text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer group text-left"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowAssignRoomModal(true)
                  }}
                >
                  <Home className="w-4 h-4 text-orange-500 group-hover:text-blue-500 transition-colors shrink-0" />
                  <span className="truncate font-medium group-hover:underline">Phòng {roomNumber}</span>
                </button>

                {/* Phone & ID - Always show */}
                {phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="font-mono">{phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CreditCard className="w-4 h-4 text-purple-500 shrink-0" />
                  <span className="font-mono">
                    {idNumber ? (
                      idNumber.length > 6
                        ? `${idNumber.substring(0, 3)}***${idNumber.slice(-3)}`
                        : idNumber
                    ) : (
                      'N/A'
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed 3 action buttons at bottom */}
          <div className="mt-auto pt-4 grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={e => { e.stopPropagation(); onView?.(id) }}
              className="w-full"
            >
              <Eye className="h-4 w-4" />
              <span className="ml-2">Chi tiết</span>
            </Button>

            <TenantFormModal
              mode="edit"
              tenant={tenantData}
              onSuccess={onSuccess}
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={e => e.stopPropagation()}
                  className="w-full"
                >
                  <Edit3 className="h-4 w-4" />
                  <span className="ml-2">Sửa</span>
                </Button>
              }
            />

            <DeleteConfirmationDialog
              title="Xóa người thuê"
              description="Bạn có chắc chắn muốn xóa người thuê này? Tất cả hợp đồng liên quan cũng sẽ bị xóa và không thể khôi phục."
              itemName={name}
              onConfirm={handleDelete}
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={e => e.stopPropagation()}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="ml-2">Xóa</span>
                </Button>
              }
            />
          </div>
        </CardContent>

        {/* Assign Room Modal */}
        <AssignRoomModal
          isOpen={showAssignRoomModal}
          onClose={() => setShowAssignRoomModal(false)}
          tenant={{
            ...tenantData,
            current_contract: currentContract,
          }}
          onSuccess={onSuccess}
        />
      </Card>
    </TooltipProvider>
  )
})

export { TenantCard }
