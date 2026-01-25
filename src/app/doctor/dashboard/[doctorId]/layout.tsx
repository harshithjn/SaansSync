"use client"

import { ReactNode, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  User,
  LogOut,
  Users,
  Bell,
  BarChart3,
  Settings,
  Download,
  Calendar,
  Stethoscope,
  ChevronRight
} from "lucide-react"
import { getDoctorBySession, clearDoctorSession, verifyDoctorSession, type DoctorSession } from "@/lib/doctor-session"

export default function Layout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ doctorId: string }>
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [doctorSession, setDoctorSession] = useState<DoctorSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [doctorId, setDoctorId] = useState<string>("")

  const navigationItems = [
    {
      name: "Patients",
      href: `/doctor/dashboard/${doctorId}`,
      icon: Users,
      isActive: pathname === `/doctor/dashboard/${doctorId}`
    },
    {
      name: "Alerts",
      href: `/doctor/dashboard/${doctorId}/alerts`,
      icon: Bell,
      isActive: pathname === `/doctor/dashboard/${doctorId}/alerts`
    },
    {
      name: "Analytics",
      href: `/doctor/dashboard/${doctorId}/analytics`,
      icon: BarChart3,
      isActive: pathname === `/doctor/dashboard/${doctorId}/analytics`
    },
    {
      name: "Appointments",
      href: `/doctor/dashboard/${doctorId}/appointments`,
      icon: Calendar,
      isActive: pathname === `/doctor/dashboard/${doctorId}/appointments`
    },
    {
      name: "Export Data",
      href: `/doctor/dashboard/${doctorId}/export`,
      icon: Download,
      isActive: pathname === `/doctor/dashboard/${doctorId}/export`
    },
    {
      name: "Settings",
      href: `/doctor/dashboard/${doctorId}/settings`,
      icon: Settings,
      isActive: pathname === `/doctor/dashboard/${doctorId}/settings`
    }
  ]

  useEffect(() => {
    // Unwrap the params Promise
    const initializeParams = async () => {
      const resolvedParams = await params
      setDoctorId(resolvedParams.doctorId)

      // Verify doctor session and access
      const session = getDoctorBySession()

      if (!session || !verifyDoctorSession(resolvedParams.doctorId)) {
        // Invalid session or unauthorized access
        clearDoctorSession()
        router.push('/login')
        return
      }

      setDoctorSession(session)
      setIsLoading(false)
    }

    initializeParams()
  }, [params, router])

  const handleLogout = () => {
    clearDoctorSession()
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!doctorSession) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Fixed and Non-scrollable */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-900 rounded flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">SaansSync</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const IconComponent = item.icon
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`
                    flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors
                    ${item.isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}>
                    <IconComponent className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Doctor Profile & Logout - Fixed at bottom */}
        <div className="px-3 py-4 border-t border-gray-200 bg-gray-50">
          <div className="px-3 py-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-3 h-3 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">
                  {doctorSession.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {doctorSession.email}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <LogOut className="w-3 h-3" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content - Offset by sidebar width */}
      <main className="flex-1 ml-64 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}