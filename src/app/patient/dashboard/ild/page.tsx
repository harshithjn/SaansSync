"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "../../../../components/ui/badge"
import { PatientDashboardData } from "@/lib/auth-types"
import { getStoredSession } from "@/lib/auth-utils"

export default function ILDPatientDashboard() {
    const [patientData, setPatientData] = useState<PatientDashboardData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadPatientData = async () => {
            const session = getStoredSession()
            if (!session) return

            // Simulate API call to fetch patient data
            const mockData: PatientDashboardData = {
                patientId: session.patientId,
                fullName: "John Doe",
                diagnosis: {
                    primaryCategory: "Interstitial Lung Disease (ILD)",
                    subtype: "Idiopathic pulmonary fibrosis",
                    dateOfDiagnosis: "2023-06-15"
                },
                latestMedications: [
                    { drugName: "PIRFENIDONE", dose: "267 mg", frequency: "Three times daily (TDS)", isActive: true },
                    { drugName: "PREDNISOLONE", dose: "10 mg", frequency: "Once daily (OD)", isActive: true },
                    { drugName: "OMEPRAZOLE", dose: "20 mg", frequency: "Once daily (OD)", isActive: true }
                ],
                latestPFT: {
                    testDate: "2024-01-15",
                    fvc: "65",
                    fev1: "68",
                    dlco: "45",
                    sixMWD: "380",
                    minSpO2: "89",
                    maxSpO2: "95"
                },
                respiratorySupport: {
                    ltot: { enabled: true, oxygenLitres: "2.0" }
                },
                smokingHistory: {
                    status: "Former Smoker",
                    packYears: "15"
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
                    Here's your personalized health dashboard for Interstitial Lung Disease (ILD)
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
                            Idiopathic Pulmonary Fibrosis (IPF) is a type of lung disease that causes scarring (fibrosis)
                            of the lungs. The scarring makes it harder for your lungs to work properly and can make it
                            difficult to breathe.
                        </p>
                    </div>
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

                        {patientData.latestPFT.dlco && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-600">DLCO (Gas Transfer)</div>
                                <div className="text-xl font-semibold">{patientData.latestPFT.dlco}%</div>
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

            {/* Current Medications */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-green-600">Current Medications</h2>
                <div className="space-y-3">
                    {patientData.latestMedications.filter(med => med.isActive).map((medication, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                            <div>
                                <div className="font-medium">{medication.drugName}</div>
                                <div className="text-sm text-gray-600">{medication.dose}</div>
                            </div>
                            <div className="text-sm text-gray-600">
                                {medication.frequency}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                        <strong>Important:</strong> Take your medications exactly as prescribed.
                        Do not stop or change doses without consulting your doctor.
                    </p>
                </div>
            </Card>

            {/* Oxygen Therapy */}
            {patientData.respiratorySupport?.ltot?.enabled && (
                <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4 text-red-600">Oxygen Therapy</h2>
                    <div className="p-4 bg-red-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Long Term Oxygen Therapy (LTOT)</span>
                            <Badge variant="destructive">Active</Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                            Prescribed Flow Rate: <strong>{patientData.respiratorySupport.ltot.oxygenLitres} L/min</strong>
                        </p>
                        <p className="text-xs text-gray-600">
                            Use oxygen therapy as prescribed to help maintain proper oxygen levels in your blood.
                        </p>
                    </div>
                </Card>
            )}

            {/* Disease Timeline */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-indigo-600">Your Health Journey</h2>
                <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                            <div className="font-medium">Diagnosis Confirmed</div>
                            <div className="text-sm text-gray-600">
                                {new Date(patientData.diagnosis.dateOfDiagnosis).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    {patientData.latestPFT && (
                        <div className="flex items-start space-x-3">
                            <div className="w-3 h-3 bg-purple-500 rounded-full mt-2"></div>
                            <div>
                                <div className="font-medium">Latest Lung Function Test</div>
                                <div className="text-sm text-gray-600">
                                    {new Date(patientData.latestPFT.testDate).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    )}

                    {patientData.respiratorySupport?.ltot?.enabled && (
                        <div className="flex items-start space-x-3">
                            <div className="w-3 h-3 bg-red-500 rounded-full mt-2"></div>
                            <div>
                                <div className="font-medium">Oxygen Therapy Started</div>
                                <div className="text-sm text-gray-600">Supporting your breathing</div>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Smoking History */}
            {patientData.smokingHistory && (
                <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4 text-orange-600">Smoking History</h2>
                    <div className="p-4 bg-orange-50 rounded-lg">
                        <p className="text-sm">
                            <strong>Status:</strong> {patientData.smokingHistory.status}
                            {patientData.smokingHistory.packYears && (
                                <span> ({patientData.smokingHistory.packYears} pack years)</span>
                            )}
                        </p>
                        {patientData.smokingHistory.status !== "Never Smoked" && (
                            <p className="text-xs text-orange-700 mt-2">
                                Smoking cessation is crucial for managing ILD. If you need help quitting,
                                please discuss with your healthcare team.
                            </p>
                        )}
                    </div>
                </Card>
            )}
        </div>
    )
}