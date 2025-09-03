'use client'

import { Button } from '@/components/ui/button'
import {
  Home,
  DollarSign,
  Edit3,
  Trash2,
  Eye,
  UserX,
  User,
  Receipt,
} from 'lucide-react'
import { RoomFormModal } from '@/components/forms/room-form-modal'
import { DeleteConfirmationDialog } from '@/components/forms/delete-confirmation-dialog'
import { AssignTenantModal } from '@/components/forms/assign-tenant-modal'
import { UnassignTenantModal } from '@/components/forms/unassign-tenant-modal'
import { CollectionFormModal } from '@/components/invoices/collection-form-modal'
import { deleteRoom } from '@/lib/database'
import type {
  Room,
  RentalContract,
  Tenant,
  Property,
  RentalInvoice,
} from '@/types/database'
import { useState } from 'react'
import { formatPrice } from '@/lib/utils'
import { getRoomStatusBadge } from '@/components/ui/badge-utils'
import { useRouter } from 'next/navigation'

interface RoomCardProps {
  id: string
  roomNumber: string
  rentAmount: number
  status: 'available' | 'occupied' | 'maintenance'
  currentContract?: RentalContract & { tenant?: Tenant }
  propertyId: string
  propertyName: string
  onSuccess?: () => void // Callback to refresh the rooms list
  onView?: (id: string) => void
  isMobile?: boolean
}

