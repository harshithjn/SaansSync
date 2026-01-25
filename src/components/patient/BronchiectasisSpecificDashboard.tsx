"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BronchiectasisData } from "@/lib/monitoring-types"
import { AlertTriangle, Droplets, Thermometer, Activity } from "lucide-react"

interface BronchiectasisSpecificDashboardProps {
    patientId: string
    onDataUpdate?: (data: BronchiectasisData) => void
}

export default function BronchiectasisSpecificDashboard({ 
    patientId, 
    onDataUpdate 
}: BronchiectasisSpecificDashboardProps) {
    const [bronchData, setBronchData] = useState<BronchiectasisData>({
        patientId,
        logDate: new Date().toISOString().split('T')[0],
        // Sputum Tracker
        sputumVolume: 'none',
        sputumColor: 'white',
        easeOfClearance: 3,
        // Infection Screen
        fever: false,
        malaise: false,
        hasHemoptysis: false
    })

    useEffect(() => {
        loadBronchiectasisData()
    }, [patientId])

    const loadBronchiectasisData = () => {
        const stored = localStorage.getItem(`bronchiectasis_data_${patientId}`)
        if (stored) {
            const parsedData = JSON.parse(stored)
            setBronchData(parsedData)
        }
    }

    const saveBronchiectasisData = (data: BronchiectasisData) => {
        localStorage.setItem(`bronchiectasis_data_${patientId}`, JSON.stringify(data))
        if (onDataUpdate) {
            onDataUpdate(data)
        }
    }

    const updateField = (field: keyof BronchiectasisData, value: any) => {
        const updatedData = {
            ...bronchData,
            [field]: value,
            logDate: new Date().toISOString().split('T')[0]
        }
        setBronchData(updatedData)
        saveBronchiectasisData(updatedData)
    }

    const getSputumVolumeOptions = () => [
        { value: 'none', label: 'None', description: 'No sputum production' },
        { value: 'small', label: 'Small', description: 'Teaspoon amount' },
        { value: 'moderate', label: 'Moderate', description: 'Tablespoon amount' },
        { value: 'large', label: 'Large', description: 'Cup or more' }
    ]

    const getSputumColorOptions = () => [
        { value: 'white', label: 'White/Clear', color: 'bg-gray-100 border-gray-300', emoji: '⚪' },
        { value: 'pale-yellow', label: 'Pale Yellow', color: 'bg-yellow-100 border-yellow-300', emoji: '🟡' },
        { value: 'dark-green', label: 'Dark Green', color: 'bg-green-200 border-green-400', emoji: '🟢' },
        { value: 'blood-streaked', label: 'Blood-streaked', color: 'bg-red-200 border-red-400', emoji: '🔴' }
    ]

    const getClearanceDescription = (scale: number) => {
        const descriptions = [
            "", // 0 not used
            "Very difficult to clear",
            "Difficult to clear", 
            "Moderately easy to clear",
            "Easy to clear",
            "Very easy to clear"
        ]
        return descriptions[scale] || ""
    }

    const getInfectionRisk = () => {
        let riskFactors = 0
        if (bronchData.sputumColor === 'dark-green') riskFactors += 3
        if (bronchData.sputumVolume === 'large') riskFactors += 2
        if (bronchData.fever) riskFactors += 2
        if (bronchData.malaise) riskFactors += 1
        if (bronchData.easeOfClearance <= 2) riskFactors += 1

        if (riskFactors >= 5) return { level: 'high', color: 'text-red-600', message: 'High infection risk' }
        if (riskFactors >= 3) return { level: 'moderate', color: 'text-yellow-600', message: 'Moderate infection risk' }
        return { level: 'low', color: 'text-green-600', message: 'Low infection risk' }
    }

    const infectionRisk = getInfectionRisk()

    return (
        <div className="space-y-6">
            {/* Sputum Tracker */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Droplets className="w-5 h-5 text-cyan-600" />
                    <h3 className="text-lg font-semibold">Sputum Tracker</h3>
                </div>

                <div className="space-y-6">
                    {/* Sputum Volume */}
                    <div className="space-y-3">
                        <h4 className="font-medium">Sputum Volume</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {getSputumVolumeOptions().map(option => (
                                <div 
                                    key={option.value}
                                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                        bronchData.sputumVolume === option.value 
                                            ? 'border-blue-500 bg-blue-50' 
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() => updateField('sputumVolume', option.value)}
                                >
                                    <div className="font-medium">{option.label}</div>
                                    <div className="text-sm text-gray-600">{option.description}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sputum Color Picker */}
                    <div className="space-y-3">
                        <h4 className="font-medium">Sputum Color</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {getSputumColorOptions().map(option => (
                                <div 
                                    key={option.value}
                                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                        bronchData.sputumColor === option.value 
                                            ? 'border-blue-500 bg-blue-50' 
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() => updateField('sputumColor', option.value)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-full border-2 ${option.color}`}></div>
                                        <div>
                                            <div className="font-medium flex items-center gap-2">
                                                <span>{option.emoji}</span>
                                                {option.label}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Color-specific alerts */}
                        {bronchData.sputumColor === 'dark-green' && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-green-600" />
                                    <span className="text-green-800 font-medium">Infection Alert</span>
                                </div>
                                <p className="text-sm text-green-700 mt-2">
                                    Dark green sputum may indicate bacterial infection. Monitor closely and consider contacting your healthcare provider if symptoms worsen.
                                </p>
                            </div>
                        )}

                        {bronchData.sputumColor === 'blood-streaked' && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                    <span className="text-red-800 font-medium">🚨 Emergency Alert</span>
                                </div>
                                <p className="text-sm text-red-700 mt-2">
                                    Blood in sputum requires immediate medical attention. Contact your healthcare provider or emergency services immediately.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Ease of Clearance */}
                    <div className="space-y-3">
                        <h4 className="font-medium">Ease of Sputum Clearance (Scale 1-5)</h4>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">1 (Very difficult)</span>
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    value={bronchData.easeOfClearance}
                                    onChange={(e) => updateField('easeOfClearance', parseInt(e.target.value))}
                                    className="flex-1"
                                />
                                <span className="text-xs text-gray-500">5 (Very easy)</span>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-cyan-600">{bronchData.easeOfClearance}</div>
                                <div className="text-sm text-gray-600">{getClearanceDescription(bronchData.easeOfClearance)}</div>
                            </div>
                        </div>

                        {bronchData.easeOfClearance <= 2 && (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                    <span className="text-yellow-800 font-medium">Clearance Difficulty</span>
                                </div>
                                <p className="text-sm text-yellow-700 mt-1">
                                    Difficulty clearing sputum may indicate thickened secretions. Ensure adequate hydration and consider airway clearance techniques.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* Infection Screen */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Thermometer className="w-5 h-5 text-red-600" />
                    <h3 className="text-lg font-semibold">Infection Screen</h3>
                </div>

                <div className="space-y-4">
                    {/* Fever Check */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-2">
                            <Thermometer className="w-5 h-5 text-red-500" />
                            <div>
                                <span className="font-medium">Fever {'>'}38°C (100.4°F)?</span>
                                <p className="text-sm text-gray-600">Check your temperature regularly</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant={bronchData.fever ? "destructive" : "outline"}
                                onClick={() => updateField('fever', true)}
                            >
                                Yes
                            </Button>
                            <Button
                                size="sm"
                                variant={!bronchData.fever ? "default" : "outline"}
                                onClick={() => updateField('fever', false)}
                            >
                                No
                            </Button>
                        </div>
                    </div>

                    {/* Malaise Check */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-orange-500" />
                            <div>
                                <span className="font-medium">Malaise / Flu-like symptoms?</span>
                                <p className="text-sm text-gray-600">General feeling of being unwell, tired, or weak</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant={bronchData.malaise ? "destructive" : "outline"}
                                onClick={() => updateField('malaise', true)}
                            >
                                Yes
                            </Button>
                            <Button
                                size="sm"
                                variant={!bronchData.malaise ? "default" : "outline"}
                                onClick={() => updateField('malaise', false)}
                            >
                                No
                            </Button>
                        </div>
                    </div>

                    {/* Hemoptysis Check */}
                    <div className="flex items-center justify-between p-4 border-2 border-red-200 rounded-lg bg-red-50">
                        <div className="flex items-center gap-2">
                            <Droplets className="w-5 h-5 text-red-600" />
                            <div>
                                <span className="font-medium text-red-800">Hemoptysis (Blood in sputum)?</span>
                                <p className="text-sm text-red-600">Any amount of blood in coughed up sputum</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant={bronchData.hasHemoptysis ? "destructive" : "outline"}
                                onClick={() => updateField('hasHemoptysis', true)}
                            >
                                Yes
                            </Button>
                            <Button
                                size="sm"
                                variant={!bronchData.hasHemoptysis ? "default" : "outline"}
                                onClick={() => updateField('hasHemoptysis', false)}
                            >
                                No
                            </Button>
                        </div>
                    </div>

                    {bronchData.hasHemoptysis && (
                        <div className="p-4 bg-red-100 border-2 border-red-300 rounded-lg">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                                <span className="text-red-800 font-bold">🚨 EMERGENCY ALERT</span>
                            </div>
                            <p className="text-sm text-red-700 mt-2 font-medium">
                                Hemoptysis (blood in sputum) requires immediate medical attention. Contact your healthcare provider or emergency services immediately.
                            </p>
                        </div>
                    )}

                    {/* Infection Risk Assessment */}
                    <div className="mt-6 p-4 border-2 rounded-lg" style={{
                        borderColor: infectionRisk.level === 'high' ? '#ef4444' : 
                                    infectionRisk.level === 'moderate' ? '#f59e0b' : '#10b981',
                        backgroundColor: infectionRisk.level === 'high' ? '#fef2f2' : 
                                        infectionRisk.level === 'moderate' ? '#fffbeb' : '#f0fdf4'
                    }}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold">Infection Risk Assessment</h4>
                                <p className="text-sm text-gray-600 mt-1">Based on current symptoms and sputum characteristics</p>
                            </div>
                            <Badge className={`text-lg px-4 py-2 ${infectionRisk.color}`}>
                                {infectionRisk.message}
                            </Badge>
                        </div>

                        {infectionRisk.level === 'high' && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-700">
                                    <strong>High infection risk detected.</strong> Consider contacting your healthcare provider for evaluation and possible antibiotic treatment.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                    <Droplets className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
                    <div className="text-lg font-bold text-gray-900 capitalize">
                        {bronchData.sputumVolume}
                    </div>
                    <div className="text-sm text-gray-600">Sputum Volume</div>
                </Card>

                <Card className="p-4 text-center">
                    <div className="w-8 h-8 mx-auto mb-2 rounded-full border-2" 
                         style={{ 
                             backgroundColor: bronchData.sputumColor === 'white' ? '#f3f4f6' :
                                            bronchData.sputumColor === 'pale-yellow' ? '#fef3c7' :
                                            bronchData.sputumColor === 'dark-green' ? '#bbf7d0' : '#fecaca'
                         }}>
                    </div>
                    <div className="text-lg font-bold text-gray-900 capitalize">
                        {bronchData.sputumColor.replace('-', ' ')}
                    </div>
                    <div className="text-sm text-gray-600">Sputum Color</div>
                </Card>

                <Card className="p-4 text-center">
                    <Activity className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-lg font-bold text-gray-900">
                        {bronchData.easeOfClearance}/5
                    </div>
                    <div className="text-sm text-gray-600">Clearance Ease</div>
                </Card>
            </div>
        </div>
    )
}