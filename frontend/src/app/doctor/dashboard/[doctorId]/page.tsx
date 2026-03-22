"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useDoctorAuth } from '@/lib/auth-guard'
import { getDoctorPatientFolders, getDoctorAlerts } from "@/lib/database-service"
import { PatientFolder, FolderColor } from "@/lib/monitoring-types"
import { formatDate } from "@/lib/utils"
import { Users, AlertTriangle, TrendingUp, Search, Plus, Bell, Edit, UserPlus, ArrowRight, Activity, Calendar, Clock } from "lucide-react"

export default function DoctorDashboard({
  params,
}: {
  params: Promise<{ doctorId: string }>
}) {
  const authState = useDoctorAuth()
  const [doctorId, setDoctorId] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDisease, setSelectedDisease] = useState("all")
  const [selectedRisk, setSelectedRisk] = useState("all")
  const [patientFolders, setPatientFolders] = useState<PatientFolder[]>([])
  const [alertCounts, setAlertCounts] = useState({
    critical: 0,
    highRisk: 0,
    total: 0
  })
  const [filteredPatients, setFilteredPatients] = useState<PatientFolder[]>([])

  useEffect(() => {
    const initializeDashboard = async () => {
      const resolvedParams = await params
      setDoctorId(resolvedParams.doctorId)

      try {
        const updatedFolders = await getDoctorPatientFolders(resolvedParams.doctorId)
        const dbAlerts = await getDoctorAlerts(resolvedParams.doctorId)
        const activeAlerts = dbAlerts.filter(a => !a.acknowledged)

        setAlertCounts({
          critical: activeAlerts.filter(a => a.level === 'RED').length,
          highRisk: activeAlerts.filter(a => a.level === 'YELLOW' || a.level === 'ORANGE').length,
          total: activeAlerts.length
        })

        setPatientFolders(updatedFolders)
        setFilteredPatients(updatedFolders)
      } catch (error) {
        console.error('Loading failed:', error)
      }
    }
    initializeDashboard()
  }, [params])

  useEffect(() => {
    let filtered: PatientFolder[] = patientFolders
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(patient =>
        patient.fullName.toLowerCase().includes(term) ||
        patient.patientId.toLowerCase().includes(term)
      )
    }
    if (selectedDisease !== "all") {
      filtered = filtered.filter(patient => {
        const pType = patient.diseaseType.toLowerCase()
        if (selectedDisease === 'copd') return pType.includes('copd') || pType.includes('obstructive')
        if (selectedDisease === 'ild') return pType.includes('ild') || pType.includes('interstitial')
        if (selectedDisease === 'asthma') return pType.includes('asthma')
        return pType === selectedDisease.toLowerCase()
      })
    }
    if (selectedRisk !== "all") {
      filtered = filtered.filter(patient => {
        if (selectedRisk === "critical") return patient.redFlagScore >= 9
        if (selectedRisk === "high") return patient.redFlagScore >= 7 && patient.redFlagScore < 9
        if (selectedRisk === "moderate") return patient.redFlagScore >= 4 && patient.redFlagScore < 7
        if (selectedRisk === "low") return patient.redFlagScore < 4
        return true
      })
    }
    setFilteredPatients(filtered as PatientFolder[])
  }, [searchTerm, selectedDisease, selectedRisk, patientFolders])

  const getRiskColor = (score: number) => {
    if (score >= 9) return "text-rose-600 bg-rose-50"
    if (score >= 7) return "text-orange-600 bg-orange-50"
    if (score >= 4) return "text-amber-600 bg-amber-50"
    return "text-emerald-600 bg-emerald-50"
  }

  const getRiskLabel = (score: number) => {
    if (score >= 9) return "Critical"
    if (score >= 7) return "High Risk"
    if (score >= 4) return "Moderate"
    return "Stable"
  }

  return (
    <div className="space-y-12 font-['Matter_Regular',sans-serif]">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Overview</p>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tighter">
                Welcome, Dr. {authState.profile?.full_name?.split(' ')[0] || 'Doctor'}
            </h1>
        </div>
        <div className="flex items-center gap-3">
            <Link href={`/doctor/dashboard/${doctorId}/create-patient`}>
                <Button className="bg-slate-950 hover:bg-slate-800 text-white rounded-[1.5rem] h-14 px-8 font-bold text-sm uppercase tracking-widest shadow-2xl shadow-slate-200 transition-all active:scale-[0.98]">
                    <Plus className="w-5 h-5 mr-2" />
                    Add Patient
                </Button>
            </Link>
        </div>
      </div>

      {/* Stats Cards - Sleek Rows */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-8 border-none bg-white shadow-[0_12px_24px_-8px_rgba(0,0,0,0.04)] rounded-[2.5rem] relative overflow-hidden group hover:shadow-xl transition-all border border-slate-50">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-slate-950 group-hover:text-white transition-all duration-500">
                    <Users className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-200 group-hover:text-slate-900 transition-colors" />
            </div>
            <div className="mt-8">
                <p className="text-4xl font-bold text-slate-900 tracking-tighter">{patientFolders.length}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Patients</p>
            </div>
          </div>
        </Card>

        <Card className="p-8 border-none bg-white shadow-[0_12px_24px_-8px_rgba(0,0,0,0.04)] rounded-[2.5rem] relative overflow-hidden group hover:shadow-xl transition-all border border-slate-50">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6" />
                </div>
                {alertCounts.critical > 0 && <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
            </div>
            <div className="mt-8">
                <p className="text-4xl font-bold text-slate-900 tracking-tighter">{alertCounts.critical}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Critical Alerts</p>
            </div>
          </div>
        </Card>

        <Card className="p-8 border-none bg-white shadow-[0_12px_24px_-8px_rgba(0,0,0,0.04)] rounded-[2.5rem] relative overflow-hidden group hover:shadow-xl transition-all border border-slate-50">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" />
                </div>
            </div>
            <div className="mt-8">
                <p className="text-4xl font-bold text-slate-900 tracking-tighter">{alertCounts.highRisk}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">High Risk Cases</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-slate-300 w-5 h-5 group-focus-within:text-slate-900 transition-colors" />
            <Input
              placeholder="Search patients by name or ID..."
              className="h-14 pl-14 bg-slate-50 border-none rounded-2xl focus-visible:ring-slate-100 transition-all text-sm font-bold placeholder:font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={selectedDisease} onValueChange={setSelectedDisease}>
            <SelectTrigger className="w-full md:w-56 h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-xs uppercase tracking-widest text-slate-500 focus:ring-slate-100">
              <SelectValue placeholder="Disease Type" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl p-2 font-['Matter_Regular',sans-serif]">
              <SelectItem value="all" className="rounded-xl text-xs font-bold uppercase tracking-widest">All Patients</SelectItem>
              <SelectItem value="asthma" className="rounded-xl text-xs font-bold uppercase tracking-widest">Asthma</SelectItem>
              <SelectItem value="copd" className="rounded-xl text-xs font-bold uppercase tracking-widest">COPD</SelectItem>
              <SelectItem value="ild" className="rounded-xl text-xs font-bold uppercase tracking-widest">ILD</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedRisk} onValueChange={setSelectedRisk}>
            <SelectTrigger className="w-full md:w-56 h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-xs uppercase tracking-widest text-slate-500 focus:ring-slate-100">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl p-2 font-['Matter_Regular',sans-serif]">
              <SelectItem value="all" className="rounded-xl text-xs font-bold uppercase tracking-widest">All Risks</SelectItem>
              <SelectItem value="critical" className="rounded-xl text-xs font-bold uppercase tracking-widest text-rose-600">Critical</SelectItem>
              <SelectItem value="high" className="rounded-xl text-xs font-bold uppercase tracking-widest text-orange-600">High Risk</SelectItem>
              <SelectItem value="low" className="rounded-xl text-xs font-bold uppercase tracking-widest text-emerald-600">Stable</SelectItem>
            </SelectContent>
          </Select>
      </div>

      {/* Patient Grid */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            Patient List <span className="text-slate-300 ml-2 font-bold">{filteredPatients.length}</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPatients.map((patient) => (
            <Link key={patient.patientId} href={`/doctor/dashboard/${doctorId}/patient/${patient.patientId}`} className="group block">
              <Card className="p-8 border-none bg-white rounded-[3rem] shadow-[0_12px_24px_-8px_rgba(0,0,0,0.02)] border border-slate-50 group-hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] group-hover:-translate-y-1 transition-all duration-500">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-slate-50 rounded-[1.25rem] flex items-center justify-center text-slate-400 group-hover:bg-slate-950 group-hover:text-white transition-all duration-500">
                        <Activity className="w-7 h-7" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-lg leading-tight tracking-tight">{patient.fullName}</h4>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {patient.patientId.slice(0, 8)}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${getRiskColor(patient.redFlagScore)}`}>
                    {getRiskLabel(patient.redFlagScore)}
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-3">
                        <span className="text-slate-400 font-bold uppercase tracking-widest">Condition</span>
                        <span className="text-slate-900 font-bold">{patient.diseaseType.split('(')[0]}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-3">
                        <span className="text-slate-400 font-bold uppercase tracking-widest">Status</span>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-1 rounded-full bg-slate-100 overflow-hidden">
                                <div className={`h-full ${patient.redFlagScore >= 7 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${patient.redFlagScore * 10}%` }} />
                            </div>
                            <span className="text-slate-900 font-bold">{patient.redFlagScore}/10</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold uppercase tracking-widest">Last Update</span>
                        <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-slate-300" />
                            <span className="text-slate-900 font-bold">{formatDate(patient.lastLogDate)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-6 h-6 rounded-full bg-slate-50 border-2 border-white" />
                        ))}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300 group-hover:text-slate-950 transition-colors flex items-center gap-2">
                        View Profile
                        <ArrowUpRight className="w-3 h-3" />
                    </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {filteredPatients.length === 0 && (
          <div className="py-24 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-slate-100">
                <Users className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">No patients found</h3>
            <p className="text-slate-400 text-sm font-medium max-w-xs mx-auto">Try adjusting your filters or search criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M7 17L17 7M17 7H7M17 7V17" />
    </svg>
  )
}