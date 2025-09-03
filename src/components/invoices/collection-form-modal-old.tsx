'use client'

import { useState, useEffect } from 'react'
import { format, subDays, startOfMonth } from 'date-fns'
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
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Zap,
  Droplet,
  Wifi,
  Trash2,
  Home,
  Calendar,
  Calculator,
  Save,
  X,
} from 'lucide-react'
import type { RentalInvoice, Room, Tenant } from '@/types/database'

interface CollectionFormModalProps {
  isOpen: boolean
  onClose: () => void
  room?: Room & {
    property?: { name: string; address: string }
    current_contract?: {
      tenant?: Tenant
      monthly_rent: number
    }
  }
  onSave?: (invoice: Partial<RentalInvoice>) => void
}

export function CollectionFormModal({
  isOpen,
  onClose,
  room,
  onSave,
}: CollectionFormModalProps) {
  const [formData, setFormData] = useState({
    // Thời gian
    period_start: '',
    period_end: '',

    // Tiền phòng
    rent_amount: room?.current_contract?.monthly_rent || 0,

    // Tiền điện
    electricity_calculation_type: 'meter', // "meter" or "flat"
    electricity_previous_reading: 0,
    electricity_current_reading: 0,
    electricity_unit_price: 4000,
    electricity_amount: 0,
    electricity_note: '',

    // Tiền nước
    water_calculation_type: 'meter', // "meter" or "flat"
    water_previous_reading: 0,
    water_current_reading: 0,
    water_unit_price: 11000,
    water_amount: 0,
    water_note: '',

    // Internet
    internet_amount: 50000,
    internet_note: '',

    // Rác
    trash_amount: 20000,
    trash_note: '',

    // Ghi chú
    notes: '',
  })

  // State cho các khoản phí thêm (removed unused state)
  // const [additionalFees, setAdditionalFees] = useState<Array<{
  //   id: string
  //   name: string
  //   amount: number
  //   note: string
  // }>>([])

  // Tự động set thời gian tính phí (30 ngày trước đến ngày hiện tại)
  useEffect(() => {
    if (isOpen) {
      const today = new Date()
      const dayOfMonth = today.getDate()

      let periodStart: Date
      let periodEnd: Date

      if (dayOfMonth === 30 || dayOfMonth === 31) {
        // Nếu ngày hiện tại là 30 hoặc 31, thì tính từ ngày 1 tháng này đến ngày 30/31
        periodStart = startOfMonth(today)
        periodEnd = today
      } else {
        // Ngược lại tính 30 ngày trước
        periodEnd = today
        periodStart = subDays(today, 29) // 30 ngày bao gồm cả ngày hiện tại
      }

      setFormData(prev => ({
        ...prev,
        period_start: format(periodStart, 'yyyy-MM-dd'),
        period_end: format(periodEnd, 'yyyy-MM-dd'),
        rent_amount: room?.current_contract?.monthly_rent || 0,
      }))
    }
  }, [isOpen, room])

  // Tính toán thành tiền điện
  useEffect(() => {
    if (formData.electricity_calculation_type === 'meter') {
      const usage = Math.max(
        0,
        formData.electricity_current_reading -
          formData.electricity_previous_reading
      )
      const amount = usage * formData.electricity_unit_price
      setFormData(prev => ({ ...prev, electricity_amount: amount }))
    }
  }, [
    formData.electricity_calculation_type,
    formData.electricity_previous_reading,
    formData.electricity_current_reading,
    formData.electricity_unit_price,
  ])

  // Tính toán thành tiền nước
  useEffect(() => {
    if (formData.water_calculation_type === 'meter') {
      const usage = Math.max(
        0,
        formData.water_current_reading - formData.water_previous_reading
      )
      const amount = usage * formData.water_unit_price
      setFormData(prev => ({ ...prev, water_amount: amount }))
    }
  }, [
    formData.water_calculation_type,
    formData.water_previous_reading,
    formData.water_current_reading,
    formData.water_unit_price,
  ])

  // Tính tổng cộng
  const totalAmount =
    formData.rent_amount +
    formData.electricity_amount +
    formData.water_amount +
    formData.internet_amount +
    formData.trash_amount

  const handleInputChange =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value =
        e.target.type === 'number'
          ? parseFloat(e.target.value) || 0
          : e.target.value
      setFormData(prev => ({ ...prev, [field]: value }))
    }

  const handleRadioChange = (field: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    const invoice: Partial<RentalInvoice> = {
      room_id: room?.id || '',
      tenant_id: room?.current_contract?.tenant?.id || '',
      period_start: formData.period_start,
      period_end: formData.period_end,
      rent_amount: formData.rent_amount,
      electricity_previous_reading: formData.electricity_previous_reading,
      electricity_current_reading: formData.electricity_current_reading,
      electricity_unit_price: formData.electricity_unit_price,
      electricity_amount: formData.electricity_amount,
      electricity_note: formData.electricity_note,
      water_previous_reading: formData.water_previous_reading,
      water_current_reading: formData.water_current_reading,
      water_unit_price: formData.water_unit_price,
      water_amount: formData.water_amount,
      water_note: formData.water_note,
      internet_amount: formData.internet_amount,
      internet_note: formData.internet_note,
      trash_amount: formData.trash_amount,
      trash_note: formData.trash_note,
      total_amount: totalAmount,
      notes: formData.notes,
      status: 'draft' as const,
      template_type: 'professional' as const,
    }

    onSave?.(invoice)
    onClose()
  }

  if (!room?.current_contract?.tenant) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Không thể tạo hóa đơn</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">Phòng này chưa có người thuê.</p>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="bg-gradient-to-r from-cyan-500 to-red-400 text-white p-4 rounded-t-lg -m-6 mb-4">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl">Thu tiền phòng</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-auto max-h-[calc(90vh-120px)] space-y-6">
          {/* Thông tin cơ bản */}
          <Card className="p-4 border-l-4 border-l-cyan-400 bg-cyan-50">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-cyan-700 font-medium">
                  Người thuê:{' '}
                  <span className="text-cyan-900 font-semibold">
                    {room.current_contract.tenant.full_name}
                  </span>
                </p>
                <p className="text-cyan-700">
                  Phòng:{' '}
                  <span className="text-cyan-900 font-semibold">
                    {room.room_number} - Lầu {room.floor || 'N/A'}
                  </span>
                </p>
                <p className="text-cyan-700">
                  Nhà:{' '}
                  <span className="text-cyan-900">
                    {room.property?.name}, {room.property?.address}
                  </span>
                </p>
              </div>
              <div>
                <Label className="text-red-700 flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" />
                  Thời gian tính phí
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-600">Từ ngày:</Label>
                    <Input
                      type="date"
                      value={formData.period_start}
                      onChange={handleInputChange('period_start')}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Đến ngày:</Label>
                    <Input
                      type="date"
                      value={formData.period_end}
                      onChange={handleInputChange('period_end')}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tiền điện */}
            <Card className="p-4 border-l-4 border-l-orange-400">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-orange-700">Tiền điện</h3>
              </div>

              <RadioGroup
                value={formData.electricity_calculation_type}
                onValueChange={handleRadioChange(
                  'electricity_calculation_type'
                )}
                className="mb-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="meter" id="elec-meter" />
                  <Label htmlFor="elec-meter" className="text-sm">
                    Theo chỉ số tiêu thụ
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="flat" id="elec-flat" />
                  <Label htmlFor="elec-flat" className="text-sm">
                    Nhập trực tiếp số tiền
                  </Label>
                </div>
              </RadioGroup>

              {formData.electricity_calculation_type === 'meter' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-gray-600">
                        Chỉ số cũ:
                      </Label>
                      <Input
                        type="number"
                        placeholder="kWh"
                        value={formData.electricity_previous_reading}
                        onChange={handleInputChange(
                          'electricity_previous_reading'
                        )}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">
                        Chỉ số mới:
                      </Label>
                      <Input
                        type="number"
                        placeholder="kWh"
                        value={formData.electricity_current_reading}
                        onChange={handleInputChange(
                          'electricity_current_reading'
                        )}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-gray-600">
                        Đơn giá (VNĐ/kWh):
                      </Label>
                      <Input
                        type="number"
                        value={formData.electricity_unit_price}
                        onChange={handleInputChange('electricity_unit_price')}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">
                        Thành tiền:
                      </Label>
                      <div className="p-2 bg-blue-50 rounded text-sm font-medium text-blue-700">
                        {formData.electricity_amount.toLocaleString('vi-VN')}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <Label className="text-xs text-gray-600">Thành tiền:</Label>
                  <Input
                    type="number"
                    value={formData.electricity_amount}
                    onChange={handleInputChange('electricity_amount')}
                    className="text-sm"
                  />
                </div>
              )}

              <div className="mt-3">
                <Label className="text-xs text-gray-600 flex items-center gap-1">
                  <span className="text-orange-500">📝</span>
                  Lưu ý tiền điện:
                </Label>
                <Textarea
                  placeholder="Ghi chú về tiền điện (tùy chọn)"
                  value={formData.electricity_note}
                  onChange={handleInputChange('electricity_note')}
                  className="text-sm mt-1 h-16 resize-none"
                />
              </div>
            </Card>

            {/* Tiền nước */}
            <Card className="p-4 border-l-4 border-l-blue-400">
              <div className="flex items-center gap-2 mb-4">
                <Droplet className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-blue-700">Tiền nước</h3>
              </div>

              <RadioGroup
                value={formData.water_calculation_type}
                onValueChange={handleRadioChange('water_calculation_type')}
                className="mb-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="meter" id="water-meter" />
                  <Label htmlFor="water-meter" className="text-sm">
                    Theo chỉ số tiêu thụ
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="flat" id="water-flat" />
                  <Label htmlFor="water-flat" className="text-sm">
                    Nhập trực tiếp số tiền
                  </Label>
                </div>
              </RadioGroup>

              {formData.water_calculation_type === 'meter' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-gray-600">
                        Chỉ số cũ:
                      </Label>
                      <Input
                        type="number"
                        placeholder="m³"
                        value={formData.water_previous_reading}
                        onChange={handleInputChange('water_previous_reading')}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">
                        Chỉ số mới:
                      </Label>
                      <Input
                        type="number"
                        placeholder="m³"
                        value={formData.water_current_reading}
                        onChange={handleInputChange('water_current_reading')}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-gray-600">
                        Đơn giá (VNĐ/m³):
                      </Label>
                      <Input
                        type="number"
                        value={formData.water_unit_price}
                        onChange={handleInputChange('water_unit_price')}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">
                        Thành tiền:
                      </Label>
                      <div className="p-2 bg-blue-50 rounded text-sm font-medium text-blue-700">
                        {formData.water_amount.toLocaleString('vi-VN')}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <Label className="text-xs text-gray-600">Thành tiền:</Label>
                  <Input
                    type="number"
                    value={formData.water_amount}
                    onChange={handleInputChange('water_amount')}
                    className="text-sm"
                  />
                </div>
              )}

              <div className="mt-3">
                <Label className="text-xs text-gray-600 flex items-center gap-1">
                  <span className="text-blue-500">📝</span>
                  Lưu ý tiền nước:
                </Label>
                <Textarea
                  placeholder="Ghi chú về tiền nước (tùy chọn)"
                  value={formData.water_note}
                  onChange={handleInputChange('water_note')}
                  className="text-sm mt-1 h-16 resize-none"
                />
              </div>
            </Card>

            {/* Khoản thu khác */}
            <Card className="p-4 border-l-4 border-l-green-400">
              <div className="flex items-center gap-2 mb-4">
                <Home className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-green-700">Khoản thu khác</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-gray-600 flex items-center gap-1">
                    <Home className="w-3 h-3" />
                    Tiền phòng (VNĐ):
                  </Label>
                  <Input
                    type="number"
                    value={formData.rent_amount}
                    onChange={handleInputChange('rent_amount')}
                    className="text-sm mt-1 bg-green-50 font-semibold"
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-600 flex items-center gap-1">
                    <Trash2 className="w-3 h-3" />
                    Tiền rác (VNĐ):
                  </Label>
                  <Input
                    type="number"
                    value={formData.trash_amount}
                    onChange={handleInputChange('trash_amount')}
                    className="text-sm mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-600 flex items-center gap-1">
                    <Wifi className="w-3 h-3" />
                    Tiền Internet (VNĐ):
                  </Label>
                  <Input
                    type="number"
                    value={formData.internet_amount}
                    onChange={handleInputChange('internet_amount')}
                    className="text-sm mt-1"
                  />
                </div>
              </div>

              <div className="mt-3">
                <Label className="text-xs text-gray-600 flex items-center gap-1">
                  <span className="text-green-500">📝</span>
                  Lưu ý khoản thu khác:
                </Label>
                <Textarea
                  placeholder="Ghi chú về khoản thu khác (tùy chọn)"
                  value={formData.notes}
                  onChange={handleInputChange('notes')}
                  className="text-sm mt-1 h-16 resize-none"
                />
              </div>
            </Card>
          </div>

          {/* Tổng cộng */}
          <Card className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-pink-600" />
                <h3 className="text-lg font-bold text-pink-700">Tổng cộng</h3>
              </div>
              <div className="text-2xl font-bold text-pink-600 bg-white px-4 py-2 rounded-lg shadow">
                {totalAmount.toLocaleString('vi-VN')} VNĐ
              </div>
            </div>
          </Card>
        </div>

        <Separator />

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
          >
            <Save className="w-4 h-4 mr-2" />
            Lưu khoản thu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
