"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/lib/toast'
import api from '@/lib/api'

export default function TestEmailPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const testEmail = async () => {
    if (!email) {
      toast.error('Please enter an email')
      return
    }

    setLoading(true)
    try {
      const result = await api.post<{ success: boolean; error?: string }>('/auth/test-email', { email })

      if (result?.success) {
        toast.success('Test email sent! Check your inbox.')
      } else {
        toast.error(`Error: ${result?.error || 'Failed to send test email'}`)
      }
    } catch (error) {
      toast.error('Unexpected error occurred')
      console.error('Test error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Test Email Delivery</h1>
        
        <div className="space-y-4">
          <Input
            type="email"
            placeholder="Enter test email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          
          <Button 
            onClick={testEmail} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Sending...' : 'Send Test Email'}
          </Button>
        </div>

        <div className="mt-6 p-4 bg-purple-50 rounded-lg">
          <h3 className="font-semibold text-purple-900 mb-2">Instructions:</h3>
          <ol className="text-sm text-purple-800 space-y-1">
            <li>1. Enter your email address</li>
            <li>2. Click "Send Test Email"</li>
            <li>3. Check your inbox (and spam folder)</li>
            <li>4. Look for verification email</li>
          </ol>
        </div>
      </div>
    </div>
  )
}