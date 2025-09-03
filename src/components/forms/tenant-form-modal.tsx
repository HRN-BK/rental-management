'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Plus,
  Edit3,
  Loader2,
  User,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  MapPin,
  Briefcase,
  UserCheck,
  PhoneCall,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import { createTenant, updateTenant } from '@/lib/database'
import type { Tenant, CreateTenantForm } from '@/types/database'
import { formatPrice, formatDate } from '@/lib/utils'

const tenantFormSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Họ tên là bắt buộc')
    .max(100, 'Họ tên không được vượt quá 100 ký tự'),
  phone: z
    .string()
    .optional()
    .refine(
      val => {
        if (!val || val.trim() === '') return true
        const phoneRegex = /^[0-9]{10,11}$/
        return phoneRegex.test(val)
      },
      {
        message: 'Số điện thoại phải có 10-11 số',
      }
    ),
  email: z
    .string()
    .optional()
    .refine(
      val => {
        if (!val || val.trim() === '') return true
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(val)
      },
      {
        message: 'Email không hợp lệ',
      }
    ),
  id_number: z
    .string()
    .optional()
    .refine(
      val => {
        if (!val || val.trim() === '') return true
        const idRegex = /^[0-9]{9,12}$/
        return idRegex.test(val)
      },
      {
        message: 'CMND/CCCD phải có 9-12 số',
      }
    ),
  birth_date: z.string().optional(),
  address: z.string().optional(),
  occupation: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z
    .string()
    .optional()
    .refine(
      val => {
        if (!val || val.trim() === '') return true
        const phoneRegex = /^[0-9]{10,11}$/
        return phoneRegex.test(val)
      },
      {
        message: 'Số điện thoại phải có 10-11 số',
      }
    ),
  notes: z.string().optional(),
})

type TenantFormData = z.infer<typeof tenantFormSchema>

interface TenantFormModalProps {
  tenant?: Tenant & {
    current_contract?: {
      id: string
      monthly_rent: number
      deposit_amount?: number
      start_date: string
      end_date?: string
      status: string
      room?: {
        room_number: string
        property?: { name: string }
      }
    }
  }
  onSuccess?: () => void
  trigger?: React.ReactNode
  mode?: 'create' | 'edit'
}

