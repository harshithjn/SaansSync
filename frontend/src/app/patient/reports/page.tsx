"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthSession } from "@/lib/auth-types"
import { getStoredSession } from "@/lib/auth-utils"
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
    BarChart3
} from "lucide-react"

interface DailyLog {
    id: string
    log_date: string
    spo2_at_rest: number
    spo2_on_exertion: number
    mmrc_scale: number
    red_flag_score: number
    disease_data: any
    symptoms: any
    created_at: string
}

export default function PatientReportsPage() {
    const router = useRouter()
    const [session, setSession] = useState<AuthSession | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([])
    const [medications, setMedications] = useState<any[]>([])
    const [patientData, setPatientData] = useState<any>(null)

    useEffect(() => {
        const initializePage = async () => {
            const storedSession = getStoredSession()
            if (!storedSession || storedSession.role !== "PATIENT") {
                router.push("/patient/login")
                return
            }

            setSession(storedSession)

            try {
                // Load patient data
                const [logs, meds, profile] = await Promise.all([
                    getPatientDailyLogs(storedSession.patientId),
                    getPatientMedications(storedSession.patientId),
                    getPatientProfile(storedSession.patientId)
                ])

                setDailyLogs(logs)
                setMedications(meds)
                setPatientData(profile)
                
                console.log('Loaded patient data:', {
                    logs: logs.length,
                    medications: meds.length,
                    profile: profile?.fullName
                })
            } catch (error) {
                console.error('Error loading patient data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        initializePage()
    }, [router])

    const getRedFlagColor = (score: number) => {
        if (score >= 9) return 'bg-red-500 text-white'
        if (score >= 7) return 'bg-red-400 text-white'
        if (score >= 4) return 'bg-yellow-500 text-white'
        return 'bg-green-500 text-white'
    }

    const getRedFlagLabel = (score: number) => {
        if (score >= 9) return 'Critical'
        if (score >= 7) return 'High Risk'
        if (score >= 4) return 'Warning'
        return 'Normal'
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your health reports...</p>
                </div>
            </div>
        )
    }

    if (!session) {
        return null
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Health Reports</h1>
                            <p className="text-gray-600">
                                {patientData?.fullName || 'Patient'} • {patientData?.diagnosis?.primaryCategory || session.primaryDiagnosisCategory}
                            </p>
                        </div>
                        <Button 
                            variant="outline" 
                            onClick={() => router.back()}
                            className="gap-2"
                        >
                            <FileText className="w-4 h-4" />
                            Back to Dashboard
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="history" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="history" className="gap-2">
                            <Calendar className="w-4 h-4" />
                            History
                        </TabsTrigger>
                        <TabsTrigger value="trends" className="gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Trends
                        </TabsTrigger>
                        <TabsTrigger value="medications" className="gap-2">
                            <Pill className="w-4 h-4" />
                            Medications
                        </TabsTrigger>
                    </TabsList>

                    {/* History Tab */}
                    <TabsContent value="history" className="space-y-4">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Activity className="w-5 h-5" />
                                Daily Health Logs ({dailyLogs.length} entries)
                            </h3>
                            
                            {dailyLogs.length === 0 ? (
                                <div className="text-center py-8">
                                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">No health logs found</p>
                                    <p className="text-sm text-gray-400">Start logging your daily health data to see trends</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {dailyLogs.map((log) => (
                                        <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-sm font-medium">
                                                        {formatDate(log.log_date)}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {formatTime(log.created_at)}
                                                    </div>
                                                </div>
                                                <Badge className={getRedFlagColor(log.red_flag_score)}>
                                                    {getRedFlagLabel(log.red_flag_score)} ({log.red_flag_score}/10)
                                                </Badge>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Heart className="w-4 h-4 text-red-500" />
                                                    <span>SpO₂ Rest: {log.spo2_at_rest}%</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Activity className="w-4 h-4 text-blue-500" />
                                                    <span>SpO₂ Exertion: {log.spo2_on_exertion}%</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Thermometer className="w-4 h-4 text-green-500" />
                                                    <span>mMRC: {log.mmrc_scale}/4</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {log.red_flag_score >= 4 ? (
                                                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                                    ) : (
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                    )}
                                                    <span>Score: {log.red_flag_score}/10</span>
                                                </div>
                                            </div>

                                            {/* Disease-specific data */}
                                            {log.disease_data && Object.keys(log.disease_data).length > 0 && (
                                                <div className="mt-3 pt-3 border-t">
                                                    <div className="text-xs text-gray-600 mb-2">Disease-specific data:</div>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                                        {Object.entries(log.disease_data).map(([key, value]) => (
                                                            <div key={key} className="bg-gray-100 px-2 py-1 rounded">
                                                                <span className="font-medium">{key}:</span> {String(value)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </TabsContent>

                    {/* Trends Tab */}
                    <TabsContent value="trends" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* SpO2 Trends */}
                            <Card className="p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-blue-500" />
                                    SpO₂ Trends
                                </h3>
                                {dailyLogs.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-blue-600">
                                                    {Math.round(dailyLogs.reduce((sum, log) => sum + (log.spo2_at_rest || 0), 0) / dailyLogs.length)}%
                                                </div>
                                                <div className="text-sm text-gray-600">Average SpO₂ at Rest</div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <div className="font-medium">Latest</div>
                                                <div className="text-blue-600">{dailyLogs[0]?.spo2_at_rest}%</div>
                                            </div>
                                            <div>
                                                <div className="font-medium">Trend</div>
                                                <div className="flex items-center gap-1 text-green-600">
                                                    <TrendingUp className="w-3 h-3" />
                                                    Stable
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        No data available for trends
                                    </div>
                                )}
                            </Card>

                            {/* Red Flag Score Trends */}
                            <Card className="p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                    Risk Score Trends
                                </h3>
                                {dailyLogs.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                                            <div className="text-center">
                                                <div className={`text-2xl font-bold ${
                                                    dailyLogs[0]?.red_flag_score >= 7 ? 'text-red-600' :
                                                    dailyLogs[0]?.red_flag_score >= 4 ? 'text-yellow-600' : 'text-green-600'
                                                }`}>
                                                    {dailyLogs[0]?.red_flag_score || 0}/10
                                                </div>
                                                <div className="text-sm text-gray-600">Latest Risk Score</div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <div className="font-medium">Average</div>
                                                <div className="text-gray-600">
                                                    {Math.round(dailyLogs.reduce((sum, log) => sum + (log.red_flag_score || 0), 0) / dailyLogs.length * 10) / 10}/10
                                                </div>
                                            </div>
                                            <div>
                                                <div className="font-medium">Status</div>
                                                <div className={`${
                                                    dailyLogs[0]?.red_flag_score >= 7 ? 'text-red-600' :
                                                    dailyLogs[0]?.red_flag_score >= 4 ? 'text-yellow-600' : 'text-green-600'
                                                }`}>
                                                    {getRedFlagLabel(dailyLogs[0]?.red_flag_score || 0)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        No data available for trends
                                    </div>
                                )}
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Medications Tab */}
                    <TabsContent value="medications" className="space-y-4">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Pill className="w-5 h-5" />
                                Current Medications ({medications.length} items)
                            </h3>
                            
                            {medications.length === 0 ? (
                                <div className="text-center py-8">
                                    <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">No medications found</p>
                                    <p className="text-sm text-gray-400">Your doctor will prescribe medications as needed</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {medications.map((med, index) => (
                                        <div key={med.id || index} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="font-medium text-lg">
                                                    {med.drugName === 'Other' ? med.customDrugName : med.drugName}
                                                </div>
                                                <Badge variant={med.isActive ? "default" : "secondary"}>
                                                    {med.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                                <div>
                                                    <span className="font-medium">Route:</span> {med.route}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Dose:</span> {med.dose}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Frequency:</span> {med.frequency}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Started:</span> {formatDate(med.startDate)}
                                                </div>
                                            </div>
                                            {med.endDate && (
                                                <div className="mt-2 text-sm text-gray-600">
                                                    <span className="font-medium">Ended:</span> {formatDate(med.endDate)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}