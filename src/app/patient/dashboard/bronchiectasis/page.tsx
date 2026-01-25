"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "../../../../components/ui/badge"
import { PatientDashboardData } from "@/lib/auth-types"
import { getStoredSession } from "@/lib/auth-utils"

export default function BronchiectasisPatientDashboard() {
    const [patientData, setPatientData] = useState<PatientDashboardData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadPatientData = async () => {
            const session = getStoredSession()
            if (!session) return

            // Simulate API call to fetch patient data
            const mockData: PatientDashboardData = {
                patientId: session.patientId,
                fullName: "Bob Wilson",
                diagnosis: {
                    primaryCategory: "Bronchiectasis",
                    subtype: "Post-infectious",
                    dateOfDiagnosis: "2021-09-12"
                },
                latestMedications: [
                    { drugName: "AZITHROMYCIN", dose: "250 mg", frequency: "Three times weekly", isActive: true },
                    { drugName: "HYPERTONIC SALINE", dose: "3%", frequency: "Twice daily (BD)", isActive: true },
                    { drugName: "SALBUTAMOL", dose: "100 mcg", frequency: "As needed (PRN)", isActive: true },
                    { drugName: "CARBOCISTEINE", dose: "375 mg", frequency: "Three times daily (TDS)", isActive: true }
                ],
                latestPFT: {
                    testDate: "2024-01-08",
                    fvc: "78",
                    fev1: "65",
                    dlco: "82",
                    sixMWD: "450",
                    minSpO2: "92",
                    maxSpO2: "97"
                },
                smokingHistory: {
                    status: "Never Smoked"
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
                    Here's your personalized health dashboard for Bronchiectasis
                </p>
            </div>

            {/* Diagnosis Summary */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-blue-600">Your Diagnosis</h2>
                <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                        <Badge variant="default" className="text-sm px-3 py-1">
                            {patientData.diagnosis.subtype} Bronchiectasis
                        </Badge>
                        <span className="text-sm text-gray-500">
                            Diagnosed: {new Date(patientData.diagnosis.dateOfDiagnosis).toLocaleDateString()}
                        </span>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-medium text-blue-800 mb-2">About Your Condition</h3>
                        <p className="text-sm text-blue-700">
                            Bronchiectasis is a condition where the airways in your lungs become abnormally widened and thickened.
                            This can lead to infections and difficulty clearing mucus. With proper treatment including airway
                            clearance and medications, symptoms can be well managed.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Airway Clearance & Medications */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-green-600">Your Treatment Plan</h2>
                <div className="space-y-4">
                    {patientData.latestMedications.filter(med => med.isActive).map((medication, index) => {
                        const isAirwayClearance = medication.drugName.includes('HYPERTONIC SALINE') ||
                            medication.drugName.includes('CARBOCISTEINE')
                        const isAntibiotic = medication.drugName.includes('AZITHROMYCIN')
                        const isBronchodilator = medication.drugName.includes('SALBUTAMOL')

                        return (
                            <div key={index} className={`p-4 rounded-lg border ${isAirwayClearance ? 'bg-blue-50 border-blue-200' :
                                    isAntibiotic ? 'bg-purple-50 border-purple-200' :
                                        isBronchodilator ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                                }`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-medium flex items-center space-x-2">
                                            <span>{medication.drugName}</span>
                                            <Badge variant="outline" className="text-xs">
                                                {isAirwayClearance ? 'Airway Clearance' :
                                                    isAntibiotic ? 'Antibiotic' :
                                                        isBronchodilator ? 'Bronchodilator' : 'Medication'}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-gray-600">{medication.dose}</div>
                                        <div className="text-sm text-gray-600">{medication.frequency}</div>
                                    </div>
                                </div>

                                {isAirwayClearance && (
                                    <div className="mt-2 text-xs text-blue-700">
                                        Helps thin and clear mucus from your airways
                                    </div>
                                )}
                                {isAntibiotic && (
                                    <div className="mt-2 text-xs text-purple-700">
                                        Helps prevent bacterial infections in your lungs
                                    </div>
                                )}
                                {isBronchodilator && (
                                    <div className="mt-2 text-xs text-green-700">
                                        Opens airways to help you breathe easier
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </Card>

            {/* Airway Clearance Techniques */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-indigo-600">Daily Airway Clearance</h2>
                <div className="p-4 bg-indigo-50 rounded-lg">
                    <h3 className="font-medium text-indigo-800 mb-3">Your Daily Routine</h3>
                    <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                1
                            </div>
                            <div>
                                <div className="font-medium">Hypertonic Saline Nebulizer</div>
                                <div className="text-sm text-gray-600">Use twice daily to help loosen mucus</div>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                2
                            </div>
                            <div>
                                <div className="font-medium">Chest Physiotherapy</div>
                                <div className="text-sm text-gray-600">Perform airway clearance techniques as taught</div>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                3
                            </div>
                            <div>
                                <div className="font-medium">Exercise & Activity</div>
                                <div className="text-sm text-gray-600">Stay active to help clear secretions naturally</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                        <strong>Remember:</strong> Consistent daily airway clearance is key to preventing infections
                        and maintaining good lung health with bronchiectasis.
                    </p>
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

            {/* Infection Prevention */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-red-600">Preventing Lung Infections</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-red-50 rounded-lg">
                        <h3 className="font-medium text-red-800 mb-2">Daily Prevention</h3>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>• Take antibiotics as prescribed</li>
                            <li>• Complete daily airway clearance</li>
                            <li>• Stay hydrated (8+ glasses water/day)</li>
                            <li>• Avoid people with colds/flu</li>
                            <li>• Get annual flu vaccination</li>
                        </ul>
                    </div>

                    <div className="p-4 bg-orange-50 rounded-lg">
                        <h3 className="font-medium text-orange-800 mb-2">Warning Signs</h3>
                        <ul className="text-sm text-orange-700 space-y-1">
                            <li>• Increased cough or sputum</li>
                            <li>• Change in sputum color (yellow/green)</li>
                            <li>• Fever or feeling unwell</li>
                            <li>• Increased shortness of breath</li>
                            <li>• Fatigue or loss of appetite</li>
                        </ul>
                    </div>
                </div>

                <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                    <p className="text-sm text-red-800">
                        <strong>Important:</strong> Contact your healthcare team immediately if you notice any warning signs.
                        Early treatment of infections is crucial for bronchiectasis management.
                    </p>
                </div>
            </Card>

            {/* Lifestyle Management */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-green-600">Living Well with Bronchiectasis</h2>
                <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                        <h3 className="font-medium text-green-800 mb-2">Exercise & Activity</h3>
                        <p className="text-sm text-green-700 mb-2">
                            Regular exercise helps clear secretions and improves overall lung health.
                        </p>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>• Walking, swimming, or cycling</li>
                            <li>• Start slowly and build up gradually</li>
                            <li>• Exercise helps natural airway clearance</li>
                        </ul>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-medium text-blue-800 mb-2">Nutrition & Hydration</h3>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Drink plenty of water to thin secretions</li>
                            <li>• Eat a balanced diet rich in vitamins</li>
                            <li>• Consider vitamin D supplementation</li>
                            <li>• Maintain a healthy weight</li>
                        </ul>
                    </div>
                </div>
            </Card>

            {/* Treatment Timeline */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-600">Your Treatment Journey</h2>
                <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                            <div className="font-medium">Diagnosis Confirmed</div>
                            <div className="text-sm text-gray-600">
                                {new Date(patientData.diagnosis.dateOfDiagnosis).toLocaleDateString()} -
                                Post-infectious bronchiectasis identified
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start space-x-3">
                        <div className="w-3 h-3 bg-purple-500 rounded-full mt-2"></div>
                        <div>
                            <div className="font-medium">Antibiotic Therapy Started</div>
                            <div className="text-sm text-gray-600">Long-term azithromycin to prevent infections</div>
                        </div>
                    </div>

                    <div className="flex items-start space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                        <div>
                            <div className="font-medium">Airway Clearance Program</div>
                            <div className="text-sm text-gray-600">Daily routine established for optimal lung health</div>
                        </div>
                    </div>

                    {patientData.latestPFT && (
                        <div className="flex items-start space-x-3">
                            <div className="w-3 h-3 bg-indigo-500 rounded-full mt-2"></div>
                            <div>
                                <div className="font-medium">Latest Lung Function Test</div>
                                <div className="text-sm text-gray-600">
                                    {new Date(patientData.latestPFT.testDate).toLocaleDateString()} -
                                    Monitoring disease progression
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
}