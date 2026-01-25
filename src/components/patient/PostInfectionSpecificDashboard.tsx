"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PostInfectionData } from "@/lib/monitoring-types"
import { AlertTriangle, TrendingUp, Activity, Droplets, Heart } from "lucide-react"

interface PostInfectionSpecificDashboardProps {
    patientId: string
    onDataUpdate?: (data: PostInfectionData) => void
}

export default function PostInfectionSpecificDashboard({ 
    patientId, 
    onDataUpdate 
}: PostInfectionSpecificDashboardProps) {
    const [postInfectionData, setPostInfectionData] = useState<PostInfectionData>({
        patientId,
        logDate: new Date().toISOString().split('T')[0],
        // Sputum Tracker (inherited from Bronchiectasis)
        sputumVolume: 'none',
        sputumColor: 'white',
        easeOfClearance: 3,
        // Infection Screen (inherited from Bronchiectasis)
        fever: false,
        malaise: false,
        hasHemoptysis: false,
        // Recovery Tracking (Post-Infection specific)
        exerciseToleranceImprovement: false,
        appetite: 'fair',
        weightChange: 0,
        // Post-Infection Complications
        persistentCough: false,
        hemoptysis: false
    })

    const [currentWeightChange, setCurrentWeightChange] = useState("")

    useEffect(() => {
        loadPostInfectionData()
    }, [patientId])

    const loadPostInfectionData = () => {
        const stored = localStorage.getItem(`post_infection_data_${patientId}`)
        if (stored) {
            const parsedData = JSON.parse(stored)
            setPostInfectionData(parsedData)
            setCurrentWeightChange(parsedData.weightChange.toString())
        }
    }

    const savePostInfectionData = (data: PostInfectionData) => {
        localStorage.setItem(`post_infection_data_${patientId}`, JSON.stringify(data))
        if (onDataUpdate) {
            onDataUpdate(data)
        }
    }

    const updateField = (field: keyof PostInfectionData, value: any) => {
        const updatedData = {
            ...postInfectionData,
            [field]: value,
            logDate: new Date().toISOString().split('T')[0]
        }
        setPostInfectionData(updatedData)
        savePostInfectionData(updatedData)
    }

    const updateWeightChange = () => {
        const weight = parseFloat(currentWeightChange) || 0
        updateField('weightChange', weight)
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
        if (color === 'dark-green') {
            return {
                show: true,
                message: 'Green/purulent sputum may indicate bacterial infection',
                level: 'warning'
            }
        }
        if (color === 'blood-streaked') {
            return {
                show: true,
                message: 'Blood in sputum requires immediate medical attention',
                level: 'critical'
            }
        }
        return { show: false, message: '', level: 'normal' }
    }

    const getRecoveryStatus = () => {
        let recoveryScore = 0
        const positiveFactors = []
        const concerningFactors = []

        // Positive recovery indicators
        if (postInfectionData.exerciseToleranceImprovement) {
            recoveryScore += 2
            positiveFactors.push('Exercise tolerance improving')
        }
        if (postInfectionData.appetite === 'good') {
            recoveryScore += 1
            positiveFactors.push('Good appetite')
        }
        if (postInfectionData.weightChange > 0) {
            recoveryScore += 1
            positiveFactors.push('Weight gain')
        }
        if (postInfectionData.sputumVolume === 'none' || postInfectionData.sputumVolume === 'small') {
            recoveryScore += 1
            positiveFactors.push('Minimal sputum production')
        }

        // Concerning factors
        if (postInfectionData.persistentCough) {
            recoveryScore -= 2
            concerningFactors.push('Persistent cough >3 weeks')
        }
        if (postInfectionData.hemoptysis) {
            recoveryScore -= 3
            concerningFactors.push('Blood in sputum')
        }
        if (postInfectionData.fever) {
            recoveryScore -= 2
            concerningFactors.push('Fever present')
        }
        if (postInfectionData.malaise) {
            recoveryScore -= 1
            concerningFactors.push('Flu-like symptoms')
        }
        if (postInfectionData.weightChange < -2) {
            recoveryScore -= 2
            concerningFactors.push('Significant weight loss')
        }

        if (recoveryScore >= 3) return { 
            level: 'good', 
            message: 'Good recovery progress', 
            positiveFactors, 
            concerningFactors 
        }
        if (recoveryScore >= 0) return { 
            level: 'moderate', 
            message: 'Moderate recovery progress', 
            positiveFactors, 
            concerningFactors 
        }
        return { 
            level: 'poor', 
            message: 'Poor recovery - medical review needed', 
            positiveFactors, 
            concerningFactors 
        }
    }

    const getInfectionRisk = () => {
        let riskFactors = 0
        const factors = []

        if (postInfectionData.fever) {
            riskFactors += 2
            factors.push('Fever >38°C')
        }
        if (postInfectionData.malaise) {
            riskFactors += 1
            factors.push('Flu-like symptoms')
        }
        if (postInfectionData.sputumColor === 'dark-green') {
            riskFactors += 2
            factors.push('Purulent sputum')
        }
        if (postInfectionData.sputumVolume === 'large') {
            riskFactors += 1
            factors.push('Large sputum volume')
        }
        if (postInfectionData.easeOfClearance <= 2) {
            riskFactors += 1
            factors.push('Difficult sputum clearance')
        }

        if (riskFactors >= 4) return { level: 'high', factors, message: 'High infection risk' }
        if (riskFactors >= 2) return { level: 'moderate', factors, message: 'Moderate infection risk' }
        return { level: 'low', factors, message: 'Low infection risk' }
    }

    const recoveryStatus = getRecoveryStatus()
    const infectionRisk = getInfectionRisk()
    const sputumAlert = getSputumColorAlert(postInfectionData.sputumColor)

    return (
        <div className="space-y-6">
            {/* Recovery Tracking */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold">Recovery Tracking</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="text-sm">Exercise tolerance improvement?</span>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant={postInfectionData.exerciseToleranceImprovement ? "default" : "outline"}
                                    onClick={() => updateField('exerciseToleranceImprovement', true)}
                                >
                                    Yes
                                </Button>
                                <Button
                                    size="sm"
                                    variant={!postInfectionData.exerciseToleranceImprovement ? "default" : "outline"}
                                    onClick={() => updateField('exerciseToleranceImprovement', false)}
                                >
                                    No
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Appetite</label>
                            <Select value={postInfectionData.appetite} onValueChange={(value) => updateField('appetite', value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="poor">Poor</SelectItem>
                                    <SelectItem value="fair">Fair</SelectItem>
                                    <SelectItem value="good">Good</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Weight Change (±kg)</label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={currentWeightChange}
                                    onChange={(e) => setCurrentWeightChange(e.target.value)}
                                    placeholder="Weight change"
                                    className="flex-1"
                                />
                                <Button onClick={updateWeightChange} size="sm">
                                    Update
                                </Button>
                            </div>
                        </div>

                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className={`text-2xl font-bold ${
                                postInfectionData.weightChange > 0 ? 'text-green-600' :
                                postInfectionData.weightChange < -2 ? 'text-red-600' : 'text-gray-900'
                            }`}>
                                {postInfectionData.weightChange > 0 ? '+' : ''}{postInfectionData.weightChange}
                            </div>
                            <div className="text-sm text-gray-600">kg change</div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Post-Infection Complications */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h3 className="text-lg font-semibold">Post-Infection Complications</h3>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm">Persistent cough ({'>'}3 weeks)?</span>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant={postInfectionData.persistentCough ? "destructive" : "outline"}
                                onClick={() => updateField('persistentCough', true)}
                            >
                                Yes
                            </Button>
                            <Button
                                size="sm"
                                variant={!postInfectionData.persistentCough ? "default" : "outline"}
                                onClick={() => updateField('persistentCough', false)}
                            >
                                No
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm">Hemoptysis (blood in sputum)?</span>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant={postInfectionData.hemoptysis ? "destructive" : "outline"}
                                onClick={() => updateField('hemoptysis', true)}
                            >
                                Yes
                            </Button>
                            <Button
                                size="sm"
                                variant={!postInfectionData.hemoptysis ? "default" : "outline"}
                                onClick={() => updateField('hemoptysis', false)}
                            >
                                No
                            </Button>
                        </div>
                    </div>

                    {postInfectionData.persistentCough && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                <span className="text-yellow-800 font-medium">Persistent Cough Alert</span>
                            </div>
                            <p className="text-sm text-yellow-700 mt-1">
                                Cough persisting {'>'}3 weeks post-infection may indicate complications or incomplete recovery.
                            </p>
                        </div>
                    )}

                    {postInfectionData.hemoptysis && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Heart className="w-4 h-4 text-red-600" />
                                <span className="text-red-800 font-medium">Critical: Hemoptysis Detected</span>
                            </div>
                            <p className="text-sm text-red-700 mt-1">
                                Blood in sputum requires immediate medical evaluation to rule out serious complications.
                            </p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Sputum Tracker */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Droplets className="w-5 h-5 text-cyan-600" />
                    <h3 className="text-lg font-semibold">Sputum Tracker</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Volume</label>
                        <Select value={postInfectionData.sputumVolume} onValueChange={(value) => updateField('sputumVolume', value)}>
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

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Color</label>
                        <Select value={postInfectionData.sputumColor} onValueChange={(value) => updateField('sputumColor', value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="white">White</SelectItem>
                                <SelectItem value="pale-yellow">Pale Yellow</SelectItem>
                                <SelectItem value="dark-green">Dark Green</SelectItem>
                                <SelectItem value="blood-streaked">Blood Streaked</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Ease of Clearance (1-5)</label>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">1 (Very difficult)</span>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                value={postInfectionData.easeOfClearance}
                                onChange={(e) => updateField('easeOfClearance', parseInt(e.target.value))}
                                className="flex-1"
                            />
                            <span className="text-xs text-gray-500">5 (Very easy)</span>
                        </div>
                        <div className="text-center text-sm text-gray-600">
                            Current: {postInfectionData.easeOfClearance}
                        </div>
                    </div>
                </div>

                {sputumAlert.show && (
                    <div className={`mt-4 p-3 rounded-lg border ${
                        sputumAlert.level === 'critical' 
                            ? 'bg-red-50 border-red-200' 
                            : 'bg-yellow-50 border-yellow-200'
                    }`}>
                        <div className="flex items-center gap-2">
                            <AlertTriangle className={`w-4 h-4 ${
                                sputumAlert.level === 'critical' ? 'text-red-600' : 'text-yellow-600'
                            }`} />
                            <span className={`font-medium ${
                                sputumAlert.level === 'critical' ? 'text-red-800' : 'text-yellow-800'
                            }`}>
                                Sputum Alert
                            </span>
                        </div>
                        <p className={`text-sm mt-1 ${
                            sputumAlert.level === 'critical' ? 'text-red-700' : 'text-yellow-700'
                        }`}>
                            {sputumAlert.message}
                        </p>
                    </div>
                )}
            </Card>

            {/* Infection Screen */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-semibold">Infection Screen</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm">Fever ({'>'}38°C)?</span>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant={postInfectionData.fever ? "destructive" : "outline"}
                                onClick={() => updateField('fever', true)}
                            >
                                Yes
                            </Button>
                            <Button
                                size="sm"
                                variant={!postInfectionData.fever ? "default" : "outline"}
                                onClick={() => updateField('fever', false)}
                            >
                                No
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm">Malaise/flu-like symptoms?</span>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant={postInfectionData.malaise ? "destructive" : "outline"}
                                onClick={() => updateField('malaise', true)}
                            >
                                Yes
                            </Button>
                            <Button
                                size="sm"
                                variant={!postInfectionData.malaise ? "default" : "outline"}
                                onClick={() => updateField('malaise', false)}
                            >
                                No
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Infection Risk Assessment */}
                <div className={`mt-6 p-4 rounded-lg border-2 ${
                    infectionRisk.level === 'high' ? 'bg-red-50 border-red-200' :
                    infectionRisk.level === 'moderate' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-green-50 border-green-200'
                }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold text-lg">Infection Risk Assessment</h4>
                            <p className="text-sm text-gray-600 mt-1">{infectionRisk.message}</p>
                        </div>
                        <Badge className={`text-lg px-4 py-2 ${
                            infectionRisk.level === 'high' ? 'bg-red-600 text-white' :
                            infectionRisk.level === 'moderate' ? 'bg-yellow-600 text-white' :
                            'bg-green-600 text-white'
                        }`}>
                            {infectionRisk.level.toUpperCase()}
                        </Badge>
                    </div>

                    {infectionRisk.factors.length > 0 && (
                        <div className="mt-3">
                            <p className="text-sm font-medium mb-2">Risk Factors:</p>
                            <ul className="list-disc list-inside text-sm space-y-1">
                                {infectionRisk.factors.map((factor, index) => (
                                    <li key={index}>{factor}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </Card>

            {/* Recovery Status Summary */}
            <Card className={`p-6 border-2 ${
                recoveryStatus.level === 'good' ? 'bg-green-50 border-green-200' :
                recoveryStatus.level === 'moderate' ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'
            }`}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold">Recovery Status</h3>
                        <p className="text-sm text-gray-600 mt-1">{recoveryStatus.message}</p>
                    </div>
                    <Badge className={`text-lg px-4 py-2 ${
                        recoveryStatus.level === 'good' ? 'bg-green-600 text-white' :
                        recoveryStatus.level === 'moderate' ? 'bg-yellow-600 text-white' :
                        'bg-red-600 text-white'
                    }`}>
                        {recoveryStatus.level.toUpperCase()}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recoveryStatus.positiveFactors.length > 0 && (
                        <div>
                            <p className="text-sm font-medium mb-2 text-green-700">Positive Indicators:</p>
                            <ul className="list-disc list-inside text-sm space-y-1 text-green-600">
                                {recoveryStatus.positiveFactors.map((factor, index) => (
                                    <li key={index}>{factor}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {recoveryStatus.concerningFactors.length > 0 && (
                        <div>
                            <p className="text-sm font-medium mb-2 text-red-700">Concerning Factors:</p>
                            <ul className="list-disc list-inside text-sm space-y-1 text-red-600">
                                {recoveryStatus.concerningFactors.map((factor, index) => (
                                    <li key={index}>{factor}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {recoveryStatus.level === 'poor' && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="text-red-800 font-medium">Medical Review Required</span>
                        </div>
                        <p className="text-sm text-red-700 mt-1">
                            Poor recovery indicators detected. Please schedule a follow-up appointment with your healthcare provider.
                        </p>
                    </div>
                )}
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                    <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className={`text-2xl font-bold ${
                        recoveryStatus.level === 'good' ? 'text-green-600' :
                        recoveryStatus.level === 'moderate' ? 'text-yellow-600' :
                        'text-red-600'
                    }`}>
                        {recoveryStatus.level === 'good' ? '✓' : 
                         recoveryStatus.level === 'moderate' ? '~' : '✗'}
                    </div>
                    <div className="text-sm text-gray-600">Recovery</div>
                </Card>

                <Card className="p-4 text-center">
                    <Droplets className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
                    <div className={`text-2xl font-bold ${getSputumVolumeColor(postInfectionData.sputumVolume)}`}>
                        {postInfectionData.sputumVolume.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-600">Sputum Volume</div>
                </Card>

                <Card className="p-4 text-center">
                    <Activity className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <div className={`text-2xl font-bold ${
                        infectionRisk.level === 'high' ? 'text-red-600' :
                        infectionRisk.level === 'moderate' ? 'text-yellow-600' :
                        'text-green-600'
                    }`}>
                        {infectionRisk.level === 'high' ? '⚠️' : 
                         infectionRisk.level === 'moderate' ? '⚡' : '✓'}
                    </div>
                    <div className="text-sm text-gray-600">Infection Risk</div>
                </Card>

                <Card className="p-4 text-center">
                    <Heart className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <div className={`text-2xl font-bold ${
                        postInfectionData.weightChange > 0 ? 'text-green-600' :
                        postInfectionData.weightChange < -2 ? 'text-red-600' : 'text-gray-900'
                    }`}>
                        {postInfectionData.weightChange > 0 ? '+' : ''}{postInfectionData.weightChange}
                    </div>
                    <div className="text-sm text-gray-600">Weight (kg)</div>
                </Card>
            </div>
        </div>
    )
}