export function TenantFormModal({
  tenant,
  onSuccess,
  trigger,
  mode = tenant ? 'edit' : 'create',
}: TenantFormModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<TenantFormData>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      full_name: tenant?.full_name || '',
      phone: tenant?.phone || '',
      email: tenant?.email || '',
      id_number: tenant?.id_number || '',
      birth_date: tenant?.birth_date || '',
      address: tenant?.address || '',
      occupation: tenant?.occupation || '',
      emergency_contact: tenant?.emergency_contact || '',
      emergency_phone: tenant?.emergency_phone || '',
      notes: tenant?.notes || '',
    },
  })

  const onSubmit = async (data: TenantFormData) => {
    try {
      setIsSubmitting(true)

      const tenantData: CreateTenantForm = {
        full_name: data.full_name,
        phone: data.phone || undefined,
        email: data.email || undefined,
        id_number: data.id_number || undefined,
        birth_date: data.birth_date || undefined,
        address: data.address || undefined,
        occupation: data.occupation || undefined,
        emergency_contact: data.emergency_contact || undefined,
        emergency_phone: data.emergency_phone || undefined,
        notes: data.notes || undefined,
      }

      if (mode === 'edit' && tenant) {
        await updateTenant(tenant.id, tenantData)
        toast.success('Đã cập nhật thông tin người thuê thành công')
      } else {
        await createTenant(tenantData)
        toast.success('Đã thêm người thuê thành công')
      }

      setOpen(false)
      form.reset()
      onSuccess?.()
    } catch (error) {
      console.error('Error saving tenant:', error)
      toast.error(
        mode === 'edit'
          ? 'Không thể cập nhật thông tin người thuê. Vui lòng thử lại.'
          : 'Không thể thêm người thuê. Vui lòng thử lại.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      form.reset()
    }
  }

  const defaultTrigger = (
    <Button
      className={mode === 'edit' ? 'h-8 px-3' : 'bg-blue-500 hover:bg-blue-600'}
    >
      {mode === 'edit' ? (
        <>
          <Edit3 className="w-4 h-4 mr-2" />
          Chỉnh sửa
        </>
      ) : (
        <>
          <Plus className="w-4 h-4 mr-2" />
          Thêm người thuê
        </>
      )}
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[95vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit'
              ? 'Chỉnh sửa thông tin người thuê'
              : 'Thêm người thuê mới'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Cập nhật thông tin người thuê. Nhấn lưu khi hoàn tất.'
              : 'Thêm người thuê mới vào hệ thống. Điền đầy đủ thông tin bên dưới.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b pb-2">
                <User className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold">Thông tin cá nhân</h3>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {/* Full Name */}
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>Họ và tên *</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="VD: Nguyễn Văn A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone and Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>Số điện thoại</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="VD: 0901234567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Mail className="w-4 h-4" />
                          <span>Email</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="VD: nguyenvana@email.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* ID Number and Birth Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="id_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <CreditCard className="w-4 h-4" />
                          <span>CMND/CCCD</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="VD: 079123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="birth_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Ngày sinh</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Address and Occupation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>Địa chỉ thường trú</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="VD: 123 Đường ABC, Quận 1, TP.HCM"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="occupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Briefcase className="w-4 h-4" />
                          <span>Nghề nghiệp</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="VD: Kỹ sư, Nhân viên văn phòng"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b pb-2">
                <UserCheck className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-semibold">Liên hệ khẩn cấp</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emergency_contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <UserCheck className="w-4 h-4" />
                        <span>Người liên hệ khẩn cấp</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="VD: Nguyễn Thị B (mẹ)" {...field} />
                      </FormControl>
                      <FormDescription>
                        Họ tên và mối quan hệ với người thuê
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergency_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <PhoneCall className="w-4 h-4" />
                        <span>Số điện thoại khẩn cấp</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="VD: 0987654321" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ghi chú</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ghi chú về người thuê, yêu cầu đặc biệt, lưu ý..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Thông tin bổ sung về người thuê (tùy chọn)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contract Information Section (Read-only) */}
            {mode === 'edit' && tenant?.current_contract && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 border-b pb-2">
                  <FileText className="w-5 h-5 text-green-500" />
                  <h3 className="text-lg font-semibold">
                    Thông tin hợp đồng hiện tại
                  </h3>
                  <span className="text-sm text-gray-500">(Chỉ đọc)</span>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Phòng thuê
                      </label>
                      <div className="mt-1 text-gray-900 dark:text-white">
                        {tenant.current_contract.room?.property?.name} - Phòng{' '}
                        {tenant.current_contract.room?.room_number}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Tiền thuê/tháng
                      </label>
                      <div className="mt-1 text-green-600 dark:text-green-400 font-semibold">
                        {formatPrice(tenant.current_contract.monthly_rent)} VNĐ
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Tiền cọc
                      </label>
                      <div className="mt-1 text-orange-600 dark:text-orange-400 font-semibold">
                        {tenant.current_contract.deposit_amount
                          ? formatPrice(
                              tenant.current_contract.deposit_amount
                            ) + ' VNĐ'
                          : 'Chưa có'}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Ngày trả tiền
                      </label>
                      <div className="mt-1 text-gray-900 dark:text-white">
                        Mỗi tháng ngày{' '}
                        {new Date(tenant.current_contract.start_date).getDate()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Ngày bắt đầu
                      </label>
                      <div className="mt-1 text-gray-900 dark:text-white">
                        {formatDate(tenant.current_contract.start_date)}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Ngày kết thúc
                      </label>
                      <div className="mt-1 text-gray-900 dark:text-white">
                        {tenant.current_contract.end_date
                          ? formatDate(tenant.current_contract.end_date)
                          : 'Không xác định'}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <strong>Lưu ý:</strong> Để cập nhật thông tin hợp đồng,
                      vui lòng sử dụng chức năng quản lý hợp đồng riêng.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {mode === 'edit' ? 'Đang cập nhật...' : 'Đang thêm...'}
                  </>
                ) : mode === 'edit' ? (
                  'Lưu thay đổi'
                ) : (
                  'Thêm người thuê'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
