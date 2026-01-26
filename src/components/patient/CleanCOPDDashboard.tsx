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
    MapPin
} from "lucide-react"

interface CleanCOPDDashboardProps {
    patientId: string
}

export default function CleanCOPDDashboard({ patientId }: CleanCOPDDashboardProps) {
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
            { name: 'Salbutamol Inhaler', taken: false },
            { name: 'Tiotropium', taken: false },
            { name: 'Budesonide/Formoterol', taken: false }
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
            const result = await createDailyLog(
                patientId,
                'COPD',
                commonData,
                copdData,
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
                <h1 className="text-2xl font-bold text-gray-900 mb-2">COPD Dashboard</h1>
                <p className="text-gray-600">Chronic Obstructive Pulmonary Disease Monitoring</p>
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
            <Card className="p-6 border-0 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Wind className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Air Quality Index</h3>
                            <p className="text-sm text-gray-500">Real-time environmental data</p>
                        </div>
                    </div>
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
                        className="text-gray-600 hover:text-gray-900"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${aqiLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {aqiLoading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                        <p className="text-sm text-gray-600">Loading air quality data...</p>
                    </div>
                ) : aqiData ? (
                    <div>
                        {/* Location info message */}
                        {aqiData.location.includes('Estimated') && (
                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-blue-600 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="text-blue-800 font-medium">Using estimated location data</p>
                                        <p className="text-blue-600 mt-1">
                                            For more accurate air quality data, you can allow location access when prompted by your browser.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6">
                                <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10"
                                    style={{ backgroundColor: getAQIColor(aqiData.aqi) }}></div>
                                <div className="relative">
                                    <div className="text-3xl font-bold text-gray-900 mb-2">
                                        {aqiData.aqi}
                                    </div>
                                    <div className="text-sm font-medium text-gray-700 mb-1">{aqiData.category}</div>
                                    <div className="flex items-center text-xs text-gray-500">
                                        <MapPin className="w-3 h-3 mr-1" />
                                        {aqiData.location}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                                <div className="text-2xl font-bold text-gray-900 mb-2">{aqiData.pm25}</div>
                                <div className="text-sm font-medium text-gray-700 mb-1">PM2.5</div>
                                <div className="text-xs text-gray-500">μg/m³</div>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                                <div className="text-2xl font-bold text-gray-900 mb-2">{aqiData.pm10}</div>
                                <div className="text-sm font-medium text-gray-700 mb-1">PM10</div>
                                <div className="text-xs text-gray-500">μg/m³</div>
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
            </Card>

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
            <Card className="border-0 shadow-sm bg-white">
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
                                Submitting...
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
            </Card>
        </div>
    )
}