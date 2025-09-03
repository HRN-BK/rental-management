import { createClient } from '@supabase/supabase-js'
import type {
  Database,
  Property,
  Room,
  Tenant,
  RentalContract,
  RentalInvoice,
} from '../types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseKey)

// Sample data
const properties: Omit<
  Property,
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'total_rooms'
  | 'occupied_rooms'
  | 'available_rooms'
  | 'occupancy_percentage'
>[] = [
  {
    name: 'Nhà trọ Minh Trầm',
    address: '325/16/9 đường Bach Đằng, Phường Gia Định',
    district: 'Gò Vấp',
    city: 'TP.HCM',
    description: 'Nhà trọ cao cấp với đầy đủ tiện nghi',
    status: 'active',
  },
  {
    name: 'Chung cư mini ABC',
    address: '123 Nguyễn Văn Cừ, Phường 4',
    district: 'Quận 5',
    city: 'TP.HCM',
    description: 'Chung cư mini tiện nghi',
    status: 'active',
  },
]

const tenants: Omit<Tenant, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    full_name: 'Nguyễn Văn A',
    phone: '0901234567',
    email: 'nguyenvana@email.com',
    id_number: '123456789',
    birth_date: '1995-01-01',
    address: '123 Nguyen Van Linh, Q7, TP.HCM',
    occupation: 'Nhân viên IT',
    emergency_contact: 'Nguyễn Thị B',
    emergency_phone: '0907654321',
    notes: 'Người thuê tốt, thanh toán đúng hạn',
  },
  {
    full_name: 'Trần Thị C',
    phone: '0912345678',
    email: 'tranthic@email.com',
    id_number: '987654321',
    birth_date: '1992-05-15',
    address: '456 Le Van Sy, Q3, TP.HCM',
    occupation: 'Kế toán',
    emergency_contact: 'Trần Văn D',
    emergency_phone: '0909876543',
  },
]

