import { supabase, handleSupabaseError } from './supabase/client'
import type {
  Property,
  Room,
  Tenant,
  RentalContract,
  PropertyWithRooms,
  TenantWithContract,
  RoomWithDetails,
  DashboardStats,
  CreatePropertyForm,
  CreateRoomForm,
  CreateTenantForm,
  CreateContractForm,
  PropertyFilters,
  TenantFilters,
  RoomFilters,
} from '@/types/database'

// ================================
// PROPERTIES
// ================================

export const getProperties = async (
  filters?: PropertyFilters
): Promise<Property[]> => {
  try {
    let query = supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,address.ilike.%${filters.search}%`
      )
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.city) {
      query = query.eq('city', filters.city)
    }

    if (filters?.district) {
      query = query.eq('district', filters.district)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching properties:', error)
    throw new Error(handleSupabaseError(error))
  }
}

export const getPropertyById = async (id: string): Promise<Property | null> => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching property:', error)
    return null
  }
}

export const getPropertyWithRooms = async (
  id: string
): Promise<PropertyWithRooms | null> => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select(
        `
        *,
        rooms (*)
      `
      )
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching property with rooms:', error)
    return null
  }
}

export const createProperty = async (
  property: CreatePropertyForm
): Promise<Property> => {
  try {
    const propertyData = {
      name: property.name,
      address: property.address,
      district: property.district,
      city: property.city,
      description: property.description,
      status: 'active' as const,
      total_rooms: 0,
      occupied_rooms: 0,
      available_rooms: 0,
      occupancy_percentage: 0,
    }

    const { data, error } = await supabase
      .from('properties')
      .insert(propertyData)
      .select()
      .single()

    if (error) throw error
    return data as Property
  } catch (error) {
    console.error('Error creating property:', error)
    throw new Error(handleSupabaseError(error))
  }
}

export const updateProperty = async (
  id: string,
  updates: Partial<CreatePropertyForm>
): Promise<Property> => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Property
  } catch (error) {
    console.error('Error updating property:', error)
    throw new Error(handleSupabaseError(error))
  }
}

export const deleteProperty = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from('properties').delete().eq('id', id)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting property:', error)
    throw new Error(handleSupabaseError(error))
  }
}

// ================================
// ROOMS
// ================================

export const getRooms = async (
  filters?: RoomFilters
): Promise<RoomWithDetails[]> => {
  try {
    let query = supabase
      .from('rooms')
      .select(
        `
        *,
        property:properties (*),
        rental_contracts!inner (
          *,
          tenant:tenants (*)
        )
      `
      )
      .order('created_at', { ascending: false })

    if (filters?.property_id) {
      query = query.eq('property_id', filters.property_id)
    }

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters?.rent_min) {
      query = query.gte('rent_amount', filters.rent_min)
    }

    if (filters?.rent_max) {
      query = query.lte('rent_amount', filters.rent_max)
    }

    const { data, error } = await query

    if (error) throw error
    return (
      data?.map((room: any) => ({
        ...room,
        current_contract: room.rental_contracts?.[0] || null,
      })) || []
    )
  } catch (error) {
    console.error('Error fetching rooms:', error)
    throw new Error(handleSupabaseError(error))
  }
}

export const getRoomsGroupedByProperty = async (): Promise<
  PropertyWithRooms[]
> => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select(
        `
        *,
        rooms (
          *,
          rental_contracts (
            *,
            tenant:tenants (*)
          )
        )
      `
      )
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching rooms grouped by property:', error)
    throw new Error(handleSupabaseError(error))
  }
}

export const createRoom = async (room: CreateRoomForm): Promise<Room> => {
  try {
    const roomData = {
      property_id: room.property_id,
      room_number: room.room_number,
      floor: room.floor,
      area_sqm: room.area_sqm,
      rent_amount: room.rent_amount,
      deposit_amount: room.deposit_amount,
      utilities: room.utilities,
      status: room.status || ('available' as const),
      description: room.description,
      images: room.images,
    }

    const { data, error } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single()

    if (error) throw error
    return data as Room
  } catch (error) {
    console.error('Error creating room:', error)
    throw new Error(handleSupabaseError(error))
  }
}

export const updateRoom = async (
  id: string,
  updates: Partial<CreateRoomForm>
): Promise<Room> => {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating room:', error)
    throw new Error(handleSupabaseError(error))
  }
}

export const deleteRoom = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from('rooms').delete().eq('id', id)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting room:', error)
    throw new Error(handleSupabaseError(error))
  }
}

// ================================
// TENANTS
// ================================

export const getTenants = async (
  filters?: TenantFilters
): Promise<TenantWithContract[]> => {
  try {
    let query = supabase
      .from('tenants')
      .select(
        `
        *,
        rental_contracts!left (
          *,
          room:rooms (
            *,
            property:properties (*)
          )
        )
      `
      )
      .order('created_at', { ascending: false })

    if (filters?.search) {
      query = query.or(
        `full_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      )
    }

    const { data, error } = await query
    if (error) throw error

    let result =
      data?.map((tenant: any) => {
        // Filter active contracts first
        const activeContracts =
          tenant.rental_contracts?.filter(
            (contract: any) => contract.status === 'active'
          ) || []
        return {
          ...tenant,
          current_contract: activeContracts[0] || null,
        }
      }) || []

    // Apply contract status filter after data is retrieved
    if (filters?.contract_status && filters.contract_status !== 'all') {
      if (filters.contract_status === 'active') {
        result = result.filter(
          (tenant: any) => tenant.current_contract !== null
        )
      } else {
        result = result.filter(
          (tenant: any) =>
            tenant.current_contract?.status === filters.contract_status
        )
      }
    }

    // Apply property filter after data is retrieved
    if (filters?.property_id) {
      result = result.filter(
        (tenant: any) =>
          tenant.current_contract?.room?.property_id === filters.property_id
      )
    }

    return result
  } catch (error) {
    console.error('Error fetching tenants:', error)
    throw new Error(handleSupabaseError(error))
  }
}

