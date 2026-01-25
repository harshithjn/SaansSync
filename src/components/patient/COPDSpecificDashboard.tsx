"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { COPDData } from "@/lib/monitoring-types"
import { AlertTriangle, Wind, Activity, TrendingUp, Droplets } from "lucide-react"

interface COPDSpecificDashboardProps {
    patientId: string
    onDataUpdate?: (data: COPDData) => void
}

export default function COPDSpecificDashboard({ 
    patientId, 
    onDataUpdate 
}: COPDSpecificDashboardProps) {
    const [copdData, setCOPDData] = useState<COPDData>({
        patientId,
        logDate: new Date().toISOString().split('T')[0],
        // COPD Impact (Weekly)
        coughFrequency: 0,
        phlegmProduction: 0,
        exerciseTolerance: true,
        sleepDisturbed: false,
        // Exacerbation Risk (Daily)
        energyLevel: 5,
        chestHeaviness: 1,
        // Ancillary Data
        dailyStepCount: 0,
        sputumVolume: 'none',
        sputumColor: 'white',
        fever: false
    })

    const [currentStepCount, setCurrentStepCount] = useState("")

    useEffect(() => {
        loadCOPDData()
    }, [patientId])

    const loadCOPDData = () => {
        const stored = localStorage.getItem(`copd_data_${patientId}`)
        if (stored) {
            const parsedData = JSON.parse(stored)
            setCOPDData(parsedData)
            setCurrentStepCount(parsedData.dailyStepCount?.toString() || "")
        }
    }

    const saveCOPDData = (data: COPDData) => {
        localStorage.setItem(`copd_data_${patientId}`, JSON.stringify(data))
        if (onDataUpdate) {
            onDataUpdate(data)
        }
    }

    const updateWeeklyAssessment = (field: keyof COPDData, value: any) => {
        const updatedData = {
            ...copdData,
            [field]: value,
            logDate: new Date().toISOString().split('T')[0]
        }
        setCOPDData(updatedData)
        saveCOPDData(updatedData)
    }

    const updateVASScore = (field: 'energyLevel' | 'chestHeaviness', score: number) => {
        const updatedData = {
            ...copdData,
            [field]: score,
            logDate: new Date().toISOString().split('T')[0]
        }
        setCOPDData(updatedData)
        saveCOPDData(updatedData)
    }

    const updateStepCount = () => {
        const steps = parseInt(currentStepCount) || 0
        const updatedData = {
            ...copdData,
            dailyStepCount: steps,
            logDate: new Date().toISOString().split('T')[0]
        }
        setCOPDData(updatedData)
        saveCOPDData(updatedData)
    }

    const getCoughFrequencyLabel = (level: number) => {
        const labels = [
            "Never",
            "Rarely (few times a week)",
            "Sometimes (daily but not bothersome)",
            "Often (daily and bothersome)",
            "Very often (constant and very bothersome)"
        ]
        return labels[level] || ""
    }

    const getPhlegmProductionLabel = (level: number) => {
        const labels = [
            "None",
            "Very little",
            "A little",
            "A moderate amount",
            "A lot"
        ]
        return labels[level] || ""
    }

    const getSputumVolumeColor = (volume: string) => {
        switch (volume) {
            case 'none': return 'text-green-600'
            case 'small': return 'text-yellow-600'
            case 'moderate': return 'text-orange-600'
            case 'large': return 'text-red-600'
            default: return 'text-gray-600'
        }
    }

    const getSputumColorAlert = (color: string) => {
        if (color === 'dark-green' || color === 'yellow') {
            return {
                show: true,
                message: 'Purulent sputum may indicate infection - contact your doctor',
                level: 'warning'
            }
        }
        return { show: false, message: '', level: 'normal' }
    }

    const getExacerbationRisk = () => {
        let riskFactors = 0
        const factors = []

        if (copdData.coughFrequency >= 3) {
            riskFactors++
            factors.push('Frequent cough')
        }
        if (copdData.phlegmProduction >= 3) {
            riskFactors++
            factors.push('Increased phlegm')
        }
        if (copdData.chestHeaviness >= 7) {
            riskFactors++
            factors.push('Severe chest heaviness')
        }
        if (copdData.energyLevel <= 3) {
            riskFactors++
            factors.push('Low energy levels')
        }
        if (copdData.fever) {
            riskFactors++
            factors.push('Fever present')
        }
        if (copdData.sputumColor === 'dark-green' || copdData.sputumColor === 'yellow') {
            riskFactors++
            factors.push('Purulent sputum')
        }

        if (riskFactors >= 3) return { level: 'high', factors, message: 'High risk of exacerbation' }
        if (riskFactors >= 2) return { level: 'moderate', factors, message: 'Moderate risk of exacerbation' }
        return { level: 'low', factors, message: 'Low risk of exacerbation' }
    }

    const exacerbationRisk = getExacerbationRisk()
    const sputumAlert = getSputumColorAlert(copdData.sputumColor)

    return (
        <div className="space-y-6">
            {/* COPD Impact Assessment (Weekly) */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Wind className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">COPD Impact Assessment (Weekly)</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cough Frequency */}
                    <div className="space-y-3">
                        <h4 className="font-medium">Cough Frequency (0-4)</h4>
                        <div className="space-y-2">
                            {[0, 1, 2, 3, 4].map(level => (
                                <div key={level} className="flex items-start space-x-3">
                                    <input
                                        type="radio"
                                        id={`cough-${level}`}
                                        name="cough-frequency"
                                        checked={copdData.coughFrequency === level}
                                        onChange={() => updateWeeklyAssessment('coughFrequency', level)}
                                        className="mt-1"
                                    />
                                    <div className="flex-1">
                                        <label htmlFor={`cough-${level}`} className="text-sm font-medium">
                                            Level {level}
                                        </label>
                                        <p className="text-xs text-gray-600">
                                            {getCoughFrequencyLabel(level)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Phlegm Production */}
                    <div className="space-y-3">
                        <h4 className="font-medium">Phlegm Production (0-4)</h4>
                        <div className="space-y-2">
                            {[0, 1, 2, 3, 4].map(level => (
                                <div key={level} className="flex items-start space-x-3">
                                    <input
                                        type="radio"
                                        id={`phlegm-${level}`}
                                        name="phlegm-production"
                                        checked={copdData.phlegmProduction === level}
                                        onChange={() => updateWeeklyAssessment('phlegmProduction', level)}
                                        className="mt-1"
                                    />
                                    <div className="flex-1">
                                        <label htmlFor={`phlegm-${level}`} className="text-sm font-medium">
                                            Level {level}
                                        </label>
                                        <p className="text-xs text-gray-600">
                                            {getPhlegmProductionLabel(level)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm">Exercise tolerance maintained?</span>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant={copdData.exerciseTolerance ? "default" : "outline"}
                                onClick={() => updateWeeklyAssessment('exerciseTolerance', true)}
                            >
                                Yes
                            </Button>
                            <Button
                                size="sm"
                                variant={!copdData.exerciseTolerance ? "default" : "outline"}
                                onClick={() => updateWeeklyAssessment('exerciseTolerance', false)}
                            >
                                No
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm">Sleep disturbed by symptoms?</span>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant={copdData.sleepDisturbed ? "default" : "outline"}
                                onClick={() => updateWeeklyAssessment('sleepDisturbed', true)}
                            >
                                Yes
                            </Button>
                            <Button
                                size="sm"
                                variant={!copdData.sleepDisturbed ? "default" : "outline"}
                                onClick={() => updateWeeklyAssessment('sleepDisturbed', false)}
                            >
                                No
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Exacerbation Risk (Daily) */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-semibold">Exacerbation Risk (Daily)</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Energy Level VAS */}
                    <div className="space-y-3">
                        <h4 className="font-medium">Energy Level (VAS 0-10)</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Current: {copdData.energyLevel}</span>
                                <span className="text-xs text-gray-500">
                                    {copdData.energyLevel <= 3 ? 'Very Low' : 
                                     copdData.energyLevel <= 6 ? 'Moderate' : 'Good'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">0 (No energy)</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    value={copdData.energyLevel}
                                    onChange={(e) => updateVASScore('energyLevel', parseInt(e.target.value))}
                                    className="flex-1"
                                />
                                <span className="text-xs text-gray-500">10 (Full energy)</span>
                            </div>
                        </div>
                    </div>

                    {/* Chest Heaviness VAS */}
                    <div className="space-y-3">
                        <h4 className="font-medium">Chest Heaviness (VAS 0-10)</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Current: {copdData.chestHeaviness}</span>
                                <span className="text-xs text-gray-500">
                                    {copdData.chestHeaviness <= 3 ? 'Mild' : 
                                     copdData.chestHeaviness <= 6 ? 'Moderate' : 'Severe'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">0 (No heaviness)</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    value={copdData.chestHeaviness}
                                    onChange={(e) => updateVASScore('chestHeaviness', parseInt(e.target.value))}
                                    className="flex-1"
                                />
                                <span className="text-xs text-gray-500">10 (Very heavy)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Exacerbation Risk Summary */}
                <div className={`mt-6 p-4 rounded-lg border-2 ${
                    exacerbationRisk.level === 'high' ? 'bg-red-50 border-red-200' :
                    exacerbationRisk.level === 'moderate' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-green-50 border-green-200'
                }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold text-lg">Exacerbation Risk Assessment</h4>
                            <p className="text-sm text-gray-600 mt-1">{exacerbationRisk.message}</p>
                        </div>
                        <Badge className={`text-lg px-4 py-2 ${
                            exacerbationRisk.level === 'high' ? 'bg-red-600 text-white' :
                            exacerbationRisk.level === 'moderate' ? 'bg-yellow-600 text-white' :
                            'bg-green-600 text-white'
                        }`}>
                            {exacerbationRisk.level.toUpperCase()}
                        </Badge>
                    </div>

                    {exacerbationRisk.factors.length > 0 && (
                        <div className="mt-3">
                            <p className="text-sm font-medium mb-2">Risk Factors:</p>
                            <ul className="list-disc list-inside text-sm space-y-1">
                                {exacerbationRisk.factors.map((factor, index) => (
                                    <li key={index}>{factor}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {exacerbationRisk.level === 'high' && (
                        <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                                <span className="text-red-800 font-medium">Doctor Alert Triggered</span>
                            </div>
                            <p className="text-sm text-red-700 mt-1">
                                High risk of COPD exacerbation detected. Please contact your healthcare provider immediately.
                            </p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Ancillary Data */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold">Additional Monitoring</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Daily Step Count */}
                    <div className="space-y-3">
                        <h4 className="font-medium">Daily Step Count</h4>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                min="0"
                                value={currentStepCount}
                                onChange={(e) => setCurrentStepCount(e.target.value)}
                                placeholder="Enter step count"
                                className="flex-1"
                            />
                            <Button onClick={updateStepCount} size="sm">
                                Update
                            </Button>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-900">
                                {copdData.dailyStepCount || 0}
                            </div>
                            <div className="text-sm text-gray-600">Steps Today</div>
                        </div>
                    </div>

                    {/* Sputum Assessment */}
                    <div className="space-y-3">
                        <h4 className="font-medium">Sputum Assessment</h4>
                        <div className="space-y-2">
                            <div>
                                <label className="text-sm font-medium">Volume</label>
                                <Select value={copdData.sputumVolume} onValueChange={(value) => updateWeeklyAssessment('sputumVolume', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        <SelectItem value="small">Small</SelectItem>
                                        <SelectItem value="moderate">Moderate</SelectItem>
                                        <SelectItem value="large">Large</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Color</label>
                                <Select value={copdData.sputumColor} onValueChange={(value) => updateWeeklyAssessment('sputumColor', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="white">White/Clear</SelectItem>
                                        <SelectItem value="pale-yellow">Pale Yellow</SelectItem>
                                        <SelectItem value="yellow">Yellow</SelectItem>
                                        <SelectItem value="dark-green">Dark Green</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <span className="text-sm">Fever ({'>'}38°C)?</span>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant={copdData.fever ? "default" : "outline"}
                                        onClick={() => updateWeeklyAssessment('fever', true)}
                                    >
                                        Yes
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={!copdData.fever ? "default" : "outline"}
                                        onClick={() => updateWeeklyAssessment('fever', false)}
                                    >
                                        No
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {sputumAlert.show && (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                    <span className="text-yellow-800 font-medium">Sputum Alert</span>
                                </div>
                                <p className="text-sm text-yellow-700 mt-1">{sputumAlert.message}</p>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                    <Wind className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                        {copdData.coughFrequency}/4
                    </div>
                    <div className="text-sm text-gray-600">Cough Level</div>
                </Card>

                <Card className="p-4 text-center">
                    <Droplets className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                        {copdData.phlegmProduction}/4
                    </div>
                    <div className="text-sm text-gray-600">Phlegm Level</div>
                </Card>

                <Card className="p-4 text-center">
                    <Activity className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                        {copdData.energyLevel}/10
                    </div>
                    <div className="text-sm text-gray-600">Energy Level</div>
                </Card>

                <Card className="p-4 text-center">
                    <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <div className={`text-2xl font-bold ${
                        exacerbationRisk.level === 'high' ? 'text-red-600' :
                        exacerbationRisk.level === 'moderate' ? 'text-yellow-600' :
                        'text-green-600'
                    }`}>
                        {exacerbationRisk.level === 'high' ? '⚠️' : 
                         exacerbationRisk.level === 'moderate' ? '⚡' : '✓'}
                    </div>
                    <div className="text-sm text-gray-600">Risk Level</div>
                </Card>
            </div>
        </div>
    )
}