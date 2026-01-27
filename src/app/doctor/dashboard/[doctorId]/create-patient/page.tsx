"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "../../../../../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
    PatientData,
    Medication,
    PFTRecord,
    StructuredDiagnosis,
    PRIMARY_DIAGNOSIS_CATEGORIES,
    ILD_SUBTYPES,
    OAD_SUBTYPES,
    COPD_SUBTYPES,
    BRONCHIECTASIS_SUBTYPES,
    POST_ICU_SUBTYPES,
    CTD_TYPES,
    SARCOIDOSIS_STAGES,
    CO_MORBIDITIES_LIST,
    ROUTE_OPTIONS,
    FREQUENCY_LIST,
    DRUG_NAME_OPTIONS,
    PFT_RANGES
} from '@/lib/patient-types'

import {
    validateStep1,
    validateStep2,
    validateStep3,
    validateStep4,
    formatMobileNumber,
    isValueAbnormal
} from '@/lib/patient-validation'

const initialPatientData: PatientData = {
    // Step 1 - Updated Basic Information
    fullName: "",
    mobileNumber: "",
    alternateMobileNumber: "",
    emailId: "",
    age: "",
    sex: "",
    registrationDate: new Date().toISOString().split('T')[0],

    // Step 2 - Updated Diagnosis Structure
    diagnosis: {
        primaryCategory: "",
        subtype: "",
        ctdType: "",
        sarcoidosisStage: "",
        fibroticiLD: "",
        customSubtype: ""
    },
    medicalHistory: "",
    comorbidities: [],
    customComorbidity: "",
    occupationalExposure: "",
    smokingStatus: "",
    packYears: "",

    // Step 3
    medications: [],

    // Step 4
    pftRecords: [],

    // Step 5
    requiresRespiratorySupport: "",
    ltot: { enabled: false, oxygenLitres: "" },
    bipap: {
        enabled: false,
        overnightUse: false,
        allTimeUse: false,
        requiresOxygen: false,
        oxygenLitres: "",
        ipap: "",
        epap: "",
        pressureSupport: "",
        respiratoryRate: ""
    },
    invasiveVentilation: {
        enabled: false,
        ipap: "",
        epap: "",
        pressureSupport: "",
        respiratoryRate: "",
        fiO2: ""
    },
    tracheostomy: {
        enabled: false,
        airwayPatencyRequired: true,
        oxygenViaTrach: false,
        oxygenLitres: "",
        requiresVentilator: false,
        ipap: "",
        epap: "",
        pressureSupport: "",
        respiratoryRate: "",
        tidalVolume: "",
        fiO2: ""
    }
}

