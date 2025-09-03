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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
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
  Plus,
  Minus,
  Building2,
  User,
  Receipt,
  Settings,
  Clock,
  RefreshCw,
} from 'lucide-react'
import type { RentalInvoice, Room, Tenant } from '@/types/database'

interface CollectionFormModalProps {
  isOpen: boolean
  onClose: () => void
  room?: {
    id: string
    room_number?: string
    rent_amount?: number
    property?: { name: string; address?: string }
    current_contract?: {
      tenant?: Tenant
      monthly_rent: number
    }
  }
  onSave?: (invoice: Partial<RentalInvoice>) => void
}

interface AdditionalFee {
  id: string
  name: string
  amount: number
  note: string
}

export function CollectionFormModal({
  isOpen,
  onClose,
  room,
  onSave,
}: CollectionFormModalProps) {
  const [formData, setFormData] = useState({
    period_start: '',
    period_end: '',
    rent_amount: room?.current_contract?.monthly_rent || 0,
    electricity_calculation_type: 'meter',
    electricity_previous_reading: 0,
    electricity_current_reading: 0,
    electricity_unit_price: 4000,
    electricity_amount: 0,
    electricity_note: '',
    water_calculation_type: 'meter',
    water_previous_reading: 0,
    water_current_reading: 0,
    water_unit_price: 11000,
    water_amount: 0,
    water_note: '',
    internet_amount: 50000,
    internet_note: '',
    trash_amount: 20000,
    trash_note: '',
    notes: '',
    // Thêm tính năng chu kỳ thu tiền
    collection_day: 24, // Ngày trong tháng (1-31)
    auto_period: true, // Tự động tính thời gian dựa trên ngày thu
    auto_load_readings: true, // Tự động lấy chỉ số từ hóa đơn trước
  })

  const [additionalFees, setAdditionalFees] = useState<AdditionalFee[]>([])
  const [lastInvoice, setLastInvoice] = useState<any>(null)

  // Load previous invoice data and auto set period dates
  useEffect(() => {
    if (isOpen && room?.id) {
      // Load last invoice to get previous readings
      fetchLastInvoice()
      
      const today = new Date()
      const collectionDay = formData.collection_day
      
      let periodStart: Date
      let periodEnd: Date
      
      if (formData.auto_period) {
        // Tính chu kỳ dựa trên ngày thu cố định
        const currentMonth = today.getMonth()
        const currentYear = today.getFullYear()
        
        // Nếu hôm nay >= ngày thu, chu kỳ từ tháng trước đến tháng này
        // Nếu hôm nay < ngày thu, chu kỳ từ 2 tháng trước đến tháng trước
        if (today.getDate() >= collectionDay) {
          periodEnd = new Date(currentYear, currentMonth, collectionDay)
          periodStart = new Date(currentYear, currentMonth - 1, collectionDay + 1)
        } else {
          periodEnd = new Date(currentYear, currentMonth - 1, collectionDay)
          periodStart = new Date(currentYear, currentMonth - 2, collectionDay + 1)
        }
      } else {
        // Logic cũ
        const dayOfMonth = today.getDate()
        if (dayOfMonth >= 28) {
          periodStart = startOfMonth(today)
          periodEnd = today
        } else {
          periodEnd = today
          periodStart = subDays(today, 29)
        }
      }

      setFormData(prev => ({
        ...prev,
        period_start: format(periodStart, 'yyyy-MM-dd'),
        period_end: format(periodEnd, 'yyyy-MM-dd'),
        rent_amount: room?.current_contract?.monthly_rent || 0,
      }))

      // Reset additional fees when modal opens
      setAdditionalFees([])
    }
  }, [isOpen, room?.id]) // Chỉ phụ thuộc vào isOpen và room?.id

  // Calculate electricity amount
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

  // Calculate water amount
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

  // Calculate total amount
  const totalAmount =
    formData.rent_amount +
    formData.electricity_amount +
    formData.water_amount +
    formData.internet_amount +
    formData.trash_amount +
    additionalFees.reduce((sum, fee) => sum + fee.amount, 0)

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

  const addAdditionalFee = () => {
    const newFee: AdditionalFee = {
      id: Date.now().toString(),
      name: '',
      amount: 0,
      note: '',
    }
    setAdditionalFees(prev => [...prev, newFee])
  }

  const removeAdditionalFee = (id: string) => {
    setAdditionalFees(prev => prev.filter(fee => fee.id !== id))
  }

  const updateAdditionalFee = (
    id: string,
    field: keyof Omit<AdditionalFee, 'id'>,
    value: string | number
  ) => {
    setAdditionalFees(prev =>
      prev.map(fee => (fee.id === id ? { ...fee, [field]: value } : fee))
    )
  }

  // Fetch last invoice to get previous readings
  const fetchLastInvoice = async () => {
    if (!room?.id) return
    
    try {
      const response = await fetch(`/api/invoices/by-room/${room.id}?limit=1`)
      const result = await response.json()
      
      if (result.success && result.data.length > 0) {
        const lastInv = result.data[0]
        setLastInvoice(lastInv)
        
        // Auto load previous readings - sẽ được thực hiện khi toggle được bật
      }
    } catch (error) {
      console.error('Error fetching last invoice:', error)
    }
  }
  
  // Auto load readings when toggle is enabled
  useEffect(() => {
    if (formData.auto_load_readings && lastInvoice) {
      setFormData(prev => ({
        ...prev,
        electricity_previous_reading: lastInvoice.electricity_current_reading || 0,
        water_previous_reading: lastInvoice.water_current_reading || 0,
        electricity_unit_price: lastInvoice.electricity_unit_price || 4000,
        water_unit_price: lastInvoice.water_unit_price || 11000,
      }))
    }
  }, [formData.auto_load_readings, lastInvoice])
  
  // Update period when collection day or auto period changes
  useEffect(() => {
    if (formData.auto_period && isOpen) {
      const today = new Date()
      const collectionDay = formData.collection_day
      const currentMonth = today.getMonth()
      const currentYear = today.getFullYear()
      
      let periodStart: Date
      let periodEnd: Date
      
      if (today.getDate() >= collectionDay) {
        periodEnd = new Date(currentYear, currentMonth, collectionDay)
        periodStart = new Date(currentYear, currentMonth - 1, collectionDay + 1)
      } else {
        periodEnd = new Date(currentYear, currentMonth - 1, collectionDay)
        periodStart = new Date(currentYear, currentMonth - 2, collectionDay + 1)
      }
      
      setFormData(prev => ({
        ...prev,
        period_start: format(periodStart, 'yyyy-MM-dd'),
        period_end: format(periodEnd, 'yyyy-MM-dd'),
      }))
    }
  }, [formData.auto_period, formData.collection_day, isOpen])
  

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
      other_fees: additionalFees.map(fee => ({
        name: fee.name,
        amount: fee.amount,
        note: fee.note,
      })),
    }

    onSave?.(invoice)
    onClose()
  }

  if (!room?.current_contract?.tenant) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <X className="w-5 h-5" />
              Không thể tạo hóa đơn
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-gray-600">Phòng này chưa có người thuê.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="!max-w-[92vw] !w-[92vw] !max-h-[92vh] !h-[92vh] flex flex-col overflow-auto bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 border-0 p-0 rounded-xl shadow-2xl"
        showCloseButton={false}
        style={{
          maxWidth: '92vw',
          width: '92vw',
          maxHeight: '92vh',
          height: '92vh',
        }}
      >
        {/* Content Container - everything scrolls together */}
        <div className="flex flex-col w-full h-full overflow-auto">
          {/* Professional Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-4 md:p-5 text-white relative overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                    <Receipt className="w-8 h-8" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold mb-1">
                      Tạo khoản thu mới
                    </DialogTitle>
                    <p className="text-blue-100">
                      Quản lý chi phí và thu tiền phòng trọ
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white hover:bg-white/20 rounded-xl"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              {/* Tenant and Room Header */}
              <div className="mt-4">
                {/* Tên người thuê - Phòng số (theo yêu cầu) */}
                <div className="bg-green-400 rounded-2xl p-5 text-center" style={{backgroundColor: '#4ade80'}}>
                  <h2 className="text-2xl font-bold text-green-900 mb-2">
                    {room.current_contract.tenant.full_name} – Phòng Số {room.room_number}
                  </h2>
                  <p className="text-green-800 text-base font-medium">
                    {room.property?.address}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 md:p-5 space-y-5">
            {/* Auto Settings */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Cài đặt tự động
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <div>
                      <Label className="text-sm font-medium">Tự động tính chu kỳ</Label>
                      <p className="text-xs text-gray-500">Dựa trên ngày thu</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.auto_period}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, auto_period: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 text-blue-600" />
                    <div>
                      <Label className="text-sm font-medium">Tự động lấy chỉ số</Label>
                      <p className="text-xs text-gray-500">Từ hóa đơn trước</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.auto_load_readings}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, auto_load_readings: checked }))
                    }
                  />
                </div>

                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <Label className="text-sm font-medium">Ngày thu hằng tháng</Label>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.collection_day}
                    onChange={handleInputChange('collection_day')}
                    className="h-10 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="Ngày (1-31)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ví dụ: 24 = thu từ 25/8 đến 24/9
                  </p>
                </div>
              </div>

              {/* Thông tin hóa đơn trước */}
              {lastInvoice && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Receipt className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Hóa đơn gần nhất (ngày {new Date(lastInvoice.created_at).toLocaleDateString('vi-VN')})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Điện:</span> {lastInvoice.electricity_current_reading} kWh
                    </div>
                    <div>
                      <span className="text-gray-500">Nước:</span> {lastInvoice.water_current_reading} m³
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Kỳ thanh toán - Đơn giản */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                    Từ ngày
                  </Label>
                  <Input
                    type="date"
                    value={formData.period_start}
                    onChange={handleInputChange('period_start')}
                    disabled={formData.auto_period}
                    className="h-12 rounded-xl border-2 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-60"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                    Đến ngày
                  </Label>
                  <Input
                    type="date"
                    value={formData.period_end}
                    onChange={handleInputChange('period_end')}
                    disabled={formData.auto_period}
                    className="h-12 rounded-xl border-2 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-60"
                  />
                </div>
              </div>
            </Card>

            {/* Service Fees Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Electricity */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-4 text-white">
                  <div className="flex items-center gap-3">
                    <Zap className="w-6 h-6" />
                    <h3 className="font-semibold text-lg">Tiền điện</h3>
                  </div>
                </div>

                <div className="p-4 space-y-4 text-gray-900 dark:text-white">
                  <RadioGroup
                    value={formData.electricity_calculation_type}
                    onValueChange={handleRadioChange(
                      'electricity_calculation_type'
                    )}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="meter" id="elec-meter" />
                      <Label
                        htmlFor="elec-meter"
                        className="text-sm font-medium"
                      >
                        Theo chỉ số
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="flat" id="elec-flat" />
                      <Label
                        htmlFor="elec-flat"
                        className="text-sm font-medium"
                      >
                        Số tiền cố định
                      </Label>
                    </div>
                  </RadioGroup>

                  {formData.electricity_calculation_type === 'meter' ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs font-medium text-gray-600">
                            Chỉ số cũ (kWh)
                          </Label>
                          <Input
                            type="number"
                            value={formData.electricity_previous_reading}
                            onChange={handleInputChange(
                              'electricity_previous_reading'
                            )}
                            className="mt-1 h-10 rounded-lg"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-600">
                            Chỉ số mới (kWh)
                          </Label>
                          <Input
                            type="number"
                            value={formData.electricity_current_reading}
                            onChange={handleInputChange(
                              'electricity_current_reading'
                            )}
                            className="mt-1 h-10 rounded-lg"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-600">
                          Đơn giá (VNĐ/kWh)
                        </Label>
                        <Input
                          type="number"
                          value={formData.electricity_unit_price}
                          onChange={handleInputChange('electricity_unit_price')}
                          className="mt-1 h-10 rounded-lg"
                        />
                      </div>
                      <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                        <p className="text-xs text-orange-600 mb-1">
                          Thành tiền
                        </p>
                        <p className="font-bold text-lg text-orange-700">
                          {formData.electricity_amount.toLocaleString('vi-VN')}{' '}
                          đ
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label className="text-xs font-medium text-gray-600">
                        Thành tiền (VNĐ)
                      </Label>
                      <Input
                        type="number"
                        value={formData.electricity_amount}
                        onChange={handleInputChange('electricity_amount')}
                        className="mt-1 h-10 rounded-lg"
                      />
                    </div>
                  )}

                  <Textarea
                    placeholder="Ghi chú về tiền điện..."
                    value={formData.electricity_note}
                    onChange={handleInputChange('electricity_note')}
                    className="h-16 resize-none rounded-lg"
                  />
                </div>
              </Card>

              {/* Water */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 text-white">
                  <div className="flex items-center gap-3">
                    <Droplet className="w-6 h-6" />
                    <h3 className="font-semibold text-lg">Tiền nước</h3>
                  </div>
                </div>

                <div className="p-4 space-y-4 text-gray-900 dark:text-white">
                  <RadioGroup
                    value={formData.water_calculation_type}
                    onValueChange={handleRadioChange('water_calculation_type')}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="meter" id="water-meter" />
                      <Label
                        htmlFor="water-meter"
                        className="text-sm font-medium"
                      >
                        Theo chỉ số
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="flat" id="water-flat" />
                      <Label
                        htmlFor="water-flat"
                        className="text-sm font-medium"
                      >
                        Số tiền cố định
                      </Label>
                    </div>
                  </RadioGroup>

                  {formData.water_calculation_type === 'meter' ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs font-medium text-gray-600">
                            Chỉ số cũ (m³)
                          </Label>
                          <Input
                            type="number"
                            value={formData.water_previous_reading}
                            onChange={handleInputChange(
                              'water_previous_reading'
                            )}
                            className="mt-1 h-10 rounded-lg"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-600">
                            Chỉ số mới (m³)
                          </Label>
                          <Input
                            type="number"
                            value={formData.water_current_reading}
                            onChange={handleInputChange(
                              'water_current_reading'
                            )}
                            className="mt-1 h-10 rounded-lg"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-600">
                          Đơn giá (VNĐ/m³)
                        </Label>
                        <Input
                          type="number"
                          value={formData.water_unit_price}
                          onChange={handleInputChange('water_unit_price')}
                          className="mt-1 h-10 rounded-lg"
                        />
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-600 mb-1">Thành tiền</p>
                        <p className="font-bold text-lg text-blue-700">
                          {formData.water_amount.toLocaleString('vi-VN')} đ
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label className="text-xs font-medium text-gray-600">
                        Thành tiền (VNĐ)
                      </Label>
                      <Input
                        type="number"
                        value={formData.water_amount}
                        onChange={handleInputChange('water_amount')}
                        className="mt-1 h-10 rounded-lg"
                      />
                    </div>
                  )}

                  <Textarea
                    placeholder="Ghi chú về tiền nước..."
                    value={formData.water_note}
                    onChange={handleInputChange('water_note')}
                    className="h-16 resize-none rounded-lg"
                  />
                </div>
              </Card>

              {/* Other Services */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 text-white">
                  <div className="flex items-center gap-3">
                    <Home className="w-6 h-6" />
                    <h3 className="font-semibold text-lg">Dịch vụ khác</h3>
                  </div>
                </div>

                <div className="p-4 space-y-4 text-gray-900 dark:text-white">
                  <div>
                    <Label className="text-xs font-medium text-gray-600 flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      Tiền phòng (VNĐ)
                    </Label>
                    <Input
                      type="number"
                      value={formData.rent_amount}
                      onChange={handleInputChange('rent_amount')}
                      className="mt-1 h-10 rounded-lg bg-green-50 font-semibold"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-600 flex items-center gap-2">
                      <Wifi className="w-4 h-4" />
                      Internet (VNĐ)
                    </Label>
                    <Input
                      type="number"
                      value={formData.internet_amount}
                      onChange={handleInputChange('internet_amount')}
                      className="mt-1 h-10 rounded-lg"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-600 flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Rác (VNĐ)
                    </Label>
                    <Input
                      type="number"
                      value={formData.trash_amount}
                      onChange={handleInputChange('trash_amount')}
                      className="mt-1 h-10 rounded-lg"
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Additional Fees */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Chi phí bổ sung
                  </h3>
                </div>
                <Button
                  onClick={addAdditionalFee}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm chi phí
                </Button>
              </div>

              {additionalFees.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Plus className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p>Chưa có chi phí bổ sung nào</p>
                  <p className="text-sm">
                    Nhấn &quot;Thêm chi phí&quot; để thêm khoản thu khác
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {additionalFees.map(fee => (
                    <div
                      key={fee.id}
                      className="flex gap-3 p-3 bg-purple-50 rounded-xl border border-purple-200"
                    >
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <Input
                          placeholder="Tên chi phí"
                          value={fee.name}
                          onChange={e =>
                            updateAdditionalFee(fee.id, 'name', e.target.value)
                          }
                          className="rounded-lg"
                        />
                        <Input
                          type="number"
                          placeholder="Số tiền"
                          value={fee.amount}
                          onChange={e =>
                            updateAdditionalFee(
                              fee.id,
                              'amount',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="rounded-lg"
                        />
                        <Input
                          placeholder="Ghi chú"
                          value={fee.note}
                          onChange={e =>
                            updateAdditionalFee(fee.id, 'note', e.target.value)
                          }
                          className="rounded-lg"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeAdditionalFee(fee.id)}
                        className="text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Notes */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-gray-500 to-slate-500 rounded-xl">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Ghi chú chung
                </h3>
              </div>
              <Textarea
                placeholder="Ghi chú về khoản thu này..."
                value={formData.notes}
                onChange={handleInputChange('notes')}
                className="h-24 resize-none rounded-xl"
              />
            </Card>

            {/* Total Summary */}
            <Card className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white rounded-2xl shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Calculator className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Tổng cộng</h3>
                    <p className="text-indigo-100">Tổng số tiền cần thu</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">
                    {totalAmount.toLocaleString('vi-VN')} đ
                  </div>
                  <p className="text-indigo-100 text-sm">VNĐ</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Footer */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t dark:border-gray-700 p-4 md:p-5 flex-shrink-0">
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={onClose}
                className="h-10 px-5 rounded-xl font-semibold"
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={handleSave}
                className="h-10 px-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg"
              >
                <Save className="w-5 h-5 mr-2" />
                Lưu khoản thu
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
