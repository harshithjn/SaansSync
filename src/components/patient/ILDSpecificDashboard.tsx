"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ILDData } from "@/lib/monitoring-types"
import { AlertTriangle, Wind, Activity, TrendingDown, Heart } from "lucide-react"

interface ILDSpecificDashboardProps {
    patientId: string
    onDataUpdate?: (data: ILDData) => void
}

export default function ILDSpecificDashboard({ 
    patientId, 
    onDataUpdate 
}: ILDSpecificDashboardProps) {
    const [ildData, setILDData] = useState<ILDData>({
        patientId,
        logDate: new Date().toISOString().split('T')[0],
        // Fibrosis & Progression Monitor
        breathlessnessChange: 'same',
        dryCoughSeverity: 1,
        fatigueLevel: 1,
        // Oxygen Dependency
        restOxygen: 0,
        exertionalOxygen: 0,
        oxygenIncrease: false,
        // Red Flags
        newChestPain: false,
        suddenSpo2Drop: false,
        spo2BaselineDrop: 0
    })

    const [currentRestOxygen, setCurrentRestOxygen] = useState("")
    const [currentExertionalOxygen, setCurrentExertionalOxygen] = useState("")
    const [currentSpo2Drop, setCurrentSpo2Drop] = useState("")

    useEffect(() => {
        loadILDData()
    }, [patientId])

    const loadILDData = () => {
        const stored = localStorage.getItem(`ild_data_${patientId}`)
        if (stored) {
            const parsedData = JSON.parse(stored)
            setILDData(parsedData)
            setCurrentRestOxygen(parsedData.restOxygen.toString())
            setCurrentExertionalOxygen(parsedData.exertionalOxygen.toString())
            setCurrentSpo2Drop(parsedData.spo2BaselineDrop.toString())
        }
    }

    const saveILDData = (data: ILDData) => {
        localStorage.setItem(`ild_data_${patientId}`, JSON.stringify(data))
        if (onDataUpdate) {
            onDataUpdate(data)
        }
    }

    const updateProgressionMonitor = (field: keyof ILDData, value: any) => {
        const updatedData = {
            ...ildData,
            [field]: value,
            logDate: new Date().toISOString().split('T')[0]
        }
        setILDData(updatedData)
        saveILDData(updatedData)
    }

    const updateVASScore = (field: 'dryCoughSeverity' | 'fatigueLevel', score: number) => {
        const updatedData = {
            ...ildData,
            [field]: score,
            logDate: new Date().toISOString().split('T')[0]
        }
        setILDData(updatedData)
        saveILDData(updatedData)
    }

    const updateOxygenRequirements = () => {
        const restOx = parseFloat(currentRestOxygen) || 0
        const exertionalOx = parseFloat(currentExertionalOxygen) || 0
        const spo2Drop = parseFloat(currentSpo2Drop) || 0

        const updatedData = {
            ...ildData,
            restOxygen: restOx,
            exertionalOxygen: exertionalOx,
            spo2BaselineDrop: spo2Drop,
            oxygenIncrease: restOx > (ildData.restOxygen || 0) || exertionalOx > (ildData.exertionalOxygen || 0),
            suddenSpo2Drop: spo2Drop >= 4,
            logDate: new Date().toISOString().split('T')[0]
        }
        setILDData(updatedData)
        saveILDData(updatedData)
    }

    const getBreathlessnessColor = (change: string) => {
        switch (change) {
            case 'better': return 'text-green-600'
            case 'same': return 'text-gray-600'
            case 'worse': return 'text-red-600'
            default: return 'text-gray-600'
        }
    }

    const getProgressionRisk = () => {
        let riskFactors = 0
        const factors = []

        if (ildData.breathlessnessChange === 'worse') {
            riskFactors += 2
            factors.push('Worsening breathlessness')
        }
        if (ildData.dryCoughSeverity >= 7) {
            riskFactors += 2
            factors.push('Severe dry cough')
        }
        if (ildData.fatigueLevel >= 7) {
            riskFactors += 1
            factors.push('High fatigue levels')
        }
        if (ildData.oxygenIncrease) {
            riskFactors += 2
            factors.push('Increased oxygen requirement')
        }
        if (ildData.newChestPain) {
            riskFactors += 2
            factors.push('New chest pain')
        }
        if (ildData.suddenSpo2Drop) {
            riskFactors += 3
            factors.push('Significant SpO2 drop')
        }

        if (riskFactors >= 5) return { level: 'high', factors, message: 'High risk of disease progression' }
        if (riskFactors >= 3) return { level: 'moderate', factors, message: 'Moderate risk of progression' }
        return { level: 'low', factors, message: 'Stable disease status' }
    }

    const progressionRisk = getProgressionRisk()

    return (
        <div className="space-y-6">
            {/* Fibrosis & Progression Monitor */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingDown className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold">Fibrosis & Progression Monitor</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Breathlessness Change */}
                    <div className="space-y-3">
                        <h4 className="font-medium">Breathlessness Change (vs last week)</h4>
                        <div className="space-y-2">
                            {[
                                { value: 'better', label: 'Better', color: 'text-green-600' },
                                { value: 'same', label: 'Same', color: 'text-gray-600' },
                                { value: 'worse', label: 'Worse', color: 'text-red-600' }
                            ].map(option => (
                                <div key={option.value} className="flex items-center space-x-3">
                                    <input
                                        type="radio"
                                        id={`breathlessness-${option.value}`}
                                        name="breathlessness-change"
                                        checked={ildData.breathlessnessChange === option.value}
                                        onChange={() => updateProgressionMonitor('breathlessnessChange', option.value)}
                                    />
                                    <label 
                                        htmlFor={`breathlessness-${option.value}`} 
                                        className={`text-sm font-medium ${option.color}`}
                                    >
                                        {option.label}
                                    </label>
                                </div>
                            ))}
                        </div>

                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className={`text-2xl font-bold ${getBreathlessnessColor(ildData.breathlessnessChange)}`}>
                                {ildData.breathlessnessChange === 'better' ? '↗️' : 
                                 ildData.breathlessnessChange === 'same' ? '→' : '↘️'}
                            </div>
                            <div className="text-sm text-gray-600 capitalize">
                                {ildData.breathlessnessChange}
                            </div>
                        </div>
                    </div>

                    {/* Dry Cough Severity */}
                    <div className="space-y-3">
                        <h4 className="font-medium">Dry Cough Severity (VAS 0-10)</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Current: {ildData.dryCoughSeverity}</span>
                                <span className="text-xs text-gray-500">
                                    {ildData.dryCoughSeverity <= 3 ? 'Mild' : 
                                     ildData.dryCoughSeverity <= 6 ? 'Moderate' : 'Severe'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">0 (No cough)</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    value={ildData.dryCoughSeverity}
                                    onChange={(e) => updateVASScore('dryCoughSeverity', parseInt(e.target.value))}
                                    className="flex-1"
                                />
                                <span className="text-xs text-gray-500">10 (Severe)</span>
                            </div>
                        </div>

                        {ildData.dryCoughSeverity >= 7 && (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                    <span className="text-yellow-800 font-medium">Severe Cough Alert</span>
                                </div>
                                <p className="text-sm text-yellow-700 mt-1">
                                    Severe dry cough may indicate disease progression.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Fatigue Level */}
                <div className="mt-6">
                    <h4 className="font-medium mb-3">Fatigue Level (VAS 0-10)</h4>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Current: {ildData.fatigueLevel}</span>
                            <span className="text-xs text-gray-500">
                                {ildData.fatigueLevel <= 3 ? 'Mild' : 
                                 ildData.fatigueLevel <= 6 ? 'Moderate' : 'Severe'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">0 (No fatigue)</span>
                            <input
                                type="range"
                                min="0"
                                max="10"
                                value={ildData.fatigueLevel}
                                onChange={(e) => updateVASScore('fatigueLevel', parseInt(e.target.value))}
                                className="flex-1"
                            />
                            <span className="text-xs text-gray-500">10 (Extreme fatigue)</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Oxygen Dependency */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Wind className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">Oxygen Dependency</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <h4 className="font-medium">Rest Oxygen (L/min)</h4>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                min="0"
                                max="15"
                                step="0.5"
                                value={currentRestOxygen}
                                onChange={(e) => setCurrentRestOxygen(e.target.value)}
                                placeholder="Oxygen at rest"
                                className="flex-1"
                            />
                            <span className="text-sm text-gray-600">L/min</span>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-900">
                                {ildData.restOxygen}
                            </div>
                            <div className="text-sm text-blue-600">L/min at Rest</div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-medium">Exertional Oxygen (L/min)</h4>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                min="0"
                                max="15"
                                step="0.5"
                                value={currentExertionalOxygen}
                                onChange={(e) => setCurrentExertionalOxygen(e.target.value)}
                                placeholder="Oxygen on exertion"
                                className="flex-1"
                            />
                            <span className="text-sm text-gray-600">L/min</span>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-900">
                                {ildData.exertionalOxygen}
                            </div>
                            <div className="text-sm text-blue-600">L/min on Exertion</div>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <Button onClick={updateOxygenRequirements} className="w-full">
                        Update Oxygen Requirements
                    </Button>
                </div>

                {ildData.oxygenIncrease && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            <span className="text-yellow-800 font-medium">Oxygen Requirement Increased</span>
                        </div>
                        <p className="text-sm text-yellow-700 mt-1">
                            Your oxygen requirements have increased. This may indicate disease progression.
                        </p>
                    </div>
                )}
            </Card>

            {/* Red Flags */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h3 className="text-lg font-semibold">Red Flag Symptoms</h3>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm">New chest pain?</span>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant={ildData.newChestPain ? "destructive" : "outline"}
                                onClick={() => updateProgressionMonitor('newChestPain', true)}
                            >
                                Yes
                            </Button>
                            <Button
                                size="sm"
                                variant={!ildData.newChestPain ? "default" : "outline"}
                                onClick={() => updateProgressionMonitor('newChestPain', false)}
                            >
                                No
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">SpO₂ Drop from Baseline (%)</label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                min="0"
                                max="20"
                                value={currentSpo2Drop}
                                onChange={(e) => setCurrentSpo2Drop(e.target.value)}
                                placeholder="SpO2 drop percentage"
                                className="flex-1"
                            />
                            <span className="text-sm text-gray-600">%</span>
                        </div>
                        
                        {ildData.spo2BaselineDrop >= 4 && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-600" />
                                    <span className="text-red-800 font-medium">Critical SpO₂ Drop</span>
                                </div>
                                <p className="text-sm text-red-700 mt-1">
                                    SpO₂ drop ≥4% from baseline requires immediate medical attention.
                                </p>
                            </div>
                        )}
                    </div>

                    {ildData.newChestPain && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Heart className="w-4 h-4 text-red-600" />
                                <span className="text-red-800 font-medium">New Chest Pain Alert</span>
                            </div>
                            <p className="text-sm text-red-700 mt-1">
                                New chest pain in ILD patients requires immediate evaluation to rule out complications.
                            </p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Disease Progression Risk Assessment */}
            <Card className={`p-6 border-2 ${
                progressionRisk.level === 'high' ? 'bg-red-50 border-red-200' :
                progressionRisk.level === 'moderate' ? 'bg-yellow-50 border-yellow-200' :
                'bg-green-50 border-green-200'
            }`}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold">Disease Progression Risk</h3>
                        <p className="text-sm text-gray-600 mt-1">{progressionRisk.message}</p>
                    </div>
                    <Badge className={`text-lg px-4 py-2 ${
                        progressionRisk.level === 'high' ? 'bg-red-600 text-white' :
                        progressionRisk.level === 'moderate' ? 'bg-yellow-600 text-white' :
                        'bg-green-600 text-white'
                    }`}>
                        {progressionRisk.level.toUpperCase()}
                    </Badge>
                </div>

                {progressionRisk.factors.length > 0 && (
                    <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Contributing Factors:</p>
                        <ul className="list-disc list-inside text-sm space-y-1">
                            {progressionRisk.factors.map((factor, index) => (
                                <li key={index}>{factor}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {progressionRisk.level === 'high' && (
                    <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="text-red-800 font-medium">Doctor Alert Triggered</span>
                        </div>
                        <p className="text-sm text-red-700 mt-1">
                            High risk of ILD progression detected. Please contact your pulmonologist immediately for evaluation and potential treatment adjustment.
                        </p>
                    </div>
                )}
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                    <TrendingDown className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <div className={`text-2xl font-bold ${getBreathlessnessColor(ildData.breathlessnessChange)}`}>
                        {ildData.breathlessnessChange === 'better' ? '↗️' : 
                         ildData.breathlessnessChange === 'same' ? '→' : '↘️'}
                    </div>
                    <div className="text-sm text-gray-600">Breathlessness</div>
                </Card>

                <Card className="p-4 text-center">
                    <Wind className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                        {ildData.dryCoughSeverity}/10
                    </div>
                    <div className="text-sm text-gray-600">Cough Severity</div>
                </Card>

                <Card className="p-4 text-center">
                    <Activity className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                        {ildData.fatigueLevel}/10
                    </div>
                    <div className="text-sm text-gray-600">Fatigue Level</div>
                </Card>

                <Card className="p-4 text-center">
                    <Heart className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <div className={`text-2xl font-bold ${
                        progressionRisk.level === 'high' ? 'text-red-600' :
                        progressionRisk.level === 'moderate' ? 'text-yellow-600' :
                        'text-green-600'
                    }`}>
                        {progressionRisk.level === 'high' ? '⚠️' : 
                         progressionRisk.level === 'moderate' ? '⚡' : '✓'}
                    </div>
                    <div className="text-sm text-gray-600">Progression Risk</div>
                </Card>
            </div>
        </div>
    )
}