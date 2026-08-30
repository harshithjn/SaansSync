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
    Shield,
    Settings as SettingsIcon,
    Bell,
    Lock,
    Save,
    Award,
    ChevronRight,
    Camera
} from "lucide-react"
import { getDoctorProfile } from "@/lib/database-service"
import { DoctorProfile } from "@/lib/monitoring-types"
import { resolveUserProfile } from "@/lib/session-manager"
import { toast } from "@/lib/toast"

export default function DoctorSettingsPage() {
    const params = useParams()
    const doctorId = params.doctorId as string

    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<DoctorProfile | null>(null)
    const [isEditing, setIsEditing] = useState(false)

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const dbProfile = await getDoctorProfile(doctorId)
                const sessionRes = await resolveUserProfile()
                const sessionProfile = sessionRes.profile as any

                if (dbProfile && sessionProfile) {
                    setProfile({
                        ...dbProfile,
                        fullName: sessionProfile.fullName || dbProfile.fullName,
                        email: sessionProfile.email || dbProfile.email
                    })
                } else {
                    setProfile(dbProfile)
                }
            } catch (error) {
                console.error(error)
                toast.error("Failed to load clinical profile")
            } finally {
                setLoading(false)
            }
        }

        if (doctorId) {
            loadProfile()
        }
    }, [doctorId])

    const handleSave = () => {
        toast.success("Profile updated successfully")
        setIsEditing(false)
    }

    if (loading) {
        return <div className="py-24 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Loading settings...</div>
    }

    return (
        <div className="max-w-4xl mx-auto space-y-12">
            {}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Account Settings</p>
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tighter">Settings</h1>
                </div>
                <Button
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    className={`h-12 px-8 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-slate-100 ${
                        isEditing ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-950 hover:bg-slate-800 text-white'
                    }`}
                >
                    {isEditing ? <><Save className="w-4 h-4 mr-2" /> Save Changes</> : "Edit Profile"}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {}
                <div className="space-y-6">
                    <Card className="p-8 border-none bg-white rounded-[2.5rem] shadow-sm border border-slate-50 flex flex-col items-center text-center">
                        <div className="relative group mb-6">
                            <div className="w-24 h-24 bg-slate-50 rounded-[1.75rem] flex items-center justify-center border-4 border-white shadow-sm overflow-hidden ring-1 ring-slate-100">
                                <User className="w-12 h-12 text-slate-300" />
                            </div>
                            <button className="absolute bottom-[-8px] right-[-8px] w-10 h-10 bg-white rounded-xl shadow-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-950 transition-all">
                                <Camera className="w-4 h-4" />
                            </button>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{profile?.fullName}</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 mb-4 flex items-center justify-center gap-2">
                                <Shield className="w-3 h-3 text-emerald-500" />
                                {profile?.approvalStatus === 'approved' ? 'Active Doctor' : 'Under Review'}
                            </p>
                            <Badge variant="secondary" className="bg-slate-50 text-slate-500 border-none font-bold text-[9px] uppercase tracking-widest px-3 py-1">
                                {profile?.specialization || 'Pulmonologist'}
                            </Badge>
                        </div>
                    </Card>

                    <div className="space-y-2">
                        <SettingItem icon={Bell} label="Notifications" />
                        <SettingItem icon={Lock} label="Security Keys" />
                        <SettingItem icon={Shield} label="Privacy Policy" />
                    </div>
                </div>

                {}
                <div className="md:col-span-2 space-y-8">
                    <Card className="p-10 border-none bg-white rounded-[3rem] shadow-sm border border-slate-50">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-10 h-10 bg-teal-50 text-teal-500 rounded-xl flex items-center justify-center">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Profile Details</h3>
                                <p className="text-[10px] font-medium text-slate-400">Professional information and contact.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-8">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Full Name</Label>
                                <Input
                                    type="email"
                                    defaultValue={profile?.email}
                                    disabled={!isEditing}
                                    className="h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900"
                                />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-10 border-none bg-white rounded-[3rem] shadow-sm border border-slate-50">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                                <Award className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Medical Credentials</h3>
                                <p className="text-[10px] font-medium text-slate-400">Affiliations and medical licenses.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-8">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Hospital Affiliation</Label>
                                <Input
                                    defaultValue={profile?.licenseNumber || "LCN-99102-X"}
                                    disabled={true}
                                    className="h-14 bg-slate-100 border-none rounded-2xl px-6 font-bold text-slate-400"
                                />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function SettingItem({ icon: Icon, label }: any) {
    return (
        <div className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-50 shadow-sm hover:bg-slate-50 transition-all cursor-pointer group">
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-slate-950 group-hover:text-white transition-all flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-200" />
        </div>
    )
}