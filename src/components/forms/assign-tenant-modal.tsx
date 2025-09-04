'use client'

import { useState, useEffect, useCallback } from 'react'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  UserPlus,
  Plus,
  Calendar,
  DollarSign,
  Loader2,
  Search,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { getTenants, createTenant, createContract } from '@/lib/database'
import type {
  Tenant,
  CreateTenantForm,
  CreateContractForm,
} from '@/types/database'

// Helper to preprocess string inputs to numbers
const toNumber = (val: any) => {
  if (val === '' || val === null || val === undefined) return undefined
  const num = Number(val)
  return isNaN(num) ? undefined : num
}

const contractFormSchema = z.object({
  tenant_id: z.string().min(1, 'Vui lòng chọn người thuê'),
  start_date: z.string().min(1, 'Ngày bắt đầu là bắt buộc'),
  end_date: z.string().optional(),
  monthly_rent: z.preprocess(toNumber, z.number().min(0, 'Tiền thuê phải lớn hơn 0')),
  deposit_amount: z.preprocess(
    toNumber,
    z.number().min(0, 'Tiền cọc phải lớn hơn hoặc bằng 0').optional()
  ),
})

const newTenantFormSchema = z.object({
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
  id_number: z.string().optional(),
  address: z.string().optional(),
  occupation: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  start_date: z.string().min(1, 'Ngày bắt đầu là bắt buộc'),
  end_date: z.string().optional(),
  monthly_rent: z.preprocess(toNumber, z.number().min(0, 'Tiền thuê phải lớn hơn 0')),
  deposit_amount: z.preprocess(
    toNumber,
    z.number().min(0, 'Tiền cọc phải lớn hơn hoặc bằng 0').optional()
  ),
})

type ContractFormData = z.infer<typeof contractFormSchema>
type NewTenantFormData = z.infer<typeof newTenantFormSchema>