export const getTenantById = async (
  id: string
): Promise<TenantWithContract | null> => {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select(
        `
        *,
        rental_contracts!inner (
          *,
          room:rooms (
            *,
            property:properties (*)
          ),
          payment_records (
            *
          )
        )
      `
      )
      .eq('id', id)
      .single()

    if (error) throw error

    if (data) {
      return {
        ...data,
        current_contract: data.rental_contracts?.[0] || null,
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching tenant:', error)
    return null
  }
}

export const createTenant = async (
  tenant: CreateTenantForm
): Promise<Tenant> => {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .insert(tenant)
      .select()
      .single()

    if (error) throw error
    return data as Tenant
  } catch (error) {
    console.error('Error creating tenant:', error)
    throw new Error(handleSupabaseError(error))
  }
}

export const updateTenant = async (
  id: string,
  updates: Partial<CreateTenantForm>
): Promise<Tenant> => {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating tenant:', error)
    throw new Error(handleSupabaseError(error))
  }
}

export const deleteTenant = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from('tenants').delete().eq('id', id)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting tenant:', error)
    throw new Error(handleSupabaseError(error))
  }
}

// ================================
// CONTRACTS
// ================================

export const getContracts = async (): Promise<RentalContract[]> => {
  try {
    const { data, error } = await supabase
      .from('rental_contracts')
      .select(
        `
        *,
        room:rooms(
          *,
          property:properties(*)
        ),
        tenant:tenants(*)
      `
      )
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching contracts:', error)
    throw new Error(handleSupabaseError(error))
  }
}

export const createContract = async (
  contract: CreateContractForm
): Promise<RentalContract> => {
  try {
    // First, check if room is available
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('status')
      .eq('id', contract.room_id)
      .single()

    if (roomError) {
      throw new Error('Không tìm thấy phòng')
    }

    if (room?.status === 'occupied') {
      throw new Error('Phòng này đã có người thuê')
    }

    // Check if tenant already has an active contract
    const { data: existingContract } = await supabase
      .from('rental_contracts')
      .select('id')
      .eq('tenant_id', contract.tenant_id)
      .eq('status', 'active')
      .maybeSingle() // Use maybeSingle to avoid error if no record found

    if (existingContract) {
      throw new Error('Người thuê này đã có hợp đồng đang hoạt động')
    }

    // Add default status if not provided
    const contractData = {
      ...contract,
      status: contract.status || 'active',
    }

    // Create contract
    const { data, error } = await supabase
      .from('rental_contracts')
      .insert([contractData])
      .select(
        `
        *,
        room:rooms(
          *,
          property:properties(*)
        ),
        tenant:tenants(*)
      `
      )
      .single()

    if (error) throw error

    // Update room status to occupied
    await updateRoom(contract.room_id, { status: 'occupied' })

    return data
  } catch (error) {
    console.error('Error creating contract:', error)
    throw new Error(
      error instanceof Error ? error.message : handleSupabaseError(error)
    )
  }
}

export const updateContract = async (
  id: string,
  updates: Partial<CreateContractForm>
): Promise<RentalContract> => {
  try {
    const { data, error } = await supabase
      .from('rental_contracts')
      .update(updates)
      .eq('id', id)
      .select(
        `
        *,
        room:rooms(
          *,
          property:properties(*)
        ),
        tenant:tenants(*)
      `
      )
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating contract:', error)
    throw new Error(handleSupabaseError(error))
  }
}