async function seedData() {
  try {
    console.log('🌱 Starting data seeding...')

    // 1. Insert Properties
    console.log('📍 Inserting properties...')
    const { data: insertedProperties, error: propError } = await supabase
      .from('properties')
      .insert(properties)
      .select()

    if (propError) {
      console.error('Error inserting properties:', propError)
      return
    }
    console.log(`✅ Inserted ${insertedProperties.length} properties`)

    // 2. Insert Tenants
    console.log('👥 Inserting tenants...')
    const { data: insertedTenants, error: tenantError } = await supabase
      .from('tenants')
      .insert(tenants)
      .select()

    if (tenantError) {
      console.error('Error inserting tenants:', tenantError)
      return
    }
    console.log(`✅ Inserted ${insertedTenants.length} tenants`)

    // 3. Insert Rooms
    const rooms: Omit<Room, 'id' | 'created_at' | 'updated_at'>[] = [
      {
        property_id: insertedProperties[0].id,
        room_number: 'Phòng 101',
        floor: '1',
        area_sqm: 20,
        rent_amount: 3500000,
        deposit_amount: 7000000,
        status: 'occupied',
        utilities: ['electricity', 'water', 'internet'],
        description: 'Phòng trọ đầy đủ tiện nghi, có điều hòa',
      },
      {
        property_id: insertedProperties[0].id,
        room_number: 'Phòng 102',
        floor: '1',
        area_sqm: 18,
        rent_amount: 3200000,
        deposit_amount: 6400000,
        status: 'occupied',
        utilities: ['electricity', 'water', 'internet'],
        description: 'Phòng trọ sạch sẽ, thoáng mát',
      },
      {
        property_id: insertedProperties[1].id,
        room_number: 'A301',
        floor: '3',
        area_sqm: 25,
        rent_amount: 4000000,
        deposit_amount: 8000000,
        status: 'occupied',
        utilities: ['electricity', 'water', 'internet', 'cable_tv'],
        description: 'Studio mini có ban công',
      },
    ]

    console.log('🏠 Inserting rooms...')
    const { data: insertedRooms, error: roomError } = await supabase
      .from('rooms')
      .insert(rooms)
      .select()

    if (roomError) {
      console.error('Error inserting rooms:', roomError)
      return
    }
    console.log(`✅ Inserted ${insertedRooms.length} rooms`)

    // 4. Insert Rental Contracts
    const contracts: Omit<
      RentalContract,
      'id' | 'created_at' | 'updated_at'
    >[] = [
      {
        room_id: insertedRooms[0].id,
        tenant_id: insertedTenants[0].id,
        start_date: '2024-01-01',
        monthly_rent: insertedRooms[0].rent_amount,
        deposit_amount: insertedRooms[0].deposit_amount,
        renewal_count: 0,
        status: 'active',
      },
      {
        room_id: insertedRooms[1].id,
        tenant_id: insertedTenants[1].id,
        start_date: '2024-02-01',
        monthly_rent: insertedRooms[1].rent_amount,
        deposit_amount: insertedRooms[1].deposit_amount,
        renewal_count: 0,
        status: 'active',
      },
    ]

    console.log('📋 Inserting rental contracts...')
    const { data: insertedContracts, error: contractError } = await supabase
      .from('rental_contracts')
      .insert(contracts)
      .select()

    if (contractError) {
      console.error('Error inserting contracts:', contractError)
      return
    }
    console.log(`✅ Inserted ${insertedContracts.length} contracts`)

    // 5. Insert Sample Invoices
    const invoices: Omit<RentalInvoice, 'id' | 'created_at' | 'updated_at'>[] =
      [
        {
          room_id: insertedRooms[0].id,
          tenant_id: insertedTenants[0].id,
          contract_id: insertedContracts[0].id,
          invoice_number: 'INV-202412-001',
          period_start: '2024-12-01',
          period_end: '2024-12-31',
          issue_date: '2024-12-01',
          due_date: '2024-12-10',
          template_type: 'professional',
          status: 'sent',

          rent_amount: 3500000,

          electricity_previous_reading: 150,
          electricity_current_reading: 205,
          electricity_unit_price: 3500,
          electricity_amount: 192500, // 55 * 3500
          electricity_note: 'Điện tháng 12/2024',

          water_previous_reading: 25,
          water_current_reading: 32,
          water_unit_price: 25000,
          water_amount: 175000, // 7 * 25000
          water_note: 'Nước tháng 12/2024',

          internet_amount: 200000,
          internet_note: 'Wifi FPT',

          trash_amount: 50000,
          trash_note: 'Phí vệ sinh chung',

          other_fees: [
            {
              name: 'Tiền bảo trì',
              amount: 100000,
              note: 'Bảo trì thiết bị chung',
            },
          ],

          total_amount: 4217500, // 3500000 + 192500 + 175000 + 200000 + 50000 + 100000
          notes: 'Hóa đơn tháng 12/2024. Vui lòng thanh toán trước ngày 10/12.',
        },
        {
          room_id: insertedRooms[1].id,
          tenant_id: insertedTenants[1].id,
          contract_id: insertedContracts[1].id,
          invoice_number: 'INV-202412-002',
          period_start: '2024-12-01',
          period_end: '2024-12-31',
          issue_date: '2024-12-01',
          due_date: '2024-12-10',
          template_type: 'professional',
          status: 'draft',

          rent_amount: 3200000,

          electricity_previous_reading: 120,
          electricity_current_reading: 165,
          electricity_unit_price: 3500,
          electricity_amount: 157500, // 45 * 3500
          electricity_note: 'Điện tháng 12/2024',

          water_previous_reading: 18,
          water_current_reading: 24,
          water_unit_price: 25000,
          water_amount: 150000, // 6 * 25000
          water_note: 'Nước tháng 12/2024',

          internet_amount: 200000,
          internet_note: 'Wifi Viettel',

          trash_amount: 50000,
          trash_note: 'Phí vệ sinh',

          other_fees: [],

          total_amount: 3757500, // 3200000 + 157500 + 150000 + 200000 + 50000
          notes: 'Hóa đơn tháng 12/2024',
        },
      ]

    console.log('🧾 Inserting rental invoices...')
    const { data: insertedInvoices, error: invoiceError } = await supabase
      .from('rental_invoices')
      .insert(invoices)
      .select()

    if (invoiceError) {
      console.error('Error inserting invoices:', invoiceError)
      return
    }
    console.log(`✅ Inserted ${insertedInvoices.length} invoices`)

    console.log('🎉 Data seeding completed successfully!')

    // Summary
    console.log('\n📊 Summary:')
    console.log(`- Properties: ${insertedProperties.length}`)
    console.log(`- Tenants: ${insertedTenants.length}`)
    console.log(`- Rooms: ${insertedRooms.length}`)
    console.log(`- Contracts: ${insertedContracts.length}`)
    console.log(`- Invoices: ${insertedInvoices.length}`)
  } catch (error) {
    console.error('❌ Error seeding data:', error)
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedData()
}

export { seedData }
