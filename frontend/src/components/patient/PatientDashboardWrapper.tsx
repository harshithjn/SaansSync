"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePatientAuth } from "@/lib/auth-guard"
import { getPatientDailyLogs, getPatientMedications, getPatientProfile } from "@/lib/database-service"
import CleanAsthmaDashboard from "./CleanAsthmaDashboard"
import CleanILDDashboard from "./CleanILDDashboard"
import CleanCOPDDashboard from "./CleanCOPDDashboard"
import CleanBronchiectasisDashboard from "./CleanBronchiectasisDashboard"
import CleanPostInfectionDashboard from "./CleanPostInfectionDashboard"
import { 
    Activity, 
    TrendingUp, 
    Calendar,
    Heart,
    Thermometer,
    AlertTriangle,
    CheckCircle,
    Pill,
    FileText,
    BarChart3,
    User,
    LogOut
} from "lucide-react"

interface PatientDashboardWrapperProps {
    diseaseType: string
}

export default function PatientDashboardWrapper({ diseaseType }: PatientDashboardWrapperProps) {
    const router = useRouter()
    const authState = usePatientAuth()
    const [isLoading, setIsLoading] = useState(true)
    const [dailyLogs, setDailyLogs] = useState<any[]>([])
    const [medications, setMedications] = useState<any[]>([])
    const [patientData, setPatientData] = useState<any>(null)
    const [activeTab, setActiveTab] = useState("entry")

    useEffect(() => {
        const initializePage = async () => {
            if (!authState.user || authState.role !== 'patient' || !authState.profile) {
                return // Will redirect via usePatientAuth
            }
            try {
                // Load patient data
                const [logs, meds, profile] = await Promise.all([
                    getPatientDailyLogs(authState.profile.id),
                    getPatientMedications(authState.profile.id),
                    getPatientProfile(authState.profile.id)
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

        if (!authState.loading) {
            initializePage()
        }
    }, [authState])

    const handleLogout = async () => {
        const { signOut } = await import('@/lib/auth-service')
        await signOut()
        router.push('/patient/login')
    }

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

    const renderDiseaseSpecificDashboard = () => {
        if (!authState.profile) return null

        const props = { patientId: authState.profile.id }

        switch (diseaseType.toLowerCase()) {
            case 'asthma':
            case 'bronchial asthma':
                return <CleanAsthmaDashboard {...props} />
            case 'ild':
            case 'interstitial lung disease (ild)':
                return <CleanILDDashboard {...props} />
            case 'copd':
            case 'copd (chronic obstructive pulmonary disease)':
                return <CleanCOPDDashboard {...props} />
            case 'bronchiectasis':
                return <CleanBronchiectasisDashboard {...props} />
            case 'post-infection':
            case 'post icu recovery':
                return <CleanPostInfectionDashboard {...props} />
            default:
                return <CleanAsthmaDashboard {...props} />
        }
    }

    if (authState.loading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your dashboard...</p>
                </div>
            </div>
        )
    }

    if (!authState.user || authState.role !== 'patient' || !authState.profile) {
        return null // Will redirect via usePatientAuth
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-4 py-3">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="font-semibold text-gray-900">
                                {patientData?.fullName || authState.profile?.full_name || 'Patient'}
                            </h1>
                            <p className="text-sm text-gray-600">
                                Diagnosis: {patientData?.diagnosis?.primaryCategory || authState.profile?.patient_data?.diagnosis?.primaryCategory || 'Health Monitoring'}
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={handleLogout} className="gap-2">
                        <LogOut className="w-4 h-4" />
                        Logout
                    </Button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="entry" className="gap-2">
                            <FileText className="w-4 h-4" />
                            Entry
                        </TabsTrigger>
                        <TabsTrigger value="history" className="gap-2">
                            <Calendar className="w-4 h-4" />
                            History
                        </TabsTrigger>
                        <TabsTrigger value="trends" className="gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Trends
                        </TabsTrigger>
                    </TabsList>

                    {/* Entry Tab - Disease-specific dashboard */}
                    <TabsContent value="entry" className="space-y-4">
                        {renderDiseaseSpecificDashboard()}
                    </TabsContent>

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
                                    <p className="text-gray-500">No history found</p>
                                    <p className="text-sm text-gray-400">Start logging your daily health data to see your history</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {dailyLogs.slice(0, 10).map((log) => (
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
                                        </div>
                                    ))}
                                    
                                    {dailyLogs.length > 10 && (
                                        <div className="text-center">
                                            <Button 
                                                variant="outline" 
                                                onClick={() => router.push('/patient/reports')}
                                                className="gap-2"
                                            >
                                                <FileText className="w-4 h-4" />
                                                View All History
                                            </Button>
                                        </div>
                                    )}
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
                                                <div className="font-medium">Entries</div>
                                                <div className="text-gray-600">{dailyLogs.length} logs</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        No data available for trends
                                    </div>
                                )}
                            </Card>

                            {/* Risk Score Trends */}
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

                            {/* Medications Summary */}
                            <Card className="p-6 md:col-span-2">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Pill className="w-5 h-5" />
                                    Current Medications ({medications.length} items)
                                </h3>
                                
                                {medications.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">No medications prescribed</p>
                                        <p className="text-sm text-gray-400">Your doctor will prescribe medications as needed</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {medications.slice(0, 4).map((med, index) => (
                                            <div key={med.id || index} className="border rounded-lg p-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="font-medium">
                                                        {med.drugName === 'Other' ? med.customDrugName : med.drugName}
                                                    </div>
                                                    <Badge variant={med.isActive ? "default" : "secondary"} className="text-xs">
                                                        {med.isActive ? "Active" : "Inactive"}
                                                    </Badge>
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {med.dose} • {med.frequency} • {med.route}
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {medications.length > 4 && (
                                            <div className="md:col-span-2 text-center">
                                                <Button 
                                                    variant="outline" 
                                                    onClick={() => router.push('/patient/medications')}
                                                    className="gap-2"
                                                >
                                                    <Pill className="w-4 h-4" />
                                                    View All Medications
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}