export const terminateContract = async (contractId: string): Promise<void> => {
  try {
    // Get contract details
    const { data: contract } = await supabase
      .from('rental_contracts')
      .select('room_id')
      .eq('id', contractId)
      .single()

    if (!contract) throw new Error('Hợp đồng không tồn tại')

    // Update contract status to terminated
    const { error: contractError } = await supabase
      .from('rental_contracts')
      .update({ status: 'terminated' })
      .eq('id', contractId)

    if (contractError) throw contractError

    // Update room status to available
    await updateRoom(contract.room_id, { status: 'available' })
  } catch (error) {
    console.error('Error terminating contract:', error)
    throw new Error(handleSupabaseError(error))
  }
}

// Assign tenant to room (creates contract)
export const assignTenantToRoom = async (
  roomId: string,
  tenantId: string,
  monthlyRent: number
): Promise<RentalContract> => {
  try {
    const contractData: CreateContractForm = {
      room_id: roomId,
      tenant_id: tenantId,
      start_date: new Date().toISOString().split('T')[0], // Today
      monthly_rent: monthlyRent,
      status: 'active',
    }

    return await createContract(contractData)
  } catch (error) {
    console.error('Error assigning tenant to room:', error)
    throw new Error(handleSupabaseError(error))
  }
}

// Unassign tenant from room (terminates contract)
export const unassignTenantFromRoom = async (roomId: string): Promise<void> => {
  try {
    // Find active contract for the room
    const { data: contract, error } = await supabase
      .from('rental_contracts')
      .select('id')
      .eq('room_id', roomId)
      .eq('status', 'active')
      .maybeSingle()

    if (error) {
      throw new Error('Không thể kiểm tra hợp đồng')
    }

    if (contract) {
      await terminateContract(contract.id)
    } else {
      throw new Error('Không tìm thấy hợp đồng đang hoạt động cho phòng này')
    }
  } catch (error) {
    console.error('Error unassigning tenant from room:', error)
    throw new Error(
      error instanceof Error ? error.message : handleSupabaseError(error)
    )
  }
}

// Transfer tenant from one room to another
export const transferTenant = async (
  fromRoomId: string,
  toRoomId: string,
  newMonthlyRent?: number
): Promise<RentalContract> => {
  try {
    // Get the current active contract
    const { data: currentContract, error: contractError } = await supabase
      .from('rental_contracts')
      .select('*')
      .eq('room_id', fromRoomId)
      .eq('status', 'active')
      .maybeSingle()

    if (contractError) {
      throw new Error('Không thể kiểm tra hợp đồng hiện tại')
    }

    if (!currentContract) {
      throw new Error('Không tìm thấy hợp đồng đang hoạt động')
    }

    // Check if destination room is available
    const { data: toRoom, error: toRoomError } = await supabase
      .from('rooms')
      .select('status, rent_amount')
      .eq('id', toRoomId)
      .single()

    if (toRoomError) {
      throw new Error('Không tìm thấy phòng đích')
    }

    if (toRoom.status === 'occupied') {
      throw new Error('Phòng đích đã có người thuê')
    }

    // Terminate current contract
    await terminateContract(currentContract.id)

    // Create new contract for the new room
    const newContractData: CreateContractForm = {
      room_id: toRoomId,
      tenant_id: currentContract.tenant_id,
      start_date: new Date().toISOString().split('T')[0], // Today
      monthly_rent: newMonthlyRent || toRoom.rent_amount,
      deposit_amount: currentContract.deposit_amount,
      status: 'active',
    }

    const newContract = await createContract(newContractData)

    return newContract
  } catch (error) {
    console.error('Error transferring tenant:', error)
    throw new Error(
      error instanceof Error ? error.message : handleSupabaseError(error)
    )
  }
}

// ================================
// DASHBOARD STATS
// ================================

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Get properties count
    const { count: propertiesCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })

    // Get rooms stats
    const { data: roomsData } = await supabase.from('rooms').select('status')

    // Get tenants count
    const { count: tenantsCount } = await supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true })

    // Get active contracts count
    const { count: activeContractsCount } = await supabase
      .from('rental_contracts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // Calculate room stats
    const totalRooms = roomsData?.length || 0
    const occupiedRooms =
      roomsData?.filter((room: any) => room.status === 'occupied').length || 0
    const availableRooms =
      roomsData?.filter((room: any) => room.status === 'available').length || 0

    // Calculate monthly revenue (sum of active contracts)
    const { data: contractsData } = await supabase
      .from('rental_contracts')
      .select('monthly_rent')
      .eq('status', 'active')

    const monthlyRevenue =
      contractsData?.reduce(
        (sum: number, contract: any) => sum + contract.monthly_rent,
        0
      ) || 0

    // Calculate occupancy rate
    const occupancyRate =
      totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0

    return {
      total_properties: propertiesCount || 0,
      total_rooms: totalRooms,
      occupied_rooms: occupiedRooms,
      available_rooms: availableRooms,
      total_tenants: tenantsCount || 0,
      active_contracts: activeContractsCount || 0,
      monthly_revenue: monthlyRevenue,
      occupancy_rate: occupancyRate,
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw new Error(handleSupabaseError(error))
  }
}
