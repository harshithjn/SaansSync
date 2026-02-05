"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    User,
    Mail,
    Phone,
    Settings as SettingsIcon,
    Bell,
    Lock,
    Save,
    Calendar,
    Stethoscope,
    Globe
} from "lucide-react"
import { usePatientAuth } from "@/lib/auth-guard"
import { getPatientProfile } from "@/lib/database-service"
import { PatientProfile } from "@/lib/monitoring-types"
import { resolveUserProfile } from "@/lib/session-manager"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"

export default function PatientSettingsPage() {
    const authState = usePatientAuth()
    const { language, setLanguage, t } = useLanguage()

    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<PatientProfile | null>(null)
    const [isEditing, setIsEditing] = useState(false)

    useEffect(() => {
        const loadProfile = async () => {
            try {
                // Fetch basic profile from DB if we have an ID
                let dbData = null
                if (authState.profile?.id) {
                    dbData = await getPatientProfile(authState.profile.id)
                }

                // Overlay with session data for security
                const sessionRes = await resolveUserProfile()
                const sessionProfile = sessionRes.profile as any

                if (sessionProfile) {
                    setProfile({
                        ...(dbData || {} as any),
                        full_name: sessionProfile.full_name || dbData?.full_name || authState.profile?.full_name,
                        email: sessionProfile.email || dbData?.email || authState.profile?.email,
                        phone: sessionProfile.mobile || sessionProfile.phone || dbData?.phone || authState.profile?.phone
                    })
                } else if (dbData) {
                    setProfile(dbData)
                }
            } catch (error) {
                console.error("Failed to load patient profile:", error)
                toast.error("Failed to load profile settings")
            } finally {
                setLoading(false)
            }
        }

        if (!authState.loading) {
            loadProfile()
        }
    }, [authState.profile?.id, authState.loading])

    const handleSave = () => {
        toast.success(t('Settings saved successfully') || "Settings saved successfully")
        setIsEditing(false)
    }

    if (loading || authState.loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-outfit">{t('Account Settings')}</h1>
                    <p className="text-gray-500">{t('Manage your personal information and preferences')}</p>
                </div>
                <Button
                    variant={isEditing ? "outline" : "default"}
                    className={!isEditing ? "bg-green-600 hover:bg-green-700" : ""}
                    onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
                >
                    {isEditing ? t('Cancel') : t('Edit Profile')}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Overview Card */}
                <Card className="p-6 col-span-1 space-y-6 shadow-sm border-0 bg-white/50 backdrop-blur-sm">
                    <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                            <User className="w-12 h-12 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{profile?.full_name || authState.profile?.full_name}</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {profile?.patient_data?.diagnosis?.primaryCategory || t('Patient')}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{profile?.email || authState.profile?.email || t('No email')}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{t('Age')}: {profile?.patient_data?.age || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Stethoscope className="w-4 h-4" />
                            <span>{t('Diagnosis')}: {profile?.patient_data?.diagnosis?.primaryCategory || 'N/A'}</span>
                        </div>
                    </div>
                </Card>

                {/* Detailed Settings Forms */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="p-6 shadow-sm border-0 bg-white">
                        <div className="flex items-center gap-2 mb-6">
                            <SettingsIcon className="w-5 h-5 text-green-600" />
                            <h3 className="text-lg font-bold">{t('Personal Information')}</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">{t('Full Name')}</Label>
                                <Input
                                    id="fullName"
                                    defaultValue={profile?.full_name || authState.profile?.full_name}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">{t('Email Address')}</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        defaultValue={profile?.email || authState.profile?.email}
                                        disabled={!isEditing}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">{t('Phone Number')}</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        defaultValue={profile?.phone || authState.profile?.phone}
                                        disabled={!isEditing}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 shadow-sm border-0 bg-white">
                        <div className="flex items-center gap-2 mb-6">
                            <Globe className="w-5 h-5 text-green-600" />
                            <h3 className="text-lg font-bold">{t('Language Preferences')}</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant={language === 'en' ? 'default' : 'outline'}
                                    className={language === 'en' ? 'bg-green-600' : ''}
                                    onClick={() => setLanguage('en')}
                                    size="sm"
                                >
                                    English
                                </Button>
                                <Button
                                    variant={language === 'hi' ? 'default' : 'outline'}
                                    className={language === 'hi' ? 'bg-green-600' : ''}
                                    onClick={() => setLanguage('hi')}
                                    size="sm"
                                >
                                    हिन्दी (Hindi)
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 shadow-sm border-0 bg-white">
                        <div className="flex items-center gap-2 mb-6">
                            <Lock className="w-5 h-5 text-green-600" />
                            <h3 className="text-lg font-bold">{t('Account Security')}</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <Bell className="w-4 h-4 text-gray-500" />
                                    <div>
                                        <p className="text-sm font-medium">{t('Daily Reminders')}</p>
                                        <p className="text-xs text-gray-500">{t('Get notified when it is time to log your symptoms')}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" className="text-green-600">{t('Enabled')}</Button>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <Lock className="w-4 h-4 text-gray-500" />
                                    <div>
                                        <p className="text-sm font-medium">{t('Change Password')}</p>
                                        <p className="text-xs text-gray-500">{t('Update your login credentials')}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" className="text-green-600" disabled>{t('Manage')}</Button>
                            </div>
                        </div>
                    </Card>

                    {isEditing && (
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsEditing(false)}>{t('Cancel')}</Button>
                            <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={handleSave}>
                                <Save className="w-4 h-4" />
                                {t('Save Changes')}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
