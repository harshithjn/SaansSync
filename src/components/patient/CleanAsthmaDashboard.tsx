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
import { createDailyLog, canLogToday, getRemainingLogsToday } from "@/lib/patient-logging"
import { calculateRedFlagScore } from "@/lib/red-flag-scoring"
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
    Zap
} from "lucide-react"

interface CleanAsthmaDashboardProps {
    patientId: string
}

export default function CleanAsthmaDashboard({ patientId }: CleanAsthmaDashboardProps) {
    // AQI State
    const [aqiData, setAqiData] = useState<any>(null)
    const [aqiLoading, setAqiLoading] = useState(true)

    // Logging State
    const [canLog, setCanLog] = useState(true)
    const [remainingLogs, setRemainingLogs] = useState(2)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form Data
    const [formData, setFormData] = useState({
        // Common Data
        spo2AtRest: 98,
        spo2OnExertion: 95,
        mMRCScale: 0,

        // Asthma Specific
        peakFlowPercent: 85,
        nightWaking: false,
        rescueInhalerPuffs: 0,
        daytimeSymptoms: false,
        relieverUse: false,
        activityLimitation: false,
        controlLevel: 'well-controlled' as 'well-controlled' | 'partly-controlled' | 'uncontrolled',

        // Symptoms VAS
        breathlessness: 2,
        cough: 1,
        chestTightness: 1,
        wheezing: 2,

        // Medications
        medications: [
            { name: 'Salbutamol Inhaler (Rescue)', taken: false },
            { name: 'Budesonide/Formoterol', taken: false },
            { name: 'Montelukast', taken: false }
        ],

        // Side Effects
        sideEffects: [] as string[],
        customSideEffect: ''
    })

    useEffect(() => {
        initializeDashboard()
        checkLoggingStatus()
    }, [patientId])

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

    const checkLoggingStatus = () => {
        setCanLog(canLogToday(patientId))
        setRemainingLogs(getRemainingLogsToday(patientId))
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
                ]
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

            // Create daily log
            const result = await createDailyLog(
                patientId,
                'Asthma',
                commonData,
                asthmaData,
                'doctor@gmail.com' // In production, get from session
            )

            if (result.success) {
                // Show success message
                alert('Health log submitted successfully!')

                // Show alert if created
                if (result.alert) {
                    alert(`Alert Generated: ${result.alert.message}`)
                }

                // Update logging status
                checkLoggingStatus()

                // Reset form or redirect
                // resetForm()
            } else {
                alert(`Error: ${result.error}`)
            }
        } catch (error) {
            console.error('Error submitting log:', error)
            alert('Failed to submit health log')
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
            {/* Header */}
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Asthma Dashboard</h1>
                <p className="text-gray-600">Bronchial Asthma Monitoring</p>
                <Badge variant="outline" className="mt-2">
                    Patient ID: {patientId}
                </Badge>
            </div>

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
                                { key: 'wheezing', label: 'Wheezing', icon: Zap }
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
                            {formData.medications.map((med, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="font-medium">{med.name}</span>
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
                                            checked={formData.sideEffects.includes(effect)}
                                            onCheckedChange={(checked) => handleSideEffectChange(effect, checked as boolean)}
                                        />
                                        <span className="text-sm">{effect}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="asthma-specific" className="space-y-4">
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
                                <label className="text-sm font-medium mb-2 block">Current Control Level</label>
                                <Select value={formData.controlLevel} onValueChange={(value: any) => setFormData(prev => ({ ...prev, controlLevel: value }))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="well-controlled">Well Controlled</SelectItem>
                                        <SelectItem value="partly-controlled">Partly Controlled</SelectItem>
                                        <SelectItem value="uncontrolled">Uncontrolled</SelectItem>
                                    </SelectContent>
                                </Select>
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