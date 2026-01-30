"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { getStoredSession } from "@/lib/auth-utils"

interface Medication {
    id: string
    drugName: string
    dose: string
    frequency: string
    route: string
    startDate: string
    endDate?: string
    isActive: boolean
    instructions: string
    sideEffects: string[]
    category: string
}

export default function PatientMedicationsPage() {
    const [medications, setMedications] = useState<Medication[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadMedications = async () => {
            const session = getStoredSession()
            if (!session) return

            // Simulate API call to fetch medications
            const mockMedications: Medication[] = [
                {
                    id: "med-001",
                    drugName: "PIRFENIDONE",
                    dose: "267 mg",
                    frequency: "Three times daily (TDS)",
                    route: "Oral",
                    startDate: "2023-06-15",
                    isActive: true,
                    instructions: "Take with food to reduce stomach upset. Take at the same times each day.",
                    sideEffects: ["Nausea", "Skin sensitivity to sunlight", "Fatigue", "Loss of appetite"],
                    category: "Anti-fibrotic"
                },
                {
                    id: "med-002",
                    drugName: "PREDNISOLONE",
                    dose: "10 mg",
                    frequency: "Once daily (OD)",
                    route: "Oral",
                    startDate: "2023-10-20",
                    isActive: true,
                    instructions: "Take in the morning with food. Do not stop suddenly - must be tapered gradually.",
                    sideEffects: ["Increased appetite", "Weight gain", "Mood changes", "Difficulty sleeping"],
                    category: "Steroid"
                },
                {
                    id: "med-003",
                    drugName: "OMEPRAZOLE",
                    dose: "20 mg",
                    frequency: "Once daily (OD)",
                    route: "Oral",
                    startDate: "2023-06-15",
                    isActive: true,
                    instructions: "Take 30 minutes before breakfast on an empty stomach.",
                    sideEffects: ["Headache", "Stomach pain", "Diarrhea"],
                    category: "Acid reducer"
                },
                {
                    id: "med-004",
                    drugName: "SALBUTAMOL",
                    dose: "100 mcg",
                    frequency: "As needed (PRN)",
                    route: "Inhalation",
                    startDate: "2023-06-15",
                    isActive: true,
                    instructions: "Use when you feel short of breath. Shake inhaler before use. Rinse mouth after use.",
                    sideEffects: ["Tremor", "Fast heartbeat", "Headache"],
                    category: "Bronchodilator"
                },
                {
                    id: "med-005",
                    drugName: "AZITHROMYCIN",
                    dose: "500 mg",
                    frequency: "Once daily (OD)",
                    route: "Oral",
                    startDate: "2023-03-01",
                    endDate: "2023-03-07",
                    isActive: false,
                    instructions: "Complete the full course even if you feel better.",
                    sideEffects: ["Nausea", "Diarrhea", "Stomach pain"],
                    category: "Antibiotic"
                }
            ]

            setMedications(mockMedications)
            setIsLoading(false)
        }

        loadMedications()
    }, [])

    const activeMedications = medications.filter(med => med.isActive)
    const pastMedications = medications.filter(med => !med.isActive)

    const getCategoryColor = (category: string) => {
        switch (category.toLowerCase()) {
            case 'anti-fibrotic':
                return 'bg-blue-100 text-blue-800'
            case 'steroid':
                return 'bg-orange-100 text-orange-800'
            case 'bronchodilator':
                return 'bg-green-100 text-green-800'
            case 'antibiotic':
                return 'bg-purple-100 text-purple-800'
            case 'acid reducer':
                return 'bg-yellow-100 text-yellow-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-4">
                        <div className="h-32 bg-gray-200 rounded"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">My Medications</h1>
                <p className="text-gray-600">
                    View your current and past medications with detailed instructions
                </p>
            </div>

            {/* Current Medications */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-green-600">
                    Current Medications ({activeMedications.length})
                </h2>

                {activeMedications.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>No current medications on file.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activeMedications.map((medication) => (
                            <div key={medication.id} className="p-4 border rounded-lg bg-green-50">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-semibold text-lg">{medication.drugName}</h3>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <Badge className={getCategoryColor(medication.category)}>
                                                {medication.category}
                                            </Badge>
                                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                                                Active
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium">{medication.dose}</div>
                                        <div className="text-sm text-gray-600">{medication.frequency}</div>
                                        <div className="text-xs text-gray-500">{medication.route}</div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="p-3 bg-white rounded border-l-4 border-blue-500">
                                        <h4 className="font-medium text-sm text-blue-800 mb-1">Instructions</h4>
                                        <p className="text-sm text-gray-700">{medication.instructions}</p>
                                    </div>

                                    {medication.sideEffects.length > 0 && (
                                        <div className="p-3 bg-white rounded border-l-4 border-yellow-500">
                                            <h4 className="font-medium text-sm text-yellow-800 mb-1">Possible Side Effects</h4>
                                            <div className="flex flex-wrap gap-1">
                                                {medication.sideEffects.map((effect, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs">
                                                        {effect}
                                                    </Badge>
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-600 mt-1">
                                                Contact your doctor if you experience severe or persistent side effects.
                                            </p>
                                        </div>
                                    )}

                                    <div className="text-xs text-gray-500">
                                        Started: {new Date(medication.startDate).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Past Medications */}
            {pastMedications.length > 0 && (
                <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4 text-gray-600">
                        Past Medications ({pastMedications.length})
                    </h2>

                    <div className="space-y-4">
                        {pastMedications.map((medication) => (
                            <div key={medication.id} className="p-4 border rounded-lg bg-gray-50">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-700">{medication.drugName}</h3>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <Badge className={getCategoryColor(medication.category)}>
                                                {medication.category}
                                            </Badge>
                                            <Badge variant="outline" className="bg-gray-100 text-gray-600">
                                                Completed
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium text-gray-700">{medication.dose}</div>
                                        <div className="text-sm text-gray-600">{medication.frequency}</div>
                                    </div>
                                </div>

                                <div className="text-xs text-gray-500">
                                    Duration: {new Date(medication.startDate).toLocaleDateString()} - {
                                        medication.endDate ? new Date(medication.endDate).toLocaleDateString() : 'Ongoing'
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Medication Reminders */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-blue-600">Medication Reminders</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-medium text-blue-800 mb-2">Taking Your Medications</h3>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Take medications at the same time each day</li>
                            <li>• Use a pill organizer to stay organized</li>
                            <li>• Set phone alarms as reminders</li>
                            <li>• Don't skip doses without consulting your doctor</li>
                        </ul>
                    </div>

                    <div className="p-4 bg-yellow-50 rounded-lg">
                        <h3 className="font-medium text-yellow-800 mb-2">Important Safety Tips</h3>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            <li>• Never stop medications suddenly</li>
                            <li>• Tell all doctors about all your medications</li>
                            <li>• Check with pharmacist about drug interactions</li>
                            <li>• Store medications properly</li>
                        </ul>
                    </div>
                </div>
            </Card>

            {/* Emergency Information */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-red-600">Emergency Information</h2>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="font-medium text-red-800 mb-2">When to Seek Immediate Help</h3>
                    <ul className="text-sm text-red-700 space-y-1 mb-3">
                        <li>• Severe allergic reaction (rash, swelling, difficulty breathing)</li>
                        <li>• Severe side effects that concern you</li>
                        <li>• Accidental overdose</li>
                        <li>• Medication not working as expected</li>
                    </ul>
                    <p className="text-sm text-red-800">
                        <strong>Emergency:</strong> Call 911 or go to the nearest emergency room
                    </p>
                    <p className="text-sm text-red-700">
                        <strong>Non-emergency questions:</strong> Contact your healthcare provider or pharmacist
                    </p>
                </div>
            </Card>

            {/* Medication History Note */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-600">About Your Medication History</h2>
                <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 mb-2">
                        This list shows medications prescribed by your healthcare team. It may not include:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Over-the-counter medications you take on your own</li>
                        <li>• Medications prescribed by other doctors</li>
                        <li>• Supplements or vitamins</li>
                    </ul>
                    <p className="text-sm text-gray-700 mt-2">
                        Always inform your healthcare team about ALL medications and supplements you're taking.
                    </p>
                </div>
            </Card>
        </div>
    )
}