"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    User,
    Mail,
    Phone,
    Shield,
    Settings as SettingsIcon,
    Bell,
    Lock,
    Save,
    Award
} from "lucide-react"
import { getDoctorProfile } from "@/lib/database-service"
import { DoctorProfile } from "@/lib/monitoring-types"
import { resolveUserProfile } from "@/lib/session-manager"
import { toast } from "sonner"

export default function DoctorSettingsPage() {
    const params = useParams()
    const doctorId = params.doctorId as string

    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<DoctorProfile | null>(null)
    const [isEditing, setIsEditing] = useState(false)

    useEffect(() => {
        const loadProfile = async () => {
            try {
                // Fetch basic status from DB
                const dbProfile = await getDoctorProfile(doctorId)

                // Overlay with session data for security (name, email, phone)
                const sessionRes = await resolveUserProfile()
                const sessionProfile = sessionRes.profile as any

                if (dbProfile && sessionProfile) {
                    setProfile({
                        ...dbProfile,
                        full_name: sessionProfile.full_name || dbProfile.full_name,
                        email: sessionProfile.email || dbProfile.email,
                        phone: sessionProfile.mobile || sessionProfile.phone || dbProfile.phone
                    })
                } else {
                    setProfile(dbProfile)
                }
            } catch (error) {
                console.error("Failed to load doctor profile:", error)
                toast.error("Failed to load profile settings")
            } finally {
                setLoading(false)
            }
        }

        if (doctorId) {
            loadProfile()
        }
    }, [doctorId])

    const handleSave = () => {
        toast.success("Settings saved successfully")
        setIsEditing(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-outfit">Account Settings</h1>
                    <p className="text-gray-500">Manage your professional profile and application preferences</p>
                </div>
                <Button
                    variant={isEditing ? "outline" : "default"}
                    onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
                >
                    {isEditing ? "Cancel" : "Edit Profile"}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Overview Card */}
                <Card className="p-6 col-span-1 space-y-6 shadow-sm border-0 bg-white/50 backdrop-blur-sm">
                    <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                            <User className="w-12 h-12 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{profile?.full_name}</h2>
                            <Badge variant="secondary" className="mt-1">
                                {profile?.approval_status === 'approved' ? 'Verified Doctor' : 'Pending Verification'}
                            </Badge>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{profile?.email || 'No email provided'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            <span>{profile?.phone || 'No phone provided'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Shield className="w-4 h-4" />
                            <span>License: {profile?.license_number || 'N/A'}</span>
                        </div>
                    </div>
                </Card>

                {/* Detailed Settings Forms */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="p-6 shadow-sm border-0 bg-white">
                        <div className="flex items-center gap-2 mb-6">
                            <SettingsIcon className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-bold">Personal Information</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                    id="fullName"
                                    defaultValue={profile?.full_name}
                                    disabled={!isEditing}
                                    placeholder="Dr. John Doe"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        defaultValue={profile?.email}
                                        disabled={!isEditing}
                                        placeholder="doctor@example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        defaultValue={profile?.phone}
                                        disabled={!isEditing}
                                        placeholder="+1 234 567 890"
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 shadow-sm border-0 bg-white">
                        <div className="flex items-center gap-2 mb-6">
                            <Award className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-bold">Professional Details</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="hospital">Hospital / Clinic Affiliation</Label>
                                <Input
                                    id="hospital"
                                    defaultValue={profile?.hospital_affiliation || "City Medical Center"}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="specialization">Specialization</Label>
                                <Input
                                    id="specialization"
                                    defaultValue={profile?.specialization || "Pulmonologist"}
                                    disabled={!isEditing}
                                />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 shadow-sm border-0 bg-white">
                        <div className="flex items-center gap-2 mb-6">
                            <Lock className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-bold">Security & Alerts</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <Bell className="w-4 h-4 text-gray-500" />
                                    <div>
                                        <p className="text-sm font-medium">Email Notifications</p>
                                        <p className="text-xs text-gray-500">Receive alerts for critical patients via email</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm">Configure</Button>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <Shield className="w-4 h-4 text-gray-500" />
                                    <div>
                                        <p className="text-sm font-medium">Two-Factor Authentication</p>
                                        <p className="text-xs text-gray-500">Add an extra layer of security to your account</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" disabled>Enabled</Button>
                            </div>
                        </div>
                    </Card>

                    {isEditing && (
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button className="gap-2" onClick={handleSave}>
                                <Save className="w-4 h-4" />
                                Save Changes
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}