// Database types for Supabase integration

export type Database = {
  public: {
    Tables: {
      properties: {
        Row: Property
        Insert: Omit<
          Property,
          | 'id'
          | 'created_at'
          | 'updated_at'
          | 'total_rooms'
          | 'occupied_rooms'
          | 'available_rooms'
          | 'occupancy_percentage'
        >
        Update: Partial<Omit<Property, 'id' | 'created_at' | 'updated_at'>>
      }
      rooms: {
        Row: Room
        Insert: Omit<Room, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Room, 'id' | 'created_at' | 'updated_at'>>
      }
      tenants: {
        Row: Tenant
        Insert: Omit<Tenant, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Tenant, 'id' | 'created_at' | 'updated_at'>>
      }
      rental_contracts: {
        Row: RentalContract
        Insert: Omit<RentalContract, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<
          Omit<RentalContract, 'id' | 'created_at' | 'updated_at'>
        >
      }
      payment_records: {
        Row: PaymentRecord
        Insert: Omit<PaymentRecord, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PaymentRecord, 'id' | 'created_at' | 'updated_at'>>
      }
      receipts: {
        Row: Receipt
        Insert: Omit<Receipt, 'id' | 'created_at'>
        Update: Partial<Omit<Receipt, 'id' | 'created_at'>>
      }
      rental_invoices: {
        Row: RentalInvoice
        Insert: Omit<RentalInvoice, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<RentalInvoice, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}

export interface Property {
  id: string
  name: string
  address: string
  district?: string
  city: string
  description?: string
  total_rooms: number
  occupied_rooms: number
  available_rooms: number
  occupancy_percentage: number
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface Room {
  id: string
  property_id: string
  room_number: string
  floor?: string
  area_sqm?: number
  rent_amount: number
  deposit_amount?: number
  utilities?: string[]
  status: 'available' | 'occupied' | 'maintenance'
  description?: string
  images?: string[]
  created_at: string
  updated_at: string
  // Relationships
  property?: Property
}

export interface Tenant {
  id: string
  full_name: string
  phone?: string
  email?: string
  id_number?: string
  birth_date?: string
  address?: string
  occupation?: string
  emergency_contact?: string
  emergency_phone?: string
  avatar_url?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface RentalContract {
  id: string
  room_id: string
  tenant_id: string
  start_date: string
  end_date?: string
  monthly_rent: number
  deposit_amount?: number
  renewal_count: number
  status: 'active' | 'expired' | 'terminated'
  created_at: string
  updated_at: string
  // Relationships
  room?: Room
  tenant?: Tenant
}

export interface PaymentRecord {
  id: string
  contract_id: string
  tenant_id: string
  amount: number
  payment_date: string
  due_date: string
  month_year: string
  payment_type: 'rent' | 'deposit' | 'utility' | 'fee'
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
  // Relationships
  contract?: RentalContract
  tenant?: Tenant
}

export interface Receipt {
  id: string
  payment_record_id: string
  receipt_number: string
  tenant_name: string
  room_info: string
  amount: number
  payment_method: 'cash' | 'bank_transfer' | 'card'
  issued_date: string
  issued_by?: string
  notes?: string
  created_at: string
  // Relationships
  payment_record?: PaymentRecord
}

export type UtilityType =
  | 'electricity'
  | 'water'
  | 'internet'
  | 'tv'
  | 'gas'
  | 'trash'
  | 'other'

export interface Utility {
  id: string
  property_id: string
  name: string
  type: UtilityType
  provider: string
  customer_code?: string
  monthly_due_date?: number // Day of month (1-31)
  notes?: string
  created_at: string
  updated_at: string
  // Relationships
  property?: Property
  bills?: UtilityBill[]
}

export interface UtilityBill {
  id: string
  utility_id: string
  property_id: string
  amount: number
  due_date: string
  paid_date?: string
  status: 'pending' | 'paid' | 'overdue'
  period_start?: string
  period_end?: string
  previous_reading?: number
  current_reading?: number
  usage_amount?: number
  rate_per_unit?: number
  attachment_url?: string
  notes?: string
  created_at: string
  updated_at: string
  // Relationships
  utility?: Utility
}

// Room-specific utility type (extends Utility but for individual rooms)
export interface RoomUtility extends Omit<Utility, 'property_id'> {
  room_id: string
  // Relationships
  room?: Room
}

// Invoice system types
export type InvoiceTemplate = 'simple' | 'professional'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

export interface RentalInvoice {
  id: string
  room_id: string
  tenant_id: string
  contract_id?: string
  invoice_number: string
  period_start: string
  period_end: string
  issue_date: string
  due_date: string
  template_type: InvoiceTemplate // Changed from 'template' to 'template_type'
  status: InvoiceStatus

  // Chi phí chi tiết
  rent_amount: number // Tiền phòng

  // Tiền điện
  electricity_previous_reading?: number // Chỉ số cũ
  electricity_current_reading?: number // Chỉ số mới
  electricity_unit_price: number // Đơn giá điện (VND/kWh)
  electricity_amount: number // Thành tiền điện
  electricity_note?: string // Lưu ý tiền điện

  // Tiền nước
  water_previous_reading?: number // Chỉ số cũ
  water_current_reading?: number // Chỉ số mới
  water_unit_price: number // Đơn giá nước (VND/m³)
  water_amount: number // Thành tiền nước
  water_note?: string // Lưu ý tiền nước

  // Các khoản khác
  internet_amount: number // Tiền Internet
  internet_note?: string // Lưu ý Internet

  trash_amount: number // Tiền rác
  trash_note?: string // Lưu ý tiền rác

  // Các khoản phụ thu khác
  other_fees?: Array<{
    name: string
    amount: number
    note?: string
  }>

  // Color settings for receipt styling
  color_settings?: {
    header_bg?: string // Màu nền header (tên phòng/nhà)
    header_text?: string // Màu chữ header
    total_bg?: string // Màu nền tổng thanh toán
    total_text?: string // Màu chữ tổng thanh toán
    theme_name?: string // Tên theme để dễ nhận diện
  }

  total_amount: number
  notes?: string
  pdf_url?: string
  created_at: string
  updated_at: string
  // Relationships
  room?: Room & { property?: Property }
  tenant?: Tenant
  contract?: RentalContract
}

export interface InvoiceLineItem {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  total_price: number
  type: 'rent' | 'utilities' | 'deposit' | 'fee' | 'other'
}

// Combined view types for complex queries
export interface TenantWithContract extends Tenant {
  current_contract?: RentalContract & {
    room?: Room & {
      property?: Property
    }
  }
}

export interface PropertyWithRooms extends Property {
  rooms?: Room[]
}

export interface RoomWithDetails extends Room {
  property?: Property
  current_contract?: RentalContract & {
    tenant?: Tenant
  }
}

// Dashboard stats types
export interface DashboardStats {
  total_properties: number
  total_rooms: number
  occupied_rooms: number
  available_rooms: number
  total_tenants: number
  active_contracts: number
  monthly_revenue: number
  occupancy_rate: number
}

// Filter and search types
export interface PropertyFilters {
  search?: string
  city?: string
  district?: string
  status?: 'active' | 'inactive'
  occupancy_min?: number
  occupancy_max?: number
}

export interface TenantFilters {
  search?: string
  contract_status?: 'active' | 'expired' | 'terminated' | 'all'
  property_id?: string
  payment_status?: 'current' | 'overdue' | 'all'
}

export interface RoomFilters {
  property_id?: string
  status?: 'available' | 'occupied' | 'maintenance' | 'all'
  rent_min?: number
  rent_max?: number
}

// Form types for creating/updating records
export interface CreatePropertyForm {
  name: string
  address: string
  district?: string
  city: string
  description?: string
}

export interface CreateRoomForm {
  property_id: string
  room_number: string
  floor?: string
  area_sqm?: number
  rent_amount: number
  deposit_amount?: number
  utilities?: string[]
  status?: 'available' | 'occupied' | 'maintenance'
  description?: string
  images?: string[]
}

export interface CreateTenantForm {
  full_name: string
  phone?: string
  email?: string
  id_number?: string
  birth_date?: string
  address?: string
  occupation?: string
  emergency_contact?: string
  emergency_phone?: string
  notes?: string
}

export interface CreateContractForm {
  room_id: string
  tenant_id: string
  start_date: string
  end_date?: string
  monthly_rent: number
  deposit_amount?: number
  status?: 'active' | 'expired' | 'terminated'
}

export interface CreatePaymentForm {
  contract_id: string
  tenant_id: string
  amount: number
  payment_date: string
  due_date: string
  month_year: string
  payment_type: 'rent' | 'deposit' | 'utility' | 'fee'
  notes?: string
}

// API response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  has_more: boolean
}
