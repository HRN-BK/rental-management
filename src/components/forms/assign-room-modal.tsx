'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Home,
  DollarSign,
  Calendar,
  Loader2,
  User,
  ArrowRight,
} from 'lucide-react'
import {
  assignTenantToRoom,
  unassignTenantFromRoom,
  getRoomsGroupedByProperty,
} from '@/lib/database'
import type {
  PropertyWithRooms,
  Tenant,
  RentalContract,
} from '@/types/database'
import { toast } from 'sonner'

interface AssignRoomModalProps {
  isOpen: boolean
  onClose: () => void
  tenant: Tenant & {
    current_contract?: RentalContract & {
      room?: {
        id: string
        room_number: string
        rent_amount: number
        property?: { name: string }
      }
    }
  }
  onSuccess?: () => void
}

export function AssignRoomModal({
  isOpen,
  onClose,
  tenant,
  onSuccess,
}: AssignRoomModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [properties, setProperties] = useState<PropertyWithRooms[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [monthlyRent, setMonthlyRent] = useState('')
  const [error, setError] = useState('')

  // Load available rooms
  useEffect(() => {
    if (isOpen) {
      loadProperties()
      setSelectedPropertyId('')
      setSelectedRoomId('')
      setMonthlyRent('')
      setError('')
    }
  }, [isOpen])

  const loadProperties = async () => {
    try {
      const data = await getRoomsGroupedByProperty()
      setProperties(data)
    } catch (err) {
      console.error('Error loading properties:', err)
      setError('Không thể tải danh sách phòng')
    }
  }

  const selectedProperty = properties.find(p => p.id === selectedPropertyId)
  const availableRooms =
    selectedProperty?.rooms?.filter(
      room =>
        room.status === 'available' ||
        room.id === tenant.current_contract?.room?.id
    ) || []

  const selectedRoom = availableRooms.find(room => room.id === selectedRoomId)

  // Auto-set rent amount when room is selected
  useEffect(() => {
    if (selectedRoom) {
      setMonthlyRent(selectedRoom.rent_amount.toString())
    }
  }, [selectedRoom])

  const handleAssign = async () => {
    if (!selectedRoomId || !monthlyRent) {
      setError('Vui lòng chọn phòng và nhập tiền thuê')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // If tenant already has a room, unassign first
      if (tenant.current_contract?.room) {
        await unassignTenantFromRoom(tenant.current_contract.room.id)
      }

      // Assign to new room
      await assignTenantToRoom(
        selectedRoomId,
        tenant.id,
        parseFloat(monthlyRent)
      )

      toast.success('Đã gán phòng cho người thuê thành công')
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Có lỗi xảy ra khi gán phòng'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnassign = async () => {
    if (!tenant.current_contract?.room) return

    setIsLoading(true)
    setError('')

    try {
      await unassignTenantFromRoom(tenant.current_contract.room.id)
      toast.success('Đã hủy phòng thuê thành công')
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Có lỗi xảy ra khi hủy phòng thuê'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const currentRoom = tenant.current_contract?.room
  const hasCurrentRoom = !!currentRoom

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-500" />
            <span>Gán phòng cho {tenant.full_name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tenant Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <User className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-sm">Thông tin người thuê</span>
            </div>
            <div className="text-sm space-y-1">
              <div>
                <strong>Tên:</strong> {tenant.full_name}
              </div>
              {tenant.phone && (
                <div>
                  <strong>Điện thoại:</strong> {tenant.phone}
                </div>
              )}
              {tenant.email && (
                <div>
                  <strong>Email:</strong> {tenant.email}
                </div>
              )}
            </div>
          </div>

          {/* Current Room (if any) */}
          {hasCurrentRoom && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border-l-4 border-gray-500">
              <div className="flex items-center space-x-2 mb-2">
                <Home className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-sm">Phòng hiện tại</span>
              </div>
              <div className="text-sm space-y-1">
                <div>
                  <strong>Phòng:</strong> {currentRoom.room_number}
                </div>
                <div>
                  <strong>Nhà:</strong> {currentRoom.property?.name}
                </div>
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-3 h-3" />
                  <span>
                    <strong>Giá thuê:</strong>{' '}
                    {currentRoom.rent_amount?.toLocaleString('vi-VN')} VNĐ/tháng
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Room Selection */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Home className="w-4 h-4 text-green-500" />
              <span className="font-medium text-sm">
                {hasCurrentRoom ? 'Chuyển sang phòng mới' : 'Chọn phòng thuê'}
              </span>
            </div>

            <div>
              <Label htmlFor="property">Chọn nhà</Label>
              <Select
                value={selectedPropertyId}
                onValueChange={setSelectedPropertyId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhà..." />
                </SelectTrigger>
                <SelectContent>
                  {properties.length === 0 ? (
                    <SelectItem value="_empty" disabled>
                      Không có nhà nào
                    </SelectItem>
                  ) : (
                    properties.map(property => (
                      <SelectItem key={property.id} value={property.id}>
                        <span className="font-medium">{property.name}</span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedPropertyId && (
              <div>
                <Label htmlFor="room">Chọn phòng</Label>
                <Select
                  value={selectedRoomId}
                  onValueChange={setSelectedRoomId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn phòng..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRooms.length === 0 ? (
                      <SelectItem value="_empty" disabled>
                        Không có phòng trống
                      </SelectItem>
                    ) : (
                      availableRooms.map(room => (
                        <SelectItem key={room.id} value={room.id}>
                          <span>
                            Phòng {room.room_number} -{' '}
                            {room.rent_amount.toLocaleString('vi-VN')} VNĐ/tháng
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedRoomId && (
              <div>
                <Label htmlFor="rent">Tiền thuê hàng tháng (VNĐ)</Label>
                <Input
                  id="rent"
                  type="number"
                  value={monthlyRent}
                  onChange={e => setMonthlyRent(e.target.value)}
                  placeholder="Nhập tiền thuê..."
                />
              </div>
            )}

            {selectedRoomId && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>Hợp đồng sẽ bắt đầu từ hôm nay</span>
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded border-l-4 border-red-500">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Hủy
            </Button>

            {hasCurrentRoom && (
              <Button
                variant="destructive"
                onClick={handleUnassign}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Home className="w-4 h-4" />
                )}
                <span>Hủy thuê</span>
              </Button>
            )}

            <Button
              onClick={handleAssign}
              disabled={isLoading || !selectedRoomId || !monthlyRent}
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : hasCurrentRoom ? (
                <ArrowRight className="w-4 h-4" />
              ) : (
                <Home className="w-4 h-4" />
              )}
              <span>{hasCurrentRoom ? 'Chuyển phòng' : 'Gán phòng'}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
