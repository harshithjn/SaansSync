"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "../../../../components/ui/badge"
import { PatientDashboardData } from "@/lib/auth-types"
import { getStoredSession } from "@/lib/auth-utils"

export default function PostICUPatientDashboard() {
    const [patientData, setPatientData] = useState<PatientDashboardData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadPatientData = async () => {
            const session = getStoredSession()
            if (!session) return

            // Simulate API call to fetch patient data
            const mockData: PatientDashboardData = {
                patientId: session.patientId,
                fullName: "Alice Brown",
                diagnosis: {
                    primaryCategory: "Post ICU Recovery",
                    subtype: "COVID ICU recovery",
                    dateOfDiagnosis: "2023-11-28"
                },
                latestMedications: [
                    { drugName: "PREDNISOLONE", dose: "20 mg", frequency: "Once daily (OD)", isActive: true },
                    { drugName: "SALBUTAMOL", dose: "100 mcg", frequency: "As needed (PRN)", isActive: true },
                    { drugName: "OMEPRAZOLE", dose: "20 mg", frequency: "Once daily (OD)", isActive: true },
                    { drugName: "VITAMIN D3", dose: "1000 IU", frequency: "Once daily (OD)", isActive: true }
                ],
                latestPFT: {
                    testDate: "2024-01-12",
                    fvc: "68",
                    fev1: "70",
                    dlco: "55",
                    sixMWD: "320",
                    minSpO2: "87",
                    maxSpO2: "94"
                },
                respiratorySupport: {
                    ltot: { enabled: true, oxygenLitres: "1.5" }
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
                    Here's your personalized recovery dashboard for Post ICU Care
                </p>
            </div>

            {/* Recovery Status */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-blue-600">Your Recovery Journey</h2>
                <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                        <Badge variant="default" className="text-sm px-3 py-1">
                            {patientData.diagnosis.subtype}
                        </Badge>
                        <span className="text-sm text-gray-500">
                            ICU Discharge: {new Date(patientData.diagnosis.dateOfDiagnosis).toLocaleDateString()}
                        </span>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-medium text-blue-800 mb-2">About Your Recovery</h3>
                        <p className="text-sm text-blue-700">
                            You're recovering from a serious illness that required intensive care. Recovery takes time,
                            and it's normal to experience fatigue, weakness, and breathing difficulties. With proper care,
                            rehabilitation, and patience, most people continue to improve over months.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Recovery Progress */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-green-600">Recovery Milestones</h2>
                <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                            <div className="font-medium">Discharged from ICU</div>
                            <div className="text-sm text-gray-600">
                                {new Date(patientData.diagnosis.dateOfDiagnosis).toLocaleDateString()}
                            </div>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Complete</Badge>
                    </div>

                    <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                            <div className="font-medium">Breathing independently</div>
                            <div className="text-sm text-gray-600">Off mechanical ventilation</div>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Complete</Badge>
                    </div>

                    <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                        <div className="flex-1">
                            <div className="font-medium">Building strength & endurance</div>
                            <div className="text-sm text-gray-600">Ongoing rehabilitation</div>
                        </div>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">In Progress</Badge>
                    </div>

                    <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                        <div className="flex-1">
                            <div className="font-medium">Return to normal activities</div>
                            <div className="text-sm text-gray-600">Goal for coming months</div>
                        </div>
                        <Badge variant="outline">Future Goal</Badge>
                    </div>
                </div>
            </Card>

            {/* Current Medications */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-purple-600">Recovery Medications</h2>
                <div className="space-y-3">
                    {patientData.latestMedications.filter(med => med.isActive).map((medication, index) => {
                        const isSteroid = medication.drugName.includes('PREDNISOLONE')
                        const isVitamin = medication.drugName.includes('VITAMIN')
                        const isBronchodilator = medication.drugName.includes('SALBUTAMOL')

                        return (
                            <div key={index} className={`p-4 rounded-lg border ${isSteroid ? 'bg-orange-50 border-orange-200' :
                                    isVitamin ? 'bg-yellow-50 border-yellow-200' :
                                        isBronchodilator ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                                }`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-medium flex items-center space-x-2">
                                            <span>{medication.drugName}</span>
                                            <Badge variant="outline" className="text-xs">
                                                {isSteroid ? 'Anti-inflammatory' :
                                                    isVitamin ? 'Supplement' :
                                                        isBronchodilator ? 'Bronchodilator' : 'Medication'}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-gray-600">{medication.dose}</div>
                                        <div className="text-sm text-gray-600">{medication.frequency}</div>
                                    </div>
                                </div>

                                {isSteroid && (
                                    <div className="mt-2 text-xs text-orange-700">
                                        Helps reduce lung inflammation from your illness
                                    </div>
                                )}
                                {isVitamin && (
                                    <div className="mt-2 text-xs text-yellow-700">
                                        Supports bone health and immune system recovery
                                    </div>
                                )}
                                {isBronchodilator && (
                                    <div className="mt-2 text-xs text-green-700">
                                        Use when you feel short of breath
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <strong>Recovery Note:</strong> Your medications may be adjusted as you recover.
                        Some medications like steroids will be gradually reduced over time.
                    </p>
                </div>
            </Card>

            {/* Oxygen Support */}
            {patientData.respiratorySupport?.ltot?.enabled && (
                <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4 text-red-600">Oxygen Support</h2>
                    <div className="p-4 bg-red-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Home Oxygen Therapy</span>
                            <Badge variant="destructive">Active</Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                            Prescribed Flow Rate: <strong>{patientData.respiratorySupport.ltot.oxygenLitres} L/min</strong>
                        </p>
                        <div className="text-xs text-gray-600 space-y-1">
                            <p>• Use oxygen as prescribed to help your lungs heal</p>
                            <p>• Your oxygen needs may decrease as you recover</p>
                            <p>• Keep oxygen equipment clean and well-maintained</p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Latest PFT Results */}
            {patientData.latestPFT && (
                <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4 text-indigo-600">Lung Function Recovery</h2>
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

                    <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <p className="text-sm text-indigo-800">
                            <strong>Recovery Progress:</strong> Your lung function is gradually improving.
                            It's normal for recovery to take several months after a serious illness.
                        </p>
                    </div>
                </Card>
            )}

            {/* Rehabilitation Plan */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-green-600">Your Rehabilitation Plan</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                        <h3 className="font-medium text-green-800 mb-2">Physical Recovery</h3>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>• Gentle breathing exercises daily</li>
                            <li>• Short walks, increasing gradually</li>
                            <li>• Simple strength exercises</li>
                            <li>• Rest when you feel tired</li>
                        </ul>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-medium text-blue-800 mb-2">Mental & Emotional Health</h3>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• It's normal to feel anxious or sad</li>
                            <li>• Talk to family and friends</li>
                            <li>• Consider counseling if needed</li>
                            <li>• Practice relaxation techniques</li>
                        </ul>
                    </div>
                </div>
            </Card>

            {/* Warning Signs */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-red-600">When to Seek Help</h2>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="font-medium text-red-800 mb-2">Contact your healthcare team if you experience:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>• Worsening shortness of breath</li>
                            <li>• Chest pain or pressure</li>
                            <li>• Fever or signs of infection</li>
                            <li>• Severe fatigue or weakness</li>
                        </ul>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>• Confusion or memory problems</li>
                            <li>• Difficulty sleeping or eating</li>
                            <li>• Severe anxiety or depression</li>
                            <li>• Any concerning new symptoms</li>
                        </ul>
                    </div>
                </div>
            </Card>

            {/* Recovery Tips */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-purple-600">Recovery Tips</h2>
                <div className="space-y-4">
                    <div className="p-4 bg-purple-50 rounded-lg">
                        <h3 className="font-medium text-purple-800 mb-2">Be Patient with Yourself</h3>
                        <p className="text-sm text-purple-700">
                            Recovery from critical illness takes time - often months. Some days will be better than others.
                            This is completely normal and part of the healing process.
                        </p>
                    </div>

                    <div className="p-4 bg-yellow-50 rounded-lg">
                        <h3 className="font-medium text-yellow-800 mb-2">Stay Connected</h3>
                        <p className="text-sm text-yellow-700">
                            Keep in touch with your healthcare team, family, and friends. Don't hesitate to ask for help
                            when you need it. Recovery is easier with support.
                        </p>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                        <h3 className="font-medium text-green-800 mb-2">Celebrate Small Wins</h3>
                        <p className="text-sm text-green-700">
                            Every small improvement is progress. Whether it's walking a bit further or feeling less tired,
                            acknowledge these victories in your recovery journey.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    )
}