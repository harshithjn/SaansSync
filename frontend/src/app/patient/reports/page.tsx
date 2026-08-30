"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePatientAuth } from "@/lib/auth-guard"
import { getPatientDailyLogs, getPatientMedications, getPatientProfile } from "@/lib/database-service"
import {
    TrendingUp,
    TrendingDown,
    Activity,
    Heart,
    Thermometer,
    Calendar,
    Clock,
    AlertTriangle,
    CheckCircle,
    Pill,
    FileText,
    BarChart3,
    ArrowLeft,
    ShieldCheck,
    ChevronRight,
    Loader2
} from "lucide-react"

interface DailyLog {
    id: string
    logDate: string
    spo2_at_rest: number
    spo2_on_exertion: number
    mmrc_scale: number
    redFlagScore: number
    disease_data: any
    symptoms: any
    createdAt: string
}

export default function PatientReportsPage() {
    const router = useRouter()
    const authState = usePatientAuth()
    const [isLoading, setIsLoading] = useState(true)
    const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([])
    const [medications, setMedications] = useState<any[]>([])
    const [patientData, setPatientData] = useState<any>(null)

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

    const getRedFlagColor = (score: number) => {
        if (score >= 9) return 'text-rose-600 bg-rose-50 border-rose-100'
        if (score >= 7) return 'text-orange-600 bg-orange-50 border-orange-100'
        if (score >= 4) return 'text-amber-600 bg-amber-50 border-amber-100'
        return 'text-emerald-600 bg-emerald-50 border-emerald-100'
    }

    const getRedFlagLabel = (score: number) => {
        if (score >= 9) return 'CRITICAL'
        if (score >= 7) return 'HIGH RISK'
        if (score >= 4) return 'WARNING'
        return 'NORMAL'
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (authState.loading || isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-[2rem] border border-slate-100 shadow-sm">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Downloading Clinical Reports...</p>
            </div>
        )
    }

    if (!authState.user || authState.role !== 'patient') {
        return null
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-1000">
            {}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-slate-50 pb-12">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest border border-slate-100/50">
                        <FileText className="w-3 h-3" />
                        Formal Health Documentation
                    </div>
                    <h1 className="text-5xl font-black text-slate-950 tracking-tighter leading-none">Clinical Reports</h1>
                    <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.3em]">
                        {patientData?.diagnosis?.primaryCategory || authState.profile?.patientData?.diagnosis?.primaryCategory || 'System Monitoring'} Protocol
                    </p>
                </div>
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="h-14 px-8 rounded-2xl bg-slate-50 border border-slate-100/50 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-950 hover:bg-white hover:shadow-xl transition-all gap-3"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Hub
                </Button>
            </div>

            <Tabs defaultValue="history" className="space-y-12">
                <div className="flex justify-center border-b border-slate-50 pb-8 sticky top-0 bg-white/80 backdrop-blur-md z-30 -mx-10 px-10">
                    <TabsList className="bg-slate-50 p-1.5 rounded-2xl border border-slate-100/50 h-16 w-full max-w-xl">
                        <TabsTrigger value="history" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-xl data-[state=active]:shadow-slate-100 font-black text-[10px] uppercase tracking-widest gap-3 h-full transition-all duration-500">
                            <Calendar className="w-4 h-4" />
                            Log Archive
                        </TabsTrigger>
                        <TabsTrigger value="trends" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-xl data-[state=active]:shadow-slate-100 font-black text-[10px] uppercase tracking-widest gap-3 h-full transition-all duration-500">
                            <BarChart3 className="w-4 h-4" />
                            Analytics
                        </TabsTrigger>
                        <TabsTrigger value="medications" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-xl data-[state=active]:shadow-slate-100 font-black text-[10px] uppercase tracking-widest gap-3 h-full transition-all duration-500">
                            <Pill className="w-4 h-4" />
                            Medication
                        </TabsTrigger>
                    </TabsList>
                </div>

                {}
                <TabsContent value="history" className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Transmission Logs</h3>
                        <Badge className="bg-slate-100 text-slate-400 border-none font-black text-[9px] uppercase tracking-widest px-4 py-2 rounded-xl">
                           Total Entries: {dailyLogs.length}
                        </Badge>
                    </div>

                    {dailyLogs.length === 0 ? (
                        <Card className="p-24 text-center border-none shadow-sm rounded-[3rem] bg-slate-50/50 border border-slate-100 flex flex-col items-center">
                            <Activity className="w-16 h-16 text-slate-100 mb-8" />
                            <h3 className="text-xl font-black text-slate-900 mb-2">ARCHIVE_EMPTY</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] max-w-xs leading-relaxed">System logs will appear here once initial clinical sessions are recorded.</p>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {dailyLogs.map((log) => (
                                <div key={log.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-50 hover:shadow-2xl hover:shadow-slate-100 transition-all duration-700 hover:scale-[1.01] flex flex-col md:flex-row md:items-center gap-10 group">
                                    <div className="flex items-center gap-6 shrink-0 md:w-56">
                                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-slate-950 group-hover:text-white transition-all duration-500">
                                            <Calendar className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="text-lg font-black text-slate-950 tracking-tight leading-none mb-2">
                                                {formatDate(log.logDate)}
                                            </div>
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 opacity-50" />
                                                Log: {formatTime(log.createdAt)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 bg-slate-50/50 p-6 rounded-[1.75rem] border border-slate-100/50">
                                        <div className="space-y-1.5">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">SpO₂ at Rest</p>
                                            <h4 className="text-xl font-black text-slate-950">{log.spo2_at_rest}%</h4>
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">SpO₂ Exertion</p>
                                            <h4 className="text-xl font-black text-slate-950">{log.spo2_on_exertion}%</h4>
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">MRC Grade</p>
                                            <h4 className="text-xl font-black text-slate-950">{log.mmrc_scale}/4</h4>
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Condition Index</p>
                                            <h4 className="text-xl font-black text-slate-950">{log.redFlagScore}/10</h4>
                                        </div>
                                    </div>

                                    <div className={`px-6 py-3 rounded-2xl border text-[9px] font-black uppercase tracking-[0.2em] md:w-52 text-center shrink-0 ${getRedFlagColor(log.redFlagScore)} group-hover:shadow-lg transition-all`}>
                                        {getRedFlagLabel(log.redFlagScore)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {}
                <TabsContent value="trends" className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {}
                        <Card className="p-12 border-none bg-white shadow-sm border border-slate-50 rounded-[3.5rem] group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500 opacity-[0.03] rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-all duration-700" />
                            <div className="flex items-center gap-4 mb-12">
                                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-500 shadow-sm border border-teal-100/50">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">SpO₂ Historical Mean</h3>
                            </div>
                            {dailyLogs.length > 0 ? (
                                <div className="space-y-12">
                                    <div className="flex items-end gap-3">
                                        <span className="text-8xl font-black text-slate-950 tracking-tighter leading-none">
                                            {Math.round(dailyLogs.reduce((sum, log) => sum + (log.spo2_at_rest || 0), 0) / dailyLogs.length)}%
                                        </span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Stable Baseline</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Latest Sync</p>
                                            <p className="text-2xl font-black text-teal-600">{dailyLogs[0]?.spo2_at_rest}%</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Vector Status</p>
                                            <div className="flex items-center gap-2 text-emerald-500">
                                                <TrendingUp className="w-4 h-4" />
                                                <span className="text-lg font-black uppercase tracking-tighter">CONSISTENT</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-20 text-slate-300 font-black uppercase tracking-widest text-[9px]">
                                    Insufficient Sample Size
                                </div>
                            )}
                        </Card>

                        {}
                        <Card className="p-12 border-none bg-white shadow-sm border border-slate-50 rounded-[3.5rem] group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500 opacity-[0.03] rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-all duration-700" />
                            <div className="flex items-center gap-4 mb-12">
                                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 shadow-sm border border-rose-100/50">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Risk Variance Model</h3>
                            </div>
                            {dailyLogs.length > 0 ? (
                                <div className="space-y-12">
                                    <div className="flex items-end gap-3">
                                        <span className={`text-8xl font-black tracking-tighter leading-none ${
                                            dailyLogs[0]?.redFlagScore >= 7 ? 'text-rose-600' :
                                            dailyLogs[0]?.redFlagScore >= 4 ? 'text-amber-500' : 'text-emerald-500'
                                        }`}>
                                            {dailyLogs[0]?.redFlagScore || 0}<span className="text-4xl opacity-10">/10</span>
                                        </span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Current Vector</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Cumulative Avg</p>
                                            <p className="text-2xl font-black text-slate-950">
                                                {Math.round(dailyLogs.reduce((sum, log) => sum + (log.redFlagScore || 0), 0) / dailyLogs.length * 10) / 10}/10
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Clinical Grade</p>
                                            <div className={`flex items-center gap-2 ${
                                                dailyLogs[0]?.redFlagScore >= 7 ? 'text-rose-600' :
                                                dailyLogs[0]?.redFlagScore >= 4 ? 'text-amber-500' : 'text-emerald-500'
                                            }`}>
                                                <span className="text-lg font-black uppercase tracking-tighter">{getRedFlagLabel(dailyLogs[0]?.redFlagScore || 0)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-20 text-slate-300 font-black uppercase tracking-widest text-[9px]">
                                    Model Awaiting Integration
                                </div>
                            )}
                        </Card>
                    </div>
                </TabsContent>

                {}
                <TabsContent value="medications" className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Active Therapeutic Protocols</h3>
                        <Badge className="bg-teal-50 text-teal-600 border-none font-black text-[9px] uppercase tracking-widest px-4 py-2 rounded-xl">
                           {medications.length} Prescriptions Syncing
                        </Badge>
                    </div>

                    {medications.length === 0 ? (
                        <Card className="p-24 text-center border-none shadow-sm rounded-[3rem] bg-slate-50/50 border border-slate-100 flex flex-col items-center">
                            <Pill className="w-16 h-16 text-slate-100 mb-8" />
                            <h3 className="text-xl font-black text-slate-900 mb-2">NO_THERAPY_DETECTED</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] max-w-xs leading-relaxed">System has not detected any active therapeutic protocols for this patient node.</p>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {medications.map((med, index) => (
                                <div key={med.id || index} className="bg-white rounded-[2.5rem] p-10 border border-slate-50 hover:shadow-2xl hover:shadow-slate-100 transition-all duration-700 group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 opacity-[0.2] -translate-y-12 translate-x-12 rounded-full" />
                                    <div className="flex items-center justify-between mb-10">
                                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-slate-950 group-hover:text-white transition-all duration-500 shadow-sm border border-slate-100/50">
                                            <Pill className="w-6 h-6" />
                                        </div>
                                        <Badge className={`px-4 py-2 rounded-full font-black text-[8px] uppercase tracking-widest border-none ${med.isActive ? "bg-emerald-50 text-emerald-500" : "bg-slate-100 text-slate-400"}`}>
                                            {med.isActive ? "ACTIVE_TRANSMISSION" : "ARCHIVED_SESSION"}
                                        </Badge>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-2xl font-black text-slate-950 tracking-tight leading-none mb-2 capitalize">
                                                {med.drugName === 'Other' ? med.customDrugName : med.drugName}
                                            </h4>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Therapeutic Asset</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-y-8 gap-x-4 pt-8 border-t border-slate-50">
                                            <div>
                                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Dosage Vector</p>
                                                <p className="text-sm font-black text-slate-950">{med.dose}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Cycle Freq</p>
                                                <p className="text-sm font-black text-slate-950">{med.frequency}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Protocol Start</p>
                                                <p className="text-sm font-black text-slate-950">{formatDate(med.startDate)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Admin Route</p>
                                                <p className="text-sm font-black text-slate-950 uppercase tracking-tighter">{med.route}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}