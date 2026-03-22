"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from "recharts"
import {
    Activity,
    Wind,
    AlertTriangle,
    Clock,
    Plus,
    CheckCircle2,
    History,
    TrendingUp,
    MapPin,
    RefreshCw,
    X,
    ChevronRight,
    Play,
    Pill,
    Heart,
    Zap
} from "lucide-react"
import { toast } from "sonner"
import { useLanguage, LanguageToggle } from "@/lib/language-context"
import {
    fetchRealTimeAQI,
    getAQIColor,
    forceRefreshAQI
} from "@/lib/aqi-service"
import {
    createDailyLog,
    canLogToday,
    getPatientProfile,
    getPatientMedications,
    getPatientTrends,
    getPatientAlerts,
    acknowledgeAlert
} from "@/lib/database-service"
import {
    asthmaAlertEngine,
    storeDoctorAlert,
    storeTodayAsthmaData,
    getYesterdayAsthmaData
} from "@/lib/alert-engines"
import {
    getPatientBaseline,
    getAlertColor,
    getAlertBackgroundColor
} from "@/lib/enhanced-alert-system"
import { getPatientDoctor } from "@/lib/doctor-patient-mapping"
import { formatDate } from "@/lib/utils"

interface ModernPatientDashboardProps {
    patientId: string
    patientName?: string
    diagnosis?: string
}

