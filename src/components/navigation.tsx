'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Menu,
  Home,
  Building2,
  Users,
  FileText,
  DoorOpen,
  BarChart3,
  User,
  Receipt,
  Settings,
  LogOut,
  Mail,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Tổng quan', icon: BarChart3 },
  { href: '/properties', label: 'Nhà cho thuê', icon: Building2 },
  { href: '/rooms', label: 'Phòng', icon: DoorOpen },
  { href: '/tenants', label: 'Người thuê', icon: Users },
  { href: '/invoices', label: 'Thu tiền', icon: Receipt },
  { href: '/receipts', label: 'Biên lai', icon: FileText },
]

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, signOut } = useAuth()
  const [isOpen, setIsOpen] = React.useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth')
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b glass">
      <div className="flex sm:h-16 h-12 items-center justify-between w-full sm:px-4 px-2 md:px-6 max-w-none">
        {/* Left Side - Logo + Navigation */}
        <div className="flex items-center">
          {/* Logo/App Name */}
          <div className="flex items-center sm:space-x-2 space-x-1">
            <Link
              href="/"
              className="flex items-center sm:space-x-3 space-x-2 group"
            >
              <div className="sm:w-10 sm:h-10 w-8 h-8 gradient-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Home className="sm:w-5 sm:h-5 w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  RentalPro
                </span>
                <p className="text-xs text-muted-foreground -mt-1">
                  Quản lý cho thuê
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:ml-8">
            {/* Main Nav Items */}
            <div className="flex items-center space-x-1">
              {navItems.map(item => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105',
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'text-foreground/70 hover:text-foreground hover:bg-accent/50'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="hidden lg:flex lg:items-center lg:space-x-3">
          {/* Profile Dropdown */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:scale-110 transition-transform relative"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <div>
                    <p className="font-medium">
                      {user.user_metadata?.full_name || user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <User className="w-4 h-4 mr-2" />
                  Thông tin tài khoản
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/auth')}
              className="hover:scale-110 transition-transform"
            >
              <User className="w-4 h-4 mr-2" />
              Đăng nhập
            </Button>
          )}

          <ThemeToggle />
        </div>

        {/* Mobile Navigation */}
        <div className="flex flex-1 items-center justify-end space-x-1 lg:hidden">
          <div className="h-8 w-8 sm:h-9 sm:w-9">
            <ThemeToggle />
          </div>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Toggle Menu"
                className="ml-1 sm:ml-2 h-10 w-10 sm:h-9 sm:w-9"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[320px] sm:w-[350px] card-premium p-0"
            >
              <SheetHeader className="p-6 pb-4">
                <SheetTitle className="flex items-center space-x-3 text-lg">
                  <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                    <Home className="w-4 h-4 text-white" />
                  </div>
                  <span>RentalPro</span>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col space-y-6 px-6 pb-6">
                {/* Main Nav Items */}
                <div className="flex flex-col space-y-1">
                  {navItems.map(item => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <SheetClose key={item.href} asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            'flex items-center space-x-3 py-4 px-4 rounded-xl text-base font-medium transition-all duration-200 min-h-[52px] touch-manipulation',
                            isActive
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                              : 'text-foreground/70 hover:text-foreground hover:bg-accent/50 dark:hover:bg-gray-700'
                          )}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          <span className="text-base">{item.label}</span>
                        </Link>
                      </SheetClose>
                    )
                  })}
                </div>

                {/* User Actions */}
                <div className="border-t pt-6 dark:border-gray-700">
                  {user ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-4 rounded-xl bg-accent/30 dark:bg-gray-700">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-base truncate">
                            {user.user_metadata?.full_name || user.email}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <SheetClose asChild>
                        <Button
                          variant="outline"
                          className="w-full h-12 mb-3 text-base font-medium touch-manipulation"
                          onClick={() => router.push('/profile')}
                        >
                          <User className="w-5 h-5 mr-3" />
                          Thông tin tài khoản
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button
                          variant="outline"
                          className="w-full h-12 text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900 text-base font-medium touch-manipulation"
                          onClick={handleSignOut}
                        >
                          <LogOut className="w-5 h-5 mr-3" />
                          Đăng xuất
                        </Button>
                      </SheetClose>
                    </div>
                  ) : (
                    <SheetClose asChild>
                      <Button
                        className="w-full h-12 text-base font-medium touch-manipulation"
                        onClick={() => router.push('/auth')}
                      >
                        <User className="w-5 h-5 mr-3" />
                        Đăng nhập
                      </Button>
                    </SheetClose>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
