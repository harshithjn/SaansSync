"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PatientDashboardLayout } from "./PatientDashboardLayout"
import { usePatientAuth } from "@/lib/auth-guard"
import { useAuth } from "@/components/auth/AuthProvider"
import { getPatientDailyLogs, getPatientMedications, getPatientProfile } from "@/lib/database-service"
import CleanAsthmaDashboard from "./CleanAsthmaDashboard"
import ModernPatientDashboard from "./ModernPatientDashboard"
import CleanILDDashboard from "./CleanILDDashboard"
import CleanCOPDDashboard from "./CleanCOPDDashboard"
import CleanBronchiectasisDashboard from "./CleanBronchiectasisDashboard"
import CleanPostInfectionDashboard from "./CleanPostInfectionDashboard"
import {
    Activity,
    TrendingUp,
    Calendar,
    Heart,
    Thermometer,
    AlertTriangle,
    CheckCircle,
    Pill,
    FileText,
    BarChart3,
    Clock,
    ArrowRight,
    Loader2,
    ShieldCheck,
    History,
    Zap
} from "lucide-react"
import { LanguageProvider } from "@/lib/language-context"
import { formatDate } from "@/lib/utils"

interface PatientDashboardWrapperProps {
    diseaseType: string
}

export default function PatientDashboardWrapper({ diseaseType }: PatientDashboardWrapperProps) {
    const router = useRouter()
    const authState = usePatientAuth()
    const [isLoading, setIsLoading] = useState(true)
    const [dailyLogs, setDailyLogs] = useState<any[]>([])
    const [medications, setMedications] = useState<any[]>([])
    const [patientData, setPatientData] = useState<any>(null)
    const [activeTab, setActiveTab] = useState("entry")
    const { logout: signOut } = useAuth()

    useEffect(() => {
        const initializePage = async () => {
            if (!authState.user || authState.role !== 'patient' || !authState.profile) {
                return
            }
            try {
                const [logs, meds, profile] = await Promise.all([
                    getPatientDailyLogs(authState.profile.id),
                    getPatientMedications(authState.profile.id),
                    getPatientProfile(authState.profile.id)
                ])

                setDailyLogs(logs)
                setMedications(meds)
                setPatientData(profile)
            } catch (error) {
                console.error('Error loading patient data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        if (!authState.loading) {
            initializePage()
        }
    }, [authState])

    const handleLogout = async () => {
        await signOut()
        router.push('/')
    }

    const getRedFlagColor = (score: number) => {
        if (score >= 9) return 'text-rose-600 bg-rose-50 border-rose-100'
        if (score >= 7) return 'text-orange-600 bg-orange-50 border-orange-100'
        if (score >= 4) return 'text-amber-600 bg-amber-50 border-amber-100'
        return 'text-emerald-600 bg-emerald-50 border-emerald-100'
    }

    const getRedFlagLabel = (score: number) => {
        if (score >= 9) return 'NEEDS ATTENTION'
        if (score >= 7) return 'HIGH SURVEILLANCE'
        if (score >= 4) return 'STABLE WARNING'
        return 'OPTIMAL'
    }

    const renderDiseaseSpecificDashboard = (headless = false) => {
        if (!authState.profile) return null
        const props = { patientId: authState.profile.id, headless }
        switch (diseaseType.toLowerCase()) {
            case 'asthma':
            case 'bronchial asthma':
                return <CleanAsthmaDashboard {...props} />
            case 'ild':
            case 'interstitial lung disease (ild)':
                return <CleanILDDashboard {...props} />
            case 'copd':
            case 'copd (chronic obstructive pulmonary disease)':
                return <CleanCOPDDashboard {...props} />
            case 'bronchiectasis':
                return <CleanBronchiectasisDashboard {...props} />
            case 'post-infection':
            case 'post icu recovery':
                return <CleanPostInfectionDashboard {...props} />
            default:
                return <CleanAsthmaDashboard {...props} />
        }
    }

    if (authState.loading || isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 font-['Matter_Regular',sans-serif]">
                <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-[2rem] border border-slate-100 shadow-sm">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500/20" />
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Loading your health data...</p>
            </div>
        )
    }

    if (!authState.user || authState.role !== 'patient' || !authState.profile) {
        return null
    }

    // Special handling for Modern Asthma Dashboard if preferred
    if (diseaseType.toLowerCase().includes('asthma') && false) { // Set to false to use standardized layout
        return (
            <LanguageProvider>
                <div className="min-h-screen bg-white">
                    <ModernPatientDashboard
                        patientId={authState.profile.id}
                        patientName={patientData?.fullName || authState.profile?.full_name}
                        diagnosis={patientData?.diagnosis?.primaryCategory || diseaseType}
                    />
                </div>
            </LanguageProvider>
        )
    }

    return (
        <PatientDashboardLayout
            patientId={authState.profile.id}
            patientName={patientData?.fullName || authState.profile?.full_name || 'Patient'}
            diagnosis={patientData?.diagnosis?.primaryCategory || authState.profile?.patient_data?.diagnosis?.primaryCategory || 'Health Monitoring'}
        >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
                <div className="flex justify-center border-b border-slate-50 pb-6 sticky top-0 bg-white/80 backdrop-blur-md z-30 -mx-10 px-10">
                    <TabsList className="bg-slate-100/50 p-1 rounded-2xl border border-slate-100/50 h-14 w-full max-w-lg">
                        <TabsTrigger value="entry" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-md font-bold text-[11px] uppercase tracking-widest gap-2.5 h-full transition-all duration-300">
                            <Zap className="w-4 h-4" />
                            Log Entry
                        </TabsTrigger>
                        <TabsTrigger value="history" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-md font-bold text-[11px] uppercase tracking-widest gap-2.5 h-full transition-all duration-300">
                            <History className="w-4 h-4" />
                            History
                        </TabsTrigger>
                        <TabsTrigger value="trends" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-md font-bold text-[11px] uppercase tracking-widest gap-2.5 h-full transition-all duration-300">
                            <TrendingUp className="w-4 h-4" />
                            Trends
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="entry" className="mt-0 outline-none animate-in fade-in duration-700">
                    <div className="max-w-5xl mx-auto">
                        {renderDiseaseSpecificDashboard(true)}
                    </div>
                </TabsContent>

                <TabsContent value="history" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-5 duration-700">
                    <div className="max-w-5xl mx-auto space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Recent Logs</h3>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Your health history</p>
                            </div>
                            <div className="px-5 py-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Entries</span>
                                <span className="text-base font-bold text-slate-900 leading-none">{dailyLogs.length}</span>
                            </div>
                        </div>

                        {dailyLogs.length === 0 ? (
                            <Card className="p-24 text-center border-none shadow-sm rounded-[3rem] bg-slate-50/50 border border-slate-100 flex flex-col items-center">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-sm mb-6">
                                    <Activity className="w-6 h-6 text-slate-200" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2 tracking-tight">No history found</h3>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest max-w-xs leading-relaxed text-center">Start logging your daily status to see your progress here.</p>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {dailyLogs.slice(0, 10).map((log) => (
                                    <div key={log.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 group flex flex-col md:flex-row md:items-center gap-8">
                                        <div className="flex items-center gap-5 shrink-0 md:w-44">
                                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                                <Calendar className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-lg font-bold text-slate-900 tracking-tight leading-none mb-2">
                                                    {formatDate(log.log_date)}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100/50">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">SpO₂ Rest</p>
                                                <span className="font-bold text-slate-900 text-lg">{log.spo2_at_rest}%</span>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">SpO₂ Activity</p>
                                                <span className="font-bold text-slate-900 text-lg">{log.spo2_on_exertion}%</span>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Shortness of Breath</p>
                                                <span className="font-bold text-slate-900 text-lg">{log.mmrc_scale}/4</span>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Pulse</p>
                                                <span className="font-bold text-slate-900 text-lg">{log.pulse_rate || '--'}bpm</span>
                                            </div>
                                        </div>

                                        <div className={`px-4 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest md:w-40 text-center shrink-0 ${getRedFlagColor(log.red_flag_score)}`}>
                                            {getRedFlagLabel(log.red_flag_score)}
                                        </div>
                                    </div>
                                ))}

                                {dailyLogs.length > 10 && (
                                    <div className="text-center pt-10">
                                        <Button
                                            variant="ghost"
                                            onClick={() => router.push('/patient/reports')}
                                            className="h-14 px-8 rounded-xl bg-slate-50 text-slate-500 hover:text-slate-900 font-bold uppercase tracking-widest text-[11px] gap-2.5 transition-all border border-slate-100"
                                        >
                                            View Full History
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="trends" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-5 duration-700">
                    <div className="max-w-5xl mx-auto space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <Card className="p-8 border-none bg-white shadow-sm border border-slate-100 rounded-[2.5rem] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 opacity-[0.02] rounded-full -translate-y-16 translate-x-16" />
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">SpO₂ Stability</h3>
                                </div>
                                {dailyLogs.length > 0 ? (
                                    <div className="space-y-8">
                                        <div className="flex items-end gap-3">
                                            <span className="text-5xl font-bold text-slate-900 tracking-tight leading-none">
                                                {Math.round(dailyLogs.reduce((sum, log) => sum + (log.spo2_at_rest || 0), 0) / dailyLogs.length)}%
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">Average</span>
                                        </div>
                                        <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                            <div className="h-full bg-purple-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.2)]" style={{ width: `${Math.round(dailyLogs.reduce((sum, log) => sum + (log.spo2_at_rest || 0), 0) / dailyLogs.length)}%` }} />
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Based on your last {dailyLogs.length} entries.</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-20">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Insufficient Temporal Data</p>
                                    </div>
                                )}
                            </Card>

                            <Card className="p-12 border-none bg-white shadow-sm border border-slate-50 rounded-[3rem] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 opacity-[0.03] rounded-full -translate-y-16 translate-x-16 transition-all duration-700 group-hover:scale-150" />
                                <div className="flex items-center gap-3 mb-12">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-sm">
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Clinical Risk Analysis</h3>
                                </div>
                                {dailyLogs.length > 0 ? (
                                    <div className="space-y-8">
                                        <div className="flex items-end gap-3">
                                            <span className={`text-5xl font-bold tracking-tight leading-none ${dailyLogs[0]?.red_flag_score >= 7 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                {dailyLogs[0]?.red_flag_score || 0}<span className="text-2xl text-slate-300">/10</span>
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">Latest Status</span>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100/50">
                                            <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                                                Your current tracking indicates a {getRedFlagLabel(dailyLogs[0]?.red_flag_score || 0).toLowerCase()} status.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-20">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Risk Model Loading...</p>
                                    </div>
                                )}
                            </Card>
                        </div>

                        <Card className="p-8 border-none bg-white shadow-sm border border-slate-100 rounded-[2.5rem] relative overflow-hidden group">
                            <div className="absolute bottom-0 right-0 w-64 h-64 bg-slate-50 opacity-[0.02] rounded-full translate-y-32 translate-x-32" />
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500">
                                        <Pill className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">My Medications</h3>
                                </div>
                                <button onClick={() => router.push('/patient/medications')} className="h-9 px-4 rounded-lg bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-900 transition-all flex items-center gap-2">
                                    View All
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {medications.length === 0 ? (
                                <div className="text-center py-16">
                                    <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">No active medications</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {medications.slice(0, 3).map((med, index) => (
                                        <div key={med.id || index} className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-white transition-all duration-300 hover:shadow-lg hover:shadow-slate-100">
                                            <div className="space-y-1">
                                                <p className="font-bold text-slate-900 tracking-tight leading-none text-base">
                                                    {med.drugName === 'Other' ? med.customDrugName : med.drugName}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {med.dose} • {med.frequency}
                                                </p>
                                            </div>
                                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                                               <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                            </div>
                                        </div>
                                    ))}
                                    {medications.length > 3 && (
                                        <div onClick={() => router.push('/patient/medications')} className="bg-white border-2 border-dashed border-slate-100 p-6 rounded-2xl flex items-center justify-center cursor-pointer hover:border-slate-300 transition-all duration-300">
                                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">+{medications.length - 3} more</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </PatientDashboardLayout>
    )
}