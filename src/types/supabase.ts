import type { Database } from './database'

// Re-export the Database type for Supabase client
export type { Database }

// Helper types for accessing specific table types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Specific table types
export type Property = Tables<'properties'>
export type Room = Tables<'rooms'>
export type Tenant = Tables<'tenants'>
export type RentalContract = Tables<'rental_contracts'>
export type PaymentRecord = Tables<'payment_records'>
export type Receipt = Tables<'receipts'>
export type RentalInvoice = Tables<'rental_invoices'>

// Insert types
export type PropertyInsert = TablesInsert<'properties'>
export type RoomInsert = TablesInsert<'rooms'>
export type TenantInsert = TablesInsert<'tenants'>
export type RentalContractInsert = TablesInsert<'rental_contracts'>
export type PaymentRecordInsert = TablesInsert<'payment_records'>
export type ReceiptInsert = TablesInsert<'receipts'>
export type RentalInvoiceInsert = TablesInsert<'rental_invoices'>

// Update types
export type PropertyUpdate = TablesUpdate<'properties'>
export type RoomUpdate = TablesUpdate<'rooms'>
export type TenantUpdate = TablesUpdate<'tenants'>
export type RentalContractUpdate = TablesUpdate<'rental_contracts'>
export type PaymentRecordUpdate = TablesUpdate<'payment_records'>
export type ReceiptUpdate = TablesUpdate<'receipts'>
export type RentalInvoiceUpdate = TablesUpdate<'rental_invoices'>
