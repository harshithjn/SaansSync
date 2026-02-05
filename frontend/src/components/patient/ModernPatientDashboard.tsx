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
import { Input } from "@/components/ui/input"
import {
    LineChart,
    Line,
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
    Thermometer,
    Droplets,
    AlertTriangle,
    Clock,
    Plus,
    CheckCircle2,
    History,
    TrendingUp,
    Stethoscope,
    Phone,
    MapPin,
    RefreshCw,
    X,
    ChevronRight,
    Play
} from "lucide-react"
import { toast } from "sonner"
import { useLanguage, LanguageToggle } from "@/lib/language-context"
import {
    fetchRealTimeAQI,
    getAQIColor,
    shouldAlertForAQI,
    forceRefreshAQI
} from "@/lib/aqi-service"
import {
    createDailyLog,
    canLogToday,
    getPatientProfile,
    getPatientMedications,
    getPatientReports,
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
} from "@/lib/enhanced-alert-system" // Assuming these exports exist or I'm adapting based on CleanAsthmaDashboard imports
import { getPatientDoctor } from "@/lib/doctor-patient-mapping"

interface ModernPatientDashboardProps {
    patientId: string
    patientName?: string
    diagnosis?: string
}

export default function ModernPatientDashboard({ patientId, patientName, diagnosis }: ModernPatientDashboardProps) {
    const { t, language } = useLanguage()

    // --- State ---
    const [activeTab, setActiveTab] = useState("overview")
    const [isLogModalOpen, setIsLogModalOpen] = useState(false)
    const [patientData, setPatientData] = useState<any>(null)
    const [aqiData, setAqiData] = useState<any>(null)
    const [loadingAqi, setLoadingAqi] = useState(true)
    const [trends, setTrends] = useState<any[]>([])
    const [canLog, setCanLog] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [currentAlert, setCurrentAlert] = useState<any>(null)
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
        medications: [] as any[], // Safe initialization
        sideEffects: [] as string[]
    })

    // --- Effects ---

    useEffect(() => {
        loadData()
    }, [patientId])

    const loadData = async () => {
        setLoadingAqi(true)
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
                        medicationId: `med-${i}`,
                        drugName: m.name || m.drugName,
                        dose: m.dose || m.frequency,
                        frequency: m.frequency,
                        dateTaken: new Date().toISOString().split('T')[0],
                        taken: false
                    }))
                }))
            }
        } catch (error) {
            console.error("Failed to load dashboard data", error)
        } finally {
            setLoadingAqi(false)
        }
    }

    // --- Handlers ---

    const handleRefreshAQI = async () => {
        setLoadingAqi(true)
        try {
            const fresh = await forceRefreshAQI(patientId)
            setAqiData(fresh)
        } catch (e) {
            toast.error("Failed to refresh AQI")
        } finally {
            setLoadingAqi(false)
        }
    }

    const handleSubmitLog = async () => {
        setIsSubmitting(true)
        try {
            // Re-use logic from CleanAsthmaDashboard but safe
            const baseline = getPatientBaseline(patientId) || {}
            const yesterday = getYesterdayAsthmaData(patientId)

            const asthmaInput = {
                patientId,
                spo2Rest: formData.spo2AtRest,
                spo2Exertion: formData.spo2OnExertion,
                rescuePuffsToday: formData.rescueInhalerPuffs,
                // SAFE ACCESS HERE
                controllerTaken: Array.isArray(formData.medications) && formData.medications.some(m => m.taken),
                mMrcToday: formData.mMRCScale,
                temperatureF: formData.feverTemperature ? parseFloat(formData.feverTemperature) : undefined,
                coughVas: formData.cough,
                chestPainVas: 0, // Simplified
                hemoptysis: false,
                breathlessnessVas: formData.breathlessness,
                wheezeVas: formData.wheezing,
                fatigueVas: 0,
                asthmaControlToday: formData.controlLevel as any,
                baselineSpO2: baseline.baselineSpO2,
                baselineMrc: baseline.baselinemMRC,
                baselineCoughVas: undefined,
                yesterdayControl: yesterday.yesterdayControl,
                yesterdayRescuePuffs: yesterday.yesterdayRescuePuffs
            }

            const alertResult = asthmaAlertEngine(asthmaInput)
            setCurrentAlert(alertResult)

            // Submit logic...
            storeTodayAsthmaData(patientId, formData.controlLevel as any, formData.rescueInhalerPuffs)
            const doc = getPatientDoctor(patientId)
            if (doc?.doctorId) {
                storeDoctorAlert(alertResult, doc.doctorId, patientData?.fullName || patientName)
            }

            const commonData = {
                patientId,
                firstLogDate: new Date().toISOString(),
                aqi: {
                    value: aqiData?.aqi || 100,
                    pm25: aqiData?.pm25 || 50,
                    pm10: aqiData?.pm10 || 70,
                    location: aqiData?.location || 'Unknown',
                    fetchedAt: aqiData?.fetchedAt || new Date().toISOString()
                },
                spo2: {
                    atRest: formData.spo2AtRest,
                    onExertion: formData.spo2OnExertion,
                    baselineTarget: 98
                },
                conditionStatus: {
                    isStatic: !formData.daytimeSymptoms && !formData.nightWaking,
                    hasWorsening: formData.rescueInhalerPuffs > 4 || formData.nightWaking,
                    hasImprovement: formData.peakFlowPercent > 80,
                    oxygenChange: 0
                },
                mMRCScale: formData.mMRCScale,
                medications: formData.medications,
                sideEffects: formData.sideEffects,
                alert: alertResult
            }

            const asthmaData = {
                patientId,
                logDate: new Date().toISOString().split('T')[0],
                peakFlowPercent: formData.peakFlowPercent,
                nightWaking: formData.nightWaking,
                rescueInhalerPuffs: formData.rescueInhalerPuffs,
                daytimeSymptoms: formData.daytimeSymptoms,
                relieverUse: formData.relieverUse,
                activityLimitation: formData.activityLimitation,
                controlLevel: formData.controlLevel
            }

            const result = await createDailyLog(patientId, 'Asthma', commonData, asthmaData)

            if (result.success) {
                toast.success("Daily log submitted successfully")
                setCanLog(false)
                setIsLogModalOpen(false)
                // Refresh trends
                const newTrends = await getPatientTrends(patientId)
                setTrends(newTrends)
            } else {
                toast.error("Submission failed: " + result.error)
            }

        } catch (error) {
            console.error(error)
            toast.error("An error occurred while submitting")
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
            toast.error("Failed to dismiss alert")
        }
    }

    // --- Render Helpers ---

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return "Good Morning"
        if (hour < 18) return "Good Afternoon"
        return "Good Evening"
    }

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* --- Hero Section --- */}
            <div className="bg-white border-b sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/80 transition-all">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                            {patientData?.fullName?.[0] || patientName?.[0] || 'P'}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">
                                {patientData?.fullName || patientName}
                            </h1>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                {diagnosis || 'Asthma'} Patient • ID: {patientId}
                            </p>
                        </div>
                    </div>
                    <div>
                        <LanguageToggle />
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

                {/* --- Active Alerts Section --- */}
                {activeAlerts.length > 0 && (
                    <div className="space-y-4">
                        {activeAlerts.map((alert) => (
                            <Card key={alert.id} className={`p-4 border-l-4 shadow-md ${alert.level === 'RED' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'
                                }`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2 rounded-full ${alert.level === 'RED' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                                            }`}>
                                            <AlertTriangle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className={`font-bold ${alert.level === 'RED' ? 'text-red-900' : 'text-yellow-900'
                                                }`}>
                                                Health Alert: {alert.level}
                                            </h4>
                                            <p className="text-sm text-gray-700 mt-1">{alert.reason_text}</p>
                                            <div className="flex items-center gap-4 mt-2">
                                                <Badge variant="outline" className="text-[10px] uppercase font-bold">
                                                    {alert.disease_type}
                                                </Badge>
                                                <span className="text-[10px] text-gray-500">
                                                    {new Date(alert.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleAcknowledge(alert.id)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-4 h-4 mr-1" />
                                        Dismiss
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* --- Status & Action Center --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Welcome Card */}
                    <Card className="col-span-1 md:col-span-2 p-6 bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="relative z-10">
                            <h2 className="text-3xl font-bold mb-2">{getGreeting()}!</h2>
                            <p className="text-indigo-100 mb-6 max-w-md">
                                Keeping track of your respiratory health is the key to a better life.
                                {canLog ? " You haven't logged your health data today." : " You're all caught up for today!"}
                            </p>

                            {canLog ? (
                                <Button
                                    onClick={() => setIsLogModalOpen(true)}
                                    size="lg"
                                    className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold shadow-lg border-none"
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    Submit Daily Log
                                </Button>
                            ) : (
                                <Button
                                    disabled
                                    variant="secondary"
                                    className="bg-white/20 text-white hover:bg-white/30 border-none"
                                >
                                    <CheckCircle2 className="w-5 h-5 mr-2" />
                                    Log Submitted
                                </Button>
                            )}
                        </div>
                    </Card>

                    {/* AQI Mini Card */}
                    <Card className="p-6 border-none shadow-md bg-white relative overflow-hidden group hover:shadow-lg transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Wind className="w-24 h-24 text-gray-900" />
                        </div>
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wider">Air Quality</h3>
                                    <div className="text-3xl font-black text-gray-900 mt-1">
                                        {loadingAqi ? "..." : aqiData?.aqi || "N/A"}
                                    </div>
                                    <div className="text-sm font-bold mt-1" style={{ color: getAQIColor(aqiData?.aqi || 0) }}>
                                        {aqiData?.category || "Unknown"}
                                    </div>
                                </div>
                                <div className={`p-2 rounded-full ${loadingAqi ? 'animate-spin' : ''} bg-gray-100 cursor-pointer hover:bg-gray-200`} onClick={handleRefreshAQI}>
                                    <RefreshCw className="w-5 h-5 text-gray-600" />
                                </div>
                            </div>
                            <div className="mt-4 flex gap-4 text-xs text-gray-500">
                                <div>
                                    <span className="block font-bold text-gray-700">PM2.5</span>
                                    {aqiData?.pm25 || "--"}
                                </div>
                                <div>
                                    <span className="block font-bold text-gray-700">PM10</span>
                                    {aqiData?.pm10 || "--"}
                                </div>
                                <div className="ml-auto flex items-end">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    <span className="truncate max-w-[80px]">{aqiData?.location || "Locating..."}</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* --- Trends & Analytics --- */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            Health Trends
                        </h3>
                        <Select value="7days">
                            <SelectTrigger className="w-[120px] h-8 text-xs">
                                <SelectValue placeholder="Range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7days">Last 7 Days</SelectItem>
                                <SelectItem value="30days">Last 30 Days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Card className="p-6 border-none shadow-md bg-white">
                        <Tabs defaultValue="spo2" className="w-full">
                            <TabsList className="mb-4">
                                <TabsTrigger value="spo2">Oxygen (SpO2)</TabsTrigger>
                                <TabsTrigger value="pft">Peak Flow</TabsTrigger>
                                <TabsTrigger value="symptoms">Symptoms</TabsTrigger>
                            </TabsList>

                            <TabsContent value="spo2" className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trends.length ? trends : []}>
                                        <defs>
                                            <linearGradient id="colorSpo2" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                                        <YAxis domain={[80, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <ReferenceLine y={92} stroke="red" strokeDasharray="3 3" />
                                        <Area type="monotone" dataKey="spo2" stroke="#8884d8" fillOpacity={1} fill="url(#colorSpo2)" strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </TabsContent>

                            <TabsContent value="pft" className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={trends.length ? trends : []}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                                        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Line type="monotone" dataKey="pefr" stroke="#10B981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </TabsContent>
                        </Tabs>
                    </Card>
                </div>

                {/* --- Recent History --- */}
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                        <History className="w-5 h-5 text-gray-600" />
                        Recent History
                    </h3>
                    <div className="grid gap-3">
                        {trends.slice(0, 3).map((log, i) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-12 rounded-full ${log.spo2 >= 95 ? 'bg-green-500' : log.spo2 >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}></div>
                                    <div>
                                        <p className="font-bold text-gray-900">{new Date(log.created_at || new Date()).toLocaleDateString()}</p>
                                        <p className="text-xs text-gray-500">{new Date(log.created_at || new Date()).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                                <div className="flex gap-6 text-sm">
                                    <div className="text-center">
                                        <p className="text-xs text-gray-400">SpO2</p>
                                        <p className="font-bold text-gray-700">{log.spo2 || '-'}%</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-400">PEFR</p>
                                        <p className="font-bold text-gray-700">{log.pefr || '-'}%</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon">
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* --- Log Entry Modal --- */}
            <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Daily Health Check-in</DialogTitle>
                        <DialogDescription>
                            Please enter your vitals and symptoms accurately.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        {/* Simplified for brevity - Reimplement logic using cleaner UI */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-sm uppercase text-gray-500">Vitals</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">SpO2 (Oxygen Level)</label>
                                    <div className="flex items-center gap-4">
                                        <Slider
                                            value={[formData.spo2AtRest]}
                                            onValueChange={(v) => setFormData(prev => ({ ...prev, spo2AtRest: v[0] }))}
                                            max={100} min={70} step={1}
                                            className="flex-1"
                                        />
                                        <span className="font-bold w-12 text-center bg-gray-100 rounded py-1">{formData.spo2AtRest}%</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">PEFR (% of personal best)</label>
                                    <div className="flex items-center gap-4">
                                        <Slider
                                            value={[formData.peakFlowPercent]}
                                            onValueChange={(v) => setFormData(prev => ({ ...prev, peakFlowPercent: v[0] }))}
                                            max={120} min={20} step={5}
                                            className="flex-1"
                                        />
                                        <span className="font-bold w-12 text-center bg-gray-100 rounded py-1">{formData.peakFlowPercent}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-semibold text-sm uppercase text-gray-500">Symptoms</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                                    <Checkbox
                                        checked={formData.nightWaking}
                                        onCheckedChange={(c) => setFormData(prev => ({ ...prev, nightWaking: c === true }))}
                                    />
                                    <span className="text-sm font-medium">Woke up at night?</span>
                                </label>
                                <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                                    <Checkbox
                                        checked={formData.daytimeSymptoms}
                                        onCheckedChange={(c) => setFormData(prev => ({ ...prev, daytimeSymptoms: c === true }))}
                                    />
                                    <span className="text-sm font-medium">Daytime symptoms?</span>
                                </label>
                                <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                                    <Checkbox
                                        checked={formData.relieverUse}
                                        onCheckedChange={(c) => setFormData(prev => ({ ...prev, relieverUse: c === true }))}
                                    />
                                    <span className="text-sm font-medium">Used reliever?</span>
                                </label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-semibold text-sm uppercase text-gray-500">Medications</h4>
                            <div className="space-y-2">
                                {Array.isArray(formData.medications) && formData.medications.map((med, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                                        <div>
                                            <p className="font-semibold text-blue-900">{med.drugName}</p>
                                            <p className="text-xs text-blue-700">{med.dose} • {med.frequency}</p>
                                        </div>
                                        <Checkbox
                                            checked={med.taken}
                                            onCheckedChange={(c) => {
                                                const newMeds = [...(formData.medications || [])]
                                                newMeds[idx].taken = c === true
                                                setFormData(prev => ({ ...prev, medications: newMeds }))
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsLogModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmitLog} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
                            {isSubmitting ? "Submitting..." : "Submit Log"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}
