import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, Loader2 } from 'lucide-react'
import { ReactNode } from 'react'

interface ListStateProps {
  state: 'loading' | 'empty' | 'error'
  title?: string
  description?: string
  icon?: ReactNode
  action?: {
    label: string
    onClick: () => void
    variant?:
      | 'default'
      | 'outline'
      | 'secondary'
      | 'destructive'
      | 'ghost'
      | 'link'
  }
  itemCount?: number
  className?: string
  // For accessibility
  'aria-live'?: 'polite' | 'assertive' | 'off'
}

export function ListState({
  state,
  title,
  description,
  icon,
  action,
  itemCount = 6,
  className = '',
  'aria-live': ariaLive = 'polite',
}: ListStateProps) {
  if (state === 'loading') {
    return (
      <div
        className={`space-y-4 ${className}`}
        role="status"
        aria-live={ariaLive}
        aria-label="Đang tải dữ liệu"
      >
        {/* Loading Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: itemCount }, (_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-muted rounded-full shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="h-4 bg-muted rounded mb-2" />
                    <div className="h-3 bg-muted rounded w-3/4" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
                <div className="mt-4 flex gap-2">
                  <div className="h-8 bg-muted rounded flex-1" />
                  <div className="h-8 bg-muted rounded flex-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading Text */}
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Đang tải dữ liệu...</span>
          </div>
        </div>
      </div>
    )
  }

  // Common content for empty and error states
  const getStateContent = () => {
    switch (state) {
      case 'empty':
        return {
          defaultTitle: 'Chưa có dữ liệu',
          defaultDescription: 'Không có mục nào để hiển thị',
          defaultIcon: (
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 text-muted-foreground" />
            </div>
          ),
        }
      case 'error':
        return {
          defaultTitle: 'Đã có lỗi xảy ra',
          defaultDescription: 'Không thể tải dữ liệu. Vui lòng thử lại.',
          defaultIcon: (
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
          ),
        }
      default:
        return {
          defaultTitle: '',
          defaultDescription: '',
          defaultIcon: null,
        }
    }
  }

  const { defaultTitle, defaultDescription, defaultIcon } = getStateContent()

  return (
    <Card className={`${className}`}>
      <CardContent className="py-16">
        <div
          className="text-center max-w-md mx-auto"
          role={state === 'error' ? 'alert' : 'status'}
          aria-live={ariaLive}
        >
          {/* Icon */}
          {icon || defaultIcon}

          {/* Title */}
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {title || defaultTitle}
          </h3>

          {/* Description */}
          <p className="text-muted-foreground mb-6">
            {description || defaultDescription}
          </p>

          {/* Action Button */}
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || 'default'}
            >
              {action.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Specialized components for common use cases
export function LoadingCards({
  itemCount = 6,
  className,
}: {
  itemCount?: number
  className?: string
}) {
  return (
    <ListState state="loading" itemCount={itemCount} className={className} />
  )
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: Omit<ListStateProps, 'state'>) {
  return (
    <ListState
      state="empty"
      title={title}
      description={description}
      icon={icon}
      action={action}
      className={className}
    />
  )
}

export function ErrorState({
  title,
  description,
  onRetry,
  className,
}: {
  title?: string
  description?: string
  onRetry: () => void
  className?: string
}) {
  return (
    <ListState
      state="error"
      title={title}
      description={description}
      action={{
        label: 'Thử lại',
        onClick: onRetry,
        variant: 'default',
      }}
      className={className}
      aria-live="assertive"
    />
  )
}
