"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PatientFolder, DoctorInstruction, Alert } from "@/lib/monitoring-types"
import { Prescription } from "@/lib/patient-types"
import { getDoctorPatientFolders } from "@/lib/doctor-patient-mapping"
import { getPatientProfile, getPatientAlerts, acknowledgeAlert, getPatientInstructions, addPatientInstruction, updatePatientData } from "@/lib/database-service"
import { getPatientPrescriptions } from "@/lib/prescription-service"
import { diagnosisToDiseaseType, formatDate } from "@/lib/utils"
import { resolveUserProfile } from "@/lib/session-manager"
import { ArrowLeft, User, Calendar, MapPin, Mail, AlertTriangle, Pill, FileText, TrendingUp, Download, Edit, Bell, MessageSquare, Trash2, Share, FileOutput, Activity, Clock, Phone, Plus, ArrowUpRight, CheckCircle2, ShieldCheck, Zap, Wind, ChevronRight } from "lucide-react"
import Link from "next/link"
import PrescriptionModal from "@/components/doctor/PrescriptionModal"
import { toast } from "@/lib/toast"
import { useDoctorAuth } from "@/lib/auth-guard"

export default function PatientDetailView({
  params,
}: {
  params: Promise<{ doctorId: string; patientId: string }>
}) {
  const authState = useDoctorAuth()
  const router = useRouter()
  const [doctorId, setDoctorId] = useState<string>("")
  const [patientId, setPatientId] = useState<string>("")
  const [patientFolder, setPatientFolder] = useState<PatientFolder | null>(null)
  const [patientData, setPatientData] = useState<any>(null)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [instructions, setInstructions] = useState<DoctorInstruction[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params
      setDoctorId(resolvedParams.doctorId)
      setPatientId(resolvedParams.patientId)

      let data = await getPatientProfile(resolvedParams.patientId)

      if (!data) {
        setLoading(false)
        return
      }
      setPatientData(data)

      const folders = getDoctorPatientFolders(resolvedParams.doctorId)
      let folder = folders.find(f => f.patientId === resolvedParams.patientId)

      if (!folder || folder.age === 0) {
        const diseaseType = data.diagnosis?.primaryCategory
          ? diagnosisToDiseaseType(data.diagnosis.primaryCategory)
          : (folder?.diseaseType || 'Unknown')

        folder = {
          ...(folder || {}),
          patientId: resolvedParams.patientId,
          fullName: data.fullName,
          age: parseInt(data.age) || 0,
          diseaseType: diseaseType as any,
          redFlagScore: folder?.redFlagScore || 1,
          alertCount: folder?.alertCount || 0,
          folderColor: folder?.folderColor || 'green',
          doctorId: resolvedParams.doctorId,
          lastLogDate: folder?.lastLogDate || new Date().toISOString()
        }
      }
      setPatientFolder(folder || null)

      await Promise.all([
        loadPrescriptions(resolvedParams.patientId),
        loadInstructions(resolvedParams.patientId),
        loadAlerts(resolvedParams.patientId)
      ])

      setLoading(false)
    }

    initializeParams()
  }, [params])

  const loadPrescriptions = async (pid: string) => {
    try {
      const list = await getPatientPrescriptions(pid)
      setPrescriptions(list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
    } catch (error) {
      console.error("Error loading prescriptions:", error)
    }
  }

  const loadInstructions = async (pid: string) => {
    try {
      const data = await getPatientInstructions(pid)
      setInstructions(data || [])
    } catch (error) {
      console.error("Error loading instructions:", error)
    }
  }

  const loadAlerts = async (pid: string) => {
    try {
      const data = await getPatientAlerts(pid)
      setAlerts(data || [])
    } catch (error) {
      console.error("Error loading alerts:", error)
    }
  }

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const result = await acknowledgeAlert(alertId)
      if (result.success) {
        toast.success("Alert acknowledged")
        loadAlerts(patientId)
      } else {
        toast.error("Failed to acknowledge: " + result.error)
      }
    } catch (e) {
      toast.error("An error occurred")
    }
  }

  const handleAddInstruction = async () => {
    const text = prompt("Enter clinical instruction for the patient:")
    if (!text || !text.trim()) return

    try {
      const result = await addPatientInstruction(patientId, doctorId, text.trim())
      if (result.success || result.instruction || result.id) {
        toast.success("Instruction sent successfully")
        loadInstructions(patientId)
      } else {
        toast.error("Failed to send instruction")
      }
    } catch (e) {
      toast.error("An error occurred")
    }
  }

  const getRiskColorClass = (score: number) => {
    if (score >= 9) return "text-rose-600 bg-rose-50 border-rose-100 shadow-rose-100/20"
    if (score >= 7) return "text-orange-600 bg-orange-50 border-orange-100 shadow-orange-100/20"
    if (score >= 4) return "text-amber-600 bg-amber-50 border-amber-100 shadow-amber-100/20"
    return "text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-100/20"
  }

  const getRiskLabel = (score: number) => {
    if (score >= 9) return "CRITICAL"
    if (score >= 7) return "HIGH RISK"
    if (score >= 4) return "MODERATE"
    return "STABLE"
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-50 rounded-[1.5rem] animate-spin border-t-slate-900" />
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] animate-pulse">Loading Patient Data</p>
      </div>
    )
  }

  if (!patientData) {
    return (
      <div className="text-center py-24 space-y-6">
        <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto border border-slate-100">
            <User className="w-10 h-10 text-slate-200" />
        </div>
        <h2 className="text-3xl font-bold text-slate-950 tracking-tighter">Profile Not Found</h2>
        <Button onClick={() => router.back()} className="h-14 px-8 rounded-2xl bg-slate-950 text-white font-bold text-xs uppercase tracking-widest shadow-2xl shadow-slate-200">
            Return to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-16 font-['Matter_Regular',sans-serif]">
      {/* Dynamic Action Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-slate-50 pb-12">
        <div className="flex items-center gap-8">
            <button onClick={() => router.back()} className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-950 hover:shadow-xl transition-all duration-500 active:scale-95 group">
                <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-2 px-1">Patient Profile</p>
                <div className="flex items-center gap-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-950 tracking-tighter leading-none">{patientData.fullName}</h1>
                    <Badge variant="outline" className="rounded-xl px-4 py-1.5 bg-slate-50 border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-500 shadow-sm">
                        ID: {patientId.slice(0, 12)}
                    </Badge>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-4">
            <Button variant="outline" className="h-16 px-8 rounded-[1.5rem] border-slate-100 font-bold text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-slate-950 transition-all border-2">
                <FileOutput className="w-5 h-5 mr-3" />
                Export Report
            </Button>
            <Link href={`/doctor/messages?patientId=${patientId}`}>
                <Button className="h-16 px-10 rounded-[1.5rem] bg-slate-950 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-widest transition-all shadow-2xl shadow-slate-200 active:scale-95">
                    <MessageSquare className="w-5 h-5 mr-3" />
                    Message Patient
                </Button>
            </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Core Profile Statistics */}
        <div className="lg:col-span-1 space-y-8">
            <Card className="p-10 border-none bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)] border border-slate-50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -translate-y-16 translate-x-16 opacity-50 group-hover:scale-110 transition-transform duration-700" />
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-28 h-28 bg-white rounded-[2.5rem] flex items-center justify-center border-2 border-slate-50 shadow-xl mb-8 relative overflow-hidden">
                        <img 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${patientData.fullName}`} 
                            alt="Avatar" 
                            className="w-20 h-20 object-contain"
                        />
                    </div>
                    <div className={`w-full py-4 rounded-2xl border px-6 mb-10 shadow-sm transition-all duration-500 ${getRiskColorClass(patientFolder?.redFlagScore || 0)}`}>
                        <p className="text-[9px] font-bold uppercase tracking-[0.3em] mb-1 opacity-70">Health Status</p>
                        <p className="text-xs font-bold tracking-tight">{getRiskLabel(patientFolder?.redFlagScore || 0)}</p>
                    </div>

                    <div className="w-full space-y-8 text-left border-t border-slate-50 pt-10">
                        {[
                            { icon: Activity, label: "Condition", value: patientData.diagnosis?.primaryCategory || 'General Checkup' },
                            { icon: Calendar, label: "Age", value: `${patientData.age} Years` },
                            { icon: Wind, label: "Monitoring For", value: patientFolder?.diseaseType || 'Respiratory Health' },
                            { icon: Clock, label: "Last Sync", value: formatDate(patientFolder?.lastLogDate || '') }
                        ].map((item, i) => (
                            <div key={i} className="space-y-2 group/item cursor-default">
                                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em] flex items-center gap-3 group-hover/item:text-slate-950 transition-colors">
                                    <item.icon className="w-3.5 h-3.5" /> 
                                    {item.label}
                                </p>
                                <p className="text-sm font-bold text-slate-950 tracking-tight leading-none pl-6.5">{item.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            <Card className="p-8 bg-emerald-500 rounded-[2.5rem] text-white overflow-hidden relative group cursor-pointer shadow-xl shadow-emerald-100 transition-all hover:scale-[1.02]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 -translate-y-16 translate-x-16 rounded-full blur-2xl group-hover:scale-150 transition-all duration-[2000ms]" />
                <div className="relative z-10 flex items-center gap-5">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                        <Zap className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-emerald-100">Patient Insights</p>
                        <p className="text-sm font-bold tracking-tight mt-1">Status Improving</p>
                    </div>
                </div>
            </Card>
        </div>

        {/* Telemetry and Management Engine */}
        <div className="lg:col-span-3 space-y-10">
            <Tabs defaultValue="vitals" className="w-full">
                <TabsList className="bg-white p-2 rounded-[2rem] shadow-[0_12px_24px_-8px_rgba(0,0,0,0.02)] border border-slate-50 h-20 w-full max-w-3xl flex items-stretch">
                    {[
                        { value: 'vitals', label: 'Vitals', icon: Activity },
                        { value: 'alerts', label: 'Alerts', icon: AlertTriangle, count: alerts.filter(a => !a.acknowledged).length },
                        { value: 'medications', label: 'Medications', icon: Pill },
                        { value: 'instructions', label: 'Instructions', icon: FileText }
                    ].map((tab) => (
                        <TabsTrigger 
                            key={tab.value}
                            value={tab.value} 
                            className="flex-1 rounded-2xl px-6 font-bold text-[10px] uppercase tracking-[0.2em] data-[state=active]:bg-slate-950 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:shadow-slate-200 transition-all duration-500 flex items-center justify-center gap-3 group"
                        >
                            <tab.icon className={`w-4 h-4 transition-colors ${tab.count ? 'text-rose-500' : 'text-slate-200 group-data-[state=active]:text-white'}`} />
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <div className="w-5 h-5 rounded-lg bg-rose-500 text-[10px] text-white flex items-center justify-center font-black shadow-lg shadow-rose-200">
                                    {tab.count}
                                </div>
                            )}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {/* Telemetry Content */}
                <TabsContent value="vitals" className="mt-12 space-y-12 outline-none animate-in fade-in duration-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="p-10 border-none bg-white rounded-[3rem] shadow-sm border border-slate-50 hover:shadow-2xl transition-all duration-700 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -translate-y-16 translate-x-16 opacity-0 group-hover:opacity-100 transition-all duration-700" />
                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-slate-950 group-hover:text-white transition-all duration-500 shadow-sm">
                                    <TrendingUp className="w-7 h-7" />
                                </div>
                                <ArrowUpRight className="w-5 h-5 text-slate-100 group-hover:text-slate-950 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                            </div>
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-3 ml-1">SpO₂ Level</h4>
                            <div className="flex items-baseline gap-4 relative z-10">
                                <span className="text-6xl font-bold text-slate-950 tracking-tighter">98%</span>
                                <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full">STABLE</Badge>
                            </div>
                        </Card>
                        <Card className="p-10 border-none bg-white rounded-[3rem] shadow-sm border border-slate-50 hover:shadow-2xl transition-all duration-700 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -translate-y-16 translate-x-16 opacity-0 group-hover:opacity-100 transition-all duration-700" />
                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-slate-950 group-hover:text-white transition-all duration-500 shadow-sm">
                                    <Activity className="w-7 h-7" />
                                </div>
                                <ArrowUpRight className="w-5 h-5 text-slate-100 group-hover:text-slate-950 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                            </div>
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-3 ml-1">Breathlessness (mMRC)</h4>
                            <div className="flex items-baseline gap-4 relative z-10">
                                <span className="text-6xl font-bold text-slate-950 tracking-tighter">1.2<span className="text-slate-200 text-3xl">/4</span></span>
                                <Badge className="bg-purple-500/10 text-purple-600 border-none font-bold text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full">NORMAL</Badge>
                            </div>
                        </Card>
                    </div>

                    <Card className="p-12 border-none bg-white rounded-[4rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)] border border-slate-50 transition-all">
                        <div className="flex items-center justify-between mb-12">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-bold text-slate-950 tracking-tighter">Health Trends</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time sync enabled</p>
                            </div>
                            <Button variant="ghost" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-950 transition-colors h-10 rounded-xl px-6 bg-slate-50/50">
                                View Full History
                            </Button>
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center justify-between p-8 rounded-[2.5rem] hover:bg-slate-50 transition-all duration-500 group border-2 border-transparent hover:border-slate-50">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-white border-2 border-slate-50 rounded-2xl flex items-center justify-center text-slate-200 group-hover:text-slate-950 group-hover:rotate-6 transition-all duration-500 shadow-sm">
                                            <Calendar className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-slate-950 tracking-tight leading-none">MARCH {24-i}, 2026</p>
                                            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                Verified Patient Entry
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-16">
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mb-1">SpO₂</p>
                                            <p className="text-xl font-bold text-slate-950 tracking-tight">97.8%</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mb-1">Pulse</p>
                                            <p className="text-xl font-bold text-slate-950 tracking-tight">72 BPM</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-2xl bg-white border-2 border-slate-50 flex items-center justify-center text-slate-100 group-hover:text-slate-950 transition-all opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100">
                                            <ChevronRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </TabsContent>

                {/* Alerts Content */}
                <TabsContent value="alerts" className="mt-12 space-y-8 outline-none animate-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center justify-between mb-2 px-2">
                        <h3 className="text-3xl font-bold text-slate-950 tracking-tighter">Patient Alerts</h3>
                        <Badge className="bg-slate-950 text-white border-none font-bold text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-full">{alerts.length} Registered Events</Badge>
                    </div>
                    {alerts.length === 0 ? (
                        <Card className="p-32 text-center border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.02)] rounded-[4rem] bg-white border border-slate-50">
                            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-slate-100">
                                <ShieldCheck className="w-12 h-12 text-slate-200" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-950 mb-3 tracking-tighter">Status Clear</h3>
                            <p className="text-slate-400 font-medium max-w-sm mx-auto">No medical alerts or anomalies detected for this patient.</p>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {alerts.map((alert) => (
                                <Card key={alert.id} className={`p-10 border-none rounded-[3.5rem] shadow-sm border transition-all duration-700 group hover:shadow-2xl ${alert.acknowledged ? 'bg-slate-50/50 opacity-60 grayscale' : 'bg-white shadow-xl border-l-[12px] border-l-rose-500'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-10">
                                            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all ${alert.level === 'RED' ? 'bg-rose-50 text-rose-500 shadow-xl shadow-rose-100' : 'bg-amber-50 text-amber-500 shadow-xl shadow-amber-100'} group-hover:scale-110`}>
                                                <AlertTriangle className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-4 mb-3">
                                                    <h4 className="text-xl font-bold text-slate-950 tracking-tight leading-none">{alert.reason_text || alert.message}</h4>
                                                    {!alert.acknowledged && <Badge className="bg-rose-500 text-white text-[9px] uppercase font-bold tracking-[0.2em] px-3 py-1 rounded-lg">High Severity</Badge>}
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    Time: {formatDate(alert.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                        {!alert.acknowledged && (
                                            <Button 
                                                onClick={() => handleAcknowledgeAlert(alert.id)}
                                                className="h-16 px-10 rounded-[1.5rem] bg-slate-950 text-white font-bold text-[10px] uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
                                            >
                                                Acknowledge
                                            </Button>
                                        )}
                                        {alert.acknowledged && (
                                            <div className="flex items-center gap-4 text-emerald-600 font-bold text-[11px] uppercase tracking-widest px-8 py-3 bg-emerald-50 rounded-2xl">
                                                <CheckCircle2 className="w-5 h-5 shadow-sm" />
                                                Acknowledged
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Medications Content */}
                <TabsContent value="medications" className="mt-12 space-y-12 outline-none animate-in fade-in duration-700">
                    <div className="flex items-center justify-between px-2">
                        <div className="space-y-1">
                            <h3 className="text-3xl font-bold text-slate-950 tracking-tighter">Medications</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Active treatment plan</p>
                        </div>
                        <Button 
                            onClick={() => setShowPrescriptionModal(true)}
                            className="bg-slate-950 hover:bg-slate-800 text-white rounded-[1.8rem] h-16 px-10 font-bold text-[10px] uppercase tracking-widest shadow-2xl shadow-slate-200 transition-all active:scale-95 flex items-center gap-4"
                        >
                            <Plus className="w-5 h-5" />
                            Add Prescription
                        </Button>
                    </div>
                    {prescriptions.length === 0 ? (
                        <Card className="p-32 text-center border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.02)] rounded-[4rem] bg-white border border-slate-50">
                            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-slate-100">
                                <Pill className="w-12 h-12 text-slate-100" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-950 mb-3 tracking-tighter">No Active Medications</h3>
                            <p className="text-slate-400 font-medium max-w-sm mx-auto">Add a prescription to start tracking the patient's medication adherence.</p>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {prescriptions.map((px) => (
                                <Card key={px.id} className="p-10 border-none bg-white rounded-[3.5rem] shadow-sm border border-slate-50 hover:shadow-2xl transition-all duration-700 group relative overflow-hidden">
                                     <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full translate-x-16 -translate-y-16 opacity-50 group-hover:scale-125 transition-transform duration-1000" />
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-3xl flex items-center justify-center group-hover:bg-slate-950 group-hover:text-white transition-all duration-500 shadow-sm group-hover:rotate-12">
                                                <Pill className="w-8 h-8" />
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-1">Date Prescribed</p>
                                                <Badge className="bg-slate-50 text-slate-950 border-none font-bold text-[10px] tracking-tighter px-4 py-1.5 rounded-xl">
                                                    {formatDate(px.date)}
                                                </Badge>
                                            </div>
                                        </div>
                                        <h4 className="text-3xl font-bold text-slate-950 mb-8 tracking-tighter group-hover:text-emerald-500 transition-colors leading-none">{px.medications[0].drugName}</h4>
                                        <div className="space-y-4 pt-4 border-t border-slate-50">
                                            {[
                                                { label: "Dosage", value: px.medications[0].dose },
                                                { label: "Frequency", value: px.medications[0].frequency },
                                                { label: "Method", value: px.medications[0].route || 'ORAL' }
                                            ].map((spec, si) => (
                                                <div key={si} className="flex justify-between items-center group/spec">
                                                    <span className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em] group-hover/spec:text-slate-950 transition-colors">{spec.label}</span>
                                                    <span className="text-sm font-bold text-slate-950 tracking-tight">{spec.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-50 group-hover:scale-100">
                                        <button className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-lg hover:rotate-12">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Instructions Content */}
                <TabsContent value="instructions" className="mt-12 space-y-12 outline-none animate-in fade-in duration-700">
                    <div className="flex items-center justify-between px-2">
                         <div className="space-y-1">
                            <h3 className="text-3xl font-bold text-slate-950 tracking-tighter">Instructions</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Guidance for the patient</p>
                        </div>
                        <Button 
                            onClick={handleAddInstruction}
                            className="bg-slate-950 hover:bg-slate-800 text-white rounded-[1.8rem] h-16 px-10 font-bold text-[10px] uppercase tracking-widest shadow-2xl shadow-slate-200 transition-all active:scale-95 flex items-center gap-4"
                        >
                            <Plus className="w-5 h-5" />
                            Add Instruction
                        </Button>
                    </div>
                    {instructions.length === 0 ? (
                         <Card className="p-32 text-center border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.02)] rounded-[4rem] bg-white border border-slate-50">
                            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-slate-100">
                                <FileText className="w-12 h-12 text-slate-100" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-950 mb-3 tracking-tighter">No Instructions</h3>
                            <p className="text-slate-400 font-medium max-w-sm mx-auto">Add an instruction to provide guidance to this patient.</p>
                         </Card>
                    ) : (
                        <div className="space-y-6">
                            {instructions.map((inst) => (
                                <Card key={inst.id} className="p-10 border-none bg-white rounded-[3rem] shadow-[0_12px_24px_-12px_rgba(0,0,0,0.02)] border border-slate-50 hover:shadow-2xl transition-all duration-700 group relative">
                                    <div className="flex items-start gap-8">
                                        <div className="w-16 h-16 bg-slate-50 rounded-[1.8rem] flex items-center justify-center text-slate-200 group-hover:bg-slate-950 group-hover:text-white transition-all duration-500 shadow-sm mt-1">
                                            <MessageSquare className="w-8 h-8" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-4">
                                                <div className="flex items-center gap-4">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        Sent: {formatDate(inst.createdAt)}
                                                    </p>
                                                    <Badge className="bg-emerald-500/5 text-emerald-600 border-none font-bold text-[8px] uppercase tracking-widest px-3 py-1">Delivered</Badge>
                                                </div>
                                                <button className="opacity-0 group-hover:opacity-100 transition-all duration-500 text-slate-100 hover:text-rose-500 p-2 rounded-xl hover:bg-rose-50">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <p className="text-xl font-bold text-slate-900 tracking-tight leading-relaxed max-w-3xl">{inst.instruction}</p>
                                        </div>
                                    </div>
                                    <div className="absolute right-10 bottom-10 opacity-0 group-hover:opacity-100 transition-all duration-1000 translate-y-4 group-hover:translate-y-0">
                                        <ShieldCheck className="w-6 h-6 text-slate-50 font-black" />
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>

        {/* Prescription Modal Integration */}
        {showPrescriptionModal && (
            <PrescriptionModal
                isOpen={showPrescriptionModal}
                patientData={patientData}
                patientId={patientId}
                doctorId={doctorId}
                doctorName={authState?.profile?.full_name || "Clinical Lead"}
                onClose={() => setShowPrescriptionModal(false)}
            />
        )}
      </div>
    </div>
  )
}