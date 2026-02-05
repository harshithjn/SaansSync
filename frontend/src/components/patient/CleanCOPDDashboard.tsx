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
import { calculateRedFlagScore } from "@/lib/red-flag-scoring"
import { PatientData } from "@/lib/patient-types"
import { useLanguage, LanguageToggle } from "@/lib/language-context"
import { getPersonalizedAlerts, getCurrentAlerts } from "@/lib/personalized-alerts"
import {
    getAlertColor,
    getAlertBackgroundColor,
    getPatientBaseline
} from "@/lib/enhanced-alert-system"
import {
    copdAlertEngine,
    storeDoctorAlert,
    type AlertOutput
} from "@/lib/alert-engines"
import { getPatientDoctor } from "@/lib/doctor-patient-mapping"
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
    Moon,
    Zap,
    User,
    Stethoscope,
    Phone,
    Play,
    FileText
} from "lucide-react"

interface CleanCOPDDashboardProps {
    patientId: string
    patientName?: string
    diagnosis?: string
    headless?: boolean
}

export default function CleanCOPDDashboard({ patientId, patientName, diagnosis, headless = false }: CleanCOPDDashboardProps) {
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

    // Personalized Alerts
    const [personalizedAlerts, setPersonalizedAlerts] = useState<any[]>([])

    // Alert System (RED/YELLOW/GREEN from SaansSync engine)
    const [currentAlert, setCurrentAlert] = useState<AlertOutput | null>(null)
    const [activeAlerts, setActiveAlerts] = useState<any[]>([])

    // Form Data
    const [formData, setFormData] = useState({
        // Common Data
        spo2AtRest: 95,
        spo2OnExertion: 92,
        mMRCScale: 1,

        // COPD Specific
        coughFrequency: 1,
        phlegmProduction: 1,
        exerciseTolerance: true,
        sleepDisturbed: false,
        energyLevel: 5,
        chestHeaviness: 3,
        sputumVolume: 'small' as 'none' | 'small' | 'moderate' | 'large',
        sputumColor: 'white',
        fever: false,

        // Symptoms VAS
        breathlessness: 3,
        cough: 2,
        chestTightness: 2,
        fatigue: 4,

        // Medications
        medications: [
            {
                medicationId: 'salbutamol-copd-1',
                drugName: 'Salbutamol Inhaler',
                dose: '2 puffs',
                frequency: 'as needed',
                dateTaken: new Date().toISOString().split('T')[0],
                taken: false
            },
            {
                medicationId: 'tiotropium-1',
                drugName: 'Tiotropium',
                dose: '18mcg',
                frequency: 'once daily',
                dateTaken: new Date().toISOString().split('T')[0],
                taken: false
            },
            {
                medicationId: 'budesonide-formoterol-copd-1',
                drugName: 'Budesonide/Formoterol',
                dose: '2 puffs',
                frequency: 'twice daily',
                dateTaken: new Date().toISOString().split('T')[0],
                taken: false
            }
        ] as any[],

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
                    isStatic: formData.energyLevel >= 5,
                    hasWorsening: formData.chestHeaviness > 7 || formData.fever,
                    hasImprovement: formData.exerciseTolerance,
                    oxygenChange: 0
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

            // Prepare COPD specific data
            const copdData = {
                patientId,
                logDate: new Date().toISOString().split('T')[0],
                coughFrequency: formData.coughFrequency,
                phlegmProduction: formData.phlegmProduction,
                exerciseTolerance: formData.exerciseTolerance,
                sleepDisturbed: formData.sleepDisturbed,
                energyLevel: formData.energyLevel,
                chestHeaviness: formData.chestHeaviness,
                sputumVolume: formData.sputumVolume,
                sputumColor: formData.sputumColor,
                fever: formData.fever
            }

            // Create daily log
            const input = {
                patientId,
                spo2Rest: formData.spo2AtRest,
                mMrcToday: formData.mMRCScale,
                // Add defaults for other required fields to avoid crash
                energyScore: 5,
            }
            // @ts-ignore
            const alertResult = copdAlertEngine(input)
            setCurrentAlert(alertResult)
            const result = await createDailyLog(
                patientId,
                'COPD',
                commonData,
                copdData
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
            patientName={patientData?.fullName || patientName || 'Patient'}
            diagnosis={patientData?.diagnosis?.primaryCategory || diagnosis || 'COPD'}
            headless={headless}
        >

            {/* Backend Health Alerts */}
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
            <DashboardCard className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Daily Health Check-in</h3>
                            <p className="text-sm text-blue-700/80">Track your vitals to stay ahead</p>
                        </div>
                    </div>
                    <Badge className={`${canLog ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400"} text-white px-4 py-1.5 text-sm font-medium shadow-sm transition-colors`}>
                        {canLog ? `${remainingLogs} Log Remaining` : "Completed for Today"}
                    </Badge>
                </div>
            </DashboardCard>

            {/* AQI Alert */}
            {aqiData && shouldAlertForAQI(aqiData.aqi) && (
                <div className="relative overflow-hidden rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-red-100 rounded-lg text-red-600">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-red-900">High Alert: Poor Air Quality</h3>
                            <p className="text-sm text-red-700 mt-0.5">AQI is hazardous. Please stay indoors and avoid exertion.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* AQI Display */}
            <DashboardCard
                noPadding
                title="Air Quality Index"
                subtitle={aqiData?.location ? `Location: ${aqiData.location}` : 'Live Monitoring'}
                action={
                    <Button
                        variant="ghost"
                        size="sm"
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
                        className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${aqiLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                }
            >
                <div className="p-6 bg-white">
                    {aqiLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-gray-50/50 rounded-xl">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                            <p className="text-sm font-medium">Fetching real-time data...</p>
                        </div>
                    ) : aqiData ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div
                                className="relative overflow-hidden rounded-xl p-6 text-white shadow-md transition-transform hover:scale-[1.02]"
                                style={{
                                    background: `linear-gradient(135deg, ${getAQIColor(aqiData.aqi)}, ${getAQIColor(aqiData.aqi)}dd)`
                                }}
                            >
                                <div className="relative z-10">
                                    <p className="text-white/80 text-sm font-medium mb-1">Current AQI</p>
                                    <div className="text-4xl font-bold mb-2">{aqiData.aqi}</div>
                                    <div className="inline-flex items-center px-2 py-1 rounded-lg bg-white/20 backdrop-blur-sm text-xs font-semibold">
                                        {aqiData.category}
                                    </div>
                                </div>
                                <Wind className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10 rotate-12" />
                            </div>

                            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-6 flex flex-col justify-center hover:bg-gray-50 transition-colors">
                                <div className="text-3xl font-bold text-gray-900 mb-1">{aqiData.pm25}</div>
                                <div className="text-sm font-medium text-gray-600">PM2.5 Concentration</div>
                                <div className="text-xs text-gray-400 mt-1">Fine particles (μg/m³)</div>
                            </div>

                            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-6 flex flex-col justify-center hover:bg-gray-50 transition-colors">
                                <div className="text-3xl font-bold text-gray-900 mb-1">{aqiData.pm10}</div>
                                <div className="text-sm font-medium text-gray-600">PM10 Concentration</div>
                                <div className="text-xs text-gray-400 mt-1">Coarse particles (μg/m³)</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-gray-50/50 rounded-xl">
                            <Wind className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                            <p className="text-gray-500 font-medium">Data unavailable</p>
                            <Button variant="link" onClick={() => initializeDashboard()} className="text-blue-600 btn-sm h-auto p-0 mt-1">Retry Connection</Button>
                        </div>
                    )}
                </div>
            </DashboardCard>

            {/* Reports Display Section */}
            {(reports.reports.length > 0 || reports.pftRecords.length > 0) && (
                <Card className="p-4 bg-white border shadow-sm">
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
                    <TabsTrigger value="copd-specific">COPD Specific</TabsTrigger>
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
                                { key: 'cough', label: 'Cough', icon: Wind },
                                { key: 'chestTightness', label: 'Chest Tightness', icon: Activity },
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
                            {/* The original instruction had a partial line here, which was likely meant to be removed or replaced.
                                Keeping the original mapping logic for medications. */}
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
                                {['Dry mouth', 'Headache', 'Nausea', 'Dizziness', 'Tremor', 'Palpitations'].map((effect) => (
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

                <TabsContent value="copd-specific" className="space-y-4">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">COPD Specific Assessment</h3>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Energy Level (0-10)</label>
                                    <div className="flex items-center gap-4">
                                        <Slider
                                            value={[formData.energyLevel]}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, energyLevel: value[0] }))}
                                            max={10}
                                            min={0}
                                            step={1}
                                            className="flex-1"
                                        />
                                        <span className="text-lg font-bold w-12">{formData.energyLevel}/10</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-2 block">Chest Heaviness (0-10)</label>
                                    <div className="flex items-center gap-4">
                                        <Slider
                                            value={[formData.chestHeaviness]}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, chestHeaviness: value[0] }))}
                                            max={10}
                                            min={0}
                                            step={1}
                                            className="flex-1"
                                        />
                                        <span className="text-lg font-bold w-12">{formData.chestHeaviness}/10</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Sputum Volume</label>
                                    <Select value={formData.sputumVolume} onValueChange={(value: any) => setFormData(prev => ({ ...prev, sputumVolume: value }))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            <SelectItem value="small">Small amount</SelectItem>
                                            <SelectItem value="moderate">Moderate amount</SelectItem>
                                            <SelectItem value="large">Large amount</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-2 block">Sputum Color</label>
                                    <Select value={formData.sputumColor} onValueChange={(value) => setFormData(prev => ({ ...prev, sputumColor: value }))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="white">White/Clear</SelectItem>
                                            <SelectItem value="pale-yellow">Pale Yellow</SelectItem>
                                            <SelectItem value="yellow">Yellow</SelectItem>
                                            <SelectItem value="dark-green">Dark Green</SelectItem>
                                            <SelectItem value="blood-streaked">Blood Streaked</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={formData.fever}
                                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, fever: checked as boolean }))}
                                    />
                                    <label className="text-sm font-medium">Fever (&gt;38°C / 100.4°F)</label>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={formData.exerciseTolerance}
                                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, exerciseTolerance: checked as boolean }))}
                                    />
                                    <label className="text-sm font-medium">Good exercise tolerance today</label>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={formData.sleepDisturbed}
                                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sleepDisturbed: checked as boolean }))}
                                    />
                                    <label className="text-sm font-medium">Sleep disturbed due to breathing</label>
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