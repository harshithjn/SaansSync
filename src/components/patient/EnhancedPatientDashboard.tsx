"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AQIData } from "@/lib/monitoring-types"
import { initializePatientAQI, getAQIColor, shouldAlertForAQI, getAQIHealthAdvice, forceRefreshAQI } from "@/lib/aqi-service"
import { canLogToday, getRemainingLogsToday, createDailyLog } from "@/lib/patient-logging"
import { scheduleDailyReminder } from "@/lib/patient-logging"
import { 
    MapPin, 
    Wind, 
    AlertTriangle, 
    Plus, 
    Calendar, 
    Clock,
    Thermometer,
    Activity,
    Heart,
    Droplets,
    Pill,
    FileText,
    TrendingUp,
    Bell
} from "lucide-react"

interface EnhancedPatientDashboardProps {
    patientId: string
    diseaseType: string
    patientData: any
}

export default function EnhancedPatientDashboard({ 
    patientId, 
    diseaseType, 
    patientData 
}: EnhancedPatientDashboardProps) {
    const [aqiData, setAqiData] = useState<AQIData | null>(null)
    const [aqiLoading, setAqiLoading] = useState(true)
    const [canLogMore, setCanLogMore] = useState(true)
    const [remainingLogs, setRemainingLogs] = useState(2)
    const [showLocationPermission, setShowLocationPermission] = useState(false)
    const [currentLog, setCurrentLog] = useState<any>({})
    const [isLogging, setIsLogging] = useState(false)

    useEffect(() => {
        initializePatientDashboard()
        checkLoggingStatus()
        scheduleDailyReminder(patientId)
    }, [patientId])

    const initializePatientDashboard = async () => {
        try {
            setAqiLoading(true)
            
            // Clear old cache to get fresh data with new API token
            localStorage.removeItem('aqi_cache_data')
            
            // Check if location permission was previously granted
            const hasLocationPermission = localStorage.getItem('location_permission_granted')
            
            if (!hasLocationPermission) {
                setShowLocationPermission(true)
            }
            
            // Initialize AQI data with real API
            console.log('Initializing AQI with real API token...')
            const aqi = await initializePatientAQI(patientId, true) // Force refresh
            console.log('AQI initialized:', aqi)
            setAqiData(aqi)
            
        } catch (error) {
            console.error('Error initializing patient dashboard:', error)
        } finally {
            setAqiLoading(false)
        }
    }

    const checkLoggingStatus = () => {
        const canLog = canLogToday(patientId)
        const remaining = getRemainingLogsToday(patientId)
        
        setCanLogMore(canLog)
        setRemainingLogs(remaining)
    }

    const handleLocationPermission = async (granted: boolean) => {
        if (granted) {
            localStorage.setItem('location_permission_granted', 'true')
            const aqi = await initializePatientAQI(patientId)
            setAqiData(aqi)
        } else {
            localStorage.setItem('location_permission_granted', 'false')
        }
        setShowLocationPermission(false)
    }

    const handleCreateLog = async () => {
        if (!canLogMore) return

        setIsLogging(true)
        try {
            const result = await createDailyLog(
                patientId,
                diseaseType as any,
                currentLog.commonData || {},
                currentLog.diseaseSpecificData || {},
                'doctor@gmail.com' // In production, get from session
            )

            if (result.success) {
                if (result.alert) {
                    alert(`Alert Created: ${result.alert.message}`)
                }
                
                // Reset form and update status
                setCurrentLog({})
                checkLoggingStatus()
                
                // Show success message
                alert('Health log created successfully!')
            } else {
                alert(`Error: ${result.error}`)
            }
        } catch (error) {
            console.error('Error creating log:', error)
            alert('Failed to create health log')
        } finally {
            setIsLogging(false)
        }
    }

    const getAQIAlertBanner = () => {
        if (!aqiData || !shouldAlertForAQI(aqiData.aqi)) return null

        return (
            <Card className="p-4 border-red-200 bg-red-50 mb-6">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-red-900">☢️ Air quality is hazardous</h3>
                        <p className="text-sm text-red-700 mt-1">
                            Take precautions - {getAQIHealthAdvice(aqiData.aqi, diseaseType)}
                        </p>
                    </div>
                </div>
            </Card>
        )
    }

    if (showLocationPermission) {
        return (
            <Card className="p-8 text-center max-w-md mx-auto mt-8">
                <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Location Permission</h3>
                <p className="text-gray-600 mb-6">
                    We need your location to show air quality around you. This helps monitor environmental factors that may affect your respiratory health.
                </p>
                <div className="flex gap-3 justify-center">
                    <Button onClick={() => handleLocationPermission(true)}>
                        Allow Location
                    </Button>
                    <Button variant="outline" onClick={() => handleLocationPermission(false)}>
                        Skip for Now
                    </Button>
                </div>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* AQI Alert Banner */}
            {getAQIAlertBanner()}

            {/* AQI Display */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Wind className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold">Air Quality</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        {aqiData && (
                            <Badge 
                                style={{ backgroundColor: getAQIColor(aqiData.aqi) }}
                                className="text-white"
                            >
                                {aqiData.category}
                            </Badge>
                        )}
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
                            🔄 Refresh
                        </Button>
                    </div>
                </div>

                {aqiLoading ? (
                    <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Loading air quality data...</p>
                    </div>
                ) : aqiData ? (
                    <div className="space-y-3">
                        <div className="text-center">
                            <div className="text-3xl font-bold mb-1" style={{ color: getAQIColor(aqiData.aqi) }}>
                                AQI: {aqiData.aqi}
                            </div>
                            <div className="text-sm text-gray-600">
                                PM2.5: {aqiData.pm25} µg/m³ | PM10: {aqiData.pm10} µg/m³
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{aqiData.location}</span>
                        </div>
                        
                        <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                            {aqiData.healthImplications}
                        </div>
                        
                        <div className="text-xs text-gray-500 text-center">
                            Last updated: {new Date(aqiData.fetchedAt).toLocaleString()}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-4 text-gray-600">
                        Unable to load air quality data
                    </div>
                )}
            </Card>

            {/* Daily Logging Status */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-green-600" />
                        <h3 className="text-lg font-semibold">Daily Health Log</h3>
                    </div>
                    <Badge variant={canLogMore ? "default" : "secondary"}>
                        {remainingLogs} logs remaining today
                    </Badge>
                </div>

                {canLogMore ? (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            You can log your health status up to 2 times per day. Your worst log will be used for analysis.
                        </p>
                        
                        <Button 
                            onClick={handleCreateLog}
                            disabled={isLogging}
                            className="w-full"
                        >
                            {isLogging ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Creating Log...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Health Log
                                </>
                            )}
                        </Button>
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">Daily logging limit reached</p>
                        <p className="text-sm text-gray-500">Come back tomorrow to log again</p>
                    </div>
                )}
            </Card>

            {/* Disease-Specific Dashboard */}
            <Tabs defaultValue="vitals" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="vitals">Vitals</TabsTrigger>
                    <TabsTrigger value="symptoms">Symptoms</TabsTrigger>
                    <TabsTrigger value="medications">Medications</TabsTrigger>
                    <TabsTrigger value="trends">Trends</TabsTrigger>
                </TabsList>

                <TabsContent value="vitals" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* SpO2 Card */}
                        <Card className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Activity className="w-5 h-5 text-blue-600" />
                                <h4 className="font-semibold">Oxygen Saturation</h4>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">At Rest:</span>
                                    <span className="font-medium">98%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">On Exertion:</span>
                                    <span className="font-medium">95%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Target:</span>
                                    <span className="font-medium text-green-600">≥95%</span>
                                </div>
                            </div>
                        </Card>

                        {/* Heart Rate Card */}
                        <Card className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Heart className="w-5 h-5 text-red-600" />
                                <h4 className="font-semibold">Heart Rate</h4>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Resting:</span>
                                    <span className="font-medium">72 bpm</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Max Today:</span>
                                    <span className="font-medium">95 bpm</span>
                                </div>
                            </div>
                        </Card>

                        {/* Temperature Card */}
                        <Card className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Thermometer className="w-5 h-5 text-orange-600" />
                                <h4 className="font-semibold">Temperature</h4>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold">98.6°F</div>
                                <div className="text-sm text-gray-600">Normal</div>
                            </div>
                        </Card>

                        {/* Respiratory Rate Card */}
                        <Card className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Wind className="w-5 h-5 text-teal-600" />
                                <h4 className="font-semibold">Respiratory Rate</h4>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold">16</div>
                                <div className="text-sm text-gray-600">breaths/min</div>
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="symptoms" className="space-y-4">
                    <Card className="p-6">
                        <h4 className="font-semibold mb-4">Symptom Tracking (VAS Scale 0-10)</h4>
                        <div className="space-y-4">
                            {['Breathlessness', 'Cough', 'Chest Tightness', 'Fatigue', 'Wheezing'].map((symptom) => (
                                <div key={symptom} className="space-y-2">
                                    <div className="flex justify-between">
                                        <label className="text-sm font-medium">{symptom}</label>
                                        <span className="text-sm text-gray-600">3 (prev: 2)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">0</span>
                                        <div className="flex-1 h-2 bg-gray-200 rounded-full">
                                            <div className="h-2 bg-yellow-500 rounded-full" style={{ width: '30%' }}></div>
                                        </div>
                                        <span className="text-xs text-gray-500">10</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="medications" className="space-y-4">
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold">Today's Medications</h4>
                            <Badge variant="outline">3 of 4 taken</Badge>
                        </div>
                        
                        <div className="space-y-3">
                            {[
                                { name: 'Salbutamol Inhaler', dose: '2 puffs', time: '8:00 AM', taken: true },
                                { name: 'Budesonide', dose: '200mcg', time: '8:00 AM', taken: true },
                                { name: 'Montelukast', dose: '10mg', time: '8:00 PM', taken: true },
                                { name: 'Salbutamol Inhaler', dose: '2 puffs', time: '8:00 PM', taken: false }
                            ].map((med, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                    <div className="flex items-center gap-3">
                                        <Pill className={`w-4 h-4 ${med.taken ? 'text-green-600' : 'text-gray-400'}`} />
                                        <div>
                                            <div className="font-medium">{med.name}</div>
                                            <div className="text-sm text-gray-600">{med.dose} at {med.time}</div>
                                        </div>
                                    </div>
                                    <Badge variant={med.taken ? "default" : "outline"}>
                                        {med.taken ? 'Taken' : 'Pending'}
                                    </Badge>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 p-3 bg-blue-50 rounded">
                            <h5 className="font-medium text-blue-900 mb-2">Side Effects</h5>
                            <div className="flex flex-wrap gap-2">
                                {['Dry mouth', 'Headache', 'Nausea'].map((effect) => (
                                    <Badge key={effect} variant="outline" className="text-xs">
                                        {effect}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="trends" className="space-y-4">
                    <Card className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                            <h4 className="font-semibold">Health Trends</h4>
                        </div>
                        
                        <div className="text-center py-8 text-gray-600">
                            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p>Trend analysis will appear here</p>
                            <p className="text-sm">Log more data to see patterns</p>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Daily Reminder Notification */}
            <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                        <h4 className="font-medium text-blue-900">Daily Reminder Set</h4>
                        <p className="text-sm text-blue-700">
                            You'll receive a gentle reminder at 8:00 PM to log your health status
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    )
}