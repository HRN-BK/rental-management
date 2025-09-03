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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Zap, Droplets, Trash2, Wifi, Tv, Wrench } from 'lucide-react'
import type { Utility, UtilityType } from '@/types/database'

interface UtilityFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<Utility>) => void
  utility?: Utility
  propertyId: string
}

const UTILITY_TYPES = [
  { value: 'electricity', label: 'Điện', icon: Zap, color: 'bg-yellow-500' },
  { value: 'water', label: 'Nước', icon: Droplets, color: 'bg-blue-500' },
  { value: 'trash', label: 'Rác', icon: Trash2, color: 'bg-green-500' },
  { value: 'internet', label: 'Internet', icon: Wifi, color: 'bg-purple-500' },
  { value: 'tv', label: 'Truyền hình', icon: Tv, color: 'bg-red-500' },
  { value: 'other', label: 'Khác', icon: Wrench, color: 'bg-gray-500' },
] as const

export function UtilityFormModal({
  isOpen,
  onClose,
  onSubmit,
  utility,
  propertyId,
}: UtilityFormModalProps) {
  const [formData, setFormData] = useState<Partial<Utility>>({
    name: utility?.name || '',
    type: utility?.type || 'electricity',
    provider: utility?.provider || '',
    customer_code: utility?.customer_code || '',
    monthly_due_date: utility?.monthly_due_date || undefined,
    property_id: propertyId,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      newErrors.name = 'Tên dịch vụ là bắt buộc'
    }

    if (!formData.type) {
      newErrors.type = 'Loại dịch vụ là bắt buộc'
    }

    if (
      formData.monthly_due_date &&
      (formData.monthly_due_date < 1 || formData.monthly_due_date > 31)
    ) {
      newErrors.monthly_due_date = 'Ngày đóng phải từ 1 đến 31'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    onSubmit(formData)
    onClose()
  }

  const handleInputChange = (
    field: keyof Utility,
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

  const selectedType = UTILITY_TYPES.find(type => type.value === formData.type)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedType && (
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedType.color}`}
              >
                <selectedType.icon className="w-4 h-4 text-white" />
              </div>
            )}
            {utility ? 'Chỉnh Sửa Dịch Vụ' : 'Thêm Dịch Vụ Mới'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Utility Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Tên Dịch Vụ <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => handleInputChange('name', e.target.value)}
              placeholder="Ví dụ: Điện lực EVN, Cấp nước Sài Gòn..."
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Utility Type */}
          <div className="space-y-2">
            <Label htmlFor="type">
              Loại Dịch Vụ <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={value =>
                handleInputChange('type', value as UtilityType)
              }
            >
              <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                <SelectValue placeholder="Chọn loại dịch vụ" />
              </SelectTrigger>
              <SelectContent>
                {UTILITY_TYPES.map(type => {
                  const Icon = type.icon
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded ${type.color} flex items-center justify-center`}
                        >
                          <Icon className="w-2.5 h-2.5 text-white" />
                        </div>
                        {type.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type}</p>
            )}
          </div>

          {/* Provider */}
          <div className="space-y-2">
            <Label htmlFor="provider">Nhà Cung Cấp</Label>
            <Input
              id="provider"
              value={formData.provider}
              onChange={e => handleInputChange('provider', e.target.value)}
              placeholder="Ví dụ: Công ty Điện Lực Gia Định..."
            />
          </div>

          {/* Customer Code */}
          <div className="space-y-2">
            <Label htmlFor="customer_code">Mã Khách Hàng</Label>
            <Input
              id="customer_code"
              value={formData.customer_code}
              onChange={e => handleInputChange('customer_code', e.target.value)}
              placeholder="Ví dụ: PE0400072448, 1423461705..."
            />
          </div>

          {/* Monthly Due Date */}
          <div className="space-y-2">
            <Label htmlFor="monthly_due_date">Ngày Đóng Hàng Tháng</Label>
            <Input
              id="monthly_due_date"
              type="number"
              min="1"
              max="31"
              value={formData.monthly_due_date || ''}
              onChange={e =>
                handleInputChange(
                  'monthly_due_date',
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              placeholder="Ví dụ: 2, 15, 25..."
              className={errors.monthly_due_date ? 'border-red-500' : ''}
            />
            <p className="text-sm text-gray-500">
              Để trống nếu không có ngày cố định
            </p>
            {errors.monthly_due_date && (
              <p className="text-sm text-red-500">{errors.monthly_due_date}</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
              {utility ? 'Cập Nhật' : 'Thêm Mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
