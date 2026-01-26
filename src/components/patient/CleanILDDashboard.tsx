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
    Heart,
    Zap
} from "lucide-react"

interface CleanILDDashboardProps {
    patientId: string
}

export default function CleanILDDashboard({ patientId }: CleanILDDashboardProps) {
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
        spo2OnExertion: 90,
        mMRCScale: 1,

        // ILD Specific
        spo2BaselineDrop: 0,
        dryCoughSeverity: 3,
        breathlessnessChange: 'stable' as 'better' | 'stable' | 'worse',
        newChestPain: false,
        hemoptysis: false,
        fibroticProgression: false,

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
                ildData,
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
                <h1 className="text-2xl font-bold text-gray-900 mb-2">ILD Dashboard</h1>
                <p className="text-gray-600">Interstitial Lung Disease Monitoring</p>
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
                            <h4 className="font-medium mb-3">Side Effects (if any)</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {['Nausea', 'Diarrhea', 'Skin rash', 'Fatigue', 'Loss of appetite', 'Weight loss'].map((effect) => (
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