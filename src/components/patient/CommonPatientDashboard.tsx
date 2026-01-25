"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { CommonPatientData, SymptomVAS, PatientMedicationLog } from "@/lib/monitoring-types"
import { fetchRealTimeAQI, getAQIColor, getAQICategory, shouldAlertForAQI, getAQIHealthAdvice, forceRefreshAQI } from "@/lib/aqi-service"
import { getStoredSession } from "@/lib/auth-utils"
import { AlertTriangle, MapPin, Wind, Droplets, Activity, Pill, Plus, Minus } from "lucide-react"

interface CommonPatientDashboardProps {
    patientId: string
    diseaseType: string
    onDataUpdate?: (data: CommonPatientData) => void
}

const SIDE_EFFECTS_LIST = [
    "Nausea",
    "Dizziness", 
    "Headache",
    "Fatigue",
    "Stomach upset",
    "Skin rash",
    "Sleep disturbance",
    "Appetite loss",
    "Dry mouth",
    "Constipation",
    "Other"
]

const DEFAULT_SYMPTOMS = [
    "Shortness of breath",
    "Chest tightness", 
    "Fatigue",
    "Cough",
    "Pedal Edema"
]

export default function CommonPatientDashboard({ 
    patientId, 
    diseaseType, 
    onDataUpdate 
}: CommonPatientDashboardProps) {
    const [commonData, setCommonData] = useState<CommonPatientData>({
        patientId,
        firstLogDate: new Date().toISOString(),
        aqi: {
            value: 0,
            pm25: 0,
            pm10: 0,
            location: "",
            fetchedAt: ""
        },
        spo2: {
            atRest: 0,
            onExertion: 0,
            baselineTarget: 95
        },
        conditionStatus: {
            isStatic: true,
            hasWorsening: false,
            hasImprovement: false,
            oxygenChange: 0
        },
        mMRCScale: 0,
        medications: [],
        sideEffects: [],
        symptoms: []
    })

    const [currentSpo2Rest, setCurrentSpo2Rest] = useState("")
    const [currentSpo2Exertion, setCurrentSpo2Exertion] = useState("")
    const [oxygenChangeAmount, setOxygenChangeAmount] = useState("")
    const [customSideEffect, setCustomSideEffect] = useState("")
    const [newSymptomName, setNewSymptomName] = useState("")
    const [showAQIAlert, setShowAQIAlert] = useState(false)

    useEffect(() => {
        loadCommonData()
    }, [patientId])

    const loadCommonData = async () => {
        try {
            console.log('Loading AQI data for patient:', patientId)
            // Load AQI data with real API
            const aqiData = await fetchRealTimeAQI()
            console.log('Received AQI data:', aqiData)
            setShowAQIAlert(shouldAlertForAQI(aqiData.aqi))
            
            // Load stored common data or initialize
            const stored = localStorage.getItem(`common_patient_data_${patientId}`)
            if (stored) {
                const parsedData = JSON.parse(stored)
                setCommonData({
                    ...parsedData,
                    aqi: {
                        value: aqiData.aqi,
                        pm25: aqiData.pm25,
                        pm10: aqiData.pm10,
                        location: aqiData.location,
                        fetchedAt: aqiData.fetchedAt
                    }
                })
                setCurrentSpo2Rest(parsedData.spo2.atRest.toString())
                setCurrentSpo2Exertion(parsedData.spo2.onExertion.toString())
            } else {
                // Initialize with default data
                const initialData = {
                    ...commonData,
                    aqi: {
                        value: aqiData.aqi,
                        pm25: aqiData.pm25,
                        pm10: aqiData.pm10,
                        location: aqiData.location,
                        fetchedAt: aqiData.fetchedAt
                    },
                    symptoms: DEFAULT_SYMPTOMS.map((name, index) => ({
                        id: `symptom-${index}`,
                        name,
                        score: 1,
                        loggedAt: new Date().toISOString()
                    }))
                }
                setCommonData(initialData)
                saveCommonData(initialData)
            }
        } catch (error) {
            console.error("Error loading common data:", error)
        }
    }

    const saveCommonData = (data: CommonPatientData) => {
        localStorage.setItem(`common_patient_data_${patientId}`, JSON.stringify(data))
        if (onDataUpdate) {
            onDataUpdate(data)
        }
    }

    const updateSpo2 = () => {
        const updatedData = {
            ...commonData,
            spo2: {
                ...commonData.spo2,
                atRest: parseFloat(currentSpo2Rest) || 0,
                onExertion: parseFloat(currentSpo2Exertion) || 0
            }
        }
        setCommonData(updatedData)
        saveCommonData(updatedData)
    }

    const updateConditionStatus = (field: string, value: any) => {
        const updatedData = {
            ...commonData,
            conditionStatus: {
                ...commonData.conditionStatus,
                [field]: value,
                // Reset conflicting fields
                ...(field === 'isStatic' && value && {
                    hasWorsening: false,
                    hasImprovement: false,
                    oxygenChange: 0
                }),
                ...(field === 'hasWorsening' && value && {
                    isStatic: false,
                    hasImprovement: false
                }),
                ...(field === 'hasImprovement' && value && {
                    isStatic: false,
                    hasWorsening: false
                })
            }
        }
        setCommonData(updatedData)
        saveCommonData(updatedData)
    }

    const updateMRCScale = (scale: number) => {
        const updatedData = {
            ...commonData,
            mMRCScale: scale
        }
        setCommonData(updatedData)
        saveCommonData(updatedData)
    }

    const handleSideEffectChange = (effect: string, checked: boolean) => {
        let updatedEffects = [...commonData.sideEffects]
        if (checked) {
            if (!updatedEffects.includes(effect)) {
                updatedEffects.push(effect)
            }
        } else {
            updatedEffects = updatedEffects.filter(e => e !== effect)
        }

        const updatedData = {
            ...commonData,
            sideEffects: updatedEffects
        }
        setCommonData(updatedData)
        saveCommonData(updatedData)
    }

    const addCustomSideEffect = () => {
        if (customSideEffect.trim()) {
            const updatedData = {
                ...commonData,
                sideEffects: [...commonData.sideEffects, customSideEffect.trim()],
                customSideEffect: customSideEffect.trim()
            }
            setCommonData(updatedData)
            saveCommonData(updatedData)
            setCustomSideEffect("")
        }
    }

    const updateSymptomScore = (symptomId: string, score: number) => {
        const updatedSymptoms = commonData.symptoms.map(symptom => 
            symptom.id === symptomId 
                ? { ...symptom, previousScore: symptom.score, score, loggedAt: new Date().toISOString() }
                : symptom
        )
        
        const updatedData = {
            ...commonData,
            symptoms: updatedSymptoms
        }
        setCommonData(updatedData)
        saveCommonData(updatedData)
    }

    const addNewSymptom = () => {
        if (newSymptomName.trim()) {
            const newSymptom: SymptomVAS = {
                id: `symptom-${Date.now()}`,
                name: newSymptomName.trim(),
                score: 1,
                loggedAt: new Date().toISOString()
            }
            
            const updatedData = {
                ...commonData,
                symptoms: [...commonData.symptoms, newSymptom]
            }
            setCommonData(updatedData)
            saveCommonData(updatedData)
            setNewSymptomName("")
        }
    }

    const getMRCDescription = (scale: number) => {
        const descriptions = [
            "Not troubled by breathlessness except on strenuous exercise",
            "Short of breath when hurrying or walking up a slight hill",
            "Walks slower than contemporaries on level ground or stops for breath when walking at own pace",
            "Stops for breath after walking about 100 meters or after a few minutes on level ground",
            "Too breathless to leave the house, or breathless when dressing/undressing"
        ]
        return descriptions[scale] || ""
    }

    return (
        <div className="space-y-6">
            {/* First Log Date */}
            <Card className="p-4">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <div>
                        <h3 className="font-medium">First Log Date & Time</h3>
                        <p className="text-sm text-gray-600">
                            {new Date(commonData.firstLogDate).toLocaleString()}
                        </p>
                    </div>
                </div>
            </Card>

            {/* AQI Section */}
            <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Wind className="w-5 h-5 text-green-600" />
                        <h3 className="font-medium">Air Quality Index (AQI)</h3>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={async () => {
                            try {
                                console.log('Refreshing AQI data...')
                                const freshAQI = await forceRefreshAQI(patientId)
                                console.log('Fresh AQI data:', freshAQI)
                                setCommonData(prev => ({
                                    ...prev,
                                    aqi: {
                                        value: freshAQI.aqi,
                                        pm25: freshAQI.pm25,
                                        pm10: freshAQI.pm10,
                                        location: freshAQI.location,
                                        fetchedAt: freshAQI.fetchedAt
                                    }
                                }))
                                setShowAQIAlert(shouldAlertForAQI(freshAQI.aqi))
                            } catch (error) {
                                console.error('Error refreshing AQI:', error)
                            }
                        }}
                        className="text-xs"
                    >
                        🔄 Refresh
                    </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 rounded-lg" style={{ backgroundColor: `${getAQIColor(commonData.aqi.value)}20` }}>
                        <div className="text-2xl font-bold" style={{ color: getAQIColor(commonData.aqi.value) }}>
                            {commonData.aqi.value}
                        </div>
                        <div className="text-sm font-medium">{getAQICategory(commonData.aqi.value)}</div>
                        <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {commonData.aqi.location}
                        </div>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold text-gray-700">{commonData.aqi.pm25}</div>
                        <div className="text-sm font-medium">PM2.5</div>
                        <div className="text-xs text-gray-600">μg/m³</div>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold text-gray-700">{commonData.aqi.pm10}</div>
                        <div className="text-sm font-medium">PM10</div>
                        <div className="text-xs text-gray-600">μg/m³</div>
                    </div>
                </div>

                {showAQIAlert && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="text-red-800 font-medium">AQI Alert</span>
                        </div>
                        <p className="text-sm text-red-700 mt-1">
                            {getAQIHealthAdvice(commonData.aqi.value, diseaseType)}
                        </p>
                    </div>
                )}
                
                <div className="mt-3 text-xs text-gray-500 text-center">
                    Last updated: {new Date(commonData.aqi.fetchedAt).toLocaleString()}
                </div>
            </Card>

            {/* SpO2 Vitals */}
            <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Droplets className="w-5 h-5 text-blue-600" />
                    <h3 className="font-medium">SpO₂ (Saturation)</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">At Rest (%)</label>
                        <Input
                            type="number"
                            min="70"
                            max="100"
                            value={currentSpo2Rest}
                            onChange={(e) => setCurrentSpo2Rest(e.target.value)}
                            placeholder="Enter SpO2 at rest"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium">On Exertion (%)</label>
                        <Input
                            type="number"
                            min="70"
                            max="100"
                            value={currentSpo2Exertion}
                            onChange={(e) => setCurrentSpo2Exertion(e.target.value)}
                            placeholder="Enter SpO2 on exertion"
                        />
                    </div>
                </div>
                
                <div className="mb-4">
                    <p className="text-sm text-gray-600">
                        Baseline Target: <span className="font-medium">{commonData.spo2.baselineTarget}%</span>
                    </p>
                </div>
                
                <Button onClick={updateSpo2} className="w-full">
                    Update SpO₂ Values
                </Button>
            </Card>

            {/* Condition Status */}
            <Card className="p-4">
                <h3 className="font-medium mb-3">Condition Status</h3>
                
                <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                        <input
                            type="radio"
                            id="static-yes"
                            name="condition-static"
                            checked={commonData.conditionStatus.isStatic}
                            onChange={() => updateConditionStatus('isStatic', true)}
                        />
                        <label htmlFor="static-yes" className="text-sm">Static: Yes</label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <input
                            type="radio"
                            id="static-no"
                            name="condition-static"
                            checked={!commonData.conditionStatus.isStatic}
                            onChange={() => updateConditionStatus('isStatic', false)}
                        />
                        <label htmlFor="static-no" className="text-sm">Static: No</label>
                    </div>

                    {!commonData.conditionStatus.isStatic && (
                        <div className="ml-6 space-y-3">
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        id="worsening"
                                        name="condition-change"
                                        checked={commonData.conditionStatus.hasWorsening}
                                        onChange={() => updateConditionStatus('hasWorsening', true)}
                                    />
                                    <label htmlFor="worsening" className="text-sm">Worsening: Yes</label>
                                </div>
                                {commonData.conditionStatus.hasWorsening && (
                                    <div className="ml-6">
                                        <div className="flex items-center space-x-2">
                                            <label className="text-sm">Oxygen requirement increased by:</label>
                                            <Input
                                                type="number"
                                                step="0.5"
                                                className="w-20"
                                                value={oxygenChangeAmount}
                                                onChange={(e) => {
                                                    setOxygenChangeAmount(e.target.value)
                                                    updateConditionStatus('oxygenChange', parseFloat(e.target.value) || 0)
                                                }}
                                            />
                                            <span className="text-sm">litres</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        id="improvement"
                                        name="condition-change"
                                        checked={commonData.conditionStatus.hasImprovement}
                                        onChange={() => updateConditionStatus('hasImprovement', true)}
                                    />
                                    <label htmlFor="improvement" className="text-sm">Improvement: Yes</label>
                                </div>
                                {commonData.conditionStatus.hasImprovement && (
                                    <div className="ml-6">
                                        <div className="flex items-center space-x-2">
                                            <label className="text-sm">Oxygen requirement decreased by:</label>
                                            <Input
                                                type="number"
                                                step="0.5"
                                                className="w-20"
                                                value={oxygenChangeAmount}
                                                onChange={(e) => {
                                                    setOxygenChangeAmount(e.target.value)
                                                    updateConditionStatus('oxygenChange', parseFloat(e.target.value) || 0)
                                                }}
                                            />
                                            <span className="text-sm">litres</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* mMRC Breathlessness Scale */}
            <Card className="p-4">
                <h3 className="font-medium mb-3">mMRC Breathlessness Scale (0-4)</h3>
                
                <div className="space-y-3">
                    {[0, 1, 2, 3, 4].map(scale => (
                        <div key={scale} className="flex items-start space-x-3">
                            <input
                                type="radio"
                                id={`mmrc-${scale}`}
                                name="mmrc-scale"
                                checked={commonData.mMRCScale === scale}
                                onChange={() => updateMRCScale(scale)}
                                className="mt-1"
                            />
                            <div className="flex-1">
                                <label htmlFor={`mmrc-${scale}`} className="text-sm font-medium">
                                    Grade {scale}
                                </label>
                                <p className="text-xs text-gray-600 mt-1">
                                    {getMRCDescription(scale)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Side Effects */}
            <Card className="p-4">
                <h3 className="font-medium mb-3">Side Effects</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                    {SIDE_EFFECTS_LIST.map(effect => (
                        <div key={effect} className="flex items-center space-x-2">
                            <Checkbox
                                id={effect}
                                checked={commonData.sideEffects.includes(effect)}
                                onCheckedChange={(checked) => handleSideEffectChange(effect, checked as boolean)}
                            />
                            <label htmlFor={effect} className="text-sm">{effect}</label>
                        </div>
                    ))}
                </div>

                {commonData.sideEffects.includes("Other") && (
                    <div className="flex gap-2">
                        <Input
                            placeholder="Specify other side effect"
                            value={customSideEffect}
                            onChange={(e) => setCustomSideEffect(e.target.value)}
                        />
                        <Button onClick={addCustomSideEffect} size="sm">
                            Add
                        </Button>
                    </div>
                )}
            </Card>

            {/* Symptoms VAS Scale */}
            <Card className="p-4">
                <h3 className="font-medium mb-3">Symptoms (VAS Scale 1-10)</h3>
                
                <div className="space-y-4">
                    {commonData.symptoms.map(symptom => (
                        <div key={symptom.id} className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium">{symptom.name}</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">
                                        Current: {symptom.score}
                                        {symptom.previousScore && (
                                            <span className="text-gray-500"> (Previous: {symptom.previousScore})</span>
                                        )}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">1</span>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={symptom.score}
                                    onChange={(e) => updateSymptomScore(symptom.id, parseInt(e.target.value))}
                                    className="flex-1"
                                />
                                <span className="text-xs text-gray-500">10</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 pt-4 border-t">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Add new symptom"
                            value={newSymptomName}
                            onChange={(e) => setNewSymptomName(e.target.value)}
                        />
                        <Button onClick={addNewSymptom} size="sm">
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}