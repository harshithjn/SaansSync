"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { fetchRealTimeAQI, getAQIColor, shouldAlertForAQI, forceRefreshAQI } from "@/lib/aqi-service"
import { createDailyLog, canLogToday, getPatientProfile } from "@/lib/database-service"
import { calculateRedFlagScore } from "@/lib/red-flag-scoring"
import { PatientData } from "@/lib/patient-types"
import { useLanguage } from "@/lib/language-context"
import { getPersonalizedAlerts, getCurrentAlerts } from "@/lib/personalized-alerts"
import {
    getAlertColor,
    getAlertBackgroundColor,
    getPatientBaseline
} from "@/lib/enhanced-alert-system"
import {
    classifyAsthmaControl,
    asthmaAlertEngine,
    storeDoctorAlert,
    getYesterdayAsthmaData,
    storeTodayAsthmaData,
    type AlertOutput,
    type AsthmaControlLevel
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
    Play
} from "lucide-react"

interface CleanAsthmaDashboardProps {
    patientId: string
    patientName?: string
    diagnosis?: string
}

export default function CleanAsthmaDashboard({ patientId, patientName, diagnosis }: CleanAsthmaDashboardProps) {
    const { t, language } = useLanguage()

    // Patient Data State
    const [patientData, setPatientData] = useState<PatientData | null>(null)

    // AQI State
    const [aqiData, setAqiData] = useState<any>(null)
    const [aqiLoading, setAqiLoading] = useState(true)

    // Logging State
    const [canLog, setCanLog] = useState(true)
    const [remainingLogs, setRemainingLogs] = useState(2)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Personalized Alerts
    const [personalizedAlerts, setPersonalizedAlerts] = useState<any[]>([])

    // Alert System (RED/YELLOW/GREEN from SaansSync engine)
    const [currentAlert, setCurrentAlert] = useState<AlertOutput | null>(null)

    // Form Data
    const [formData, setFormData] = useState({
        // Common Data
        spo2AtRest: 98,
        spo2OnExertion: 95,
        mMRCScale: 0,

        // Oxygenation Status
        oxygenationStatus: 'Room Air', // Default
        oxygenationChange: '',
        oxygenationImprovement: '',
        oxygenationWorsening: '',
        oxygenDecreased: '',
        oxygenIncreased: '',
        saturationLow: '',

        // Asthma Specific
        peakFlowPercent: 85,
        nightWaking: false,
        rescueInhalerPuffs: 0,
        daytimeSymptoms: false,
        relieverUse: false,
        activityLimitation: false,
        controlLevel: 'well-controlled' as 'well-controlled' | 'partly-controlled' | 'poorly-controlled',

        // Updated Symptoms
        cough: 1,
        fever: 0,
        feverTemperature: '',
        expectoration: 0,
        chestPain: 0,
        wheezing: 2,
        stridor: 0,
        weakness: 0,
        pedalEdema: 0,
        breathlessness: 2,
        chestTightness: 1,
        otherSymptoms: '',

        // Medications
        medications: [
            {
                medicationId: 'salbutamol-1',
                drugName: 'Salbutamol Inhaler (Rescue)',
                dose: '2 puffs',
                frequency: 'as needed',
                dateTaken: new Date().toISOString().split('T')[0],
                taken: false
            },
            {
                medicationId: 'budesonide-formoterol-1',
                drugName: 'Budesonide/Formoterol',
                dose: '2 puffs',
                frequency: 'twice daily',
                dateTaken: new Date().toISOString().split('T')[0],
                taken: false
            },
            {
                medicationId: 'montelukast-1',
                drugName: 'Montelukast',
                dose: '10mg',
                frequency: 'once daily at bedtime',
                dateTaken: new Date().toISOString().split('T')[0],
                taken: false
            }
        ],

        // Updated Side Effects
        sideEffects: [] as string[],
        customSideEffect: ''
    })

    useEffect(() => {
        loadPatientData()
        initializeDashboard()
        checkLoggingStatus()
        loadPersonalizedAlerts()
    }, [patientId])

    const loadPatientData = async () => {
        try {
            const data = await getPatientProfile(patientId)
            setPatientData(data)
            console.log('Loaded patient data:', data)
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
            setRemainingLogs(dbCanLog ? 2 : 0) // Simplified - just show if can log or not
        } catch (error) {
            console.error('Error checking logging status:', error)
            setCanLog(false)
            setRemainingLogs(0)
        }
    }

    const loadPersonalizedAlerts = () => {
        const alerts = getPersonalizedAlerts(patientId)
        setPersonalizedAlerts(alerts)
    }

    // Auto-calculate control status from 4 questions: 0 = Well, 1–2 = Partly, 3–4 = Poorly
    const controlLevelFromCheckboxes = classifyAsthmaControl(
        formData.nightWaking,
        formData.daytimeSymptoms,
        formData.activityLimitation,
        formData.relieverUse
    )

    // Update control level in form when checkboxes change
    useEffect(() => {
        if (controlLevelFromCheckboxes !== formData.controlLevel) {
            setFormData(prev => ({ ...prev, controlLevel: controlLevelFromCheckboxes }))
        }
    }, [controlLevelFromCheckboxes, formData.controlLevel])

    // Real-time alert using SaansSync asthma engine (RED/YELLOW/GREEN)
    useEffect(() => {
        const baseline = getPatientBaseline(patientId) || {}
        const yesterday = getYesterdayAsthmaData(patientId)
        const input = {
            patientId,
            spo2Rest: formData.spo2AtRest,
            spo2Exertion: formData.spo2OnExertion,
            rescuePuffsToday: formData.rescueInhalerPuffs,
            controllerTaken: formData.medications.some(m => m.taken),
            mMrcToday: formData.mMRCScale,
            temperatureF: formData.feverTemperature ? parseFloat(formData.feverTemperature) : undefined,
            coughVas: formData.cough,
            chestPainVas: formData.chestPain,
            hemoptysis: false,
            breathlessnessVas: formData.breathlessness,
            wheezeVas: formData.wheezing,
            fatigueVas: formData.weakness,
            asthmaControlToday: formData.controlLevel,
            baselineSpO2: baseline.baselineSpO2,
            baselineMrc: baseline.baselinemMRC,
            baselineCoughVas: undefined,
            yesterdayControl: yesterday.yesterdayControl,
            yesterdayRescuePuffs: yesterday.yesterdayRescuePuffs
        }
        const result = asthmaAlertEngine(input)
        setCurrentAlert(result)
    }, [
        patientId,
        formData.spo2AtRest,
        formData.spo2OnExertion,
        formData.rescueInhalerPuffs,
        formData.mMRCScale,
        formData.cough,
        formData.chestPain,
        formData.breathlessness,
        formData.wheezing,
        formData.controlLevel,
        formData.medications,
        formData.feverTemperature
    ])

    const handleSubmit = async () => {
        if (!canLog) return

        setIsSubmitting(true)
        try {
            const baseline = getPatientBaseline(patientId) || {}
            const yesterday = getYesterdayAsthmaData(patientId)
            const asthmaInput = {
                patientId,
                spo2Rest: formData.spo2AtRest,
                spo2Exertion: formData.spo2OnExertion,
                rescuePuffsToday: formData.rescueInhalerPuffs,
                controllerTaken: formData.medications.some(m => m.taken),
                mMrcToday: formData.mMRCScale,
                temperatureF: formData.feverTemperature ? parseFloat(formData.feverTemperature) : undefined,
                coughVas: formData.cough,
                chestPainVas: formData.chestPain,
                hemoptysis: false,
                breathlessnessVas: formData.breathlessness,
                wheezeVas: formData.wheezing,
                fatigueVas: formData.weakness,
                asthmaControlToday: formData.controlLevel,
                baselineSpO2: baseline.baselineSpO2,
                baselineMrc: baseline.baselinemMRC,
                baselineCoughVas: undefined,
                yesterdayControl: yesterday.yesterdayControl,
                yesterdayRescuePuffs: yesterday.yesterdayRescuePuffs
            }
            const alertResult = asthmaAlertEngine(asthmaInput)
            setCurrentAlert(alertResult)

            storeTodayAsthmaData(patientId, formData.controlLevel, formData.rescueInhalerPuffs)
            const doc = getPatientDoctor(patientId)
            if (doc?.doctorId) {
                storeDoctorAlert(alertResult, doc.doctorId, patientData?.fullName || patientName)
            }

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
                symptoms: [
                    { id: '1', name: 'Breathlessness', score: formData.breathlessness, loggedAt: new Date().toISOString() },
                    { id: '2', name: 'Cough', score: formData.cough, loggedAt: new Date().toISOString() },
                    { id: '3', name: 'Chest Tightness', score: formData.chestTightness, loggedAt: new Date().toISOString() },
                    { id: '4', name: 'Wheezing', score: formData.wheezing, loggedAt: new Date().toISOString() }
                ],
                alert: alertResult
            }

            // Prepare Asthma specific data
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

            // Create daily log in database
            const result = await createDailyLog(
                patientId,
                'Asthma',
                commonData,
                asthmaData
            )

            if (result.success) {
                toast.success('Health log submitted successfully!')
                if (alertResult.level !== 'GREEN') {
                    toast.info(`Alert (${alertResult.level})`, alertResult.reason_text)
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
        <div className="space-y-6 max-w-4xl mx-auto p-4">
            {/* Header with Patient Info */}
            <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <User className="w-6 h-6 text-blue-600" />
                    <h1 className="text-2xl font-bold text-gray-900">
                        {patientData?.fullName || patientName || 'Patient Dashboard'}
                    </h1>
                </div>
                {patientData?.mobileNumber && (
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <p className="text-sm text-gray-600">{patientData.mobileNumber}</p>
                    </div>
                )}
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Stethoscope className="w-5 h-5 text-green-600" />
                    <p className="text-lg text-gray-700 font-medium">
                        {patientData?.diagnosis.primaryCategory || diagnosis || 'Bronchial Asthma'}
                    </p>
                </div>
                <p className="text-gray-600">{t('dashboard.title')} - {language === 'hi' ? 'दमा निगरानी' : 'Asthma Monitoring'}</p>
                <Badge variant="outline" className="mt-2">
                    Patient ID: {patientId}
                </Badge>
            </div>

            {/* Personalized Alerts */}
            {personalizedAlerts.length > 0 && (
                <Card className="p-4 bg-blue-50 border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-5 h-5 text-blue-600" />
                        <h3 className="font-medium text-blue-900">Personalized Reminders</h3>
                    </div>
                    <div className="space-y-2">
                        {personalizedAlerts.filter(alert => alert.isActive).map((alert, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                                <span className="text-sm">{alert.name}</span>
                                <Badge variant="outline" className="text-xs">
                                    {alert.frequency} {alert.interval && alert.interval}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Current Alert Display (RED/YELLOW/GREEN) */}
            {currentAlert && currentAlert.level !== 'GREEN' && (
                <Card
                    className="p-4 border-2"
                    style={{
                        backgroundColor: getAlertBackgroundColor(currentAlert.level),
                        borderColor: getAlertColor(currentAlert.level)
                    }}
                >
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle
                            className="w-5 h-5"
                            style={{ color: getAlertColor(currentAlert.level) }}
                        />
                        <h3
                            className="font-medium"
                            style={{ color: getAlertColor(currentAlert.level) }}
                        >
                            {currentAlert.level} Alert
                        </h3>
                    </div>
                    <p className="text-sm font-medium mb-2">{currentAlert.reason_text}</p>
                    {currentAlert.triggers.length > 0 && (
                        <ul className="text-sm space-y-1">
                            {currentAlert.triggers.map((trigger, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <span className="text-red-500 mt-1">•</span>
                                    <span>{trigger}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            )}

            {/* Virtual Pulmonary Rehabilitation */}
            <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Play className="w-6 h-6 text-green-600" />
                        <div>
                            <h3 className="font-medium text-green-900">{t('rehabilitation.title')}</h3>
                            <p className="text-sm text-green-700">{t('rehabilitation.description')}</p>
                        </div>
                    </div>
                    <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                        {t('rehabilitation.start')}
                    </Button>
                </div>
            </Card>

            {/* Logging Status */}
            <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">Daily Health Log</span>
                    </div>
                    <Badge variant={canLog ? "default" : "secondary"}>
                        {remainingLogs} logs remaining today
                    </Badge>
                </div>
            </Card>

            {/* AQI Alert */}
            {aqiData && shouldAlertForAQI(aqiData.aqi) && (
                <Card className="p-4 border-red-200 bg-red-50">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                        <div>
                            <h3 className="font-semibold text-red-900">☢️ Air quality is hazardous</h3>
                            <p className="text-sm text-red-700">Take precautions - avoid outdoor activities</p>
                        </div>
                    </div>
                </Card>
            )}

            {/* AQI Display */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Wind className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold">Air Quality Index</h3>
                    </div>
                    <Button
                        variant="outline"
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
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${aqiLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {aqiLoading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Loading air quality data...</p>
                    </div>
                ) : aqiData ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 rounded-lg" style={{ backgroundColor: `${getAQIColor(aqiData.aqi)}20` }}>
                            <div className="text-3xl font-bold mb-1" style={{ color: getAQIColor(aqiData.aqi) }}>
                                {aqiData.aqi}
                            </div>
                            <div className="text-sm font-medium">{aqiData.category}</div>
                            <div className="text-xs text-gray-600 flex items-center justify-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" />
                                {aqiData.location}
                            </div>
                        </div>

                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-700">{aqiData.pm25}</div>
                            <div className="text-sm font-medium">PM2.5</div>
                            <div className="text-xs text-gray-600">μg/m³</div>
                        </div>

                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-700">{aqiData.pm10}</div>
                            <div className="text-sm font-medium">PM10</div>
                            <div className="text-xs text-gray-600">μg/m³</div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-4 text-gray-600">
                        Unable to load air quality data
                    </div>
                )}
            </Card>

            {/* Main Form */}
            <Tabs defaultValue="vitals" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="vitals">Vitals</TabsTrigger>
                    <TabsTrigger value="symptoms">Symptoms</TabsTrigger>
                    <TabsTrigger value="medications">Medications</TabsTrigger>
                    <TabsTrigger value="asthma-specific">Asthma Control</TabsTrigger>
                </TabsList>

                <TabsContent value="vitals" className="space-y-4">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">{t('dashboard.vitals')}</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">{t('vitals.spo2')} at Rest (%)</label>
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
                                    <label className="text-sm font-medium mb-2 block">{t('vitals.spo2')} on Exertion (%)</label>
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

                                {/* Respiratory support / oxygenation: only show if doctor set it for this patient */}
                                {(patientData?.requiresRespiratorySupport === 'yes' || patientData?.ltot?.enabled || patientData?.bipap?.enabled || patientData?.invasiveVentilation?.enabled || patientData?.tracheostomy?.enabled) && (
                                    <>
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">{t('dashboard.oxygenation')}</label>
                                            <div className="p-3 bg-blue-50 rounded-lg">
                                                <p className="text-sm font-medium text-blue-900">
                                                    {formData.oxygenationStatus || t('dashboard.roomAir')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                                            <div>
                                                <label className="text-sm font-medium mb-2 block">{t('vitals.oxygenationChange')}</label>
                                                <Select
                                                    value={formData.oxygenationChange}
                                                    onValueChange={(value) => setFormData(prev => ({ ...prev, oxygenationChange: value }))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select option" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="yes">{t('common.yes')}</SelectItem>
                                                        <SelectItem value="no">{t('common.no')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {formData.oxygenationChange === 'yes' && (
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-sm font-medium mb-2 block">Type of Change</label>
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <Checkbox
                                                                    checked={formData.oxygenationImprovement === 'yes'}
                                                                    onCheckedChange={(checked) => {
                                                                        setFormData(prev => ({
                                                                            ...prev,
                                                                            oxygenationImprovement: checked ? 'yes' : '',
                                                                            oxygenationWorsening: checked ? '' : prev.oxygenationWorsening
                                                                        }))
                                                                    }}
                                                                />
                                                                <label className="text-sm">{t('vitals.improvement')}</label>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Checkbox
                                                                    checked={formData.oxygenationWorsening === 'yes'}
                                                                    onCheckedChange={(checked) => {
                                                                        setFormData(prev => ({
                                                                            ...prev,
                                                                            oxygenationWorsening: checked ? 'yes' : '',
                                                                            oxygenationImprovement: checked ? '' : prev.oxygenationImprovement
                                                                        }))
                                                                    }}
                                                                />
                                                                <label className="text-sm">{t('vitals.worsening')}</label>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {formData.oxygenationImprovement === 'yes' && (
                                                        <div>
                                                            <label className="text-sm font-medium mb-2 block">{t('vitals.oxygenDecreased')}</label>
                                                            <Input
                                                                value={formData.oxygenDecreased}
                                                                onChange={(e) => setFormData(prev => ({ ...prev, oxygenDecreased: e.target.value }))}
                                                                placeholder="Enter amount (e.g., 1L/min)"
                                                            />
                                                        </div>
                                                    )}

                                                    {formData.oxygenationWorsening === 'yes' && (
                                                        <div>
                                                            <label className="text-sm font-medium mb-2 block">{t('vitals.oxygenIncreased')}</label>
                                                            <Input
                                                                value={formData.oxygenIncreased}
                                                                onChange={(e) => setFormData(prev => ({ ...prev, oxygenIncreased: e.target.value }))}
                                                                placeholder="Enter amount (e.g., 2L/min)"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div>
                                                <label className="text-sm font-medium mb-2 block">{t('vitals.saturationLow')}</label>
                                                <Select
                                                    value={formData.saturationLow}
                                                    onValueChange={(value) => setFormData(prev => ({ ...prev, saturationLow: value }))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select option" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="yes">{t('common.yes')}</SelectItem>
                                                        <SelectItem value="no">{t('common.no')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Peak Flow (% of personal best)</label>
                                    <div className="flex items-center gap-4">
                                        <Slider
                                            value={[formData.peakFlowPercent]}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, peakFlowPercent: value[0] }))}
                                            max={120}
                                            min={30}
                                            step={5}
                                            className="flex-1"
                                        />
                                        <span className="text-lg font-bold w-12">{formData.peakFlowPercent}%</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-2 block">{t('mmrc.title')}</label>
                                    <Select value={formData.mMRCScale.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, mMRCScale: parseInt(value) }))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">0 - {t('mmrc.grade0')}</SelectItem>
                                            <SelectItem value="1">1 - {t('mmrc.grade1')}</SelectItem>
                                            <SelectItem value="2">2 - {t('mmrc.grade2')}</SelectItem>
                                            <SelectItem value="3">3 - {t('mmrc.grade3')}</SelectItem>
                                            <SelectItem value="4">4 - {t('mmrc.grade4')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="symptoms" className="space-y-4">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">{t('dashboard.symptoms')} (0-10 Scale)</h3>

                        <div className="space-y-6">
                            {[
                                { key: 'cough', label: t('symptoms.cough'), icon: Wind },
                                { key: 'fever', label: t('symptoms.fever'), icon: Thermometer },
                                { key: 'expectoration', label: t('symptoms.expectoration'), icon: Droplets },
                                { key: 'chestPain', label: t('symptoms.chestPain'), icon: Activity },
                                { key: 'wheezing', label: t('symptoms.wheezing'), icon: Zap },
                                { key: 'stridor', label: t('symptoms.stridor'), icon: Wind },
                                { key: 'weakness', label: t('symptoms.weakness'), icon: Activity },
                                { key: 'pedalEdema', label: t('symptoms.pedalEdema'), icon: Droplets },
                                { key: 'breathlessness', label: 'Breathlessness', icon: Activity },
                                { key: 'chestTightness', label: 'Chest Tightness', icon: Activity }
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

                                    {/* Temperature input for fever */}
                                    {key === 'fever' && formData.fever > 0 && (
                                        <div className="ml-6 mt-2">
                                            <label className="text-xs text-gray-600 mb-1 block">
                                                {t('common.temperature')} ({t('common.fahrenheit')})
                                            </label>
                                            <Input
                                                type="number"
                                                value={formData.feverTemperature}
                                                onChange={(e) => setFormData(prev => ({ ...prev, feverTemperature: e.target.value }))}
                                                placeholder="e.g., 101.5"
                                                className="w-32 text-sm"
                                                step="0.1"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Others with text input */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Plus className="w-4 h-4 text-blue-600" />
                                    <label className="text-sm font-medium">{t('common.others')}</label>
                                </div>
                                <Input
                                    value={formData.otherSymptoms}
                                    onChange={(e) => setFormData(prev => ({ ...prev, otherSymptoms: e.target.value }))}
                                    placeholder="Describe any other symptoms..."
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="medications" className="space-y-4">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Today's Medications</h3>

                        <div className="space-y-4">
                            {formData.medications.map((med, index) => (
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
                            <h4 className="font-medium mb-3">{t('sideEffects.title')}</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    t('sideEffects.fever'),
                                    t('sideEffects.dizziness'),
                                    t('sideEffects.itching'),
                                    'Dry mouth',
                                    'Headache',
                                    'Nausea',
                                    'Tremor',
                                    'Palpitations'
                                ].map((effect) => (
                                    <div key={effect} className="flex items-center gap-2">
                                        <Checkbox
                                            checked={formData.sideEffects.includes(effect)}
                                            onCheckedChange={(checked) => handleSideEffectChange(effect, checked as boolean)}
                                        />
                                        <span className="text-sm">{effect}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Others with text input */}
                            <div className="mt-3 space-y-2">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={formData.sideEffects.includes('Others')}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setFormData(prev => ({ ...prev, sideEffects: [...prev.sideEffects, 'Others'] }))
                                            } else {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    sideEffects: prev.sideEffects.filter(e => e !== 'Others'),
                                                    customSideEffect: ''
                                                }))
                                            }
                                        }}
                                    />
                                    <span className="text-sm">{t('common.others')}</span>
                                </div>

                                {formData.sideEffects.includes('Others') && (
                                    <Input
                                        value={formData.customSideEffect}
                                        onChange={(e) => setFormData(prev => ({ ...prev, customSideEffect: e.target.value }))}
                                        placeholder="Describe other side effects..."
                                        className="ml-6 w-full"
                                    />
                                )}
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="asthma-specific" className="space-y-4">
                    {/* Current control level — auto from 4 questions (0=Well, 1–2=Partly, 3–4=Poorly) */}
                    <Card className="p-4 border-2" style={{
                        borderColor: formData.controlLevel === 'well-controlled' ? '#16a34a' : formData.controlLevel === 'partly-controlled' ? '#d97706' : '#dc2626',
                        backgroundColor: formData.controlLevel === 'well-controlled' ? '#dcfce7' : formData.controlLevel === 'partly-controlled' ? '#fef3c7' : '#fee2e2'
                    }}>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">Current control level</h3>
                        <p className="text-xl font-semibold" style={{
                            color: formData.controlLevel === 'well-controlled' ? '#16a34a' : formData.controlLevel === 'partly-controlled' ? '#b45309' : '#dc2626'
                        }}>
                            {formData.controlLevel === 'well-controlled' ? 'Well Controlled (0 checkboxes)' :
                                formData.controlLevel === 'partly-controlled' ? 'Partly Controlled (1–2 checkboxes)' : 'Poorly Controlled (3–4 checkboxes)'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Based on the 4 questions below. Updates automatically.</p>
                    </Card>
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Asthma Control Assessment</h3>

                        <div className="space-y-6">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Rescue Inhaler Puffs (last 24 hours)</label>
                                <div className="flex items-center gap-4">
                                    <Slider
                                        value={[formData.rescueInhalerPuffs]}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, rescueInhalerPuffs: value[0] }))}
                                        max={20}
                                        min={0}
                                        step={1}
                                        className="flex-1"
                                    />
                                    <span className="text-lg font-bold w-12">{formData.rescueInhalerPuffs}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={formData.nightWaking}
                                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, nightWaking: checked as boolean }))}
                                    />
                                    <div className="flex items-center gap-2">
                                        <Moon className="w-4 h-4 text-blue-600" />
                                        <label className="text-sm font-medium">Night waking due to asthma symptoms</label>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={formData.daytimeSymptoms}
                                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, daytimeSymptoms: checked as boolean }))}
                                    />
                                    <label className="text-sm font-medium">Daytime symptoms (more than twice a week)</label>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={formData.activityLimitation}
                                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, activityLimitation: checked as boolean }))}
                                    />
                                    <label className="text-sm font-medium">Activity limitation due to asthma</label>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={formData.relieverUse}
                                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, relieverUse: checked as boolean }))}
                                    />
                                    <label className="text-sm font-medium">Need for reliever treatment (more than twice a week)</label>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Current Control Level (Auto-calculated)</label>
                                <div className="p-3 rounded-lg border-2" style={{
                                    backgroundColor: formData.controlLevel === 'well-controlled' ? '#dcfce7' :
                                        formData.controlLevel === 'partly-controlled' ? '#fef3c7' : '#fee2e2',
                                    borderColor: formData.controlLevel === 'well-controlled' ? '#16a34a' :
                                        formData.controlLevel === 'partly-controlled' ? '#d97706' : '#dc2626'
                                }}>
                                    <span className="font-medium" style={{
                                        color: formData.controlLevel === 'well-controlled' ? '#16a34a' :
                                            formData.controlLevel === 'partly-controlled' ? '#d97706' : '#dc2626'
                                    }}>
                                        {formData.controlLevel === 'well-controlled' && t('control.wellControlled')}
                                        {formData.controlLevel === 'partly-controlled' && t('control.partlyControlled')}
                                        {formData.controlLevel === 'poorly-controlled' && t('control.poorlyControlled')}
                                    </span>
                                    <p className="text-xs mt-1 opacity-75">
                                        Based on {[formData.nightWaking, formData.daytimeSymptoms, formData.activityLimitation, formData.relieverUse].filter(Boolean).length} selected criteria
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Submit Button */}
            <Card className="p-6 bg-green-50 border-green-200">
                <div className="text-center space-y-4">
                    <h3 className="text-lg font-semibold text-green-900">Ready to Submit?</h3>
                    <p className="text-sm text-green-700">
                        Please review all your entries above before submitting your daily health log.
                    </p>

                    <Button
                        onClick={handleSubmit}
                        disabled={!canLog || isSubmitting}
                        className="w-full max-w-md bg-green-600 hover:bg-green-700 text-white"
                        size="lg"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Submitting...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5 mr-2" />
                                Submit Health Log
                            </>
                        )}
                    </Button>

                    {!canLog && (
                        <p className="text-sm text-gray-600">
                            Daily logging limit reached. Come back tomorrow to log again.
                        </p>
                    )}
                </div>
            </Card>
        </div>
    )
}