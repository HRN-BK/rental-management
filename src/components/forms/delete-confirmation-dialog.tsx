'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface DeleteConfirmationDialogProps {
  title: string
  description: string
  itemName: string
  onConfirm: () => Promise<void>
  trigger?: React.ReactNode
  destructiveAction?: boolean
}

export function DeleteConfirmationDialog({
  title,
  description,
  itemName,
  onConfirm,
  trigger,
  destructiveAction = true,
}: DeleteConfirmationDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    try {
      setIsDeleting(true)
      await onConfirm()
      setOpen(false)
      toast.success('Đã xóa thành công')
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Không thể xóa. Vui lòng thử lại.')
    } finally {
      setIsDeleting(false)
    }
  }

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className="text-red-600 border-red-200 hover:bg-red-50"
    >
      <Trash2 className="w-4 h-4 mr-2" />
      Xóa
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription className="text-left">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-800 rounded-lg p-4 my-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Bạn sắp xóa:{' '}
                <span className="font-bold">&quot;{itemName}&quot;</span>
              </p>
              <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                Thao tác này không thể hoàn tác!
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Hủy
          </Button>
          <Button
            variant={destructiveAction ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang xóa...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa vĩnh viễn
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