export default function CreatePatientPage() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(1)
    const [patientData, setPatientData] = useState<PatientData>(initialPatientData)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({})

    // Clear validation errors when step changes
    useEffect(() => {
        setValidationErrors({})
    }, [currentStep])

    const updatePatientData = (field: string, value: any) => {
        setPatientData(prev => ({ ...prev, [field]: value }))
        // Clear validation error for this field
        if (validationErrors[field]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[field]
                return newErrors
            })
        }
    }

    const updateDiagnosis = (field: string, value: string) => {
        setPatientData(prev => ({
            ...prev,
            diagnosis: {
                ...prev.diagnosis,
                [field]: value,
                // Reset dependent fields when primary category changes
                ...(field === 'primaryCategory' && {
                    subtype: "",
                    ctdType: "",
                    sarcoidosisStage: "",
                    fibroticiLD: "",
                    customSubtype: ""
                }),
                // Reset conditional fields when subtype changes
                ...(field === 'subtype' && {
                    ctdType: "",
                    sarcoidosisStage: "",
                    customSubtype: ""
                })
            }
        }))

        // Clear validation errors for diagnosis fields
        if (validationErrors[field]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[field]
                return newErrors
            })
        }
    }

    const getSubtypeOptions = () => {
        switch (patientData.diagnosis.primaryCategory) {
            case "Interstitial Lung Disease (ILD)":
                return ILD_SUBTYPES

            case "Bronchial Asthma":
                return OAD_SUBTYPES

            case "COPD (Chronic Obstructive Pulmonary Disease)":
                return COPD_SUBTYPES

            case "Bronchiectasis":
                return BRONCHIECTASIS_SUBTYPES

            case "Post ICU Recovery":
                return POST_ICU_SUBTYPES

            default:
                return []
        }
    }


    const validateCurrentStep = () => {
        // Step 6 is read-only preview - no validation needed
        if (currentStep === 6) {
            return true
        }

        let validation
        switch (currentStep) {
            case 1:
                validation = validateStep1(patientData)
                break
            case 2:
                validation = validateStep2(patientData)
                break
            case 3:
                validation = validateStep4(patientData) // PFT
                break
            case 4:
                validation = { isValid: true, errors: [] } // Respiratory Support - no validation needed
                break
            case 5:
                validation = validateStep3(patientData) // Medications
                break
            default:
                validation = { isValid: true, errors: [] }
        }

        const errorMap: { [key: string]: string } = {}
        validation.errors.forEach(error => {
            errorMap[error.field] = error.message
        })
        setValidationErrors(errorMap)

        return validation.isValid
    }

    const handleNext = () => {
        // Clean up incomplete medications before validation
        if (currentStep === 5) {
            const completeMedications = patientData.medications.filter(med =>
                med.route && med.drugName && med.dose && med.frequency && med.startDate
            )
            if (completeMedications.length !== patientData.medications.length) {
                setPatientData(prev => ({
                    ...prev,
                    medications: completeMedications
                }))
            }
        }

        if (validateCurrentStep()) {
            setCurrentStep(prev => {
                const nextStep = prev + 1
                // Clear validation errors when moving to any new step
                setValidationErrors({})
                return nextStep
            })
        }
    }

    const handleBack = () => {
        // Clear validation errors when going back
        setValidationErrors({})
        setCurrentStep(prev => Math.max(1, prev - 1))
    }
    const addMedication = () => {
        const newMedication: Medication = {
            id: Date.now().toString(),
            route: "",
            drugName: "",
            customDrugName: "",
            dose: "",
            frequency: "",
            startDate: "",
            endDate: "",
            isActive: true
        }
        setPatientData(prev => ({
            ...prev,
            medications: [...prev.medications, newMedication]
        }))
    }

    const updateMedication = (id: string, field: string, value: string) => {
        setPatientData(prev => ({
            ...prev,
            medications: prev.medications.map(med => {
                if (med.id === id) {
                    const updatedMed = { ...med, [field]: value }

                    // Handle drug name selection logic
                    if (field === 'drugName') {
                        if (value === 'Other') {
                            // Keep the "Other" selection but clear custom name
                            updatedMed.customDrugName = ""
                        } else {
                            // Clear custom name when selecting predefined drug
                            updatedMed.customDrugName = ""
                        }
                    }

                    // Auto-format custom drug name to uppercase
                    if (field === 'customDrugName') {
                        updatedMed.customDrugName = value.toUpperCase()
                    }

                    // Update active status based on end date
                    if (field === 'endDate' || field === 'startDate') {
                        const today = new Date()
                        const endDate = updatedMed.endDate ? new Date(updatedMed.endDate) : null
                        updatedMed.isActive = !endDate || endDate >= today
                    }

                    return updatedMed
                }
                return med
            })
        }))
    }

    const removeMedication = (id: string) => {
        setPatientData(prev => ({
            ...prev,
            medications: prev.medications.filter(med => med.id !== id)
        }))
    }

    const addPFTRecord = () => {
        const newRecord: PFTRecord = {
            id: Date.now().toString(),
            fvc: "",
            fev1: "",
            fvcLitres: "",
            fev1Litres: "",
            dlco: "",
            sixMWD: "",
            minSpO2: "",
            maxSpO2: "",
            testDate: new Date().toISOString().split('T')[0]
        }
        setPatientData(prev => ({
            ...prev,
            pftRecords: [...prev.pftRecords, newRecord]
        }))
    }

    const updatePFTRecord = (id: string, field: string, value: string) => {
        setPatientData(prev => ({
            ...prev,
            pftRecords: prev.pftRecords.map(record =>
                record.id === id ? { ...record, [field]: value } : record
            )
        }))
    }

    const removePFTRecord = (id: string) => {
        setPatientData(prev => ({
            ...prev,
            pftRecords: prev.pftRecords.filter(record => record.id !== id)
        }))
    }

    const handleComorbidityChange = (comorbidity: string, checked: boolean) => {
        if (checked) {
            setPatientData(prev => ({
                ...prev,
                comorbidities: [...prev.comorbidities, comorbidity]
            }))
        } else {
            setPatientData(prev => ({
                ...prev,
                comorbidities: prev.comorbidities.filter(c => c !== comorbidity)
            }))
        }
    }

    const updateRespiratoryConfig = (configType: string, field: string, value: any) => {
        setPatientData(prev => {
            const currentConfig = prev[configType as keyof PatientData] as any
            return {
                ...prev,
                [configType]: {
                    ...currentConfig,
                    [field]: value
                }
            }
        })
    }

    const handleCreatePatient = async () => {
        setIsSubmitting(true)
        try {
            // Import auth utilities and storage
            const { createPatientCredentials } = await import('@/lib/auth-utils')
            const { storePatient } = await import('@/lib/patient-storage')
            const { createPatientFolder } = await import('@/lib/doctor-patient-mapping')

            // Create patient credentials
            const credentials = createPatientCredentials(patientData.emailId)

            // Store patient in local storage
            storePatient(credentials, patientData)

            // Get current doctor ID from URL
            const pathParts = window.location.pathname.split('/')
            const doctorId = pathParts[3] // /doctor/dashboard/[doctorId]/create-patient

            // Create patient folder and doctor-patient mapping
            createPatientFolder(patientData, doctorId, credentials.patientId, 1, 0) // Initial score of 1, no alerts

            // Combine patient data with credentials
            const patientWithCredentials = {
                ...patientData,
                patientId: credentials.patientId,
                credentials: credentials
            }

            console.log("Creating patient with data:", patientWithCredentials)
            console.log("Patient credentials created:", {
                patientId: credentials.patientId,
                email: credentials.email,
                defaultPassword: "patient123",
                role: credentials.role
            })

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000))

            alert(`Patient created successfully!\n\nPatient ID: ${credentials.patientId}\nLogin Email: ${credentials.email}\nDefault Password: patient123\n\n✅ The patient can now log in at:\n🔗 http://localhost:3000/patient/login\n\nUse the email and password above to test the patient login.\n\n🏥 Patient has been assigned to your dashboard and will appear in your patient folder view.`)

            // Reset form and navigate back to dashboard
            setPatientData(initialPatientData)
            setCurrentStep(1)

            // Navigate back to dashboard after a short delay
            setTimeout(() => {
                router.push(`/doctor/dashboard/${doctorId}`)
            }, 1000)
        } catch (error) {
            alert("Error creating patient. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const getActiveMedicationsCount = () => {
        return patientData.medications.filter(med => med.isActive).length
    }

    const getPastMedicationsCount = () => {
        return patientData.medications.filter(med => !med.isActive).length
    }

    const formatDiagnosisDisplay = () => {
        let display = patientData.diagnosis.primaryCategory
        if (patientData.diagnosis.subtype) {
            if (patientData.diagnosis.subtype === "Others" && patientData.diagnosis.customSubtype) {
                display += ` / ${patientData.diagnosis.customSubtype}`
            } else {
                display += ` / ${patientData.diagnosis.subtype}`
            }
        }
        if (patientData.diagnosis.ctdType) {
            display += ` / ${patientData.diagnosis.ctdType}`
        }
        if (patientData.diagnosis.sarcoidosisStage) {
            display += ` / ${patientData.diagnosis.sarcoidosisStage}`
        }
        if (patientData.diagnosis.fibroticiLD) {
            display += ` / Fibrotic: ${patientData.diagnosis.fibroticiLD}`
        }
        return display
    }
    // Step 1: Updated Basic Patient Information
    const renderStep1 = () => (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Step 1: Basic Patient Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name *</label>
                    <Input
                        value={patientData.fullName}
                        onChange={(e) => updatePatientData("fullName", e.target.value)}
                        placeholder="Enter patient's full name"
                        className={validationErrors.fullName ? "border-red-500" : ""}
                    />
                    {validationErrors.fullName && (
                        <p className="text-xs text-red-500">{validationErrors.fullName}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Mobile Number *</label>
                    <Input
                        value={patientData.mobileNumber}
                        onChange={(e) => updatePatientData("mobileNumber", formatMobileNumber(e.target.value))}
                        placeholder="Enter mobile number"
                        className={validationErrors.mobileNumber ? "border-red-500" : ""}
                    />
                    {validationErrors.mobileNumber && (
                        <p className="text-xs text-red-500">{validationErrors.mobileNumber}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Alternate Mobile Number</label>
                    <Input
                        value={patientData.alternateMobileNumber || ""}
                        onChange={(e) => updatePatientData("alternateMobileNumber", formatMobileNumber(e.target.value))}
                        placeholder="Enter alternate mobile number (optional)"
                    />
                    <p className="text-xs text-gray-500">Optional: For backup contact</p>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Email ID *</label>
                    <Input
                        type="email"
                        value={patientData.emailId}
                        onChange={(e) => updatePatientData("emailId", e.target.value)}
                        placeholder="Enter email address"
                        className={validationErrors.emailId ? "border-red-500" : ""}
                    />
                    {validationErrors.emailId && (
                        <p className="text-xs text-red-500">{validationErrors.emailId}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Age *</label>
                    <Input
                        type="number"
                        value={patientData.age}
                        onChange={(e) => updatePatientData("age", e.target.value)}
                        placeholder="Enter age"
                        min="1"
                        max="120"
                        className={validationErrors.age ? "border-red-500" : ""}
                    />
                    {validationErrors.age && (
                        <p className="text-xs text-red-500">{validationErrors.age}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Sex *</label>
                    <Select
                        value={patientData.sex}
                        onValueChange={(value) => updatePatientData("sex", value)}
                    >
                        <SelectTrigger className={validationErrors.sex ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select sex" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                    {validationErrors.sex && (
                        <p className="text-xs text-red-500">{validationErrors.sex}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Registration Date</label>
                    <Input
                        value={patientData.registrationDate}
                        disabled
                        className="bg-gray-100"
                    />
                </div>
            </div>
        </Card>
    )
    // Step 2: Updated Structured Diagnosis & Medical History
    const renderStep2 = () => (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Step 2: Structured Diagnosis & Medical History</h3>

            <div className="space-y-6">
                {/* Structured Diagnosis Section */}
                <div className="p-4 bg-blue-50 rounded-lg space-y-4">
                    <h4 className="font-medium text-blue-800">Primary Diagnosis (Structured)</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Primary Diagnosis Category *</label>
                            <Select
                                value={patientData.diagnosis.primaryCategory}
                                onValueChange={(value) => updateDiagnosis("primaryCategory", value)}
                            >
                                <SelectTrigger className={validationErrors.primaryCategory ? "border-red-500" : ""}>
                                    <SelectValue placeholder="Select primary category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PRIMARY_DIAGNOSIS_CATEGORIES.map(category => (
                                        <SelectItem key={category} value={category}>{category}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {validationErrors.primaryCategory && (
                                <p className="text-xs text-red-500">{validationErrors.primaryCategory}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Diagnosis Subtype *</label>
                            <Select
                                value={patientData.diagnosis.subtype}
                                onValueChange={(value) => updateDiagnosis("subtype", value)}
                                disabled={!patientData.diagnosis.primaryCategory}
                            >
                                <SelectTrigger className={validationErrors.subtype ? "border-red-500" : ""}>
                                    <SelectValue placeholder={
                                        patientData.diagnosis.primaryCategory
                                            ? "Select subtype"
                                            : "Select primary category first"
                                    } />
                                </SelectTrigger>
                                <SelectContent>
                                    {getSubtypeOptions().map(subtype => (
                                        <SelectItem key={subtype} value={subtype}>{subtype}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {validationErrors.subtype && (
                                <p className="text-xs text-red-500">{validationErrors.subtype}</p>
                            )}
                        </div>
                    </div>

                    {/* Conditional CTD Type */}
                    {patientData.diagnosis.subtype === "CTD-ILD" && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">CTD Type *</label>
                            <Select
                                value={patientData.diagnosis.ctdType || ""}
                                onValueChange={(value) => updateDiagnosis("ctdType", value)}
                            >
                                <SelectTrigger className={validationErrors.ctdType ? "border-red-500" : ""}>
                                    <SelectValue placeholder="Select CTD type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CTD_TYPES.map(type => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {validationErrors.ctdType && (
                                <p className="text-xs text-red-500">{validationErrors.ctdType}</p>
                            )}
                        </div>
                    )}

                    {/* Conditional Sarcoidosis Stage */}
                    {patientData.diagnosis.subtype === "Sarcoidosis" && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Sarcoidosis Stage *</label>
                            <Select
                                value={patientData.diagnosis.sarcoidosisStage || ""}
                                onValueChange={(value) => updateDiagnosis("sarcoidosisStage", value)}
                            >
                                <SelectTrigger className={validationErrors.sarcoidosisStage ? "border-red-500" : ""}>
                                    <SelectValue placeholder="Select sarcoidosis stage" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SARCOIDOSIS_STAGES.map(stage => (
                                        <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {validationErrors.sarcoidosisStage && (
                                <p className="text-xs text-red-500">{validationErrors.sarcoidosisStage}</p>
                            )}
                        </div>
                    )}

                    {/* Conditional ILD Fibrotic Field */}
                    {patientData.diagnosis.primaryCategory === "Interstitial Lung Disease (ILD)" && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Fibrotic ILD *</label>
                            <Select
                                value={patientData.diagnosis.fibroticiLD || ""}
                                onValueChange={(value) => updateDiagnosis("fibroticiLD", value)}
                            >
                                <SelectTrigger className={validationErrors.fibroticiLD ? "border-red-500" : ""}>
                                    <SelectValue placeholder="Select fibrotic status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Yes">Yes</SelectItem>
                                    <SelectItem value="No">No</SelectItem>
                                </SelectContent>
                            </Select>
                            {validationErrors.fibroticiLD && (
                                <p className="text-xs text-red-500">{validationErrors.fibroticiLD}</p>
                            )}
                        </div>
                    )}

                    {/* Custom Subtype Input - Only show when "Others" is selected */}
                    {patientData.diagnosis.subtype === "Others" && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Specify Other Subtype *</label>
                            <Input
                                value={patientData.diagnosis.customSubtype || ""}
                                onChange={(e) => updateDiagnosis("customSubtype", e.target.value)}
                                placeholder="Enter custom subtype"
                                className={validationErrors.customSubtype ? "border-red-500" : ""}
                            />
                            {validationErrors.customSubtype && (
                                <p className="text-xs text-red-500">{validationErrors.customSubtype}</p>
                            )}
                        </div>
                    )}

                    {/* Diagnosis Preview */}
                    {patientData.diagnosis.primaryCategory && patientData.diagnosis.subtype && (
                        <div className="p-3 bg-white border rounded-lg">
                            <p className="text-sm font-medium text-gray-700">Diagnosis Preview:</p>
                            <p className="text-lg font-semibold text-blue-700">{formatDiagnosisDisplay()}</p>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Medical History</label>
                    <textarea
                        className="w-full p-2 border rounded-md resize-none"
                        rows={3}
                        value={patientData.medicalHistory}
                        onChange={(e) => updatePatientData("medicalHistory", e.target.value)}
                        placeholder="Enter medical history details..."
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium">Co-morbidities (Select all that apply)</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {CO_MORBIDITIES_LIST.map((comorbidity) => (
                            <div key={comorbidity} className="flex items-center space-x-2">
                                <Checkbox
                                    id={comorbidity}
                                    checked={patientData.comorbidities.includes(comorbidity)}
                                    onCheckedChange={(checked) => handleComorbidityChange(comorbidity, checked as boolean)}
                                />
                                <label htmlFor={comorbidity} className="text-sm">{comorbidity}</label>
                            </div>
                        ))}
                    </div>

                    {/* Custom Comorbidity Input - Only show when "Others" is selected */}
                    {patientData.comorbidities.includes("Others") && (
                        <div className="space-y-2 mt-3">
                            <label className="text-sm font-medium">Specify Other Comorbidity</label>
                            <Input
                                value={patientData.customComorbidity}
                                onChange={(e) => updatePatientData("customComorbidity", e.target.value)}
                                placeholder="Enter custom comorbidity"
                            />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Occupational Exposure</label>
                        <textarea
                            className="w-full p-2 border rounded-md resize-none"
                            rows={2}
                            value={patientData.occupationalExposure}
                            onChange={(e) => updatePatientData("occupationalExposure", e.target.value)}
                            placeholder="Describe any occupational exposures..."
                        />
                    </div>
                </div>

                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium">Smoking History</h4>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Smoking Status</label>
                        <Select
                            value={patientData.smokingStatus}
                            onValueChange={(value) => updatePatientData("smokingStatus", value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select smoking status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Never Smoked">Never Smoked</SelectItem>
                                <SelectItem value="Former Smoker">Former Smoker</SelectItem>
                                <SelectItem value="Current Smoker">Current Smoker</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {patientData.smokingStatus !== "Never Smoked" && patientData.smokingStatus !== "" && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Pack Years</label>
                            <Input
                                type="number"
                                step="0.1"
                                value={patientData.packYears}
                                onChange={(e) => updatePatientData("packYears", e.target.value)}
                                placeholder="Enter pack years"
                                className={validationErrors.packYears ? "border-red-500" : ""}
                            />
                            {validationErrors.packYears && (
                                <p className="text-xs text-red-500">{validationErrors.packYears}</p>
                            )}
                            <p className="text-xs text-gray-500">
                                Pack years = (Cigarettes per day ÷ 20) × Years smoked
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    )
    // Step 3: Medication History & Prescription (unchanged)
    const renderStep3 = () => (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Step 5: Medication History & Prescription</h3>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex space-x-4">
                        <p className="text-sm text-gray-600">
                            Total Medications: {patientData.medications.length}
                        </p>
                        <p className="text-sm text-green-600">
                            Active: {getActiveMedicationsCount()}
                        </p>
                        <p className="text-sm text-gray-500">
                            Past: {getPastMedicationsCount()}
                        </p>
                    </div>
                    <Button onClick={addMedication} variant="outline">Add Medication</Button>
                </div>

                {/* Legend */}
                <div className="flex space-x-4 text-xs">
                    <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                        <span>Active Medication</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
                        <span>Past Medication</span>
                    </div>
                </div>

                {/* Validation Errors */}
                {Object.keys(validationErrors).some(key => key.startsWith('medication-')) && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="text-sm font-medium text-red-800 mb-2">Medication Validation Errors:</h4>
                        <ul className="text-sm text-red-700 space-y-1">
                            {Object.entries(validationErrors)
                                .filter(([key]) => key.startsWith('medication-'))
                                .map(([key, message]) => (
                                    <li key={key}>• {message}</li>
                                ))}
                        </ul>
                    </div>
                )}

                {patientData.medications.map((medication, index) => (
                    <div
                        key={medication.id}
                        className={`p-4 border rounded-lg space-y-4 ${medication.isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                            }`}
                    >
                        <div className="flex justify-between items-center">
                            <h4 className="font-medium flex items-center space-x-2">
                                <span>Medication #{index + 1}</span>
                                <Badge variant={medication.isActive ? "default" : "secondary"}>
                                    {medication.isActive ? "Active" : "Past"}
                                </Badge>
                            </h4>
                            <Button
                                onClick={() => removeMedication(medication.id)}
                                variant="destructive"
                                size="sm"
                            >
                                Remove
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Route *</label>
                                <Select
                                    value={medication.route}
                                    onValueChange={(value) => updateMedication(medication.id, "route", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select route" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ROUTE_OPTIONS.map(route => (
                                            <SelectItem key={route} value={route}>{route}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Drug Name *</label>
                                <Select
                                    value={medication.drugName}
                                    onValueChange={(value) => updateMedication(medication.id, "drugName", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select drug name" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DRUG_NAME_OPTIONS.map(drug => (
                                            <SelectItem key={drug} value={drug}>{drug}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Custom Drug Name Input - Only show when "Other" is selected */}
                            {medication.drugName === "Other" && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Custom Drug Name *</label>
                                    <Input
                                        value={medication.customDrugName || ""}
                                        onChange={(e) => updateMedication(medication.id, "customDrugName", e.target.value)}
                                        placeholder="Enter custom drug name"
                                        className="uppercase"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Dose *</label>
                                <Input
                                    value={medication.dose}
                                    onChange={(e) => updateMedication(medication.id, "dose", e.target.value)}
                                    placeholder="e.g., 100 mg"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Frequency *</label>
                                <Select
                                    value={medication.frequency}
                                    onValueChange={(value) => updateMedication(medication.id, "frequency", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select frequency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FREQUENCY_LIST.map(freq => (
                                            <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Start Date *</label>
                                <Input
                                    type="date"
                                    value={medication.startDate}
                                    onChange={(e) => updateMedication(medication.id, "startDate", e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">End Date (Optional)</label>
                                <Input
                                    type="date"
                                    value={medication.endDate}
                                    onChange={(e) => updateMedication(medication.id, "endDate", e.target.value)}
                                    placeholder="Leave blank if ongoing"
                                />
                                <p className="text-xs text-gray-500">Leave blank for ongoing medication</p>
                            </div>
                        </div>
                    </div>
                ))}

                {patientData.medications.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <p>No medications added yet. Click "Add Medication" to add one.</p>
                    </div>
                )}
            </div>
        </Card>
    )
    // Step 4: Pulmonary Function Tests (moved from step 4)
    const renderStep4 = () => (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Step 3: Pulmonary Function Tests (PFT) - Clinical Grade</h3>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">PFT Records: {patientData.pftRecords.length}</p>
                    <Button onClick={addPFTRecord} variant="outline">Add PFT Record</Button>
                </div>

                {/* Validation Errors */}
                {Object.keys(validationErrors).some(key => key.startsWith('pft-')) && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="text-sm font-medium text-red-800 mb-2">PFT Validation Errors:</h4>
                        <ul className="text-sm text-red-700 space-y-1">
                            {Object.entries(validationErrors)
                                .filter(([key]) => key.startsWith('pft-'))
                                .map(([key, message]) => (
                                    <li key={key}>• {message}</li>
                                ))}
                        </ul>
                    </div>
                )}

                {patientData.pftRecords.map((record, index) => (
                    <div key={record.id} className="p-4 border rounded-lg space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-medium">PFT Record #{index + 1}</h4>
                            <div className="flex space-x-2">
                                <Input
                                    type="date"
                                    value={record.testDate}
                                    onChange={(e) => updatePFTRecord(record.id, "testDate", e.target.value)}
                                    className="w-40"
                                />
                                <Button
                                    onClick={() => removePFTRecord(record.id)}
                                    variant="destructive"
                                    size="sm"
                                >
                                    Remove
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Spirometry */}
                            <div className="space-y-3">
                                <h5 className="font-medium text-blue-600">Spirometry</h5>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center space-x-1">
                                        <span>FVC (% predicted)</span>
                                        {record.fvc && isValueAbnormal('FVC', record.fvc) && (
                                            <span className="text-red-500 text-xs">⚠️ Abnormal</span>
                                        )}
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={record.fvc}
                                        onChange={(e) => updatePFTRecord(record.id, "fvc", e.target.value)}
                                        placeholder="80-120"
                                        className={record.fvc && isValueAbnormal('FVC', record.fvc) ? "border-red-300" : ""}
                                    />
                                    <p className="text-xs text-gray-500">Normal: 80-120%</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">FVC (in litres)</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={record.fvcLitres}
                                        onChange={(e) => updatePFTRecord(record.id, "fvcLitres", e.target.value)}
                                        placeholder="e.g., 3.50"
                                    />
                                    <p className="text-xs text-gray-500">Numeric input in litres</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center space-x-1">
                                        <span>FEV1 (% predicted)</span>
                                        {record.fev1 && isValueAbnormal('FEV1', record.fev1) && (
                                            <span className="text-red-500 text-xs">⚠️ Abnormal</span>
                                        )}
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={record.fev1}
                                        onChange={(e) => updatePFTRecord(record.id, "fev1", e.target.value)}
                                        placeholder="80-120"
                                        className={record.fev1 && isValueAbnormal('FEV1', record.fev1) ? "border-red-300" : ""}
                                    />
                                    <p className="text-xs text-gray-500">Normal: 80-120%</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">FEV1 (in litres)</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={record.fev1Litres}
                                        onChange={(e) => updatePFTRecord(record.id, "fev1Litres", e.target.value)}
                                        placeholder="e.g., 2.80"
                                    />
                                    <p className="text-xs text-gray-500">Numeric input in litres</p>
                                </div>
                            </div>

                            {/* Diffusion */}
                            <div className="space-y-3">
                                <h5 className="font-medium text-green-600">Diffusion</h5>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center space-x-1">
                                        <span>DLCO (% predicted)</span>
                                        {record.dlco && isValueAbnormal('DLCO', record.dlco) && (
                                            <span className="text-red-500 text-xs">⚠️ Abnormal</span>
                                        )}
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={record.dlco}
                                        onChange={(e) => updatePFTRecord(record.id, "dlco", e.target.value)}
                                        placeholder="80-120"
                                        className={record.dlco && isValueAbnormal('DLCO', record.dlco) ? "border-red-300" : ""}
                                    />
                                    <p className="text-xs text-gray-500">Normal: 80-120%</p>
                                </div>
                            </div>

                            {/* Exercise */}
                            <div className="space-y-3">
                                <h5 className="font-medium text-purple-600">Exercise</h5>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center space-x-1">
                                        <span>6MWD (meters)</span>
                                        {record.sixMWD && isValueAbnormal('6MWD', record.sixMWD) && (
                                            <span className="text-red-500 text-xs">⚠️ Abnormal</span>
                                        )}
                                    </label>
                                    <Input
                                        type="number"
                                        value={record.sixMWD}
                                        onChange={(e) => updatePFTRecord(record.id, "sixMWD", e.target.value)}
                                        placeholder="400-700"
                                        className={record.sixMWD && isValueAbnormal('6MWD', record.sixMWD) ? "border-red-300" : ""}
                                    />
                                    <p className="text-xs text-gray-500">Normal: 400-700m</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center space-x-1">
                                        <span>Min SpO₂ (%)</span>
                                        {record.minSpO2 && isValueAbnormal('Min SpO2', record.minSpO2) && (
                                            <span className="text-red-500 text-xs">⚠️ Abnormal</span>
                                        )}
                                    </label>
                                    <Input
                                        type="number"
                                        value={record.minSpO2}
                                        onChange={(e) => updatePFTRecord(record.id, "minSpO2", e.target.value)}
                                        placeholder="88-100"
                                        min="0"
                                        max="100"
                                        className={record.minSpO2 && isValueAbnormal('Min SpO2', record.minSpO2) ? "border-red-300" : ""}
                                    />
                                    <p className="text-xs text-gray-500">Normal: ≥88%</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center space-x-1">
                                        <span>Max SpO₂ (%)</span>
                                        {record.maxSpO2 && isValueAbnormal('Max SpO2', record.maxSpO2) && (
                                            <span className="text-red-500 text-xs">⚠️ Abnormal</span>
                                        )}
                                    </label>
                                    <Input
                                        type="number"
                                        value={record.maxSpO2}
                                        onChange={(e) => updatePFTRecord(record.id, "maxSpO2", e.target.value)}
                                        placeholder="95-100"
                                        min="0"
                                        max="100"
                                        className={record.maxSpO2 && isValueAbnormal('Max SpO2', record.maxSpO2) ? "border-red-300" : ""}
                                    />
                                    <p className="text-xs text-gray-500">Normal: ≥95%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {patientData.pftRecords.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <p>No PFT records added yet. Click "Add PFT Record" to add one.</p>
                    </div>
                )}
            </div>
        </Card>
    )
    // Step 5: Respiratory Support & Oxygen Status (moved from step 5)
    const renderStep5 = () => (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Step 4: Respiratory Support & Oxygen Status</h3>

            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Does the patient require respiratory support / oxygen?</label>
                    <Select
                        value={patientData.requiresRespiratorySupport}
                        onValueChange={(value) => updatePatientData("requiresRespiratorySupport", value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {patientData.requiresRespiratorySupport === "Yes" && (
                    <Tabs defaultValue="ltot" className="space-y-4">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="ltot">LTOT</TabsTrigger>
                            <TabsTrigger value="bipap">BiPAP/NIV</TabsTrigger>
                            <TabsTrigger value="invasive">Invasive Vent</TabsTrigger>
                            <TabsTrigger value="tracheostomy">Tracheostomy</TabsTrigger>
                        </TabsList>

                        {/* LTOT Configuration */}
                        <TabsContent value="ltot" className="space-y-4">
                            <div className="p-4 border rounded-lg">
                                <div className="flex items-center space-x-2 mb-4">
                                    <Checkbox
                                        id="ltot-enabled"
                                        checked={patientData.ltot.enabled}
                                        onCheckedChange={(checked) => updateRespiratoryConfig("ltot", "enabled", checked)}
                                    />
                                    <label htmlFor="ltot-enabled" className="font-medium">Enable LTOT (Long Term Oxygen Therapy)</label>
                                </div>

                                {patientData.ltot.enabled && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Oxygen Litres</label>
                                        <Input
                                            type="number"
                                            step="0.5"
                                            value={patientData.ltot.oxygenLitres}
                                            onChange={(e) => updateRespiratoryConfig("ltot", "oxygenLitres", e.target.value)}
                                            placeholder="e.g., 2.0"
                                        />
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* BiPAP/NIV Configuration */}
                        <TabsContent value="bipap" className="space-y-4">
                            <div className="p-4 border rounded-lg">
                                <div className="flex items-center space-x-2 mb-4">
                                    <Checkbox
                                        id="bipap-enabled"
                                        checked={patientData.bipap.enabled}
                                        onCheckedChange={(checked) => updateRespiratoryConfig("bipap", "enabled", checked)}
                                    />
                                    <label htmlFor="bipap-enabled" className="font-medium">Enable BiPAP / NIV</label>
                                </div>

                                {patientData.bipap.enabled && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="overnight-use"
                                                    checked={patientData.bipap.overnightUse}
                                                    onCheckedChange={(checked) => updateRespiratoryConfig("bipap", "overnightUse", checked)}
                                                />
                                                <label htmlFor="overnight-use" className="text-sm">Overnight use</label>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="alltime-use"
                                                    checked={patientData.bipap.allTimeUse}
                                                    onCheckedChange={(checked) => updateRespiratoryConfig("bipap", "allTimeUse", checked)}
                                                />
                                                <label htmlFor="alltime-use" className="text-sm">All-time use</label>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="requires-oxygen-bipap"
                                                checked={patientData.bipap.requiresOxygen}
                                                onCheckedChange={(checked) => updateRespiratoryConfig("bipap", "requiresOxygen", checked)}
                                            />
                                            <label htmlFor="requires-oxygen-bipap" className="text-sm">Requires oxygen with BiPAP</label>
                                        </div>

                                        {patientData.bipap.requiresOxygen && (
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Oxygen Litres</label>
                                                <Input
                                                    type="number"
                                                    step="0.5"
                                                    value={patientData.bipap.oxygenLitres}
                                                    onChange={(e) => updateRespiratoryConfig("bipap", "oxygenLitres", e.target.value)}
                                                    placeholder="e.g., 2.0"
                                                />
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">IPAP</label>
                                                <Input
                                                    type="number"
                                                    value={patientData.bipap.ipap}
                                                    onChange={(e) => updateRespiratoryConfig("bipap", "ipap", e.target.value)}
                                                    placeholder="cmH2O"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">EPAP</label>
                                                <Input
                                                    type="number"
                                                    value={patientData.bipap.epap}
                                                    onChange={(e) => updateRespiratoryConfig("bipap", "epap", e.target.value)}
                                                    placeholder="cmH2O"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Pressure Support</label>
                                                <Input
                                                    type="number"
                                                    value={patientData.bipap.pressureSupport}
                                                    onChange={(e) => updateRespiratoryConfig("bipap", "pressureSupport", e.target.value)}
                                                    placeholder="cmH2O"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Respiratory Rate</label>
                                                <Input
                                                    type="number"
                                                    value={patientData.bipap.respiratoryRate}
                                                    onChange={(e) => updateRespiratoryConfig("bipap", "respiratoryRate", e.target.value)}
                                                    placeholder="breaths/min"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* Invasive Ventilation Configuration */}
                        <TabsContent value="invasive" className="space-y-4">
                            <div className="p-4 border rounded-lg">
                                <div className="flex items-center space-x-2 mb-4">
                                    <Checkbox
                                        id="invasive-enabled"
                                        checked={patientData.invasiveVentilation.enabled}
                                        onCheckedChange={(checked) => updateRespiratoryConfig("invasiveVentilation", "enabled", checked)}
                                    />
                                    <label htmlFor="invasive-enabled" className="font-medium">Enable Invasive Ventilation</label>
                                </div>

                                {patientData.invasiveVentilation.enabled && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">IPAP</label>
                                            <Input
                                                type="number"
                                                value={patientData.invasiveVentilation.ipap}
                                                onChange={(e) => updateRespiratoryConfig("invasiveVentilation", "ipap", e.target.value)}
                                                placeholder="cmH2O"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">EPAP</label>
                                            <Input
                                                type="number"
                                                value={patientData.invasiveVentilation.epap}
                                                onChange={(e) => updateRespiratoryConfig("invasiveVentilation", "epap", e.target.value)}
                                                placeholder="cmH2O"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Pressure Support</label>
                                            <Input
                                                type="number"
                                                value={patientData.invasiveVentilation.pressureSupport}
                                                onChange={(e) => updateRespiratoryConfig("invasiveVentilation", "pressureSupport", e.target.value)}
                                                placeholder="cmH2O"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Respiratory Rate</label>
                                            <Input
                                                type="number"
                                                value={patientData.invasiveVentilation.respiratoryRate}
                                                onChange={(e) => updateRespiratoryConfig("invasiveVentilation", "respiratoryRate", e.target.value)}
                                                placeholder="breaths/min"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">FiO₂ (%)</label>
                                            <Input
                                                type="number"
                                                min="21"
                                                max="100"
                                                value={patientData.invasiveVentilation.fiO2}
                                                onChange={(e) => updateRespiratoryConfig("invasiveVentilation", "fiO2", e.target.value)}
                                                placeholder="21-100"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* Tracheostomy Configuration */}
                        <TabsContent value="tracheostomy" className="space-y-4">
                            <div className="p-4 border rounded-lg">
                                <div className="flex items-center space-x-2 mb-4">
                                    <Checkbox
                                        id="trach-enabled"
                                        checked={patientData.tracheostomy.enabled}
                                        onCheckedChange={(checked) => updateRespiratoryConfig("tracheostomy", "enabled", checked)}
                                    />
                                    <label htmlFor="trach-enabled" className="font-medium">Enable Tracheostomy</label>
                                </div>

                                {patientData.tracheostomy.enabled && (
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="airway-patency"
                                                checked={patientData.tracheostomy.airwayPatencyRequired}
                                                onCheckedChange={(checked) => updateRespiratoryConfig("tracheostomy", "airwayPatencyRequired", checked)}
                                            />
                                            <label htmlFor="airway-patency" className="text-sm">Airway patency required</label>
                                        </div>

                                        {!patientData.tracheostomy.airwayPatencyRequired && (
                                            <div className="space-y-4 p-3 bg-gray-50 rounded">
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id="oxygen-via-trach"
                                                        checked={patientData.tracheostomy.oxygenViaTrach}
                                                        onCheckedChange={(checked) => updateRespiratoryConfig("tracheostomy", "oxygenViaTrach", checked)}
                                                    />
                                                    <label htmlFor="oxygen-via-trach" className="text-sm">Oxygen via tracheostomy</label>
                                                </div>

                                                {patientData.tracheostomy.oxygenViaTrach && (
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Oxygen Litres</label>
                                                        <Input
                                                            type="number"
                                                            step="0.5"
                                                            value={patientData.tracheostomy.oxygenLitres}
                                                            onChange={(e) => updateRespiratoryConfig("tracheostomy", "oxygenLitres", e.target.value)}
                                                            placeholder="e.g., 2.0"
                                                        />
                                                    </div>
                                                )}

                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id="requires-ventilator"
                                                        checked={patientData.tracheostomy.requiresVentilator}
                                                        onCheckedChange={(checked) => updateRespiratoryConfig("tracheostomy", "requiresVentilator", checked)}
                                                    />
                                                    <label htmlFor="requires-ventilator" className="text-sm">Requires ventilator</label>
                                                </div>

                                                {patientData.tracheostomy.requiresVentilator && (
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">IPAP</label>
                                                            <Input
                                                                type="number"
                                                                value={patientData.tracheostomy.ipap}
                                                                onChange={(e) => updateRespiratoryConfig("tracheostomy", "ipap", e.target.value)}
                                                                placeholder="cmH2O"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">EPAP</label>
                                                            <Input
                                                                type="number"
                                                                value={patientData.tracheostomy.epap}
                                                                onChange={(e) => updateRespiratoryConfig("tracheostomy", "epap", e.target.value)}
                                                                placeholder="cmH2O"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Pressure Support</label>
                                                            <Input
                                                                type="number"
                                                                value={patientData.tracheostomy.pressureSupport}
                                                                onChange={(e) => updateRespiratoryConfig("tracheostomy", "pressureSupport", e.target.value)}
                                                                placeholder="cmH2O"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Respiratory Rate</label>
                                                            <Input
                                                                type="number"
                                                                value={patientData.tracheostomy.respiratoryRate}
                                                                onChange={(e) => updateRespiratoryConfig("tracheostomy", "respiratoryRate", e.target.value)}
                                                                placeholder="breaths/min"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Tidal Volume</label>
                                                            <Input
                                                                type="number"
                                                                value={patientData.tracheostomy.tidalVolume}
                                                                onChange={(e) => updateRespiratoryConfig("tracheostomy", "tidalVolume", e.target.value)}
                                                                placeholder="mL"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">FiO₂ (%)</label>
                                                            <Input
                                                                type="number"
                                                                min="21"
                                                                max="100"
                                                                value={patientData.tracheostomy.fiO2}
                                                                onChange={(e) => updateRespiratoryConfig("tracheostomy", "fiO2", e.target.value)}
                                                                placeholder="21-100"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                )}
            </div>
        </Card>
    )
    // Step 6: Updated Review & Create Patient
    const renderStep6 = () => (
        <Card className="p-6">
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Step 6: Doctor Review & Final Preview</h3>
                <p className="text-sm text-gray-600">
                    Please review all patient information below. This is a read-only preview of the data you've entered.
                    Click "Create Patient" when you're ready to save this patient record.
                </p>
            </div>

            <div className="space-y-6">
                {/* Updated Basic Details - Removed occupation, address, emergency contacts */}
                <div>
                    <h4 className="font-medium mb-2 text-blue-600">Basic Details</h4>
                    <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <p><span className="font-medium">Name:</span> {patientData.fullName}</p>
                        <p><span className="font-medium">Age:</span> {patientData.age}</p>
                        <p><span className="font-medium">Sex:</span> {patientData.sex}</p>
                        <p><span className="font-medium">Mobile:</span> {patientData.mobileNumber}</p>
                        <p><span className="font-medium">Email ID:</span> {patientData.emailId}</p>
                        <p><span className="font-medium">Registration Date:</span> {patientData.registrationDate}</p>
                    </div>
                </div>

                {/* Updated Structured Diagnosis */}
                <div>
                    <h4 className="font-medium mb-2 text-green-600">Structured Diagnosis</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <div className="flex items-center space-x-2">
                            <Badge variant="default" className="text-lg px-3 py-1">
                                {formatDiagnosisDisplay()}
                            </Badge>
                        </div>

                        {patientData.comorbidities.length > 0 && (
                            <div>
                                <span className="font-medium text-sm">Co-morbidities:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {patientData.comorbidities.map(c => (
                                        <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {patientData.smokingStatus && (
                            <p className="text-sm">
                                <span className="font-medium">Smoking:</span> {patientData.smokingStatus}
                                {patientData.packYears && ` (${patientData.packYears} pack years)`}
                            </p>
                        )}

                        {patientData.medicalHistory && (
                            <div>
                                <span className="font-medium text-sm">Medical History:</span>
                                <p className="text-sm text-gray-700 mt-1">{patientData.medicalHistory}</p>
                            </div>
                        )}

                        {patientData.occupationalExposure && (
                            <div>
                                <span className="font-medium text-sm">Occupational Exposure:</span>
                                <p className="text-sm text-gray-700 mt-1">{patientData.occupationalExposure}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* PFT Records */}
                {patientData.pftRecords.length > 0 && (
                    <div>
                        <h4 className="font-medium mb-2 text-purple-600">PFT Records ({patientData.pftRecords.length})</h4>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                            {patientData.pftRecords.map((record, index) => (
                                <div key={record.id} className="border-l-4 border-purple-500 pl-3">
                                    <p className="font-medium text-sm">Record #{index + 1} - {record.testDate}</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs mt-1">
                                        {record.fvc && <p>FVC: {record.fvc}% {isValueAbnormal('FVC', record.fvc) && <span className="text-red-500">⚠️</span>}</p>}
                                        {record.fev1 && <p>FEV1: {record.fev1}% {isValueAbnormal('FEV1', record.fev1) && <span className="text-red-500">⚠️</span>}</p>}
                                        {record.dlco && <p>DLCO: {record.dlco}% {isValueAbnormal('DLCO', record.dlco) && <span className="text-red-500">⚠️</span>}</p>}
                                        {record.sixMWD && <p>6MWD: {record.sixMWD}m {isValueAbnormal('6MWD', record.sixMWD) && <span className="text-red-500">⚠️</span>}</p>}
                                        {record.minSpO2 && <p>Min SpO₂: {record.minSpO2}% {isValueAbnormal('Min SpO2', record.minSpO2) && <span className="text-red-500">⚠️</span>}</p>}
                                        {record.maxSpO2 && <p>Max SpO₂: {record.maxSpO2}% {isValueAbnormal('Max SpO2', record.maxSpO2) && <span className="text-red-500">⚠️</span>}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Medications */}
                {patientData.medications.length > 0 && (
                    <div>
                        <h4 className="font-medium mb-2 text-orange-600">
                            Medications ({patientData.medications.length}) -
                            <span className="text-green-600 ml-2">Active: {getActiveMedicationsCount()}</span>
                            <span className="text-gray-500 ml-2">Past: {getPastMedicationsCount()}</span>
                        </h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2">Route</th>
                                            <th className="text-left py-2">Drug Name</th>
                                            <th className="text-left py-2">Dose</th>
                                            <th className="text-left py-2">Frequency</th>
                                            <th className="text-left py-2">Start Date</th>
                                            <th className="text-left py-2">End Date</th>
                                            <th className="text-left py-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {patientData.medications.map((med) => (
                                            <tr key={med.id} className="border-b">
                                                <td className="py-2">{med.route}</td>
                                                <td className="py-2 font-medium">
                                                    {med.drugName === "Other" ? med.customDrugName : med.drugName}
                                                </td>
                                                <td className="py-2">{med.dose}</td>
                                                <td className="py-2">{med.frequency}</td>
                                                <td className="py-2">{med.startDate}</td>
                                                <td className="py-2">{med.endDate || "Ongoing"}</td>
                                                <td className="py-2">
                                                    <Badge variant={med.isActive ? "default" : "secondary"} className="text-xs">
                                                        {med.isActive ? "Active" : "Past"}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Respiratory Support */}
                {patientData.requiresRespiratorySupport === "Yes" && (
                    <div>
                        <h4 className="font-medium mb-2 text-red-600">Respiratory Support</h4>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                            {patientData.ltot.enabled && (
                                <p><span className="font-medium">LTOT:</span> {patientData.ltot.oxygenLitres} L/min</p>
                            )}

                            {patientData.bipap.enabled && (
                                <div>
                                    <p className="font-medium">BiPAP/NIV:</p>
                                    <div className="ml-4 space-y-1">
                                        {patientData.bipap.overnightUse && <p>• Overnight use</p>}
                                        {patientData.bipap.allTimeUse && <p>• All-time use</p>}
                                        {patientData.bipap.requiresOxygen && <p>• Oxygen: {patientData.bipap.oxygenLitres} L/min</p>}
                                        {patientData.bipap.ipap && <p>• IPAP: {patientData.bipap.ipap} cmH2O</p>}
                                        {patientData.bipap.epap && <p>• EPAP: {patientData.bipap.epap} cmH2O</p>}
                                    </div>
                                </div>
                            )}

                            {patientData.invasiveVentilation.enabled && (
                                <div>
                                    <p className="font-medium">Invasive Ventilation:</p>
                                    <div className="ml-4 space-y-1">
                                        {patientData.invasiveVentilation.ipap && <p>• IPAP: {patientData.invasiveVentilation.ipap} cmH2O</p>}
                                        {patientData.invasiveVentilation.epap && <p>• EPAP: {patientData.invasiveVentilation.epap} cmH2O</p>}
                                        {patientData.invasiveVentilation.fiO2 && <p>• FiO₂: {patientData.invasiveVentilation.fiO2}%</p>}
                                    </div>
                                </div>
                            )}

                            {patientData.tracheostomy.enabled && (
                                <div>
                                    <p className="font-medium">Tracheostomy:</p>
                                    <div className="ml-4 space-y-1">
                                        <p>• Airway patency: {patientData.tracheostomy.airwayPatencyRequired ? "Required" : "Not required"}</p>
                                        {patientData.tracheostomy.oxygenViaTrach && <p>• Oxygen via trach: {patientData.tracheostomy.oxygenLitres} L/min</p>}
                                        {patientData.tracheostomy.requiresVentilator && <p>• Requires ventilator</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    )

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1: return renderStep1()       // Basic
            case 2: return renderStep2()       // Diagnosis
            case 3: return renderStep4()       // PFT
            case 4: return renderStep5()       // Respiratory Support
            case 5: return renderStep3()       // Medications
            case 6: return renderStep6()       // Final Preview
            default: return renderStep1()
        }
    }


    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Create New Patient - Updated Multi-Step Form</h1>
                <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5, 6].map((step) => (
                        <div
                            key={step}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === currentStep
                                ? "bg-blue-600 text-white"
                                : step < currentStep
                                    ? "bg-green-600 text-white"
                                    : "bg-gray-200 text-gray-600"
                                }`}
                        >
                            {step}
                        </div>
                    ))}
                </div>
            </div>

            {renderCurrentStep()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
                <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 1 || isSubmitting}
                >
                    Back
                </Button>

                <div className="space-x-2">
                    {currentStep < 6 ? (
                        <Button
                            onClick={handleNext}
                            disabled={isSubmitting}
                        >
                            Next
                        </Button>
                    ) : (
                        <Button
                            onClick={handleCreatePatient}
                            className="bg-green-600 hover:bg-green-700"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Creating Patient..." : "Create Patient"}
                        </Button>
                    )}
                </div>
            </div>
        </>
    )
}