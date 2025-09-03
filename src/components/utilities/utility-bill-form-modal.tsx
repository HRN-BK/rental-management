'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CalendarIcon, Upload, FileText } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { Utility, UtilityBill } from '@/types/database'
import { Badge } from '@/components/ui/badge'

interface UtilityBillFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<UtilityBill>) => void
  utility: Utility
  bill?: UtilityBill
}

export function UtilityBillFormModal({
  isOpen,
  onClose,
  onSubmit,
  utility,
  bill,
}: UtilityBillFormModalProps) {
  const [formData, setFormData] = useState<Partial<UtilityBill>>({
    utility_id: utility.id,
    property_id: utility.property_id,
    period_start: bill?.period_start || new Date().toISOString().split('T')[0],
    period_end: bill?.period_end || new Date().toISOString().split('T')[0],
    amount: bill?.amount || 0,
    previous_reading: bill?.previous_reading || undefined,
    current_reading: bill?.current_reading || undefined,
    usage_amount: bill?.usage_amount || undefined,
    rate_per_unit: bill?.rate_per_unit || undefined,
    due_date: bill?.due_date || new Date().toISOString().split('T')[0],
    status: bill?.status || 'pending',
    notes: bill?.notes || '',
    attachment_url: bill?.attachment_url || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [calendarOpen, setCalendarOpen] = useState<string | null>(null)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.period_start) {
      newErrors.period_start = 'Ngày bắt đầu kỳ là bắt buộc'
    }

    if (!formData.period_end) {
      newErrors.period_end = 'Ngày kết thúc kỳ là bắt buộc'
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Số tiền phải lớn hơn 0'
    }

    if (!formData.due_date) {
      newErrors.due_date = 'Ngày đáo hạn là bắt buộc'
    }

    // Validate readings for utilities that use them
    if (['electricity', 'water'].includes(utility.type)) {
      if (
        formData.current_reading !== undefined &&
        formData.previous_reading !== undefined
      ) {
        if (formData.current_reading < formData.previous_reading) {
          newErrors.current_reading =
            'Chỉ số hiện tại phải lớn hơn chỉ số trước'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Calculate usage if both readings are provided
    if (formData.current_reading && formData.previous_reading) {
      formData.usage_amount =
        formData.current_reading - formData.previous_reading
    }

    onSubmit(formData)
    onClose()
  }

  const handleInputChange = (
    field: keyof UtilityBill,
    value: string | number | undefined
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }))
    }
  }

  const handleDateChange = (
    field: keyof UtilityBill,
    date: Date | undefined
  ) => {
    if (date) {
      handleInputChange(field, date.toISOString().split('T')[0])
    }
    setCalendarOpen(null)
  }

  const formatDateForDisplay = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: vi })
    } catch {
      return dateStr
    }
  }

  const showReadings = ['electricity', 'water'].includes(utility.type)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            {bill ? 'Chỉnh Sửa Hóa Đơn' : 'Thêm Hóa Đơn Mới'}
            <Badge variant="outline" className="ml-2">
              {utility.name}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Period */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period_start">
                Ngày Bắt Đầu Kỳ <span className="text-red-500">*</span>
              </Label>
              <Popover
                open={calendarOpen === 'period_start'}
                onOpenChange={open =>
                  setCalendarOpen(open ? 'period_start' : null)
                }
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.period_start && 'text-muted-foreground',
                      errors.period_start && 'border-red-500'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.period_start
                      ? formatDateForDisplay(formData.period_start)
                      : 'Chọn ngày'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      formData.period_start
                        ? parseISO(formData.period_start)
                        : undefined
                    }
                    onSelect={date => handleDateChange('period_start', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.period_start && (
                <p className="text-sm text-red-500">{errors.period_start}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="period_end">
                Ngày Kết Thúc Kỳ <span className="text-red-500">*</span>
              </Label>
              <Popover
                open={calendarOpen === 'period_end'}
                onOpenChange={open =>
                  setCalendarOpen(open ? 'period_end' : null)
                }
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.period_end && 'text-muted-foreground',
                      errors.period_end && 'border-red-500'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.period_end
                      ? formatDateForDisplay(formData.period_end)
                      : 'Chọn ngày'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      formData.period_end
                        ? parseISO(formData.period_end)
                        : undefined
                    }
                    onSelect={date => handleDateChange('period_end', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.period_end && (
                <p className="text-sm text-red-500">{errors.period_end}</p>
              )}
            </div>
          </div>

          {/* Readings (for electricity and water) */}
          {showReadings && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="previous_reading">
                  Chỉ Số Trước ({utility.type === 'electricity' ? 'kWh' : 'm³'})
                </Label>
                <Input
                  id="previous_reading"
                  type="number"
                  min="0"
                  value={formData.previous_reading || ''}
                  onChange={e =>
                    handleInputChange(
                      'previous_reading',
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_reading">
                  Chỉ Số Hiện Tại (
                  {utility.type === 'electricity' ? 'kWh' : 'm³'})
                </Label>
                <Input
                  id="current_reading"
                  type="number"
                  min="0"
                  value={formData.current_reading || ''}
                  onChange={e =>
                    handleInputChange(
                      'current_reading',
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  placeholder="0"
                  className={errors.current_reading ? 'border-red-500' : ''}
                />
                {errors.current_reading && (
                  <p className="text-sm text-red-500">
                    {errors.current_reading}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Usage and Rate */}
          {showReadings && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usage_amount">
                  Lượng Sử Dụng ({utility.type === 'electricity' ? 'kWh' : 'm³'}
                  )
                </Label>
                <Input
                  id="usage_amount"
                  type="number"
                  min="0"
                  value={formData.usage_amount || ''}
                  onChange={e =>
                    handleInputChange(
                      'usage_amount',
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  placeholder="Tự động tính từ chỉ số"
                  disabled={
                    !!(formData.current_reading && formData.previous_reading)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate_per_unit">
                  Đơn Giá (VNĐ/{utility.type === 'electricity' ? 'kWh' : 'm³'})
                </Label>
                <Input
                  id="rate_per_unit"
                  type="number"
                  min="0"
                  value={formData.rate_per_unit || ''}
                  onChange={e =>
                    handleInputChange(
                      'rate_per_unit',
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  placeholder="3500"
                />
              </div>
            </div>
          )}

          {/* Amount and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                Số Tiền <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                min="0"
                value={formData.amount || ''}
                onChange={e =>
                  handleInputChange(
                    'amount',
                    e.target.value ? parseFloat(e.target.value) : 0
                  )
                }
                placeholder="0"
                className={errors.amount ? 'border-red-500' : ''}
              />
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">
                Ngày Đáo Hạn <span className="text-red-500">*</span>
              </Label>
              <Popover
                open={calendarOpen === 'due_date'}
                onOpenChange={open => setCalendarOpen(open ? 'due_date' : null)}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.due_date && 'text-muted-foreground',
                      errors.due_date && 'border-red-500'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.due_date
                      ? formatDateForDisplay(formData.due_date)
                      : 'Chọn ngày'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      formData.due_date
                        ? parseISO(formData.due_date)
                        : undefined
                    }
                    onSelect={date => handleDateChange('due_date', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.due_date && (
                <p className="text-sm text-red-500">{errors.due_date}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi Chú</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={e => handleInputChange('notes', e.target.value)}
              placeholder="Ghi chú thêm về hóa đơn này..."
              rows={3}
            />
          </div>

          {/* Attachment */}
          <div className="space-y-2">
            <Label htmlFor="attachment_url">Đính Kèm</Label>
            <div className="flex gap-2">
              <Input
                id="attachment_url"
                value={formData.attachment_url}
                onChange={e =>
                  handleInputChange('attachment_url', e.target.value)
                }
                placeholder="URL hình ảnh hóa đơn..."
              />
              <Button type="button" variant="outline" size="sm">
                <Upload className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
              {bill ? 'Cập Nhật' : 'Thêm Mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
