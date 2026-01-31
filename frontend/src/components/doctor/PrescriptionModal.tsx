"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Printer, Download, Save } from "lucide-react"
import { PatientData, PersonalizedAlert, PERSONALIZED_ALERT_TYPES } from "@/lib/patient-types"
import { generatePrescription, formatPrescriptionCard, createPrescriptionFolders } from "@/lib/prescription-service"
import { toast } from "@/lib/toast"

interface PrescriptionModalProps {
    isOpen: boolean
    onClose: () => void
    patientData: PatientData
    patientId: string
    doctorId: string
    doctorName: string
}

export default function PrescriptionModal({
    isOpen,
    onClose,
    patientData,
    patientId,
    doctorId,
    doctorName
}: PrescriptionModalProps) {
    const [personalizedAlerts, setPersonalizedAlerts] = useState<PersonalizedAlert[]>([])
    const [instructions, setInstructions] = useState("")
    const [generatedPrescription, setGeneratedPrescription] = useState<string>("")
    const [isGenerating, setIsGenerating] = useState(false)

    useEffect(() => {
        if (isOpen) {
            // Reset state when modal opens
            setPersonalizedAlerts([])
            setInstructions("")
            setGeneratedPrescription("")
        }
    }, [isOpen])

    const addPersonalizedAlert = () => {
        const newAlert: PersonalizedAlert = {
            id: Date.now().toString(),
            type: 'custom',
            name: '',
            frequency: '',
            interval: '',
            instructions: '',
            isActive: true
        }
        setPersonalizedAlerts(prev => [...prev, newAlert])
    }

    const updatePersonalizedAlert = (id: string, field: string, value: string) => {
        setPersonalizedAlerts(prev => prev.map(alert =>
            alert.id === id ? { ...alert, [field]: value } : alert
        ))
    }

    const removePersonalizedAlert = (id: string) => {
        setPersonalizedAlerts(prev => prev.filter(alert => alert.id !== id))
    }

    const getAlertTypeConfig = (type: string) => {
        return PERSONALIZED_ALERT_TYPES.find(t => t.type === type) || PERSONALIZED_ALERT_TYPES[3] // default to custom
    }

    const handleGeneratePrescription = async () => {
        setIsGenerating(true)

        try {
            // Generate prescription (patientId required for storage)
            const prescription = await generatePrescription(
                patientData,
                patientId,
                doctorId,
                doctorName,
                personalizedAlerts.filter(alert => alert.name && alert.frequency),
                instructions
            )

            if (!prescription) {
                throw new Error('Failed to generate prescription')
            }

            // Format for display
            const formattedPrescription = formatPrescriptionCard(prescription)
            setGeneratedPrescription(formattedPrescription)

            // Create folder structure (this would be handled by the backend in a real app)
            const folders = createPrescriptionFolders(prescription)
            console.log("Prescription folders created:", folders)

        } catch (error) {
            console.error("Error generating prescription:", error)
            toast.error("Error generating prescription. Please try again.")
        } finally {
            setIsGenerating(false)
        }
    }

    const handlePrintPrescription = () => {
        if (!generatedPrescription) return

        const printWindow = window.open('', '_blank')
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Prescription Card</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            pre { white-space: pre-wrap; font-family: Arial, sans-serif; }
                        </style>
                    </head>
                    <body>
                        <pre>${generatedPrescription}</pre>
                    </body>
                </html>
            `)
            printWindow.document.close()
            printWindow.print()
        }
    }

    const handleDownloadPrescription = () => {
        if (!generatedPrescription) return

        const blob = new Blob([generatedPrescription], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `prescription-${patientData.fullName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Generate Prescription Card</h2>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="space-y-6">
                        {/* Patient Info */}
                        <Card className="p-4">
                            <h3 className="font-medium mb-2">Patient Information</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <p><span className="font-medium">Name:</span> {patientData.fullName}</p>
                                <p><span className="font-medium">Age:</span> {patientData.age}</p>
                                <p><span className="font-medium">Diagnosis:</span> {patientData.diagnosis.primaryCategory}</p>
                                <p><span className="font-medium">Active Medications:</span> {patientData.medications.filter(m => m.isActive).length}</p>
                            </div>
                        </Card>

                        {/* Personalized Alerts */}
                        <Card className="p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-medium">Personalized Alerts</h3>
                                <Button onClick={addPersonalizedAlert} variant="outline" size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Alert
                                </Button>
                            </div>

                            {personalizedAlerts.length === 0 && (
                                <p className="text-sm text-gray-500 text-center py-4">
                                    No personalized alerts added. Click "Add Alert" to add medication alerts, pulmonary rehabilitation, chest physiotherapy, etc.
                                </p>
                            )}

                            {personalizedAlerts.map((alert, index) => (
                                <div key={alert.id} className="border rounded-lg p-4 mb-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-medium">Alert #{index + 1}</h4>
                                        <Button
                                            onClick={() => removePersonalizedAlert(alert.id)}
                                            variant="destructive"
                                            size="sm"
                                        >
                                            Remove
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Alert Type</label>
                                            <Select
                                                value={alert.type}
                                                onValueChange={(value) => updatePersonalizedAlert(alert.id, "type", value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select alert type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {PERSONALIZED_ALERT_TYPES.map(type => (
                                                        <SelectItem key={type.type} value={type.type}>
                                                            {type.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {alert.type === 'custom' && (
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Custom Alert Name</label>
                                                <Input
                                                    value={alert.name}
                                                    onChange={(e) => updatePersonalizedAlert(alert.id, "name", e.target.value)}
                                                    placeholder="Enter custom alert name"
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Frequency</label>
                                            <Select
                                                value={alert.frequency}
                                                onValueChange={(value) => updatePersonalizedAlert(alert.id, "frequency", value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select frequency" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {getAlertTypeConfig(alert.type).frequencies.map(freq => (
                                                        <SelectItem key={freq} value={freq}>
                                                            {freq}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {getAlertTypeConfig(alert.type).intervals && (
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Interval</label>
                                                <Select
                                                    value={alert.interval || ""}
                                                    onValueChange={(value) => updatePersonalizedAlert(alert.id, "interval", value)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select interval" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {getAlertTypeConfig(alert.type).intervals!.map(interval => (
                                                            <SelectItem key={interval} value={interval}>
                                                                {interval}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-medium">Instructions (Optional)</label>
                                            <Input
                                                value={alert.instructions || ""}
                                                onChange={(e) => updatePersonalizedAlert(alert.id, "instructions", e.target.value)}
                                                placeholder="Additional instructions for this alert"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Card>

                        {/* Additional Instructions */}
                        <Card className="p-4">
                            <h3 className="font-medium mb-2">Additional Instructions</h3>
                            <textarea
                                className="w-full p-2 border rounded-md resize-none"
                                rows={3}
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                placeholder="Enter any additional instructions for the patient..."
                            />
                        </Card>

                        {/* Generated Prescription Preview */}
                        {generatedPrescription && (
                            <Card className="p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-medium">Generated Prescription</h3>
                                    <div className="flex space-x-2">
                                        <Button onClick={handlePrintPrescription} variant="outline" size="sm">
                                            <Printer className="h-4 w-4 mr-2" />
                                            Print
                                        </Button>
                                        <Button onClick={handleDownloadPrescription} variant="outline" size="sm">
                                            <Download className="h-4 w-4 mr-2" />
                                            Download
                                        </Button>
                                    </div>
                                </div>
                                <pre className="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-wrap font-mono">
                                    {generatedPrescription}
                                </pre>
                            </Card>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleGeneratePrescription}
                                disabled={isGenerating}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {isGenerating ? "Generating..." : "Generate Prescription"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}