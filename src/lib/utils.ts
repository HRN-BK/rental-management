import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format price utility
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount)
}

// Format date utility
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('vi-VN')
}
