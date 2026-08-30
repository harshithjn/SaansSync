"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    User,
    Mail,
    Settings as SettingsIcon,
    Bell,
    Lock,
    Save,
    Calendar,
    Stethoscope,
    Globe,
    ShieldCheck,
    ChevronRight,
    Loader2,
    CheckCircle2
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
                let dbData = null
                if (authState.profile?.id) {
                    dbData = await getPatientProfile(authState.profile.id)
                }

                const sessionRes = await resolveUserProfile()
                const sessionProfile = sessionRes.profile as any

                if (sessionProfile) {
                    setProfile({
                        ...(dbData || {} as any),
                        fullName: sessionProfile.fullName || dbData?.fullName || authState.profile?.fullName,
                        email: sessionProfile.email || dbData?.email || authState.profile?.email
                    })
                } else if (dbData) {
                    setProfile(dbData)
                }
            } catch (error) {
                console.error("Failed to load patient profile:", error)
            } finally {
                setLoading(false)
            }
        }

        if (!authState.loading) {
            loadProfile()
        }
    }, [authState.profile?.id, authState.loading])

    const handleSave = () => {
        toast.success(t('Identity configuration updated') || "Identity configuration updated")
        setIsEditing(false)
    }

    if (loading || authState.loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-[2rem] border border-slate-100 shadow-sm">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Synching Identity Nodes...</p>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-1000">
            {}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-slate-50 pb-12">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest border border-slate-100/50">
                        <User className="w-3 h-3" />
                        Administrative Surface
                    </div>
                    <h1 className="text-5xl font-black text-slate-950 tracking-tighter leading-none">Identity Config</h1>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Manage patient credentials and localization</p>
                </div>
                <Button
                    variant={isEditing ? "ghost" : "default"}
                    className={`h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-500 ${
                        isEditing
                        ? "bg-slate-50 text-slate-400 hover:text-slate-950 border border-slate-100/50"
                        : "bg-slate-950 text-white shadow-2xl shadow-slate-100 hover:bg-slate-800"
                    }`}
                    onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
                >
                    {isEditing ? 'Cancel Edit' : 'Edit Identity'}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {}
                <div className="lg:col-span-4 space-y-8">
                    <Card className="p-10 border-none bg-white rounded-[3.5rem] shadow-sm border border-slate-50 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-950 opacity-[0.02] rounded-full -translate-y-16 translate-x-16 transition-all duration-700 group-hover:scale-150" />

                        <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                            <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center border-4 border-white shadow-xl group-hover:scale-105 transition-all duration-500 overflow-hidden">
                                <img
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.fullName || 'Patient'}`}
                                    className="w-24 h-24 object-contain"
                                    alt="Avatar"
                                />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-slate-950 tracking-tighter leading-none">
                                    {profile?.fullName || authState.profile?.fullName}
                                </h2>
                                <Badge className="bg-emerald-50 text-emerald-500 border-none font-black text-[8px] uppercase tracking-[0.3em] px-4 py-1.5 rounded-full">
                                    Verified Subject
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-6 pt-10 mt-10 border-t border-slate-50 relative z-10">
                            <div className="flex items-center gap-4 group/item">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover/item:text-slate-950 transition-colors">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1.5">Primary Link</p>
                                    <p className="text-sm font-bold text-slate-950 truncate">{profile?.email || authState.profile?.email || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 group/item">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover/item:text-slate-950 transition-colors">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1.5">Metric Age</p>
                                    <p className="text-sm font-bold text-slate-950">{(profile as any)?.age || 'Unset'} Cycles</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-8 border-none bg-slate-950 rounded-[2.5rem] shadow-2xl shadow-slate-100 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl rounded-full" />
                        <div className="flex items-center gap-4 mb-6">
                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Trust Engine</h4>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase tracking-wider text-center">Your identity is cryptographically linked to your healthcare provider's node. All changes require formal synchronization.</p>
                    </Card>
                </div>

                {}
                <div className="lg:col-span-8 space-y-8">
                    <Card className="p-10 border-none bg-white rounded-[3.5rem] shadow-sm border border-slate-50 space-y-10 hover:shadow-xl transition-all duration-700">
                        <div className="flex items-center gap-4 border-b border-slate-50 pb-8">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-950 shadow-sm">
                                <SettingsIcon className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Access Credentials</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Legal Full Identity</Label>
                                <Input
                                    id="fullName"
                                    defaultValue={profile?.fullName || authState.profile?.fullName}
                                    disabled={!isEditing}
                                    className="h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-sm text-slate-950 focus-visible:ring-slate-100 disabled:opacity-50 transition-all"
                                />
                            </div>
                            <div className="space-y-4">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Communication Endpoint</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    defaultValue={profile?.email || authState.profile?.email}
                                    disabled={!isEditing}
                                    className="h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-sm text-slate-950 focus-visible:ring-slate-100 disabled:opacity-50 transition-all"
                                />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-10 border-none bg-white rounded-[3.5rem] shadow-sm border border-slate-50 space-y-10 hover:shadow-xl transition-all duration-700">
                        <div className="flex items-center gap-4 border-b border-slate-50 pb-8">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-950 shadow-sm">
                                <Globe className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Localization</h3>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            {[
                                { id: 'en', label: 'ENGLISH_GLOBAL', local: 'International' },
                                { id: 'hi', label: 'HINDI_REGIONAL', local: 'हिन्दी' }
                            ].map((lang) => (
                                <button
                                    key={lang.id}
                                    onClick={() => setLanguage(lang.id as any)}
                                    className={`flex-1 min-w-[200px] h-20 rounded-[1.75rem] border transition-all duration-500 flex flex-col items-center justify-center gap-1.5 group ${
                                        language === lang.id
                                        ? 'bg-slate-950 text-white border-slate-950 shadow-2xl shadow-slate-100'
                                        : 'bg-slate-50 border-slate-50 text-slate-400 hover:border-slate-200'
                                    }`}
                                >
                                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${language === lang.id ? 'text-slate-400' : 'text-slate-300'}`}>{lang.label}</span>
                                    <span className="text-sm font-black tracking-tight">{lang.local}</span>
                                </button>
                            ))}
                        </div>
                    </Card>

                    <Card className="p-10 border-none bg-white rounded-[3.5rem] shadow-sm border border-slate-50 space-y-10 hover:shadow-xl transition-all duration-700">
                        <div className="flex items-center gap-4 border-b border-slate-50 pb-8">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-950 shadow-sm">
                                <Lock className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Surveillance Config</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-8 rounded-[2rem] bg-slate-50 border border-slate-100/50 group hover:bg-white transition-all duration-500">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-100 text-slate-200 group-hover:text-emerald-500 transition-colors shadow-sm">
                                        <Bell className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-slate-950 tracking-tight">Daily Triage Reminders</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Automated Clinical Prompts</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-emerald-500 bg-emerald-50 px-4 py-2 rounded-xl">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Active</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {isEditing && (
                        <div className="flex justify-end pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Button
                                className="h-16 px-12 rounded-[1.5rem] bg-slate-950 text-white font-black text-sm tracking-tight hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 flex items-center gap-4 group"
                                onClick={handleSave}
                            >
                                <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                Save Identity Manifest
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
