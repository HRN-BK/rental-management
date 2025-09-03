'use client'

import { useState, useEffect } from 'react'
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
import { Plus, Edit3, Loader2, Building2 } from 'lucide-react'
import { createRoom, updateRoom, getProperties } from '@/lib/database'
import type { Room, Property, CreateRoomForm } from '@/types/database'

const roomFormSchema = z.object({
  property_id: z.string().min(1, 'Vui lòng chọn nhà cho thuê'),
  room_number: z.string().min(1, 'Vui lòng nhập số phòng'),
  floor: z.string().optional(),
  area_sqm: z
    .number()
    .min(1, 'Diện tích phải lớn hơn 0')
    .max(1000, 'Diện tích không được vượt quá 1000m²'),
  rent_amount: z
    .number()
    .min(0, 'Giá thuê không được âm')
    .max(100000000, 'Giá thuê không được vượt quá 100 triệu VNĐ'),
  deposit_amount: z
    .number()
    .min(0, 'Tiền cọc không được âm')
    .max(1000000000, 'Tiền cọc không được vượt quá 1 tỷ VNĐ'),
  description: z.string().optional(),
})

type RoomFormData = z.infer<typeof roomFormSchema>

interface RoomFormModalProps {
  room?: Room
  propertyId?: string // Pre-select property when creating from property page
  onSuccess?: () => void
  trigger?: React.ReactNode
  mode?: 'create' | 'edit'
}

export function RoomFormModal({
  room,
  propertyId,
  onSuccess,
  trigger,
  mode = room ? 'edit' : 'create',
}: RoomFormModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoadingProperties, setIsLoadingProperties] = useState(false)

  const form = useForm<RoomFormData>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      property_id: room?.property_id || propertyId || '',
      room_number: room?.room_number || '',
      floor: room?.floor || '',
      area_sqm: room?.area_sqm || undefined,
      rent_amount: room?.rent_amount || 0,
      deposit_amount: room?.deposit_amount || undefined,
      description: room?.description || '',
    },
  })

  // Load properties when modal opens
  useEffect(() => {
    if (open && mode === 'create') {
      loadProperties()
    }
  }, [open, mode])

  const loadProperties = async () => {
    try {
      setIsLoadingProperties(true)
      const data = await getProperties()
      setProperties(data)
    } catch (error) {
      console.error('Error loading properties:', error)
      // TODO: Add error handling UI
    } finally {
      setIsLoadingProperties(false)
    }
  }

  const onSubmit = async (data: RoomFormData) => {
    try {
      setIsSubmitting(true)

      const roomData: CreateRoomForm = {
        property_id: data.property_id,
        room_number: data.room_number || '',
        floor: data.floor || undefined,
        area_sqm: data.area_sqm || 1,
        rent_amount: data.rent_amount || 0,
        deposit_amount: data.deposit_amount || 0,
        description: data.description || undefined,
      }

      if (mode === 'edit' && room) {
        await updateRoom(room.id, roomData)
        // Success: room updated
      } else {
        await createRoom(roomData)
        // Success: room created
      }

      setOpen(false)
      form.reset()
      onSuccess?.()
    } catch (error) {
      console.error('Error saving room:', error)
      // TODO: Add error handling UI
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
          Thêm phòng
        </>
      )}
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Cập nhật thông tin phòng. Nhấn lưu khi hoàn tất.'
              : 'Thêm phòng mới vào hệ thống. Chỉ cần chọn nhà cho thuê, các thông tin khác có thể điền sau.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Property Selection (only for create mode) */}
              {mode === 'create' && !propertyId && (
                <FormField
                  control={form.control}
                  name="property_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nhà cho thuê *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoadingProperties}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn nhà cho thuê" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {properties.map(property => (
                            <SelectItem key={property.id} value={property.id}>
                              <span className="font-medium">
                                {property.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Room Number and Floor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="room_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số phòng</FormLabel>
                      <FormControl>
                        <Input placeholder="VD: 101, A01, P201" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="floor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tầng</FormLabel>
                      <FormControl>
                        <Input placeholder="VD: Tầng 1, Tầng trệt" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Area and Rent */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="area_sqm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diện tích (m²)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="25"
                          {...field}
                          value={field.value || ''}
                          onChange={e => {
                            const value = e.target.value
                            field.onChange(
                              value === '' ? undefined : Number(value)
                            )
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rent_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giá thuê (VNĐ)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="3500000"
                          {...field}
                          value={field.value || ''}
                          onChange={e => {
                            const value = e.target.value
                            field.onChange(value === '' ? 0 : Number(value))
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deposit_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tiền cọc (VNĐ)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="7000000"
                          {...field}
                          value={field.value || ''}
                          onChange={e => {
                            const value = e.target.value
                            field.onChange(value === '' ? 0 : Number(value))
                          }}
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
                        placeholder="Mô tả chi tiết về phòng, nội thất, điều kiện..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Thông tin bổ sung về phòng (tùy chọn)
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
                  'Thêm phòng'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
