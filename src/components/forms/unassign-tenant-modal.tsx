'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { UserX, Loader2, AlertTriangle } from 'lucide-react'
import { unassignTenantFromRoom } from '@/lib/database'
import { toast } from 'sonner'

interface UnassignTenantModalProps {
  isOpen: boolean
  onClose: () => void
  roomId: string
  roomNumber: string
  tenantName: string
  propertyName: string
  onSuccess?: () => void
}

export function UnassignTenantModal({
  isOpen,
  onClose,
  roomId,
  roomNumber,
  tenantName,
  propertyName,
  onSuccess,
}: UnassignTenantModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleUnassign = async () => {
    setIsLoading(true)

    try {
      await unassignTenantFromRoom(roomId)
      toast.success('Đã hủy thuê phòng thành công')
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error unassigning tenant:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Có lỗi xảy ra khi hủy thuê phòng'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span>Xác nhận hủy thuê</span>
          </DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn hủy thuê phòng này không?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="space-y-2 text-sm">
              <div>
                <strong>Phòng:</strong> {roomNumber}
              </div>
              <div>
                <strong>Nhà:</strong> {propertyName}
              </div>
              <div>
                <strong>Người thuê:</strong> {tenantName}
              </div>
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border-l-4 border-orange-500">
            <div className="text-sm text-orange-800 dark:text-orange-200">
              <p>
                <strong>Lưu ý:</strong>
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>
                  Hợp đồng sẽ được chuyển sang trạng thái &quot;Đã kết
                  thúc&quot;
                </li>
                <li>Phòng sẽ chuyển sang trạng thái &quot;Trống&quot;</li>
                <li>Thao tác này không thể hoàn tác</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleUnassign}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserX className="w-4 h-4" />
              )}
              <span>Xác nhận hủy thuê</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
