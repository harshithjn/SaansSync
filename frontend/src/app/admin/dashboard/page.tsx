"use client"

import { useState, useEffect } from 'react'
import { Header } from '@/components/common/Header'
import {
    Shield,
    Users,
    Clock,
    CheckCircle,
    XCircle,
    FileText,
    Mail,
    Phone,
    Calendar,
    AlertCircle,
    RefreshCw,
    LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
    getAllDoctors,
    approveDoctorAccount, 
    rejectDoctorAccount,
    fixApprovedDoctors,
    type DoctorProfile 
} from '@/lib/auth-service'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'

export default function AdminDashboard() {
    const [doctors, setDoctors] = useState<DoctorProfile[]>([])
    const [selectedTab, setSelectedTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [checkingAuth, setCheckingAuth] = useState(true)
    const [stats, setStats] = useState({
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0
    })

    useEffect(() => {
        checkAdminAuth()
    }, [])

    const checkAdminAuth = async () => {
        try {
            // Check for valid Supabase session
            const { data: { session }, error } = await supabase.auth.getSession()
            
            if (error || !session || !session.user) {
                console.log('❌ No valid admin session found')
                window.location.href = '/admin/login'
                return
            }

            // Verify admin role
            const userEmail = session.user.email
            const adminEmails = ['harshithj1121@gmail.com', 'admin@healthplatform.com', 'admin@saanssync.com']
            
            if (!adminEmails.includes(userEmail || '')) {
                console.log('❌ User is not an admin:', userEmail)
                window.location.href = '/admin/login'
                return
            }

            console.log('✅ Admin authenticated:', userEmail)
            setIsAuthenticated(true)
            loadDoctors()
            
        } catch (error) {
            console.error('❌ Auth check error:', error)
            window.location.href = '/admin/login'
        } finally {
            setCheckingAuth(false)
        }
    }

    const loadDoctors = async () => {
        setRefreshing(true)
        try {
            console.log('👨‍💼 Loading doctors for admin dashboard...')

            const allDoctors = await getAllDoctors()
            
            console.log('📊 Loaded doctors:', allDoctors.length)
            
            if (allDoctors.length === 0) {
                console.log('ℹ️ No doctors found - normal if no registrations yet')
                toast.success('Admin dashboard loaded (no doctors registered yet)')
            } else {
                toast.success(`Loaded ${allDoctors.length} doctors successfully`)
            }

            setDoctors(allDoctors)
            
            // Calculate stats
            const pending = allDoctors.filter(d => d.approval_status === 'pending').length
            const approved = allDoctors.filter(d => d.approval_status === 'approved').length
            const rejected = allDoctors.filter(d => d.approval_status === 'rejected').length
            
            setStats({
                pending,
                approved,
                rejected,
                total: allDoctors.length
            })

        } catch (error) {
            console.error('❌ Error loading doctors:', error)
            
            // Check if this is a service role key issue
            if (error && typeof error === 'object' && 'message' in error) {
                const errorMessage = (error as any).message
                if (errorMessage.includes('Service role key not configured')) {
                    toast.error('Admin functions require service role key. Please add NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY to your environment.')
                } else {
                    toast.error(`Failed to load doctors: ${errorMessage}`)
                }
            } else {
                toast.error('Failed to load doctor data. Check console for details.')
            }
        } finally {
            setRefreshing(false)
        }
    }

    const handleApprove = async (doctorId: string) => {
        setLoading(true)
        try {
            const result = await approveDoctorAccount(doctorId)
            if (result.success) {
                await loadDoctors()
                toast.success('Doctor account approved successfully!')
            } else {
                toast.error(result.error || 'Failed to approve doctor account')
            }
        } catch (error) {
            console.error('Error approving doctor:', error)
            toast.error('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleReject = async (doctorId: string) => {
        const reason = prompt('Please provide a reason for rejection:')
        if (!reason) return

        setLoading(true)
        try {
            const result = await rejectDoctorAccount(doctorId)
            if (result.success) {
                await loadDoctors()
                toast.success('Doctor account rejected.')
            } else {
                toast.error(result.error || 'Failed to reject doctor account')
            }
        } catch (error) {
            console.error('Error rejecting doctor:', error)
            toast.error('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleFixApprovedDoctors = async () => {
        setLoading(true)
        try {
            const result = await fixApprovedDoctors()
            if (result.success) {
                toast.success(`Fixed ${result.fixed} approved doctors`)
                await loadDoctors() // Reload the list
            } else {
                toast.error(result.error || 'Failed to fix approved doctors')
            }
        } catch (error) {
            console.error('Error fixing approved doctors:', error)
            toast.error('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        try {
            // Sign out from Supabase
            await supabase.auth.signOut()
            
            toast.success('Logged out successfully')
            window.location.href = '/admin/login'
        } catch (error) {
            console.error('❌ Logout error:', error)
            // Force redirect even if logout fails
            toast.success('Logged out successfully')
            window.location.href = '/admin/login'
        }
    }

    const filteredDoctors = doctors.filter(doctor => doctor.approval_status === selectedTab)

    if (checkingAuth) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Checking admin authentication...</p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null // Will redirect to login
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header currentPage="admin" />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                                <p className="text-gray-600">Manage doctor registrations and approvals</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={loadDoctors}
                                disabled={refreshing}
                                variant="outline"
                                className="gap-2"
                            >
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                            <Button
                                onClick={handleFixApprovedDoctors}
                                disabled={loading}
                                variant="outline"
                                className="gap-2 bg-blue-50 border-blue-300 text-blue-600 hover:bg-blue-100"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Fix Approved Doctors
                            </Button>
                            <Button
                                onClick={handleLogout}
                                variant="outline"
                                className="gap-2 text-red-600 border-red-300 hover:bg-red-50"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                                <p className="text-sm text-gray-600">Pending Reviews</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                                <p className="text-sm text-gray-600">Approved Doctors</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                                <XCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                                <p className="text-sm text-gray-600">Rejected</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                <p className="text-sm text-gray-600">Total Applications</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="border-b border-gray-200">
                        <div className="flex">
                            <button
                                onClick={() => setSelectedTab('pending')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${selectedTab === 'pending'
                                    ? 'border-orange-500 text-orange-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Pending ({stats.pending})
                            </button>
                            <button
                                onClick={() => setSelectedTab('approved')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${selectedTab === 'approved'
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Approved ({stats.approved})
                            </button>
                            <button
                                onClick={() => setSelectedTab('rejected')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${selectedTab === 'rejected'
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Rejected ({stats.rejected})
                            </button>
                        </div>
                    </div>

                    {/* Doctor Cards */}
                    <div className="p-6">
                        {filteredDoctors.length === 0 ? (
                            <div className="text-center py-12">
                                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No {selectedTab} doctors
                                </h3>
                                <p className="text-gray-500">
                                    {selectedTab === 'pending'
                                        ? 'New doctor registrations will appear here for review.'
                                        : `No ${selectedTab} doctor accounts found.`
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {filteredDoctors.map((doctor) => (
                                    <div
                                        key={doctor.id}
                                        className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                    {doctor.full_name}
                                                </h3>
                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                    <div className="flex items-center gap-1">
                                                        <Mail className="w-4 h-4" />
                                                        {doctor.email}
                                                    </div>
                                                    {doctor.phone && (
                                                        <div className="flex items-center gap-1">
                                                            <Phone className="w-4 h-4" />
                                                            {doctor.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${doctor.approval_status === 'pending'
                                                ? 'bg-orange-100 text-orange-700'
                                                : doctor.approval_status === 'approved'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                }`}>
                                                {doctor.approval_status.charAt(0).toUpperCase() + doctor.approval_status.slice(1)}
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar className="w-4 h-4" />
                                                <span>Registered: {new Date(doctor.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Users className="w-4 h-4" />
                                                <span>Doctor ID: {doctor.id.slice(0, 8)}...</span>
                                            </div>
                                        </div>

                                        {doctor.updated_at !== doctor.created_at && (
                                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                                <p className="text-sm text-gray-600">
                                                    <strong>Last Updated:</strong> {new Date(doctor.updated_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        )}

                                        {doctor.approval_status === 'pending' && (
                                            <div className="flex gap-3">
                                                <Button
                                                    onClick={() => handleApprove(doctor.id)}
                                                    disabled={loading}
                                                    className="bg-green-600 hover:bg-green-700 text-white gap-2"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    onClick={() => handleReject(doctor.id)}
                                                    disabled={loading}
                                                    variant="outline"
                                                    className="border-red-300 text-red-600 hover:bg-red-50 gap-2"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Reject
                                                </Button>
                                            </div>
                                        )}

                                        {doctor.approval_status === 'approved' && (
                                            <div className="p-3 bg-green-50 rounded-lg">
                                                <p className="text-sm text-green-700">
                                                    ✅ <strong>Account Active:</strong> Doctor can login with their email and password
                                                </p>
                                                <p className="text-xs text-green-600 mt-1">
                                                    Dashboard URL: /doctor/dashboard/{doctor.id}
                                                </p>
                                            </div>
                                        )}

                                        {doctor.approval_status === 'rejected' && (
                                            <div className="p-3 bg-red-50 rounded-lg">
                                                <p className="text-sm text-red-700">
                                                    ❌ <strong>Account Rejected:</strong> Doctor cannot access the system
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}