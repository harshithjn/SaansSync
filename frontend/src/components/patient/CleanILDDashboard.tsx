"use client"

import { useState, useEffect } from "react"
import { PatientDashboardLayout } from "./PatientDashboardLayout"
import { DashboardCard } from "@/components/ui/DashboardCard"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { fetchRealTimeAQI, getAQIColor, shouldAlertForAQI, forceRefreshAQI } from "@/lib/aqi-service"
import { createDailyLog, canLogToday, getPatientProfile, getPatientMedications, getPatientReports, getPatientAlerts, acknowledgeAlert } from "@/lib/database-service"
import { PatientData } from "@/lib/patient-types"
import { useLanguage, LanguageToggle } from "@/lib/language-context"
import { toast } from "@/lib/toast"
import {
    Wind,
    Activity,
    Thermometer,
    Droplets,
    AlertTriangle,
    CheckCircle,
    Clock,
    Plus,
    RefreshCw,
    MapPin,
    Heart,
    Zap,
    FileText
} from "lucide-react"

interface CleanILDDashboardProps {
    patientId: string
    patientName?: string
    diagnosis?: string
    headless?: boolean
}

export default function CleanILDDashboard({ patientId, patientName, diagnosis, headless = false }: CleanILDDashboardProps) {
    const { t, language } = useLanguage()

    // Patient Data State
    const [patientData, setPatientData] = useState<PatientData | null>(null)
    const [reports, setReports] = useState<{ pftRecords: any[], reports: any[] }>({ pftRecords: [], reports: [] })

    // AQI State
    const [aqiData, setAqiData] = useState<any>(null)
    const [aqiLoading, setAqiLoading] = useState(true)

    // Logging State
    const [canLog, setCanLog] = useState(true)
    const [remainingLogs, setRemainingLogs] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [activeAlerts, setActiveAlerts] = useState<any[]>([])

    // Form Data
    const [formData, setFormData] = useState({
        // Common Data
        spo2AtRest: 95,
        spo2OnExertion: 90,
        mMRCScale: 1,

        // ILD Specific
        spo2BaselineDrop: 0,
        dryCoughSeverity: 3,
        breathlessnessChange: 'stable' as 'better' | 'stable' | 'worse',
        newChestPain: false,
        hemoptysis: false,
        fibroticProgression: false,
        kbildScore: 0,

        // Symptoms VAS
        breathlessness: 4,
        cough: 5,
        chestTightness: 3,
        fatigue: 6,

        // Medications
        medications: [
            {
                medicationId: 'pirfenidone-1',
                drugName: 'Pirfenidone',
                dose: '267mg',
                frequency: 'three times daily',
                dateTaken: new Date().toISOString().split('T')[0],
                taken: false
            },
            {
                medicationId: 'nintedanib-1',
                drugName: 'Nintedanib',
                dose: '150mg',
                frequency: 'twice daily',
                dateTaken: new Date().toISOString().split('T')[0],
                taken: false
            },
            {
                medicationId: 'prednisolone-1',
                drugName: 'Prednisolone',
                dose: '10mg',
                frequency: 'once daily',
                dateTaken: new Date().toISOString().split('T')[0],
                taken: false
            },
            {
                medicationId: 'n-acetylcysteine-1',
                drugName: 'N-Acetylcysteine',
                dose: '600mg',
                frequency: 'twice daily',
                dateTaken: new Date().toISOString().split('T')[0],
                taken: false
            }
        ],

        // Side Effects
        sideEffects: [] as string[],
        customSideEffect: ''
    })

    useEffect(() => {
        const initializeComponent = async () => {
            await loadPatientData()
            initializeDashboard()
            checkLoggingStatus()
        }
        initializeComponent()
    }, [patientId])

    const loadPatientData = async () => {
        try {
            const data = await getPatientProfile(patientId)
            if (data) {
                setPatientData(data)

                // Load meds and reports
                const meds = await getPatientMedications(patientId)
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

                const reps = await getPatientReports(patientId)
                setReports(reps)

                // Load active alerts
                const alerts = await getPatientAlerts(patientId)
                setActiveAlerts(alerts?.filter((a: any) => !a.acknowledged) || [])

                console.log('Loaded patient data:', data)
            }
        } catch (error) {
            console.error('Error loading patient data:', error)
        }
    }

    const initializeDashboard = async () => {
        try {
            setAqiLoading(true)
            const aqi = await fetchRealTimeAQI()
            setAqiData(aqi)
        } catch (error) {
            console.error('Error loading AQI:', error)
        } finally {
            setAqiLoading(false)
        }
    }

    const checkLoggingStatus = async () => {
        try {
            const dbCanLog = await canLogToday(patientId)
            setCanLog(dbCanLog)
            setRemainingLogs(dbCanLog ? 1 : 0)
        } catch (error) {
            console.error('Error checking logging status:', error)
            setCanLog(false)
            setRemainingLogs(0)
        }
    }

    const handleSubmit = async () => {
        if (!canLog) return

        setIsSubmitting(true)
        try {
            // Prepare common data
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
                    baselineTarget: 95
                },
                conditionStatus: {
                    isStatic: formData.breathlessnessChange === 'stable',
                    hasWorsening: formData.breathlessnessChange === 'worse' || formData.spo2BaselineDrop >= 4,
                    hasImprovement: formData.breathlessnessChange === 'better',
                    oxygenChange: formData.spo2BaselineDrop
                },
                mMRCScale: formData.mMRCScale,
                medications: formData.medications,
                sideEffects: formData.sideEffects,
                symptoms: [
                    { id: '1', name: 'Breathlessness', score: formData.breathlessness, loggedAt: new Date().toISOString() },
                    { id: '2', name: 'Cough', score: formData.cough, loggedAt: new Date().toISOString() },
                    { id: '3', name: 'Chest Tightness', score: formData.chestTightness, loggedAt: new Date().toISOString() },
                    { id: '4', name: 'Fatigue', score: formData.fatigue, loggedAt: new Date().toISOString() }
                ]
            }

            // Prepare ILD specific data
            const ildData = {
                patientId,
                logDate: new Date().toISOString().split('T')[0],
                spo2BaselineDrop: formData.spo2BaselineDrop,
                dryCoughSeverity: formData.dryCoughSeverity,
                breathlessnessChange: formData.breathlessnessChange,
                newChestPain: formData.newChestPain,
                hemoptysis: formData.hemoptysis,
                fibroticProgression: formData.fibroticProgression
            }

            // Create daily log
            const result = await createDailyLog(
                patientId,
                'ILD',
                commonData,
                ildData
            )

            if (result.success) {
                toast.success('Health log submitted successfully!')
                if (result.alert) {
                    toast.info('Alert', result.alert.message)
                }
                checkLoggingStatus()
            } else {
                toast.error(result.error || 'Submit failed')
            }
        } catch (error) {
            console.error('Error submitting log:', error)
            toast.error('Failed to submit health log')
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

    const handleMedicationChange = (index: number, taken: boolean) => {
        const updatedMeds = [...formData.medications]
        updatedMeds[index].taken = taken
        setFormData(prev => ({ ...prev, medications: updatedMeds }))
    }

    const handleSideEffectChange = (effect: string, checked: boolean) => {
        if (checked) {
            setFormData(prev => ({
                ...prev,
                sideEffects: [...prev.sideEffects, effect]
            }))
        } else {
            setFormData(prev => ({
                ...prev,
                sideEffects: prev.sideEffects.filter(e => e !== effect)
            }))
        }
    }

    return (
        <PatientDashboardLayout
            patientId={patientId}
            patientName={patientName || patientData?.fullName || 'Patient'}
            diagnosis={diagnosis || patientData?.diagnosis?.primaryCategory || 'Interstitial Lung Disease'}
            headless={headless}
        >

            {/* Backend Health Alerts */}
            {activeAlerts.length > 0 && (
                <DashboardCard title="Active Health Alerts" className="bg-red-50/50 border-red-100">
                    <div className="space-y-4">
                        {activeAlerts.map((alert) => (
                            <Card key={alert.id} className={`p-4 border-l-4 shadow-sm ${alert.level === 'RED' ? 'border-red-500 bg-white' : 'border-yellow-500 bg-white'}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2 rounded-full ${alert.level === 'RED' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                            <AlertTriangle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className={`font-bold ${alert.level === 'RED' ? 'text-red-900' : 'text-yellow-900'}`}>
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
                                        Dismiss
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </DashboardCard>
            )}

            {/* Logging Status */}
            <DashboardCard className="bg-white border-blue-100 border-l-4 border-l-blue-500">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2 rounded-full">
                            <Clock className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Daily Health Log</h3>
                            <p className="text-xs text-gray-500">Track your progress</p>
                        </div>
                    </div>
                    <Badge variant={canLog ? "default" : "secondary"} className={canLog ? "bg-blue-600 hover:bg-blue-700" : ""}>
                        {remainingLogs} logs remaining today
                    </Badge>
                </div>
            </DashboardCard>

            {/* AQI Alert */}
            {aqiData && shouldAlertForAQI(aqiData.aqi) && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 shadow-sm flex items-center gap-4 animate-pulse">
                    <div className="bg-white p-2 rounded-full shadow-sm">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-red-900 text-lg">⚠️ Air Quality Alert</h3>
                        <p className="text-sm text-red-800 font-medium">Hazardous conditions detected. Please minimize outdoor exposure.</p>
                    </div>
                </div>
            )}

            {/* AQI Display */}
            <DashboardCard
                noPadding
                title="Air Quality Index"
                subtitle="Real-time environmental data"
                action={
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full hover:bg-purple-50 hover:text-purple-600 border-gray-200 transition-colors"
                        onClick={async () => {
                            setAqiLoading(true)
                            try {
                                const freshAQI = await forceRefreshAQI(patientId)
                                setAqiData(freshAQI)
                            } catch (error) {
                                console.error('Error refreshing AQI:', error)
                            } finally {
                                setAqiLoading(false)
                            }
                        }}
                        disabled={aqiLoading}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${aqiLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                }
            >
                <div className="p-6 bg-white">
                    {aqiLoading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                            <p className="text-sm text-gray-600">Syncing environmental data...</p>
                        </div>
                    ) : aqiData ? (
                        <div>
                            {/* Location info message */}
                            {aqiData.location.includes('Estimated') && (
                                <div className="mb-4 p-3 bg-purple-50 border border-purple-100 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-4 h-4 text-purple-600 mt-0.5" />
                                        <div className="text-sm">
                                            <p className="text-purple-800 font-medium">Using estimated location data</p>
                                            <p className="text-purple-600 mt-1">
                                                For more accurate air quality data, you can allow location access when prompted by your browser.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center p-5 rounded-2xl transition-transform hover:scale-105"
                                    style={{
                                        background: `linear-gradient(135deg, ${getAQIColor(aqiData.aqi)}15 0%, ${getAQIColor(aqiData.aqi)}30 100%)`,
                                        border: `1px solid ${getAQIColor(aqiData.aqi)}40`
                                    }}>
                                    <div className="relative">
                                        <div className="text-4xl font-black mb-1 drop-shadow-sm" style={{ color: getAQIColor(aqiData.aqi) }}>
                                            {aqiData.aqi}
                                        </div>
                                        <div className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: getAQIColor(aqiData.aqi) }}>
                                            {aqiData.category}
                                        </div>
                                        <div className="text-xs text-gray-600 flex items-center justify-center gap-1 bg-white/50 py-1 px-2 rounded-full mx-auto w-fit">
                                            <MapPin className="w-3 h-3" />
                                            <span className="truncate max-w-[120px]">{aqiData.location}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                                    <div className="text-2xl font-bold text-gray-700">{aqiData.pm25}</div>
                                    <div className="text-xs font-semibold text-gray-500 uppercase">PM2.5</div>
                                    <div className="text-[10px] text-gray-400">Fine Particles</div>
                                </div>

                                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                                    <div className="text-2xl font-bold text-gray-700">{aqiData.pm10}</div>
                                    <div className="text-xs font-semibold text-gray-500 uppercase">PM10</div>
                                    <div className="text-[10px] text-gray-400">Coarse Particles</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Wind className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                            <p className="text-gray-600 font-medium mb-2">Air quality data temporarily unavailable</p>
                            <p className="text-sm text-gray-500 mb-4">
                                We're using estimated values based on your general area.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => initializeDashboard()}
                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Try Again
                            </Button>
                        </div>
                    )}
                </div>
            </DashboardCard>

            {/* Reports Display Section */}
            {(reports.reports.length > 0 || reports.pftRecords.length > 0) && (
                <Card className="p-4 bg-white border shadow-sm mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-5 h-5 text-purple-600" />
                        <h3 className="font-medium text-gray-900">Doctor Reports & Tests</h3>
                    </div>

                    <div className="space-y-4">
                        {reports.pftRecords.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">PFT Records</h4>
                                <div className="grid gap-2">
                                    {reports.pftRecords.map((rec: any, i: number) => (
                                        <div key={i} className="flex justify-between p-2 bg-purple-50 rounded text-sm">
                                            <span>{rec.date}</span>
                                            <span className="font-medium">FEV1: {rec.fev1}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {reports.reports.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Other Reports</h4>
                                <div className="grid gap-2">
                                    {reports.reports.map((rep: any, i: number) => (
                                        <div key={i} className="p-2 bg-gray-50 rounded text-sm">
                                            <p className="font-medium">{rep.title || 'Report'}</p>
                                            <p className="text-gray-600">{rep.summary || rep.description}</p>
                                            <p className="text-xs text-gray-400 mt-1">{rep.date}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Main Form */}
            <Tabs defaultValue="vitals" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="vitals">Vitals</TabsTrigger>
                    <TabsTrigger value="symptoms">Symptoms</TabsTrigger>
                    <TabsTrigger value="medications">Medications</TabsTrigger>
                    <TabsTrigger value="ild-specific">ILD Specific</TabsTrigger>
                </TabsList>

                <TabsContent value="vitals" className="space-y-4">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Vital Signs</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">SpO₂ at Rest (%)</label>
                                    <div className="flex items-center gap-4">
                                        <Slider
                                            value={[formData.spo2AtRest]}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, spo2AtRest: value[0] }))}
                                            max={100}
                                            min={70}
                                            step={1}
                                            className="flex-1"
                                        />
                                        <span className="text-lg font-bold w-12">{formData.spo2AtRest}%</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-2 block">SpO₂ on Exertion (%)</label>
                                    <div className="flex items-center gap-4">
                                        <Slider
                                            value={[formData.spo2OnExertion]}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, spo2OnExertion: value[0] }))}
                                            max={100}
                                            min={70}
                                            step={1}
                                            className="flex-1"
                                        />
                                        <span className="text-lg font-bold w-12">{formData.spo2OnExertion}%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">SpO₂ Drop from Baseline (%)</label>
                                    <div className="flex items-center gap-4">
                                        <Slider
                                            value={[formData.spo2BaselineDrop]}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, spo2BaselineDrop: value[0] }))}
                                            max={15}
                                            min={0}
                                            step={1}
                                            className="flex-1"
                                        />
                                        <span className="text-lg font-bold w-12">{formData.spo2BaselineDrop}%</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-2 block">mMRC Breathlessness Scale</label>
                                    <Select value={formData.mMRCScale.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, mMRCScale: parseInt(value) }))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">0 - Only breathless with strenuous exercise</SelectItem>
                                            <SelectItem value="1">1 - Breathless when hurrying or walking up a slight hill</SelectItem>
                                            <SelectItem value="2">2 - Walks slower than people of same age due to breathlessness</SelectItem>
                                            <SelectItem value="3">3 - Stops for breath after walking about 100 yards</SelectItem>
                                            <SelectItem value="4">4 - Too breathless to leave the house</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="symptoms" className="space-y-4">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Symptom Severity (0-10 Scale)</h3>

                        <div className="space-y-6">
                            {[
                                { key: 'breathlessness', label: 'Breathlessness', icon: Activity },
                                { key: 'cough', label: 'Dry Cough', icon: Wind },
                                { key: 'chestTightness', label: 'Chest Tightness', icon: Heart },
                                { key: 'fatigue', label: 'Fatigue', icon: Clock }
                            ].map(({ key, label, icon: Icon }) => (
                                <div key={key} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Icon className="w-4 h-4 text-blue-600" />
                                            <label className="text-sm font-medium">{label}</label>
                                        </div>
                                        <span className="text-lg font-bold">{formData[key as keyof typeof formData] as number}/10</span>
                                    </div>
                                    <Slider
                                        value={[formData[key as keyof typeof formData] as number]}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, [key]: value[0] }))}
                                        max={10}
                                        min={0}
                                        step={1}
                                        className="w-full"
                                    />
                                </div>
                            ))}
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="medications" className="space-y-4">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Today's Medications</h3>

                        <div className="space-y-4">
                            {Array.isArray(formData.medications) && formData.medications.map((med, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <span className="font-medium">{med.drugName}</span>
                                        <p className="text-sm text-gray-600">{med.dose} - {med.frequency}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            checked={med.taken}
                                            onCheckedChange={(checked) => handleMedicationChange(index, checked as boolean)}
                                        />
                                        <span className="text-sm text-gray-600">
                                            {med.taken ? 'Taken' : 'Not taken'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6">
                            <h4 className="font-medium mb-3">Side Effects (if any)</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {['Nausea', 'Diarrhea', 'Skin rash', 'Fatigue', 'Loss of appetite', 'Weight loss'].map((effect) => (
                                    <div key={effect} className="flex items-center gap-2">
                                        <Checkbox
                                            checked={Array.isArray(formData.sideEffects) && formData.sideEffects.includes(effect)}
                                            onCheckedChange={(checked) => handleSideEffectChange(effect, checked as boolean)}
                                        />
                                        <span className="text-sm">{effect}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="ild-specific" className="space-y-4">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">ILD Specific Assessment</h3>

                        <div className="space-y-6">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Dry Cough Severity (0-10)</label>
                                <div className="flex items-center gap-4">
                                    <Slider
                                        value={[formData.dryCoughSeverity]}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, dryCoughSeverity: value[0] }))}
                                        max={10}
                                        min={0}
                                        step={1}
                                        className="flex-1"
                                    />
                                    <span className="text-lg font-bold w-12">{formData.dryCoughSeverity}/10</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Breathlessness Change</label>
                                <Select value={formData.breathlessnessChange} onValueChange={(value: any) => setFormData(prev => ({ ...prev, breathlessnessChange: value }))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="better">Better than usual</SelectItem>
                                        <SelectItem value="stable">Same as usual</SelectItem>
                                        <SelectItem value="worse">Worse than usual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">KBILD Score (0–100)</label>
                                <div className="flex items-center gap-4">
                                    <Slider
                                        value={[formData.kbildScore]}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, kbildScore: value[0] }))}
                                        max={100}
                                        min={0}
                                        step={1}
                                        className="flex-1"
                                    />
                                    <span className="text-lg font-bold w-12">{formData.kbildScore}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">King&apos;s Brief Interstitial Lung Disease questionnaire</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={formData.newChestPain}
                                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, newChestPain: checked as boolean }))}
                                    />
                                    <label className="text-sm font-medium">New or worsening chest pain</label>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={formData.hemoptysis}
                                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hemoptysis: checked as boolean }))}
                                    />
                                    <label className="text-sm font-medium">Blood in sputum (Hemoptysis)</label>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={formData.fibroticProgression}
                                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, fibroticProgression: checked as boolean }))}
                                    />
                                    <label className="text-sm font-medium">Signs of fibrotic progression</label>
                                </div>
                            </div>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Submit Button */}
            {/* Submit Button */}
            <DashboardCard className="border-0 shadow-sm bg-white">
                <div className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>

                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Submit</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Review your entries above, then submit your daily health log to your care team.
                    </p>

                    <Button
                        onClick={handleSubmit}
                        disabled={!canLog || isSubmitting}
                        className="bg-gray-900 hover:bg-gray-800 text-white border-0 h-12 px-8 rounded-xl font-medium"
                        size="lg"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-3"></div>
                                Submitted...
                            </>
                        ) : (
                            <>
                                Submit Health Log
                            </>
                        )}
                    </Button>

                    {!canLog && (
                        <p className="text-sm text-gray-500 mt-4">
                            Daily logging limit reached. Come back tomorrow to log again.
                        </p>
                    )}
                </div>
            </DashboardCard>
        </PatientDashboardLayout>
    )
}