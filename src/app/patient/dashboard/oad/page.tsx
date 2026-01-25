"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "../../../../components/ui/badge"
import { PatientDashboardData } from "@/lib/auth-types"
import { getStoredSession } from "@/lib/auth-utils"

export default function OADPatientDashboard() {
    const [patientData, setPatientData] = useState<PatientDashboardData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadPatientData = async () => {
            const session = getStoredSession()
            if (!session) return

            // Simulate API call to fetch patient data
            const mockData: PatientDashboardData = {
                patientId: session.patientId,
                fullName: "Jane Smith",
                diagnosis: {
                    primaryCategory: "Obstructive Airway Disease (OAD)",
                    subtype: "COPD",
                    dateOfDiagnosis: "2022-03-20"
                },
                latestMedications: [
                    { drugName: "SALBUTAMOL", dose: "100 mcg", frequency: "As needed (PRN)", isActive: true },
                    { drugName: "TIOTROPIUM", dose: "18 mcg", frequency: "Once daily (OD)", isActive: true },
                    { drugName: "BUDESONIDE/FORMOTEROL", dose: "160/4.5 mcg", frequency: "Twice daily (BD)", isActive: true },
                    { drugName: "PREDNISOLONE", dose: "5 mg", frequency: "Once daily (OD)", isActive: true }
                ],
                latestPFT: {
                    testDate: "2024-01-10",
                    fvc: "72",
                    fev1: "58",
                    dlco: "75",
                    sixMWD: "420",
                    minSpO2: "91",
                    maxSpO2: "96"
                },
                smokingHistory: {
                    status: "Former Smoker",
                    packYears: "25"
                }
            }

            setPatientData(mockData)
            setIsLoading(false)
        }

        loadPatientData()
    }, [])

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-4">
                        <div className="h-32 bg-gray-200 rounded"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (!patientData) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">Unable to load patient data</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Welcome, {patientData.fullName}
                </h1>
                <p className="text-gray-600">
                    Here's your personalized health dashboard for Obstructive Airway Disease (OAD)
                </p>
            </div>

            {/* Diagnosis Summary */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-blue-600">Your Diagnosis</h2>
                <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                        <Badge variant="default" className="text-sm px-3 py-1">
                            {patientData.diagnosis.subtype}
                        </Badge>
                        <span className="text-sm text-gray-500">
                            Diagnosed: {new Date(patientData.diagnosis.dateOfDiagnosis).toLocaleDateString()}
                        </span>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-medium text-blue-800 mb-2">About Your Condition</h3>
                        <p className="text-sm text-blue-700">
                            COPD (Chronic Obstructive Pulmonary Disease) is a lung disease that makes it hard to breathe.
                            It's caused by damage to the airways and air sacs in your lungs, often from smoking.
                            With proper treatment and lifestyle changes, symptoms can be managed effectively.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Inhaler Medications */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-green-600">Your Inhalers & Medications</h2>
                <div className="space-y-3">
                    {patientData.latestMedications.filter(med => med.isActive).map((medication, index) => {
                        const isInhaler = medication.drugName.includes('SALBUTAMOL') ||
                            medication.drugName.includes('TIOTROPIUM') ||
                            medication.drugName.includes('BUDESONIDE')

                        return (
                            <div key={index} className={`p-4 rounded-lg ${isInhaler ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-medium flex items-center space-x-2">
                                            <span>{medication.drugName}</span>
                                            {isInhaler && <Badge variant="outline" className="text-xs">Inhaler</Badge>}
                                        </div>
                                        <div className="text-sm text-gray-600">{medication.dose}</div>
                                        <div className="text-sm text-gray-600">{medication.frequency}</div>
                                    </div>

                                    {isInhaler && (
                                        <div className="text-right">
                                            <div className="text-xs text-green-700">
                                                {medication.drugName.includes('SALBUTAMOL') ? 'Rescue Inhaler' :
                                                    medication.drugName.includes('TIOTROPIUM') ? 'Daily Controller' :
                                                        'Combination Inhaler'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">Inhaler Tips:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Use your rescue inhaler (Salbutamol) when you feel short of breath</li>
                        <li>• Take your daily controller inhalers even when you feel well</li>
                        <li>• Rinse your mouth after using steroid inhalers</li>
                        <li>• Keep your rescue inhaler with you at all times</li>
                    </ul>
                </div>
            </Card>

            {/* Latest PFT Results */}
            {patientData.latestPFT && (
                <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4 text-purple-600">Latest Lung Function Tests</h2>
                    <div className="text-sm text-gray-600 mb-4">
                        Test Date: {new Date(patientData.latestPFT.testDate).toLocaleDateString()}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {patientData.latestPFT.fvc && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-600">FVC (Lung Capacity)</div>
                                <div className="text-xl font-semibold">{patientData.latestPFT.fvc}%</div>
                                <div className="text-xs text-gray-500">Normal: 80-120%</div>
                            </div>
                        )}

                        {patientData.latestPFT.fev1 && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-600">FEV1 (Airflow)</div>
                                <div className="text-xl font-semibold">{patientData.latestPFT.fev1}%</div>
                                <div className="text-xs text-gray-500">Normal: 80-120%</div>
                            </div>
                        )}

                        {patientData.latestPFT.sixMWD && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-600">6-Minute Walk</div>
                                <div className="text-xl font-semibold">{patientData.latestPFT.sixMWD}m</div>
                                <div className="text-xs text-gray-500">Normal: 400-700m</div>
                            </div>
                        )}

                        {patientData.latestPFT.minSpO2 && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-600">Min Oxygen Level</div>
                                <div className="text-xl font-semibold">{patientData.latestPFT.minSpO2}%</div>
                                <div className="text-xs text-gray-500">Normal: ≥88%</div>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Smoking History & Cessation */}
            {patientData.smokingHistory && (
                <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4 text-orange-600">Smoking History</h2>
                    <div className="p-4 bg-orange-50 rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="font-medium">Status: {patientData.smokingHistory.status}</p>
                                {patientData.smokingHistory.packYears && (
                                    <p className="text-sm text-gray-600">
                                        Total exposure: {patientData.smokingHistory.packYears} pack years
                                    </p>
                                )}
                            </div>
                            {patientData.smokingHistory.status === "Former Smoker" && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    Quit Smoking ✓
                                </Badge>
                            )}
                        </div>

                        {patientData.smokingHistory.status === "Former Smoker" ? (
                            <div className="p-3 bg-green-50 border border-green-200 rounded">
                                <p className="text-sm text-green-800">
                                    <strong>Congratulations!</strong> Quitting smoking is the most important thing you can do
                                    for your COPD. Your lungs are already starting to heal.
                                </p>
                            </div>
                        ) : patientData.smokingHistory.status === "Current Smoker" ? (
                            <div className="p-3 bg-red-50 border border-red-200 rounded">
                                <p className="text-sm text-red-800">
                                    <strong>Important:</strong> Quitting smoking is crucial for managing COPD.
                                    Please talk to your doctor about smoking cessation programs and support.
                                </p>
                            </div>
                        ) : (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                                <p className="text-sm text-blue-800">
                                    Great job never smoking! This helps protect your lungs from further damage.
                                </p>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* COPD Management Tips */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-indigo-600">Managing Your COPD</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-indigo-50 rounded-lg">
                        <h3 className="font-medium text-indigo-800 mb-2">Daily Care</h3>
                        <ul className="text-sm text-indigo-700 space-y-1">
                            <li>• Take medications as prescribed</li>
                            <li>• Use inhalers correctly</li>
                            <li>• Stay active with gentle exercise</li>
                            <li>• Avoid lung irritants</li>
                        </ul>
                    </div>

                    <div className="p-4 bg-red-50 rounded-lg">
                        <h3 className="font-medium text-red-800 mb-2">When to Call Your Doctor</h3>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>• Increased shortness of breath</li>
                            <li>• Change in mucus color or amount</li>
                            <li>• Fever or signs of infection</li>
                            <li>• Rescue inhaler not helping</li>
                        </ul>
                    </div>
                </div>
            </Card>

            {/* Action Plan */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-green-600">Your COPD Action Plan</h2>
                <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            1
                        </div>
                        <div>
                            <div className="font-medium text-green-800">Green Zone - Feeling Good</div>
                            <div className="text-sm text-gray-600">
                                Take your daily medications, stay active, avoid triggers
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            2
                        </div>
                        <div>
                            <div className="font-medium text-yellow-800">Yellow Zone - Caution</div>
                            <div className="text-sm text-gray-600">
                                Increased symptoms: Use rescue inhaler, rest, monitor closely
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            3
                        </div>
                        <div>
                            <div className="font-medium text-red-800">Red Zone - Seek Help</div>
                            <div className="text-sm text-gray-600">
                                Severe symptoms: Call your doctor or emergency services immediately
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}