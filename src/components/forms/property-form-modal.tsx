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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Plus, Edit3, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createProperty, updateProperty } from '@/lib/database'
import type { Property, CreatePropertyForm } from '@/types/database'

const propertyFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Tên nhà cho thuê là bắt buộc')
    .max(100, 'Tên không được vượt quá 100 ký tự'),
  address: z
    .string()
    .min(1, 'Địa chỉ là bắt buộc')
    .max(200, 'Địa chỉ không được vượt quá 200 ký tự'),
  city: z
    .string()
    .min(1, 'Thành phố là bắt buộc')
    .max(50, 'Tên thành phố không được vượt quá 50 ký tự'),
  district: z.string().optional(),
  description: z.string().optional(),
})

type PropertyFormData = z.infer<typeof propertyFormSchema>

interface PropertyFormModalProps {
  property?: Property
  onSuccess?: () => void
  trigger?: React.ReactNode
  mode?: 'create' | 'edit'
}

export function PropertyFormModal({
  property,
  onSuccess,
  trigger,
  mode = property ? 'edit' : 'create',
}: PropertyFormModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      name: property?.name || '',
      address: property?.address || '',
      city: property?.city || '',
      district: property?.district || '',
      description: property?.description || '',
    },
  })

  const onSubmit = async (data: PropertyFormData) => {
    try {
      setIsSubmitting(true)

      const propertyData: CreatePropertyForm = {
        name: data.name,
        address: data.address,
        city: data.city,
        district: data.district || undefined,
        description: data.description || undefined,
      }

      if (mode === 'edit' && property) {
        await updateProperty(property.id, propertyData)
        toast.success('Đã cập nhật nhà cho thuê thành công')
      } else {
        await createProperty(propertyData)
        toast.success('Đã thêm nhà cho thuê thành công')
      }

      setOpen(false)
      form.reset()
      onSuccess?.()
    } catch (error) {
      console.error('Error saving property:', error)
      toast.error(
        mode === 'edit'
          ? 'Không thể cập nhật nhà cho thuê. Vui lòng thử lại.'
          : 'Không thể thêm nhà cho thuê. Vui lòng thử lại.'
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
      className={
        mode === 'edit' ? 'h-8 px-3' : 'bg-emerald-500 hover:bg-emerald-600'
      }
    >
      {mode === 'edit' ? (
        <>
          <Edit3 className="w-4 h-4 mr-2" />
          Chỉnh sửa
        </>
      ) : (
        <>
          <Plus className="w-4 h-4 mr-2" />
          Thêm nhà cho thuê
        </>
      )}
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit'
              ? 'Chỉnh sửa nhà cho thuê'
              : 'Thêm nhà cho thuê mới'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Cập nhật thông tin nhà cho thuê. Nhấn lưu khi hoàn tất.'
              : 'Thêm nhà cho thuê mới vào hệ thống. Điền đầy đủ thông tin bên dưới.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Property Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên nhà cho thuê *</FormLabel>
                    <FormControl>
                      <Input placeholder="VD: Nhà trọ Bách Đằng" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Address */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Địa chỉ *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="VD: 123/45 Đường ABC, Phường XYZ"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* City and District */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thành phố *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn thành phố" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Ho Chi Minh">
                            TP. Hồ Chí Minh
                          </SelectItem>
                          <SelectItem value="Ha Noi">Hà Nội</SelectItem>
                          <SelectItem value="Da Nang">Đà Nẵng</SelectItem>
                          <SelectItem value="Can Tho">Cần Thơ</SelectItem>
                          <SelectItem value="Hai Phong">Hải Phòng</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quận/Huyện</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="VD: Quận 1, Huyện Bình Chánh"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Mô tả chi tiết về nhà cho thuê, tiện ích xung quanh..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Thông tin bổ sung về nhà cho thuê (tùy chọn)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
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
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {mode === 'edit' ? 'Đang cập nhật...' : 'Đang thêm...'}
                  </>
                ) : mode === 'edit' ? (
                  'Lưu thay đổi'
                ) : (
                  'Thêm nhà cho thuê'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
