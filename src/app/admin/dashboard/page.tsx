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
    AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    getDoctorRegistrations,
    updateRegistrationStatus,
    getPendingRegistrationsCount,
    type DoctorRegistration
} from '@/lib/doctor-storage'

export default function AdminDashboard() {
    const [registrations, setRegistrations] = useState<DoctorRegistration[]>([])
    const [selectedTab, setSelectedTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadRegistrations()
    }, [])

    const loadRegistrations = () => {
        const allRegistrations = getDoctorRegistrations()
        setRegistrations(allRegistrations)
    }

    const handleApprove = async (id: string) => {
        setLoading(true)
        try {
            const success = updateRegistrationStatus(id, 'approved', 'Admin')
            if (success) {
                loadRegistrations()
                alert('Doctor registration approved successfully! Login credentials have been created.')
            } else {
                alert('Error approving registration')
            }
        } catch (error) {
            alert('Error approving registration')
        } finally {
            setLoading(false)
        }
    }

    const handleReject = async (id: string) => {
        const reason = prompt('Please provide a reason for rejection:')
        if (!reason) return

        setLoading(true)
        try {
            const success = updateRegistrationStatus(id, 'rejected', 'Admin', reason)
            if (success) {
                loadRegistrations()
                alert('Doctor registration rejected.')
            } else {
                alert('Error rejecting registration')
            }
        } catch (error) {
            alert('Error rejecting registration')
        } finally {
            setLoading(false)
        }
    }

    const filteredRegistrations = registrations.filter(reg => reg.status === selectedTab)
    const pendingCount = registrations.filter(reg => reg.status === 'pending').length
    const approvedCount = registrations.filter(reg => reg.status === 'approved').length
    const rejectedCount = registrations.filter(reg => reg.status === 'rejected').length

    return (
        <div className="min-h-screen bg-gray-50">
            <Header currentPage="admin" />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                            <p className="text-gray-600">Manage doctor registrations and approvals</p>
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
                                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
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
                                <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
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
                                <p className="text-2xl font-bold text-gray-900">{rejectedCount}</p>
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
                                <p className="text-2xl font-bold text-gray-900">{registrations.length}</p>
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
                                Pending ({pendingCount})
                            </button>
                            <button
                                onClick={() => setSelectedTab('approved')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${selectedTab === 'approved'
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Approved ({approvedCount})
                            </button>
                            <button
                                onClick={() => setSelectedTab('rejected')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${selectedTab === 'rejected'
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Rejected ({rejectedCount})
                            </button>
                        </div>
                    </div>

                    {/* Registration Cards */}
                    <div className="p-6">
                        {filteredRegistrations.length === 0 ? (
                            <div className="text-center py-12">
                                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No {selectedTab} registrations
                                </h3>
                                <p className="text-gray-500">
                                    {selectedTab === 'pending'
                                        ? 'New doctor registrations will appear here for review.'
                                        : `No ${selectedTab} doctor registrations found.`
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {filteredRegistrations.map((registration) => (
                                    <div
                                        key={registration.id}
                                        className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                    {registration.name}
                                                </h3>
                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                    <div className="flex items-center gap-1">
                                                        <Mail className="w-4 h-4" />
                                                        {registration.email}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Phone className="w-4 h-4" />
                                                        {registration.phoneNumber}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${registration.status === 'pending'
                                                ? 'bg-orange-100 text-orange-700'
                                                : registration.status === 'approved'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                }`}>
                                                {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar className="w-4 h-4" />
                                                <span>Submitted: {new Date(registration.submittedAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <FileText className="w-4 h-4" />
                                                <span>Certificate: {registration.certificateFileName}</span>
                                            </div>
                                        </div>

                                        {registration.reviewedAt && (
                                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                                <p className="text-sm text-gray-600">
                                                    <strong>Reviewed:</strong> {new Date(registration.reviewedAt).toLocaleDateString()} by {registration.reviewedBy}
                                                </p>
                                                {registration.rejectionReason && (
                                                    <p className="text-sm text-red-600 mt-1">
                                                        <strong>Reason:</strong> {registration.rejectionReason}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {registration.status === 'pending' && (
                                            <div className="flex gap-3">
                                                <Button
                                                    onClick={() => handleApprove(registration.id)}
                                                    disabled={loading}
                                                    className="bg-green-600 hover:bg-green-700 text-white gap-2"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    onClick={() => handleReject(registration.id)}
                                                    disabled={loading}
                                                    variant="outline"
                                                    className="border-red-300 text-red-600 hover:bg-red-50 gap-2"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Reject
                                                </Button>
                                            </div>
                                        )}

                                        {registration.status === 'approved' && (
                                            <div className="p-3 bg-green-50 rounded-lg">
                                                <p className="text-sm text-green-700">
                                                    ✅ <strong>Login Created:</strong> Email: {registration.email} | Password: doctor123
                                                </p>
                                                <p className="text-xs text-green-600 mt-1">
                                                    Doctor can now login and will get a unique dashboard URL
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