// Common types for the Rental Web application

export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Property {
  id: string
  title: string
  description?: string
  address: string
  rent_amount: number
  currency: string
  status: 'available' | 'occupied' | 'maintenance'
  created_at: string
  updated_at: string
}

// Add more types as needed...
