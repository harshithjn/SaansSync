"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
    ArrowLeft, 
    ArrowRight, 
    User, 
    Stethoscope, 
    Activity, 
    Wind, 
    Pill, 
    ChevronRight, 
    CheckCircle2, 
    Trash2, 
    Plus, 
    FileText,
    Shield,
    Calendar,
    Search
} from "lucide-react"

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
} from '@/lib/patient-validation'
import { toast } from '@/lib/toast'

const initialPatientData: PatientData = {
    fullName: "",
    emailId: "",
    age: "",
    sex: "",
    registrationDate: new Date().toISOString().split('T')[0],
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
    medications: [],
    pftRecords: [],
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

    useEffect(() => {
        setValidationErrors({})
    }, [currentStep])

    const updatePatientData = (field: string, value: any) => {
        setPatientData(prev => ({ ...prev, [field]: value }))
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
                ...(field === 'primaryCategory' && {
                    subtype: "",
                    ctdType: "",
                    sarcoidosisStage: "",
                    fibroticiLD: "",
                    customSubtype: ""
                }),
                ...(field === 'subtype' && {
                    ctdType: "",
                    sarcoidosisStage: "",
                    customSubtype: ""
                })
            }
        }))

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
            case "Interstitial Lung Disease (ILD)": return ILD_SUBTYPES
            case "Bronchial Asthma": return OAD_SUBTYPES
            case "COPD (Chronic Obstructive Pulmonary Disease)": return COPD_SUBTYPES
            case "Bronchiectasis": return BRONCHIECTASIS_SUBTYPES
            case "Post ICU Recovery": return POST_ICU_SUBTYPES
            default: return []
        }
    }

    const validateCurrentStep = () => {
        if (currentStep === 6) return true
        let validation
        switch (currentStep) {
            case 1: validation = validateStep1(patientData); break
            case 2: validation = validateStep2(patientData); break
            case 3: validation = validateStep4(patientData); break // PFT
            case 4: validation = { isValid: true, errors: [] }; break // Resp Support
            case 5: validation = validateStep3(patientData); break // Meds
            default: validation = { isValid: true, errors: [] }
        }

        const errorMap: { [key: string]: string } = {}
        validation.errors.forEach(error => { errorMap[error.field] = error.message })
        setValidationErrors(errorMap)
        return validation.isValid
    }

    const handleNext = () => {
        if (currentStep === 5) {
            const completeMedications = patientData.medications.filter(med =>
                med.route && med.drugName && med.dose && med.frequency && med.startDate
            )
            setPatientData(prev => ({ ...prev, medications: completeMedications }))
        }

        if (validateCurrentStep()) {
            setCurrentStep(prev => prev + 1)
        }
    }

    const handleBack = () => {
        setCurrentStep(prev => Math.max(1, prev - 1))
    }

    const handleCreatePatient = async () => {
        setIsSubmitting(true)
        try {
            const { createPatientFolderAsync } = await import('@/lib/doctor-patient-mapping')
            const { createPatientAccount } = await import('@/lib/database-service')
            
            const pathParts = window.location.pathname.split('/')
            const doctorId = pathParts[3]

            const credentials = {
                email: patientData.emailId,
                password: Math.random().toString(36).substring(2, 12)
            }

            const result = await createPatientAccount(
                credentials.email,
                credentials.password,
                patientData.fullName,
                patientData.diagnosis.primaryCategory as any,
                doctorId,
                patientData
            )

            if (!(result as any)?.success || !(result as any)?.profile?.id) {
                throw new Error((result as any)?.error || 'Registration failed')
            }

            const patientId = (result as any).profile.id
            await createPatientFolderAsync(patientData, doctorId, patientId, 1, 0)

            toast.success('Registration Complete', `Patient profile created. Credentials sent to ${patientData.emailId}`)
            router.push(`/doctor/dashboard/${doctorId}`)
        } catch (error) {
            toast.error('System Error', (error as Error).message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const steps = [
        { id: 1, name: "Profile", icon: User },
        { id: 2, name: "Diagnosis", icon: Stethoscope },
        { id: 3, name: "Vitals", icon: Activity },
        { id: 4, name: "Support", icon: Wind },
        { id: 5, name: "Medication", icon: Pill },
        { id: 6, name: "Review", icon: CheckCircle2 }
    ]

    return (
        <div className="max-w-5xl mx-auto space-y-10 font-['Matter_Regular',sans-serif] pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button onClick={() => router.back()} className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Registration</p>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tighter">Register New Patient</h1>
                    </div>
                </div>
            </div>

            {/* Stepper */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm overflow-x-auto">
                <div className="flex items-center justify-between min-w-[700px] px-4">
                    {steps.map((step, idx) => (
                        <div key={step.id} className="flex items-center">
                            <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => step.id < currentStep && setCurrentStep(step.id)}>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                                    currentStep === step.id 
                                        ? 'bg-slate-950 text-white shadow-xl shadow-slate-200 scale-110' 
                                        : currentStep > step.id 
                                            ? 'bg-emerald-50 text-emerald-600' 
                                            : 'bg-slate-50 text-slate-300'
                                }`}>
                                    <step.icon className="w-5 h-5" />
                                </div>
                                <span className={`text-[9px] font-bold uppercase tracking-widest ${
                                    currentStep === step.id ? 'text-slate-950' : 'text-slate-400'
                                }`}>{step.name}</span>
                            </div>
                            {idx < steps.length - 1 && (
                                <div className="mx-6 w-12 h-[2px] bg-slate-50 rounded-full">
                                    <div className={`h-full bg-slate-950 transition-all duration-700 ${currentStep > step.id ? 'w-full' : 'w-0'}`} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
                {currentStep === 1 && <ProfileStep data={patientData} update={updatePatientData} errors={validationErrors} />}
                {currentStep === 2 && <DiagnosisStep data={patientData} update={updateDiagnosis} errors={validationErrors} options={getSubtypeOptions()} />}
                {currentStep === 3 && <PFTStep data={patientData} set={setPatientData} errors={validationErrors} />}
                {currentStep === 4 && <SupportStep data={patientData} updateConfig={(t: keyof PatientData, f: string, v: any) => setPatientData(prev => ({...prev, [t]: {...(prev[t as keyof PatientData] as any), [f]: v}}))} />}
                {currentStep === 5 && <MedicationStep data={patientData} set={setPatientData} errors={validationErrors} />}
                {currentStep === 6 && <ReviewStep data={patientData} />}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-8 border-t border-slate-100">
                <Button 
                    variant="ghost" 
                    onClick={handleBack} 
                    disabled={currentStep === 1 || isSubmitting}
                    className="h-14 px-8 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-slate-950"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                </Button>
                
                {currentStep < 6 ? (
                    <Button 
                        onClick={handleNext}
                        className="h-14 px-10 rounded-[1.5rem] bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 transition-all active:scale-[0.98]"
                    >
                        Next Step
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                ) : (
                    <Button 
                        onClick={handleCreatePatient}
                        disabled={isSubmitting}
                        className="h-14 px-10 rounded-[1.5rem] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-[0.2em] shadow-2xl shadow-emerald-100 transition-all active:scale-[0.98]"
                    >
                        {isSubmitting ? "Creating Patient Profile..." : "Confirm Registration"}
                        <CheckCircle2 className="w-4 h-4 ml-2" />
                    </Button>
                )}
            </div>
        </div>
    )
}

/* Sub-components for clean structure */

function ProfileStep({ data, update, errors }: any) {
    return (
        <Card className="p-10 border-none bg-white rounded-[3rem] shadow-sm border border-slate-50">
            <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center">
                    <User className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Personal Details</h3>
                    <p className="text-xs font-medium text-slate-400">Basic information for the patient profile.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <InputGroup label="Full Name" error={errors.fullName}>
                    <Input 
                        value={data.fullName}
                        onChange={(e) => update("fullName", e.target.value)}
                        placeholder="e.g. Johnathan Smith"
                        className="h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900"
                    />
                </InputGroup>
                <InputGroup label="Email Address" error={errors.emailId}>
                    <Input 
                        type="email"
                        value={data.emailId}
                        onChange={(e) => update("emailId", e.target.value)}
                        placeholder="john@example.com"
                        className="h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900"
                    />
                </InputGroup>
                <InputGroup label="Age" error={errors.age}>
                    <Input 
                        type="number"
                        value={data.age}
                        onChange={(e) => update("age", e.target.value)}
                        placeholder="45"
                        className="h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900"
                    />
                </InputGroup>
                <InputGroup label="Gender" error={errors.sex}>
                    <Select value={data.sex} onValueChange={(v) => update("sex", v)}>
                        <SelectTrigger className="h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900">
                            <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl font-bold">
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Non-binary</SelectItem>
                        </SelectContent>
                    </Select>
                </InputGroup>
            </div>
        </Card>
    )
}

function DiagnosisStep({ data, update, errors, options }: any) {
    return (
        <Card className="p-10 border-none bg-white rounded-[3rem] shadow-sm border border-slate-50">
            <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                    <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Diagnosis</h3>
                    <p className="text-xs font-medium text-slate-400">Defining the primary respiratory condition.</p>
                </div>
            </div>

            <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <InputGroup label="Condition Category" error={errors.primaryCategory}>
                        <Select value={data.diagnosis.primaryCategory} onValueChange={(v) => update("primaryCategory", v)}>
                            <SelectTrigger className="h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl font-bold">
                                {PRIMARY_DIAGNOSIS_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </InputGroup>
                    <InputGroup label="Specific Subtype" error={errors.subtype}>
                        <Select value={data.diagnosis.subtype} onValueChange={(v) => update("subtype", v)} disabled={!data.diagnosis.primaryCategory}>
                            <SelectTrigger className="h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900">
                                <SelectValue placeholder="Select subtype" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl font-bold">
                                {options.map((o: string) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </InputGroup>
                </div>

                <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                   <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">Medical History Summary</h4>
                   <textarea 
                     className="w-full h-32 bg-white border-none rounded-2xl p-6 font-bold text-slate-900 resize-none shadow-sm focus:ring-2 ring-slate-100"
                     value={data.medicalHistory}
                     onChange={(e) => update("medicalHistory", e.target.value)}
                     placeholder="Document significant medical history here..."
                   />
                </div>
            </div>
        </Card>
    )
}

function PFTStep({ data, set, errors }: any) {
    const add = () => set((prev: any) => ({ ...prev, pftRecords: [...prev.pftRecords, { id: Date.now().toString(), testDate: new Date().toISOString().split('T')[0] }] }))
    const remove = (id: string) => set((prev: any) => ({ ...prev, pftRecords: prev.pftRecords.filter((r: any) => r.id !== id) }))
    const update = (id: string, f: string, v: string) => set((prev: any) => ({ ...prev, pftRecords: prev.pftRecords.map((r: any) => r.id === id ? { ...r, [f]: v } : r) }))

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Vitals & Tests</h3>
                        <p className="text-xs font-medium text-slate-400">Pulmonary Function Test (PFT) records.</p>
                    </div>
                </div>
                <Button onClick={add} variant="outline" className="rounded-2xl border-slate-200 h-14 px-8 font-bold text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-950 hover:text-white transition-all">
                    <Plus className="w-4 h-4 mr-2" /> Add Record
                </Button>
            </div>

            {data.pftRecords.length === 0 ? (
                <Card className="p-24 text-center bg-white rounded-[3rem] border-none shadow-sm">
                    <Activity className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                    <h3 className="text-xl font-bold text-slate-900">No baseline records</h3>
                    <p className="text-slate-400 mt-2 max-w-xs mx-auto">Add a PFT record to establish the patient's baseline measurements.</p>
                </Card>
            ) : (
                <div className="space-y-6">
                    {data.pftRecords.map((record: any) => (
                        <Card key={record.id} className="p-8 border-none bg-white rounded-[2.5rem] shadow-sm relative group overflow-hidden border border-slate-50">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                                <InputGroup label="Date">
                                    <Input type="date" value={record.testDate} onChange={(e) => update(record.id, "testDate", e.target.value)} className="bg-slate-50 border-none rounded-xl font-bold" />
                                </InputGroup>
                                <InputGroup label="FVC (%)">
                                    <Input type="number" value={record.fvc} onChange={(e) => update(record.id, "fvc", e.target.value)} className="bg-slate-50 border-none rounded-xl font-bold" />
                                </InputGroup>
                                <InputGroup label="FEV1 (%)">
                                    <Input type="number" value={record.fev1} onChange={(e) => update(record.id, "fev1", e.target.value)} className="bg-slate-50 border-none rounded-xl font-bold" />
                                </InputGroup>
                                <InputGroup label="DLCO (%)">
                                    <Input type="number" value={record.dlco} onChange={(e) => update(record.id, "dlco", e.target.value)} className="bg-slate-50 border-none rounded-xl font-bold" />
                                </InputGroup>
                                <div className="flex items-end justify-end">
                                    <Button onClick={() => remove(record.id)} variant="ghost" className="h-12 w-12 rounded-xl text-rose-200 hover:text-rose-600 hover:bg-rose-50">
                                        <Trash2 className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

function SupportStep({ data, updateConfig }: any) {
    return (
        <Card className="p-10 border-none bg-white rounded-[3rem] shadow-sm border border-slate-50">
            <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center">
                    <Wind className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Breathing Support</h3>
                    <p className="text-xs font-medium text-slate-400">Ongoing support and supplemental oxygen requirements.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                    <SupportToggle 
                        label="LTOT (Oxygen Therapy)" 
                        checked={data.ltot.enabled} 
                        onChange={(v: boolean) => updateConfig("ltot", "enabled", v)} 
                    />
                    {data.ltot.enabled && (
                        <div className="pl-6 border-l-2 border-slate-100 space-y-4">
                    <InputGroup label="Flow Rate (L/min)">
                                <Input type="number" step="0.5" value={data.ltot.oxygenLitres} onChange={(e) => updateConfig("ltot", "oxygenLitres", e.target.value)} className="h-12 bg-slate-50 border-none rounded-xl font-bold text-slate-900" />
                            </InputGroup>
                        </div>
                    )}
                </div>
                
                <div className="space-y-6">
                    <SupportToggle 
                        label="BiPAP / NILV Support" 
                        checked={data.bipap.enabled} 
                        onChange={(v: boolean) => updateConfig("bipap", "enabled", v)} 
                    />
                    {data.bipap.enabled && (
                        <div className="pl-6 border-l-2 border-slate-100 grid grid-cols-2 gap-4">
                            <InputGroup label="IPAP">
                                <Input type="number" value={data.bipap.ipap} onChange={(e) => updateConfig("bipap", "ipap", e.target.value)} className="h-10 bg-slate-50 border-none rounded-xl font-bold text-slate-900" />
                            </InputGroup>
                            <InputGroup label="EPAP">
                                <Input type="number" value={data.bipap.epap} onChange={(e) => updateConfig("bipap", "epap", e.target.value)} className="h-10 bg-slate-50 border-none rounded-xl font-bold text-slate-900" />
                            </InputGroup>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    )
}

function MedicationStep({ data, set, errors }: any) {
    const add = () => set((prev: any) => ({ ...prev, medications: [...prev.medications, { id: Date.now().toString(), isActive: true }] }))
    const remove = (id: string) => set((prev: any) => ({ ...prev, medications: prev.medications.filter((m: any) => m.id !== id) }))
    const update = (id: string, f: string, v: string) => set((prev: any) => ({ ...prev, medications: prev.medications.map((m: any) => m.id === id ? { ...m, [f]: v } : m) }))

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
                        <Pill className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Medications</h3>
                        <p className="text-xs font-medium text-slate-400">Current active medications and dosing schedule.</p>
                    </div>
                </div>
                <Button onClick={add} variant="outline" className="rounded-2xl border-slate-200 h-14 px-8 font-bold text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-950 hover:text-white transition-all">
                    <Plus className="w-4 h-4 mr-2" /> Add Medication
                </Button>
            </div>

            {data.medications.length === 0 ? (
                <Card className="p-24 text-center bg-white rounded-[3rem] border-none shadow-sm">
                    <Pill className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                    <h3 className="text-xl font-bold text-slate-900">No active medications</h3>
                    <p className="text-slate-400 mt-2 max-w-xs mx-auto">Define the initial medication list for this patient to track adherence.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {data.medications.map((med: any) => (
                        <Card key={med.id} className="p-8 border-none bg-white rounded-[2.5rem] shadow-sm border border-slate-50 group">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-slate-950 group-hover:text-white transition-all">
                                    <Pill className="w-5 h-5" />
                                </div>
                                <button onClick={() => remove(med.id)} className="text-slate-200 hover:text-rose-500 transition-colors">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-6">
                                <InputGroup label="Medication Name">
                                    <Input value={med.drugName} onChange={(e) => update(med.id, "drugName", e.target.value)} placeholder="e.g. Mycophenolate" className="h-12 bg-slate-50 border-none rounded-xl px-4 font-bold text-slate-900" />
                                </InputGroup>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputGroup label="Dose">
                                        <Input value={med.dose} onChange={(e) => update(med.id, "dose", e.target.value)} placeholder="500mg" className="h-12 bg-slate-50 border-none rounded-xl px-4 font-bold text-slate-900" />
                                    </InputGroup>
                                    <InputGroup label="Frequency">
                                        <Input value={med.frequency} onChange={(e) => update(med.id, "frequency", e.target.value)} placeholder="Twice a day" className="h-12 bg-slate-50 border-none rounded-xl px-4 font-bold text-slate-900" />
                                    </InputGroup>
                                </div>
                                <InputGroup label="Method">
                                    <Select value={med.route} onValueChange={(v) => update(med.id, "route", v)}>
                                        <SelectTrigger className="h-12 bg-slate-50 border-none rounded-xl px-4 font-bold text-slate-900">
                                            <SelectValue placeholder="Select method" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl font-bold">
                                            {ROUTE_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </InputGroup>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

function ReviewStep({ data }: any) {
    return (
        <Card className="p-10 border-none bg-white rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-50">
            <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-50">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Review Summary</h3>
                    <p className="text-xs font-medium text-slate-400">Verify all entries before finalizing registration.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <ReviewSection title="Patient Profile">
                        <ReviewRow label="Full Name" value={data.fullName} />
                        <ReviewRow label="Email" value={data.emailId} />
                        <ReviewRow label="Age / Sex" value={`${data.age} Y • ${data.sex}`} />
                    </ReviewSection>
                    
                    <ReviewSection title="Medical Diagnosis">
                        <ReviewRow label="Category" value={data.diagnosis.primaryCategory} />
                        <ReviewRow label="Subtype" value={data.diagnosis.subtype || 'Unspecified'} />
                    </ReviewSection>
                </div>

                <div className="space-y-8">
                    <ReviewSection title="Baseline Metrics">
                        <ReviewRow label="Vitals Records" value={`${data.pftRecords.length} recorded`} />
                        <ReviewRow label="Resp. Support" value={data.requiresRespiratorySupport || 'None'} />
                    </ReviewSection>

                    <ReviewSection title="Treatment Plan">
                        <ReviewRow label="Active Meds" value={`${data.medications.length} active`} />
                        <div className="mt-4 flex flex-wrap gap-2">
                            {data.medications.map((m: any, i: number) => (
                                <Badge key={i} className="bg-slate-50 text-slate-500 border-none font-bold text-[9px] uppercase tracking-widest px-3 py-1">
                                    {m.drugName}
                                </Badge>
                            ))}
                        </div>
                    </ReviewSection>
                </div>
            </div>

            <div className="mt-12 p-6 bg-slate-950 rounded-[2rem] flex items-center justify-between text-white">
                <div className="flex items-center gap-4">
                    <Shield className="w-6 h-6 text-emerald-400" />
                    <div>
                        <p className="font-bold text-sm tracking-tight text-white">Ready for Registration</p>
                        <p className="text-[10px] font-medium text-slate-400">Patient will be added to your dashboard.</p>
                    </div>
                </div>
                <div className="hidden md:block">
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Security: Encrypted AES-256</p>
                </div>
            </div>
        </Card>
    )
}

/* UI Components for steps */

function InputGroup({ label, error, children }: any) {
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{label}</label>
                {error && <span className="text-[10px] font-bold text-rose-500">{error}</span>}
            </div>
            {children}
        </div>
    )
}

function ReviewSection({ title, children }: any) {
    return (
        <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 border-b border-slate-50 pb-2 mb-4">{title}</h4>
            <div className="space-y-3">
                {children}
            </div>
        </div>
    )
}

function ReviewRow({ label, value }: any) {
    return (
        <div className="flex justify-between items-center py-1">
            <span className="text-xs font-bold text-slate-400">{label}</span>
            <span className="text-xs font-bold text-slate-900">{value || '--'}</span>
        </div>
    )
}

function SupportToggle({ label, checked, onChange }: any) {
    return (
        <div className={`p-6 rounded-3xl border transition-all ${checked ? 'bg-slate-950 border-slate-950 shadow-xl shadow-slate-200' : 'bg-white border-slate-100'}`} onClick={() => onChange(!checked)}>
            <div className="flex items-center justify-between cursor-pointer">
                <span className={`text-xs font-bold uppercase tracking-widest ${checked ? 'text-white' : 'text-slate-900'}`}>{label}</span>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${checked ? 'bg-white border-white text-slate-950' : 'border-slate-100'}`}>
                    {checked && <CheckCircle2 className="w-4 h-4" />}
                </div>
            </div>
        </div>
    )
}