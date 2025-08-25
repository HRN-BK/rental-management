'use client'

import { Button } from '@/components/ui/button'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function Home() {
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing...')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const testSupabaseConnection = async () => {
      try {
        if (!isSupabaseConfigured()) {
          setConnectionStatus('⚠️ Supabase not configured - using placeholder values')
          setIsLoading(false)
          return
        }
        
        // Simple health check - this will work even without database setup
        const { error } = await supabase.from('_realtime_schema').select('*').limit(1)
        if (error) {
          // Expected error if no database setup yet
          if (error.message.includes('relation') || error.message.includes('does not exist')) {
            setConnectionStatus('✅ Supabase connected (no schema yet)')
          } else {
            setConnectionStatus(`❌ Supabase error: ${error.message}`)
          }
        } else {
          setConnectionStatus('✅ Supabase connected successfully')
        }
      } catch (err) {
        setConnectionStatus(`❌ Connection failed: ${err}`)
      } finally {
        setIsLoading(false)
      }
    }

    testSupabaseConnection()
  }, [])

  return (
    <main className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Rental Web</h1>
          <p className="text-lg text-muted-foreground">
            Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui + Supabase
          </p>
        </div>

        {/* Integration Tests */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 border rounded-lg bg-card text-card-foreground">
            <h2 className="text-xl font-semibold mb-2">Next.js 15</h2>
            <p className="text-sm text-muted-foreground mb-4">
              App Router with TypeScript support
            </p>
            <div className="text-green-600 font-medium">✅ Working</div>
          </div>

          <div className="p-6 border rounded-lg bg-card text-card-foreground">
            <h2 className="text-xl font-semibold mb-2">Tailwind CSS</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Utility-first CSS framework
            </p>
            <div className="text-green-600 font-medium">✅ Styling applied</div>
          </div>

          <div className="p-6 border rounded-lg bg-card text-card-foreground">
            <h2 className="text-xl font-semibold mb-2">shadcn/ui</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Beautiful UI components
            </p>
            <Button size="sm" className="mt-2">
              ✅ Button works
            </Button>
          </div>

          <div className="p-6 border rounded-lg bg-card text-card-foreground md:col-span-2 lg:col-span-3">
            <h2 className="text-xl font-semibold mb-2">Supabase Connection</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Database and authentication backend
            </p>
            <div className="font-medium">
              {isLoading ? 'Testing connection...' : connectionStatus}
            </div>
            {!isLoading && (
              <p className="text-xs text-muted-foreground mt-2">
                Configure your Supabase credentials in .env.local to fully enable database features.
              </p>
            )}
          </div>
        </div>

        {/* Next Steps */}
        <div className="p-6 border rounded-lg bg-card text-card-foreground">
          <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
          <ul className="space-y-2 text-sm">
            <li>• Set up your Supabase project and add credentials to .env.local</li>
            <li>• Create your database schema</li>
            <li>• Add authentication</li>
            <li>• Build your rental management features</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
