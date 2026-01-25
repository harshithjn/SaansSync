"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { Button } from "@/components/ui/button"
import { getStoredSession } from "@/lib/auth-utils"

interface PFTReport {
    id: string
    testDate: string
    fvc: string
    fev1: string
    dlco: string
    sixMWD: string
    minSpO2: string
    maxSpO2: string
    notes: string
}

interface PrescriptionReport {
    id: string
    prescriptionDate: string
    medications: Array<{
        drugName: string
        dose: string
        frequency: string
        duration: string
    }>
    doctorName: string
}

export default function PatientReportsPage() {
    const [pftReports, setPftReports] = useState<PFTReport[]>([])
    const [prescriptions, setPrescriptions] = useState<PrescriptionReport[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadReports = async () => {
            const session = getStoredSession()
            if (!session) return

            // Simulate API call to fetch reports
            const mockPFTReports: PFTReport[] = [
                {
                    id: "pft-001",
                    testDate: "2024-01-15",
                    fvc: "65",
                    fev1: "68",
                    dlco: "45",
                    sixMWD: "380",
                    minSpO2: "89",
                    maxSpO2: "95",
                    notes: "Stable lung function compared to previous test"
                },
                {
                    id: "pft-002",
                    testDate: "2023-10-20",
                    fvc: "62",
                    fev1: "65",
                    dlco: "42",
                    sixMWD: "365",
                    minSpO2: "87",
                    maxSpO2: "94",
                    notes: "Slight decline in DLCO, continue current treatment"
                },
                {
                    id: "pft-003",
                    testDate: "2023-07-12",
                    fvc: "68",
                    fev1: "70",
                    dlco: "48",
                    sixMWD: "395",
                    minSpO2: "90",
                    maxSpO2: "96",
                    notes: "Baseline measurements established"
                }
            ]

            const mockPrescriptions: PrescriptionReport[] = [
                {
                    id: "rx-001",
                    prescriptionDate: "2024-01-15",
                    medications: [
                        { drugName: "PIRFENIDONE", dose: "267 mg", frequency: "Three times daily", duration: "Ongoing" },
                        { drugName: "PREDNISOLONE", dose: "10 mg", frequency: "Once daily", duration: "3 months" },
                        { drugName: "OMEPRAZOLE", dose: "20 mg", frequency: "Once daily", duration: "Ongoing" }
                    ],
                    doctorName: "Dr. Sarah Johnson"
                },
                {
                    id: "rx-002",
                    prescriptionDate: "2023-10-20",
                    medications: [
                        { drugName: "PIRFENIDONE", dose: "267 mg", frequency: "Three times daily", duration: "Ongoing" },
                        { drugName: "PREDNISOLONE", dose: "15 mg", frequency: "Once daily", duration: "6 months" }
                    ],
                    doctorName: "Dr. Sarah Johnson"
                }
            ]

            setPftReports(mockPFTReports)
            setPrescriptions(mockPrescriptions)
            setIsLoading(false)
        }

        loadReports()
    }, [])

    const handleDownloadReport = (reportId: string, type: 'pft' | 'prescription') => {
        // Simulate download functionality
        alert(`Downloading ${type} report ${reportId}...`)
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
                <h1 className="text-2xl font-bold text-gray-900 mb-2">My Reports</h1>
                <p className="text-gray-600">
                    View and download your medical reports and test results
                </p>
            </div>

            {/* PFT Reports */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-purple-600">Lung Function Test Reports</h2>
                <div className="space-y-4">
                    {pftReports.map((report) => (
                        <div key={report.id} className="p-4 border rounded-lg bg-purple-50">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-medium">Pulmonary Function Test</h3>
                                    <p className="text-sm text-gray-600">
                                        Test Date: {new Date(report.testDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadReport(report.id, 'pft')}
                                >
                                    📄 Download
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                <div className="text-center p-2 bg-white rounded">
                                    <div className="text-sm text-gray-600">FVC</div>
                                    <div className="font-semibold">{report.fvc}%</div>
                                </div>
                                <div className="text-center p-2 bg-white rounded">
                                    <div className="text-sm text-gray-600">FEV1</div>
                                    <div className="font-semibold">{report.fev1}%</div>
                                </div>
                                <div className="text-center p-2 bg-white rounded">
                                    <div className="text-sm text-gray-600">DLCO</div>
                                    <div className="font-semibold">{report.dlco}%</div>
                                </div>
                                <div className="text-center p-2 bg-white rounded">
                                    <div className="text-sm text-gray-600">6MWD</div>
                                    <div className="font-semibold">{report.sixMWD}m</div>
                                </div>
                            </div>

                            {report.notes && (
                                <div className="p-3 bg-white rounded border-l-4 border-purple-500">
                                    <p className="text-sm"><strong>Doctor's Notes:</strong> {report.notes}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Card>

            {/* Prescription Reports */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-green-600">Prescription Reports</h2>
                <div className="space-y-4">
                    {prescriptions.map((prescription) => (
                        <div key={prescription.id} className="p-4 border rounded-lg bg-green-50">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-medium">Prescription</h3>
                                    <p className="text-sm text-gray-600">
                                        Date: {new Date(prescription.prescriptionDate).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Prescribed by: {prescription.doctorName}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadReport(prescription.id, 'prescription')}
                                >
                                    📄 Download
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-medium text-sm">Medications:</h4>
                                {prescription.medications.map((med, index) => (
                                    <div key={index} className="flex justify-between items-center p-2 bg-white rounded">
                                        <div>
                                            <span className="font-medium">{med.drugName}</span>
                                            <span className="text-sm text-gray-600 ml-2">{med.dose}</span>
                                        </div>
                                        <div className="text-right text-sm">
                                            <div>{med.frequency}</div>
                                            <div className="text-gray-500">{med.duration}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Lab Reports (Future) */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-blue-600">Lab Reports</h2>
                <div className="text-center py-8 text-gray-500">
                    <p>No lab reports available at this time.</p>
                    <p className="text-sm mt-2">Lab results will appear here when available.</p>
                </div>
            </Card>

            {/* Imaging Reports (Future) */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-orange-600">Imaging Reports</h2>
                <div className="text-center py-8 text-gray-500">
                    <p>No imaging reports available at this time.</p>
                    <p className="text-sm mt-2">X-ray, CT scan, and other imaging results will appear here when available.</p>
                </div>
            </Card>

            {/* Help Section */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-600">Need Help?</h2>
                <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 mb-2">
                        <strong>Understanding Your Reports:</strong>
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Your healthcare team can explain any test results you don't understand</li>
                        <li>• Keep copies of your reports for your records</li>
                        <li>• Bring reports to all medical appointments</li>
                        <li>• Contact your clinic if you have questions about any results</li>
                    </ul>
                </div>
            </Card>
        </div>
    )
}