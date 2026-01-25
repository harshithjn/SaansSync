"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AsthmaData } from "@/lib/monitoring-types"
import { calculateAsthmaControl } from "@/lib/red-flag-scoring"
import { AlertTriangle, Wind, Activity, TrendingUp } from "lucide-react"

interface AsthmaSpecificDashboardProps {
    patientId: string
    onDataUpdate?: (data: AsthmaData) => void
}

export default function AsthmaSpecificDashboard({ 
    patientId, 
    onDataUpdate 
}: AsthmaSpecificDashboardProps) {
    const [asthmaData, setAsthmaData] = useState<AsthmaData>({
        patientId,
        logDate: new Date().toISOString().split('T')[0],
        // Asthma Control (Last 4 Weeks)
        daytimeSymptoms: false,
        nightWaking: false,
        relieverUse: false,
        activityLimitation: false,
        controlLevel: 'well-controlled',
        // Daily Tracking
        rescueInhalerPuffs: 0,
        peakFlow: 0,
        peakFlowPercent: 100
    })

    const [currentPuffs, setCurrentPuffs] = useState("")
    const [currentPeakFlow, setCurrentPeakFlow] = useState("")
    const [personalBest, setPersonalBest] = useState("500") // Default personal best

    useEffect(() => {
        loadAsthmaData()
    }, [patientId])

    const loadAsthmaData = () => {
        const stored = localStorage.getItem(`asthma_data_${patientId}`)
        if (stored) {
            const parsedData = JSON.parse(stored)
            setAsthmaData(parsedData)
            setCurrentPuffs(parsedData.rescueInhalerPuffs.toString())
            setCurrentPeakFlow(parsedData.peakFlow.toString())
        }
    }

    const saveAsthmaData = (data: AsthmaData) => {
        localStorage.setItem(`asthma_data_${patientId}`, JSON.stringify(data))
        if (onDataUpdate) {
            onDataUpdate(data)
        }
    }

    const updateControlQuestion = (field: keyof AsthmaData, value: boolean) => {
        const updatedData = {
            ...asthmaData,
            [field]: value
        }
        
        // Recalculate control level
        updatedData.controlLevel = calculateAsthmaControl(updatedData)
        
        setAsthmaData(updatedData)
        saveAsthmaData(updatedData)
    }

    const updateDailyTracking = () => {
        const puffs = parseInt(currentPuffs) || 0
        const peakFlowValue = parseInt(currentPeakFlow) || 0
        const personalBestValue = parseInt(personalBest) || 500
        const peakFlowPercent = personalBestValue > 0 ? Math.round((peakFlowValue / personalBestValue) * 100) : 0

        const updatedData = {
            ...asthmaData,
            rescueInhalerPuffs: puffs,
            peakFlow: peakFlowValue,
            peakFlowPercent,
            logDate: new Date().toISOString().split('T')[0]
        }

        setAsthmaData(updatedData)
        saveAsthmaData(updatedData)
    }

    const getControlLevelColor = (level: string) => {
        switch (level) {
            case 'well-controlled':
                return 'bg-green-100 text-green-800 border-green-200'
            case 'partly-controlled':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'uncontrolled':
                return 'bg-red-100 text-red-800 border-red-200'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const getPeakFlowColor = (percent: number) => {
        if (percent >= 80) return 'text-green-600'
        if (percent >= 60) return 'text-yellow-600'
        return 'text-red-600'
    }

    const getRescueInhalerAlert = (puffs: number) => {
        if (puffs > 4) return { show: true, level: 'critical', message: 'Critical: >4 puffs in 24 hours' }
        if (puffs > 2) return { show: true, level: 'warning', message: 'Warning: Increased rescue inhaler use' }
        return { show: false, level: 'normal', message: '' }
    }

    const rescueAlert = getRescueInhalerAlert(asthmaData.rescueInhalerPuffs)

    return (
        <div className="space-y-6">
            {/* Asthma Control Assessment */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Wind className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">Asthma Control (Last 4 Weeks)</h3>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <span className="text-sm">Daytime symptoms {'>'}2/week?</span>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant={asthmaData.daytimeSymptoms ? "default" : "outline"}
                                        onClick={() => updateControlQuestion('daytimeSymptoms', true)}
                                    >
                                        Yes
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={!asthmaData.daytimeSymptoms ? "default" : "outline"}
                                        onClick={() => updateControlQuestion('daytimeSymptoms', false)}
                                    >
                                        No
                                    </Button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <span className="text-sm">Night waking due to asthma?</span>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant={asthmaData.nightWaking ? "default" : "outline"}
                                        onClick={() => updateControlQuestion('nightWaking', true)}
                                    >
                                        Yes
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={!asthmaData.nightWaking ? "default" : "outline"}
                                        onClick={() => updateControlQuestion('nightWaking', false)}
                                    >
                                        No
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <span className="text-sm">Reliever use {'>'}2/week?</span>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant={asthmaData.relieverUse ? "default" : "outline"}
                                        onClick={() => updateControlQuestion('relieverUse', true)}
                                    >
                                        Yes
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={!asthmaData.relieverUse ? "default" : "outline"}
                                        onClick={() => updateControlQuestion('relieverUse', false)}
                                    >
                                        No
                                    </Button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <span className="text-sm">Activity limitation?</span>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant={asthmaData.activityLimitation ? "default" : "outline"}
                                        onClick={() => updateControlQuestion('activityLimitation', true)}
                                    >
                                        Yes
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={!asthmaData.activityLimitation ? "default" : "outline"}
                                        onClick={() => updateControlQuestion('activityLimitation', false)}
                                    >
                                        No
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Control Level Result */}
                    <div className="mt-6 p-4 rounded-lg border-2" style={{ 
                        backgroundColor: getControlLevelColor(asthmaData.controlLevel).includes('green') ? '#f0fdf4' :
                                        getControlLevelColor(asthmaData.controlLevel).includes('yellow') ? '#fffbeb' : '#fef2f2'
                    }}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold text-lg">Asthma Control Level</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    Based on your responses over the last 4 weeks
                                </p>
                            </div>
                            <Badge className={`text-lg px-4 py-2 ${getControlLevelColor(asthmaData.controlLevel)}`}>
                                {asthmaData.controlLevel.replace('-', ' ').toUpperCase()}
                            </Badge>
                        </div>

                        {asthmaData.controlLevel === 'uncontrolled' && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-600" />
                                    <span className="text-red-800 font-medium">Doctor Alert Triggered</span>
                                </div>
                                <p className="text-sm text-red-700 mt-1">
                                    Your asthma is uncontrolled. Please contact your healthcare provider for medication adjustment.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* Daily Tracking */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold">Daily Tracking</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Rescue Inhaler */}
                    <div className="space-y-3">
                        <h4 className="font-medium">Rescue Inhaler Puffs (Today)</h4>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                min="0"
                                max="20"
                                value={currentPuffs}
                                onChange={(e) => setCurrentPuffs(e.target.value)}
                                placeholder="Number of puffs"
                                className="flex-1"
                            />
                            <span className="text-sm text-gray-600">puffs</span>
                        </div>
                        
                        {rescueAlert.show && (
                            <div className={`p-3 rounded-lg border ${
                                rescueAlert.level === 'critical' 
                                    ? 'bg-red-50 border-red-200 text-red-800' 
                                    : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                            }`}>
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="font-medium">{rescueAlert.message}</span>
                                </div>
                            </div>
                        )}

                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-3xl font-bold text-gray-900">
                                {asthmaData.rescueInhalerPuffs}
                            </div>
                            <div className="text-sm text-gray-600">Puffs Today</div>
                        </div>
                    </div>

                    {/* Peak Flow */}
                    <div className="space-y-3">
                        <h4 className="font-medium">Peak Flow (PEFR)</h4>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min="0"
                                    max="800"
                                    value={currentPeakFlow}
                                    onChange={(e) => setCurrentPeakFlow(e.target.value)}
                                    placeholder="Current reading"
                                    className="flex-1"
                                />
                                <span className="text-sm text-gray-600">L/min</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min="0"
                                    max="800"
                                    value={personalBest}
                                    onChange={(e) => setPersonalBest(e.target.value)}
                                    placeholder="Personal best"
                                    className="flex-1"
                                />
                                <span className="text-sm text-gray-600">Personal best</span>
                            </div>
                        </div>

                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className={`text-3xl font-bold ${getPeakFlowColor(asthmaData.peakFlowPercent || 0)}`}>
                                {asthmaData.peakFlowPercent || 0}%
                            </div>
                            <div className="text-sm text-gray-600">of Personal Best</div>
                            <div className="text-xs text-gray-500 mt-1">
                                {asthmaData.peakFlow} L/min
                            </div>
                        </div>

                        {asthmaData.peakFlowPercent && asthmaData.peakFlowPercent < 60 && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-600" />
                                    <span className="text-red-800 font-medium">Critical Alert</span>
                                </div>
                                <p className="text-sm text-red-700 mt-1">
                                    Peak flow &lt;60% of personal best. Seek immediate medical attention.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6">
                    <Button onClick={updateDailyTracking} className="w-full">
                        Update Daily Tracking
                    </Button>
                </div>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                    <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                        {asthmaData.controlLevel === 'well-controlled' ? '✓' : 
                         asthmaData.controlLevel === 'partly-controlled' ? '~' : '✗'}
                    </div>
                    <div className="text-sm text-gray-600">Control Status</div>
                </Card>

                <Card className="p-4 text-center">
                    <Wind className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                        {asthmaData.peakFlowPercent || 0}%
                    </div>
                    <div className="text-sm text-gray-600">Peak Flow</div>
                </Card>

                <Card className="p-4 text-center">
                    <Activity className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                        {asthmaData.rescueInhalerPuffs}
                    </div>
                    <div className="text-sm text-gray-600">Rescue Puffs</div>
                </Card>
            </div>
        </div>
    )
}