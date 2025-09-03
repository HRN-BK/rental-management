'use client'

import { useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SimpleInvoiceTemplate } from './simple-invoice-template'
import { ProfessionalInvoiceTemplate } from './professional-invoice-template'
import { Download, Eye } from 'lucide-react'
import html2canvas from 'html2canvas'
import type { RentalInvoice } from '@/types/database'

interface InvoicePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: RentalInvoice
}

export function InvoicePreviewModal({
  isOpen,
  onClose,
  invoice,
}: InvoicePreviewModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null)

  const handleDownloadPNG = async () => {
    if (!invoiceRef.current) return

    try {
      // Create canvas from the invoice element
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2, // Higher quality
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        height: invoiceRef.current.scrollHeight,
        width: invoiceRef.current.scrollWidth,
      })

      // Convert to PNG and download
      const link = document.createElement('a')
      link.download = `${invoice.invoice_number}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Error generating PNG:', error)
      alert('Có lỗi xảy ra khi xuất hóa đơn. Vui lòng thử lại.')
    }
  }

  // Template will be selected based on invoice.template_type

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-500" />
            Xem Trước Hóa Đơn
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-auto max-h-[60vh] -mx-6 px-6">
          <div ref={invoiceRef} className="bg-white">
            {invoice.template_type === 'simple' ? (
              <SimpleInvoiceTemplate invoice={invoice} />
            ) : (
              <ProfessionalInvoiceTemplate invoice={invoice} />
            )}
          </div>
        </div>

        <Separator />

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button
            onClick={handleDownloadPNG}
            className="bg-green-500 hover:bg-green-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Tải Xuống PNG
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