export default function ModernPatientDashboard({ patientId, patientName, diagnosis }: ModernPatientDashboardProps) {
    const { t } = useLanguage()

    // --- State ---
    const [activeTab, setActiveTab] = useState("overview")
    const [isLogModalOpen, setIsLogModalOpen] = useState(false)
    const [patientData, setPatientData] = useState<any>(null)
    const [aqiData, setAqiData] = useState<any>(null)
    const [loadingAqi, setLoadingAqi] = useState(true)
    const [trends, setTrends] = useState<any[]>([])
    const [canLog, setCanLog] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [activeAlerts, setActiveAlerts] = useState<any[]>([])

    // Form State
    const [formData, setFormData] = useState({
        spo2AtRest: 98,
        spo2OnExertion: 95,
        mMRCScale: 0,
        peakFlowPercent: 85,
        nightWaking: false,
        rescueInhalerPuffs: 0,
        daytimeSymptoms: false,
        relieverUse: false,
        activityLimitation: false,
        controlLevel: 'well-controlled',
        cough: 1,
        breathlessness: 2,
        wheezing: 2,
        chestTightness: 1,
        feverTemperature: '',
        medications: [] as any[],
        sideEffects: [] as string[]
    })

    useEffect(() => {
        const load = async () => {
            try {
                const [profile, meds, logStatus, aqi, trendsData, alerts] = await Promise.all([
                    getPatientProfile(patientId),
                    getPatientMedications(patientId),
                    canLogToday(patientId),
                    fetchRealTimeAQI(),
                    getPatientTrends(patientId),
                    getPatientAlerts(patientId)
                ])
                setPatientData(profile)
                setCanLog(logStatus)
                setAqiData(aqi)
                setTrends(trendsData)
                setActiveAlerts(alerts?.filter((a: any) => !a.acknowledged) || [])

                if (meds && meds.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        medications: meds.map((m: any, i: number) => ({
                            medicationId: m.id || `med-${i}`,
                            drugName: m.name || m.drugName,
                            dose: m.dose,
                            frequency: m.frequency,
                            taken: false
                        }))
                    }))
                }
            } catch (error) {
                console.error("Dashboard initialization failed:", error)
            } finally {
                setLoadingAqi(false)
            }
        }
        load()
    }, [patientId])

    const handleRefreshAQI = async () => {
        setLoadingAqi(true)
        try {
            const freshAqi = await fetchRealTimeAQI()
            setAqiData(freshAqi)
            toast.success("Environmental data updated")
        } catch (e) {
            toast.error("Failed to fetch fresh AQI")
        } finally {
            setLoadingAqi(false)
        }
    }

    const handleSubmitLog = async () => {
        setIsSubmitting(true)
        try {
            const baseline = getPatientBaseline(patientId) || {}
            const yesterday = getYesterdayAsthmaData(patientId)
            const alertResult = asthmaAlertEngine({
                patientId,
                spo2Rest: formData.spo2AtRest,
                spo2Exertion: formData.spo2OnExertion,
                rescuePuffsToday: formData.rescueInhalerPuffs,
                controllerTaken: formData.medications.some(m => m.taken),
                mMrcToday: formData.mMRCScale,
                temperatureF: formData.feverTemperature ? parseFloat(formData.feverTemperature) : undefined,
                coughVas: formData.cough,
                chestPainVas: 0,
                hemoptysis: false,
                breathlessnessVas: formData.breathlessness,
                wheezeVas: formData.wheezing,
                fatigueVas: 0,
                asthmaControlToday: formData.controlLevel as any,
                baselineSpO2: baseline.baselineSpO2,
                baselineMrc: baseline.baselinemMRC,
                yesterdayControl: yesterday.yesterdayControl,
                yesterdayRescuePuffs: yesterday.yesterdayRescuePuffs
            })

            const result = await createDailyLog(patientId, 'Asthma', {
                patientId,
                aqi: aqiData,
                spo2: { atRest: formData.spo2AtRest, onExertion: formData.spo2OnExertion },
                mMRCScale: formData.mMRCScale,
                medications: formData.medications,
                alert: alertResult
            }, {
                patientId,
                logDate: new Date().toISOString().split('T')[0],
                peakFlowPercent: formData.peakFlowPercent,
                nightWaking: formData.nightWaking,
                rescueInhalerPuffs: formData.rescueInhalerPuffs,
                daytimeSymptoms: formData.daytimeSymptoms,
                relieverUse: formData.relieverUse,
                activityLimitation: formData.activityLimitation,
                controlLevel: formData.controlLevel
            })

            if (result.success) {
                toast.success("Health log recorded successfully")
                setCanLog(false)
                setIsLogModalOpen(false)
                const newTrends = await getPatientTrends(patientId)
                setTrends(newTrends)
            }
        } catch (e) {
            toast.error("Failed to record log")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleAcknowledge = async (alertId: string) => {
        try {
            await acknowledgeAlert(alertId)
            setActiveAlerts(prev => prev.filter(a => a.id !== alertId))
            toast.success("Alert dismissed")
        } catch (e) {
            toast.error("Action failed")
        }
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] pb-24 font-['Matter_Regular',sans-serif]">
            {/* Minimal Header */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-40 px-8 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-white font-bold text-xl">
                            {patientData?.fullName?.[0] || 'P'}
                        </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                            {patientData?.fullName || patientName}
                        </h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{diagnosis || 'Recovery Journey'}</p>
                        </div>
                    </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <LanguageToggle />
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-8 py-10 space-y-12">
                {/* Notification Area */}
                {activeAlerts.length > 0 && (
                    <div className="space-y-3">
                        {activeAlerts.map((alert) => (
                            <div key={alert.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex items-center justify-between group animate-in fade-in slide-in-from-top-4">
                                <div className="flex items-center gap-6">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${alert.level === 'RED' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'}`}>
                                        <AlertTriangle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 tracking-tight">Health Alert: {alert.level}</h4>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5">{alert.reason_text}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => handleAcknowledge(alert.id)} className="h-10 px-4 rounded-xl text-slate-300 hover:text-slate-950 hover:bg-slate-50 transition-all font-bold text-[10px] uppercase tracking-widest">
                                    Dismiss
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card className="md:col-span-2 p-10 bg-purple-600 text-white rounded-[3rem] border-none shadow-xl shadow-purple-100 flex flex-col justify-between min-h-[320px] relative overflow-hidden group">
                        <div className="relative z-10">
                            <h2 className="text-4xl font-bold tracking-tight mb-4">Hello, {patientData?.fullName?.split(' ')[0] || 'there'}.</h2>
                            <p className="text-purple-100 font-medium text-lg leading-relaxed max-w-sm mb-8">
                                {canLog ? "How are you feeling today? Tap below to record your daily health update." : "Great job! You've already checked in today. Rest well."}
                            </p>
                            {canLog ? (
                                <Button onClick={() => setIsLogModalOpen(true)} className="h-16 px-10 rounded-2xl bg-white text-purple-600 hover:bg-purple-50 font-bold text-lg transition-all shadow-lg active:scale-95">
                                    <Plus className="w-6 h-6 mr-3" />
                                    Daily Check-in
                                </Button>
                            ) : (
                                <Badge className="h-12 px-6 rounded-xl bg-white/10 text-white border border-white/20 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Daily update saved
                                </Badge>
                            )}
                        </div>
                    </Card>

                    <Card className="p-10 bg-white rounded-[3rem] border-none shadow-sm flex flex-col justify-between border border-slate-50 group">
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500">
                                <Wind className="w-6 h-6" />
                            </div>
                            <button 
                                onClick={handleRefreshAQI}
                                className={`text-slate-200 hover:text-purple-500 transition-colors ${loadingAqi ? 'animate-spin' : ''}`}>
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Air Quality</p>
                            <div className="flex items-baseline gap-3">
                                <span className="text-6xl font-bold text-slate-900 tracking-tight" style={{ color: getAQIColor(aqiData?.aqi || 0) }}>
                                    {loadingAqi ? '--' : aqiData?.aqi || '42'}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-widest leading-none translate-y-[-2px]" style={{ color: getAQIColor(aqiData?.aqi || 0) }}>
                                    {aqiData?.category || 'Refreshing...'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate max-w-[120px]">{aqiData?.location || 'Locating Area...'}</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Analytics */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Trends</h3>
                        </div>
                        <Tabs defaultValue="7days" className="w-auto">
                            <TabsList className="bg-slate-100/50 p-1 h-10 rounded-xl">
                                <TabsTrigger value="7days" className="rounded-lg px-4 text-[10px] font-bold uppercase tracking-widest">7D</TabsTrigger>
                                <TabsTrigger value="30days" className="rounded-lg px-4 text-[10px] font-bold uppercase tracking-widest">30D</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <Card className="p-8 bg-white rounded-[2.5rem] border-none shadow-sm border border-slate-100">
                        <Tabs defaultValue="spo2" className="w-full space-y-8">
                            <TabsList className="bg-slate-50 p-1 rounded-xl w-fit h-12 border border-slate-100">
                                <TabsTrigger value="spo2" className="rounded-lg px-8 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm font-bold text-xs tracking-tight h-full">Oxygen level</TabsTrigger>
                                <TabsTrigger value="pefr" className="rounded-lg px-8 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm font-bold text-xs tracking-tight h-full">Breathing strength</TabsTrigger>
                            </TabsList>

                            <TabsContent value="spo2" className="h-[320px] outline-none">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trends}>
                                        <defs>
                                            <linearGradient id="colorSpo2" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#F8FAFC" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} dy={10} />
                                        <YAxis domain={[85, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} dx={-10} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '16px', border: '1px solid #F1F5F9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', fontWeight: 700, fontSize: '11px' }}
                                        />
                                        <ReferenceLine y={92} stroke="#FDA4AF" strokeDasharray="3 3" />
                                        <Area type="monotone" dataKey="spo2" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorSpo2)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </TabsContent>

                            <TabsContent value="pefr" className="h-[360px] outline-none">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trends}>
                                        <defs>
                                            <linearGradient id="colorPefr" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#F1F5F9" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#CBD5E1' }} dy={10} />
                                        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#CBD5E1' }} dx={-10} />
                                        <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px -12px rgba(0,0,0,0.1)', fontWeight: 700, fontSize: '12px' }} />
                                        <Area type="monotone" dataKey="pefr" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorPefr)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </TabsContent>
                        </Tabs>
                    </Card>
                </div>

                {/* Log Entry Dialog */}
                <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
                    <DialogContent className="max-w-xl rounded-[2.5rem] p-10 border-none shadow-2xl overflow-y-auto max-h-[90vh] font-['Matter_Regular',sans-serif]">
                        <DialogHeader className="mb-8">
                            <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900">Daily Check-in</DialogTitle>
                            <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">How are you feeling today?</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-12">
                            {/* Sliders */}
                            <div className="space-y-10">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Oxygen level (%)</label>
                                        <span className="text-xl font-bold text-slate-900">{formData.spo2AtRest}%</span>
                                    </div>
                                    <Slider
                                        value={[formData.spo2AtRest]}
                                        onValueChange={(v) => setFormData(prev => ({ ...prev, spo2AtRest: v[0] }))}
                                        max={100} min={80} step={1}
                                        className="[&_[role=slider]]:h-6 [&_[role=slider]]:w-6 [&_[role=slider]]:bg-purple-600 [&_[role=track]]:bg-slate-100"
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Breathing strength (%)</label>
                                        <span className="text-xl font-bold text-slate-900">{formData.peakFlowPercent}%</span>
                                    </div>
                                    <Slider
                                        value={[formData.peakFlowPercent]}
                                        onValueChange={(v) => setFormData(prev => ({ ...prev, peakFlowPercent: v[0] }))}
                                        max={100} min={40} step={1}
                                        className="[&_[role=slider]]:h-6 [&_[role=slider]]:w-6 [&_[role=slider]]:bg-purple-600 [&_[role=track]]:bg-slate-100"
                                    />
                                </div>
                            </div>

                            {/* Checkboxes */}
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { key: 'nightWaking', label: 'Woke up at night' },
                                    { key: 'daytimeSymptoms', label: 'Symptoms today' },
                                    { key: 'relieverUse', label: 'Used rescue inhaler' }
                                ].map(({ key, label }) => (
                                    <div key={key} 
                                        onClick={() => setFormData(prev => ({ ...prev, [key]: !prev[key as keyof typeof formData] }))}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${formData[key as keyof typeof formData] ? 'bg-purple-50 border-purple-100' : 'bg-slate-50 border-slate-100'}`}>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${formData[key as keyof typeof formData] ? 'text-purple-700' : 'text-slate-500'}`}>{label}</span>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData[key as keyof typeof formData] ? 'bg-purple-600 border-purple-600' : 'bg-white border-slate-200'}`}>
                                            {formData[key as keyof typeof formData] && <CheckCircle2 className="w-3 h-3 text-white" />}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Meds */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Medications taken</label>
                                {formData.medications.map((med, i) => (
                                    <div key={i} 
                                        onClick={() => {
                                            const newMeds = [...formData.medications]
                                            newMeds[i].taken = !newMeds[i].taken
                                            setFormData(prev => ({ ...prev, medications: newMeds }))
                                        }}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${med.taken ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-white ${med.taken ? 'text-emerald-500 shadow-sm' : 'text-slate-300'}`}>
                                                <Pill className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className={`text-xs font-bold ${med.taken ? 'text-emerald-900' : 'text-slate-900'}`}>{med.drugName}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{med.dose}</p>
                                            </div>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${med.taken ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-200'}`}>
                                            {med.taken && <CheckCircle2 className="w-3 h-3 text-white" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <DialogFooter className="mt-10 pt-8 border-t border-slate-50">
                            <Button variant="ghost" onClick={() => setIsLogModalOpen(false)} className="h-12 px-6 rounded-xl font-bold text-slate-300 hover:text-slate-900">Cancel</Button>
                            <Button onClick={handleSubmitLog} disabled={isSubmitting} className="h-12 px-8 rounded-xl bg-purple-600 text-white hover:bg-purple-700 font-bold text-sm uppercase tracking-widest flex-1 shadow-lg shadow-purple-100">
                                {isSubmitting ? "Saving..." : "Save today's log"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
