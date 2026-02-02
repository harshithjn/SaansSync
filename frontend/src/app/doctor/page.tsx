"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { guardPublicRoute } from "@/lib/auth-guard"

export default function DoctorPage() {
  const router = useRouter()

  // Redirect if already authenticated
  useEffect(() => {
    guardPublicRoute()
  }, [])

  const handleLogin = () => {
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Doctor Portal</h1>
        <p className="text-gray-600 text-center mb-8">
          Access your healthcare dashboard
        </p>
        
        <Button 
          onClick={handleLogin}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          Go to Login
        </Button>
      </div>
    </div>
  )
}
