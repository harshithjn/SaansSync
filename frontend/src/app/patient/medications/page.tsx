"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { usePatientAuth } from '@/lib/auth-guard'
import { formatDate } from '@/lib/utils'
import {
    Pill,
    ShieldCheck,
    AlertCircle,
    Clock,
    Info,
    ArrowLeft,
    CheckCircle2,
    History,
    Zap,
    Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"

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
    const router = useRouter()
    const authState = usePatientAuth()
    const [medications, setMedications] = useState<Medication[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadMedications = async () => {
            if (!authState.user || authState.role !== 'patient') {
                return
            }

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
                    sideEffects: ["Nausea", "Sun sensitivity", "Fatigue"],
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
                    instructions: "Take in the morning with food. Must be tapered gradually.",
                    sideEffects: ["Appetite increase", "Weight gain"],
                    category: "Steroid"
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
                    instructions: "Complete the full course.",
                    sideEffects: ["Nausea"],
                    category: "Antibiotic"
                }
            ]

            setMedications(mockMedications)
            setIsLoading(false)
        }

        if (!authState.loading) {
            loadMedications()
        }
    }, [authState])

    const activeMedications = medications.filter(med => med.isActive)
    const pastMedications = medications.filter(med => !med.isActive)

    if (authState.loading || isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-[2rem] border border-slate-100 shadow-sm">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Accessing Pharmacy Records...</p>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-1000">
            {}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-slate-50 pb-12">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest border border-slate-100/50">
                        <Pill className="w-3 h-3" />
                        Therapeutic Protocol Dashboard
                    </div>
                    <h1 className="text-5xl font-black text-slate-950 tracking-tighter leading-none">Medication</h1>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Active surveillance of prescribed pharmacological agents</p>
                </div>
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="h-14 px-8 rounded-2xl bg-slate-50 border border-slate-100/50 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-950 hover:bg-white hover:shadow-xl transition-all gap-3"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Hub
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {}
                <div className="lg:col-span-8 space-y-12">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-950 tracking-tight">Active Protocols</h2>
                            <Badge className="bg-emerald-50 text-emerald-500 border-none font-black text-[8px] uppercase tracking-widest px-4 py-2 rounded-xl">
                                {activeMedications.length} Prescriptions Live
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {activeMedications.map((med) => (
                                <div key={med.id} className="bg-white rounded-[2.5rem] p-10 border border-slate-50 hover:shadow-2xl hover:shadow-slate-100 transition-all duration-700 group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-950 opacity-[0.02] -translate-y-16 translate-x-16 rounded-full group-hover:scale-150 transition-transform duration-1000" />

                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-10">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-slate-50 rounded-[1.25rem] flex items-center justify-center text-slate-300 group-hover:bg-slate-950 group-hover:text-white transition-all duration-500 shadow-sm border border-slate-100/50">
                                                <Pill className="w-7 h-7" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <h3 className="text-2xl font-black text-slate-950 tracking-tight leading-none uppercase">{med.drugName}</h3>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest">{med.category}</span>
                                                    <div className="w-1 h-1 bg-slate-100 rounded-full" />
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Protocol V1.2.0</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-left md:text-right shrink-0">
                                            <div className="text-xl font-black text-slate-950 tracking-tighter mb-1">{med.dose}</div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{med.frequency}</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-6 rounded-[1.5rem] bg-slate-50 border border-slate-100/50 space-y-3 group/info">
                                            <div className="flex items-center gap-2 text-teal-500">
                                                <Zap className="w-3.5 h-3.5" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Clinical Instruction</span>
                                            </div>
                                            <p className="text-[11px] font-bold text-slate-600 leading-relaxed italic">
                                                "{med.instructions}"
                                            </p>
                                        </div>
                                        <div className="p-6 rounded-[1.5rem] bg-slate-50 border border-slate-100/50 space-y-3">
                                            <div className="flex items-center gap-2 text-rose-500">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Observed Variance</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {med.sideEffects.map((effect, i) => (
                                                    <Badge key={i} className="bg-white text-slate-400 border border-slate-100 font-black text-[7px] uppercase tracking-widest py-1 px-3">
                                                        {effect}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                            <Clock className="w-3.5 h-3.5" />
                                            Active Since: {formatDate(med.startDate)}
                                        </div>
                                        <div className="flex items-center gap-2 text-emerald-500">
                                            <ShieldCheck className="w-4 h-4" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Verified Session</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {pastMedications.length > 0 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-black text-slate-400 tracking-tight uppercase tracking-widest text-[12px] flex items-center gap-3">
                                <History className="w-4 h-4" />
                                Archive Archives
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {pastMedications.map((med) => (
                                    <div key={med.id} className="p-6 rounded-[2rem] border border-slate-50 bg-slate-50/30 flex items-center justify-between opacity-60 group hover:opacity-100 transition-all duration-500">
                                        <div className="space-y-1.5">
                                            <h4 className="font-black text-slate-900 tracking-tight text-lg uppercase">{med.drugName}</h4>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Cycle Ended: {formatDate(med.endDate!)}</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-200 border border-slate-100">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {}
                <div className="lg:col-span-4 space-y-8">
                    <Card className="p-10 border-none bg-slate-950 rounded-[3rem] shadow-2xl shadow-slate-100 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full group-hover:scale-150 transition-all duration-1000" />
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-4">
                                <Info className="w-5 h-5 text-teal-400" />
                                <h3 className="text-xs font-black uppercase tracking-[0.3em]">Protocol Hygiene</h3>
                            </div>
                            <div className="space-y-6">
                                {[
                                    'Establish Temporal Consistency',
                                    'Utilize Clinical Organization Tools',
                                    'Engage Hardware Alerts',
                                    'Maintain Bio-Feedback Loops'
                                ].map((tip, i) => (
                                    <div key={i} className="flex items-center gap-4 group/item">
                                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500/50 group-hover/item:bg-teal-400 transition-colors" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover/item:text-white transition-colorsLeading-relaxed">{tip}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    <Card className="p-10 border-none bg-rose-50 rounded-[3rem] border border-rose-100 space-y-8 group hover:bg-white transition-all duration-700">
                        <div className="flex items-center gap-4 text-rose-600">
                            <AlertCircle className="w-5 h-5" />
                            <h3 className="text-xs font-black uppercase tracking-[0.3em]">Critical Variance</h3>
                        </div>
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-rose-800 uppercase tracking-widest leading-relaxed">Seek immediate emergency intervention if variance includes:</p>
                            <ul className="space-y-3">
                                {[
                                    'Acute Anaphylactic Response',
                                    'Profound Respiratory Distress',
                                    'Severe Systemic Toxicity'
                                ].map((warn, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <div className="w-1 h-1 bg-rose-300 rounded-full" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-rose-700">{warn}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="pt-4 border-t border-rose-100 text-center">
                            <p className="text-[14px] font-black text-rose-600 tracking-tighter">EMERGENCY_LINK_911</p>
                        </div>
                    </Card>

                    <Card className="p-8 border-none bg-slate-50/50 rounded-[2.5rem] border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider text-center">
                            This manifest represents verified clinical assets. Consult your primary medical node for adjustment protocols.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    )
}