export function RoomCard({
  id,
  roomNumber,
  rentAmount,
  status,
  currentContract,
  propertyId,
  propertyName,
  onSuccess,
  onView,
  isMobile = false,
}: RoomCardProps) {
  const router = useRouter()
  const [showUnassignModal, setShowUnassignModal] = useState(false)
  const [showCollectionModal, setShowCollectionModal] = useState(false)

  const roomData: Partial<Room> = {
    id,
    room_number: roomNumber,
    rent_amount: rentAmount,
    status,
    property_id: propertyId,
  }

  const handleDelete = async () => {
    await deleteRoom(id)
    onSuccess?.() // Refresh the list
  }

  const handleSaveInvoice = async (invoiceData: Partial<RentalInvoice>) => {
    try {
      // Add contract_id to the invoice data
      const fullInvoiceData = {
        ...invoiceData,
        contract_id: currentContract?.id,
      }

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullInvoiceData),
      })

      const result = await response.json()

      if (result.success) {
        console.log('Saved invoice:', result.data)
        // Close modal and show success message
        setShowCollectionModal(false)
        // Optionally redirect to invoices page or refresh current view
      } else {
        console.error('Failed to save invoice:', result.error)
      }
    } catch (error) {
      console.error('Error saving invoice:', error)
    }
  }

  // Create room data compatible with OccupiedRoom type
  const occupiedRoomData =
    status === 'occupied' && currentContract
      ? {
          id,
          room_number: roomNumber,
          rent_amount: rentAmount,
          status,
          property_id: propertyId,
          created_at: new Date().toISOString(), // Add missing required fields
          updated_at: new Date().toISOString(),
          property: {
            name: propertyName,
            address: 'N/A', // We don't have address in this context
          },
          current_contract: {
            tenant: currentContract.tenant,
            monthly_rent: currentContract.monthly_rent,
          },
        }
      : null

  if (isMobile) {
    return (
      <div className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Phòng {roomNumber}
            </h3>
            <div className="flex-shrink-0">{getRoomStatusBadge(status)}</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center space-x-1 text-sm">
              <DollarSign className="w-3 h-3 text-green-500" />
              <span className="font-medium text-green-600">
                {formatPrice(rentAmount)}/tháng
              </span>
            </div>
            {status === 'occupied' && currentContract?.tenant && (
              <div className="flex items-center space-x-1 text-sm">
                <User className="w-3 h-3 text-blue-500" />
                <span
                  className="font-medium text-blue-600 truncate"
                  title={currentContract.tenant.full_name}
                >
                  {currentContract.tenant.full_name}
                </span>
              </div>
            )}
          </div>

          {/* Mobile Action Buttons - Icons Only */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView?.(id)}
              className="p-2 h-8 w-8"
            >
              <Eye className="w-3 h-3" />
            </Button>

            {status === 'available' && (
              <AssignTenantModal
                roomId={id}
                roomNumber={roomNumber}
                propertyName={propertyName}
                defaultRent={rentAmount}
                onSuccess={onSuccess}
                trigger={
                  <Button variant="outline" size="sm" className="p-2 h-8 w-8">
                    <User className="w-3 h-3" />
                  </Button>
                }
              />
            )}

            {status === 'occupied' && currentContract?.tenant && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-green-600 border-green-200 hover:bg-green-50 p-2 h-8 w-8"
                  onClick={() => setShowCollectionModal(true)}
                >
                  <Receipt className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-orange-600 border-orange-200 hover:bg-orange-50 p-2 h-8 w-8"
                  onClick={() => setShowUnassignModal(true)}
                >
                  <UserX className="w-3 h-3" />
                </Button>
              </>
            )}

            <RoomFormModal
              mode="edit"
              room={roomData as Room}
              onSuccess={onSuccess}
              trigger={
                <Button variant="outline" size="sm" className="p-2 h-8 w-8">
                  <Edit3 className="w-3 h-3" />
                </Button>
              }
            />

            <DeleteConfirmationDialog
              title="Xóa phòng"
              description="Bạn có chắc chắn muốn xóa phòng này? Tất cả hợp đồng liên quan cũng sẽ bị xóa."
              itemName={`Phòng ${roomNumber} - ${propertyName}`}
              onConfirm={handleDelete}
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50 p-2 h-8 w-8"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              }
            />
          </div>
        </div>

        {/* Unassign Modal */}
        {showUnassignModal && currentContract?.tenant && (
          <UnassignTenantModal
            isOpen={showUnassignModal}
            onClose={() => setShowUnassignModal(false)}
            roomId={id}
            roomNumber={roomNumber}
            tenantName={currentContract.tenant.full_name}
            propertyName={propertyName}
            onSuccess={onSuccess}
          />
        )}

        {/* Collection Modal */}
        {showCollectionModal && occupiedRoomData && (
          <CollectionFormModal
            isOpen={showCollectionModal}
            onClose={() => setShowCollectionModal(false)}
            room={occupiedRoomData}
            onSave={handleSaveInvoice}
          />
        )}
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
        {/* Room Info */}
        <div className="flex items-center space-x-4 flex-1">
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Phòng {roomNumber}
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="font-medium">
                  {formatPrice(rentAmount)}/tháng
                </span>
              </div>
              {status === 'occupied' && currentContract?.tenant && (
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4 text-blue-500" />
                  <span
                    className="font-medium truncate"
                    title={currentContract.tenant.full_name}
                  >
                    {currentContract.tenant.full_name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status and Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 lg:gap-4">
          {/* Status Badge */}
          <div className="flex-shrink-0">{getRoomStatusBadge(status)}</div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView?.(id)}
              className="flex-shrink-0"
            >
              <Eye className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Chi tiết</span>
            </Button>

            {/* Show assign tenant button for available rooms */}
            {status === 'available' && (
              <AssignTenantModal
                roomId={id}
                roomNumber={roomNumber}
                propertyName={propertyName}
                defaultRent={rentAmount}
                onSuccess={onSuccess}
              />
            )}

            {/* Show collection button for occupied rooms */}
            {status === 'occupied' && currentContract?.tenant && (
              <Button
                variant="outline"
                size="sm"
                className="text-green-600 border-green-200 hover:bg-green-50 flex-shrink-0"
                onClick={() => setShowCollectionModal(true)}
              >
                <Receipt className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Thu tiền</span>
              </Button>
            )}

            {/* Show unassign button for occupied rooms */}
            {status === 'occupied' && currentContract?.tenant && (
              <Button
                variant="outline"
                size="sm"
                className="text-orange-600 border-orange-200 hover:bg-orange-50 flex-shrink-0"
                onClick={() => setShowUnassignModal(true)}
              >
                <UserX className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Hủy thuê</span>
              </Button>
            )}

            <RoomFormModal
              mode="edit"
              room={roomData as Room}
              onSuccess={onSuccess}
              trigger={
                <Button variant="outline" size="sm" className="flex-shrink-0">
                  <Edit3 className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Sửa</span>
                </Button>
              }
            />

            <DeleteConfirmationDialog
              title="Xóa phòng"
              description="Bạn có chắc chắn muốn xóa phòng này? Tất cả hợp đồng liên quan cũng sẽ bị xóa."
              itemName={`Phòng ${roomNumber} - ${propertyName}`}
              onConfirm={handleDelete}
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50 flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Xóa</span>
                </Button>
              }
            />
          </div>
        </div>
      </div>

      {/* Unassign Modal */}
      {showUnassignModal && currentContract?.tenant && (
        <UnassignTenantModal
          isOpen={showUnassignModal}
          onClose={() => setShowUnassignModal(false)}
          roomId={id}
          roomNumber={roomNumber}
          tenantName={currentContract.tenant.full_name}
          propertyName={propertyName}
          onSuccess={onSuccess}
        />
      )}

      {/* Collection Modal */}
      {showCollectionModal && occupiedRoomData && (
        <CollectionFormModal
          isOpen={showCollectionModal}
          onClose={() => setShowCollectionModal(false)}
          room={occupiedRoomData}
          onSave={handleSaveInvoice}
        />
      )}
    </div>
  )
}
