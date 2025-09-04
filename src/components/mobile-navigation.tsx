'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Building2,
  Users,
  Receipt,
  FileText,
  Menu,
  User,
  Moon,
  Sun,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const mainNavItems = [
  { href: '/', label: 'Trang chủ', icon: Home },
  { href: '/properties', label: 'Nhà thuê', icon: Building2 },
  { href: '/tenants', label: 'Người thuê', icon: Users },
  { href: '/receipts', label: 'Biên lai', icon: FileText },
]

const secondaryNavItems = [
  { href: '/invoices', label: 'Thu tiền', icon: Receipt },
  { href: '/rooms', label: 'Phòng', icon: Building2 },
]

export function MobileNavigation() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      {/* Main Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="grid grid-cols-5 h-16">
          {/* Main 4 tabs */}
          {mainNavItems.map(item => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center py-2 px-1 transition-colors touch-manipulation',
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                )}
              >
                <Icon className={cn('w-6 h-6 mb-1', isActive && 'scale-110')} />
                <span className="text-xs font-medium truncate max-w-full">
                  {item.label}
                </span>
              </Link>
            )
          })}

          {/* More menu */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center py-2 px-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors touch-manipulation">
                <Menu className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">Thêm</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto max-h-[80vh] p-0">
              <div className="p-4">
                <SheetHeader className="mb-6">
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>

                {/* Secondary Navigation */}
                <div className="space-y-2 mb-6">
                  {secondaryNavItems.map(item => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <SheetClose key={item.href} asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            'flex items-center space-x-3 p-4 rounded-lg transition-colors touch-manipulation',
                            isActive
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                          )}
                        >
                          <Icon className="w-6 h-6" />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      </SheetClose>
                    )
                  })}
                </div>

                {/* User Section */}
                {user && (
                  <div className="border-t pt-4">
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {user.user_metadata?.full_name || user.email}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <SheetClose asChild>
                        <Link href="/profile">
                          <Button
                            variant="outline"
                            className="h-12 touch-manipulation w-full"
                          >
                            <User className="w-4 h-4 mr-2" />
                            Hồ sơ
                          </Button>
                        </Link>
                      </SheetClose>

                      {/* Dark Mode Toggle */}
                      {mounted && (
                        <Button
                          variant="outline"
                          className="h-12 touch-manipulation"
                          onClick={() =>
                            setTheme(theme === 'dark' ? 'light' : 'dark')
                          }
                        >
                          {theme === 'dark' ? (
                            <>
                              <Sun className="w-4 h-4 mr-2" />
                              Sáng
                            </>
                          ) : (
                            <>
                              <Moon className="w-4 h-4 mr-2" />
                              Tối
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Spacer for bottom navigation */}
      <div className="md:hidden h-16" />
    </>
  )
}