interface AssignTenantModalProps {
  roomId: string
  roomNumber: string
  propertyName: string
  defaultRent: number
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function AssignTenantModal({
  roomId,
  roomNumber,
  propertyName,
  defaultRent,
  onSuccess,
  trigger,
}: AssignTenantModalProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('existing')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isLoadingTenants, setIsLoadingTenants] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Form for existing tenant
  const contractForm = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      tenant_id: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      monthly_rent: defaultRent,
      deposit_amount: defaultRent,
    },
  })

  // Form for new tenant
  const newTenantForm = useForm<NewTenantFormData>({
    resolver: zodResolver(newTenantFormSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      id_number: '',
      address: '',
      occupation: '',
      emergency_contact: '',
      emergency_phone: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      monthly_rent: defaultRent,
      deposit_amount: defaultRent,
    },
  })

  // Load tenants without active contracts
  const loadAvailableTenants = useCallback(async () => {
    try {
      setIsLoadingTenants(true)
      const allTenants = await getTenants({ search: searchTerm })
      // Filter tenants without active contracts
      const availableTenants = allTenants.filter(
        tenant =>
          !tenant.current_contract ||
          tenant.current_contract.status !== 'active'
      )
      setTenants(availableTenants)
    } catch (error) {
      console.error('Error loading tenants:', error)
      toast.error('Không thể tải danh sách người thuê')
    } finally {
      setIsLoadingTenants(false)
    }
  }, [searchTerm])

  useEffect(() => {
    if (open && activeTab === 'existing') {
      loadAvailableTenants()
    }
  }, [open, activeTab, loadAvailableTenants])

  const handleAssignExistingTenant = async (data: ContractFormData) => {
    try {
      setIsSubmitting(true)

      const contractData: CreateContractForm = {
        room_id: roomId,
        tenant_id: data.tenant_id,
        start_date: data.start_date,
        end_date: data.end_date || undefined,
        monthly_rent: data.monthly_rent,
        deposit_amount: data.deposit_amount,
      }

      await createContract(contractData)
      toast.success('Đã gán người thuê vào phòng thành công')

      setOpen(false)
      contractForm.reset()
      onSuccess?.()
    } catch (error) {
      console.error('Error assigning tenant:', error)
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định'
      toast.error(`Không thể gán người thuê vào phòng: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateAndAssignTenant = async (data: NewTenantFormData) => {
    try {
      setIsSubmitting(true)
      console.log('Creating tenant with data:', data)

      // First, create the tenant
      const tenantData: CreateTenantForm = {
        full_name: data.full_name,
        phone: data.phone || undefined,
        email: data.email || undefined,
        id_number: data.id_number || undefined,
        address: data.address || undefined,
        occupation: data.occupation || undefined,
        emergency_contact: data.emergency_contact || undefined,
        emergency_phone: data.emergency_phone || undefined,
      }

      const newTenant = await createTenant(tenantData)

      // Then, create the contract
      const contractData: CreateContractForm = {
        room_id: roomId,
        tenant_id: newTenant.id,
        start_date: data.start_date,
        end_date: data.end_date || undefined,
        monthly_rent: data.monthly_rent,
        deposit_amount: data.deposit_amount,
      }

      await createContract(contractData)
      toast.success('Đã tạo người thuê mới và gán vào phòng thành công')

      setOpen(false)
      newTenantForm.reset()
      onSuccess?.()
    } catch (error) {
      console.error('Error creating and assigning tenant:', error)
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định'
      toast.error(`Không thể tạo và gán người thuê: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      contractForm.reset()
      newTenantForm.reset()
      setSearchTerm('')
      setActiveTab('existing')
    }
  }

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className="text-green-600 border-green-200 hover:bg-green-50"
    >
      <UserPlus className="w-4 h-4 mr-1" />
      Thêm người thuê
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
<DialogContent className="sm:max-w-[600px] max-h-[90vh] sm:max-h-[85vh] overflow-y-auto w-[calc(100vw-2rem)] sm:w-full">
        <DialogHeader>
          <DialogTitle>Thêm người thuê vào phòng</DialogTitle>
          <DialogDescription>
            Phòng số {roomNumber} - {propertyName}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Chọn người thuê có sẵn</TabsTrigger>
            <TabsTrigger value="new">Tạo người thuê mới</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4 mt-4">
            <Form {...contractForm}>
              <form
                onSubmit={contractForm.handleSubmit(handleAssignExistingTenant)}
                className="space-y-4"
              >
                {/* Search tenants */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Tìm kiếm người thuê..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Tenant selection */}
                <FormField
                  control={contractForm.control}
                  name="tenant_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chọn người thuê *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn người thuê" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingTenants ? (
                            <div className="flex items-center justify-center p-4">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="ml-2">Đang tải...</span>
                            </div>
                          ) : tenants.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                              {searchTerm
                                ? 'Không tìm thấy người thuê'
                                : 'Không có người thuê nào khả dụng'}
                            </div>
                          ) : (
                            tenants.map(tenant => (
                              <SelectItem key={tenant.id} value={tenant.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {tenant.full_name}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {tenant.phone && `${tenant.phone}`}
                                    {tenant.phone && tenant.email && ' • '}
                                    {tenant.email && tenant.email}
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Contract details */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={contractForm.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Ngày bắt đầu *</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={contractForm.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Ngày kết thúc</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={contractForm.control}
                    name="monthly_rent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4" />
                          <span>Tiền thuê/tháng *</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={contractForm.control}
                    name="deposit_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4" />
                          <span>Tiền cọc</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                          />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Gán người thuê
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="new" className="space-y-4 mt-4">
            <Form {...newTenantForm}>
              <form
                onSubmit={newTenantForm.handleSubmit(
                  handleCreateAndAssignTenant
                )}
                className="space-y-4"
              >
                {/* Personal Information */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 border-b pb-2">
                    <User className="w-4 h-4 text-blue-500" />
                    <h4 className="font-semibold">Thông tin cá nhân</h4>
                  </div>

                  <FormField
                    control={newTenantForm.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Họ và tên *</FormLabel>
                        <FormControl>
                          <Input placeholder="VD: Nguyễn Văn A" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={newTenantForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Số điện thoại</FormLabel>
                          <FormControl>
                            <Input placeholder="VD: 0901234567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={newTenantForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
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
                </div>

                {/* Contract Information */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 border-b pb-2">
                    <Calendar className="w-4 h-4 text-green-500" />
                    <h4 className="font-semibold">Thông tin hợp đồng</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={newTenantForm.control}
                      name="start_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ngày bắt đầu *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={newTenantForm.control}
                      name="end_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ngày kết thúc</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={newTenantForm.control}
                      name="monthly_rent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tiền thuê/tháng *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              onChange={e =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={newTenantForm.control}
                      name="deposit_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tiền cọc</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              onChange={e =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
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
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Tạo và gán
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
