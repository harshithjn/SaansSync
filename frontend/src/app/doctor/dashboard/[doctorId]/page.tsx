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
    <div className="space-y-8">
      {}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1">
            <p className="font-mono text-[9px] text-teal-600 uppercase tracking-[0.2em]">— Overview</p>
            <h1 className="font-heading text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
                Welcome, Dr. {authState.profile?.fullName?.split(' ')[0] || 'Doctor'}
            </h1>
        </div>
        <div className="flex items-center gap-3">
            <Link href={`/doctor/dashboard/${doctorId}/create-patient`}>
                <Button className="bg-slate-950 hover:bg-slate-800 text-white rounded-md h-10 px-5 font-bold text-xs uppercase tracking-widest border-2 border-slate-950 transition-all active:scale-[0.98]">
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add Patient
                </Button>
            </Link>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-200 border border-slate-200">
        <div className="p-5 bg-white group hover:bg-slate-50/50 transition-all">
            <div className="flex justify-between items-start">
                <Users className="w-4 h-4 text-slate-400" />
                <ArrowRight className="w-4 h-4 text-slate-200 group-hover:text-slate-900 transition-colors" />
            </div>
            <div className="mt-6">
                <p className="font-mono text-3xl font-bold text-slate-900 tracking-tight">{patientFolders.length}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Patients</p>
            </div>
        </div>

        <div className="p-5 bg-white group hover:bg-slate-50/50 transition-all">
            <div className="flex justify-between items-start">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                {alertCounts.critical > 0 && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
            </div>
            <div className="mt-6">
                <p className="font-mono text-3xl font-bold text-slate-900 tracking-tight">{alertCounts.critical}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Critical Alerts</p>
            </div>
        </div>

        <div className="p-5 bg-white group hover:bg-slate-50/50 transition-all">
            <div className="flex justify-between items-start">
                <TrendingUp className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-6">
                <p className="font-mono text-3xl font-bold text-slate-900 tracking-tight">{alertCounts.highRisk}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">High Risk Cases</p>
            </div>
        </div>
      </div>

      {}
      <div className="flex flex-col md:flex-row gap-2.5 items-center">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-slate-900 transition-colors" />
            <Input
              placeholder="Search patients by name or ID..."
              className="h-10 pl-9 bg-white border border-slate-200 rounded-md focus-visible:ring-0 focus-visible:border-slate-900 transition-all text-xs font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={selectedDisease} onValueChange={setSelectedDisease}>
            <SelectTrigger className="w-full md:w-44 h-10 bg-white border border-slate-200 rounded-md px-4 font-bold text-[10px] uppercase tracking-widest text-slate-500 focus:ring-0">
              <SelectValue placeholder="Disease Type" />
            </SelectTrigger>
            <SelectContent className="rounded-md border border-slate-200 shadow-lg p-1">
              <SelectItem value="all" className="rounded text-xs font-bold uppercase tracking-widest">All Patients</SelectItem>
              <SelectItem value="asthma" className="rounded text-xs font-bold uppercase tracking-widest">Asthma</SelectItem>
              <SelectItem value="copd" className="rounded text-xs font-bold uppercase tracking-widest">COPD</SelectItem>
              <SelectItem value="ild" className="rounded text-xs font-bold uppercase tracking-widest">ILD</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedRisk} onValueChange={setSelectedRisk}>
            <SelectTrigger className="w-full md:w-44 h-10 bg-white border border-slate-200 rounded-md px-4 font-bold text-[10px] uppercase tracking-widest text-slate-500 focus:ring-0">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent className="rounded-md border border-slate-200 shadow-lg p-1">
              <SelectItem value="all" className="rounded text-xs font-bold uppercase tracking-widest">All Risks</SelectItem>
              <SelectItem value="critical" className="rounded text-xs font-bold uppercase tracking-widest text-rose-600">Critical</SelectItem>
              <SelectItem value="high" className="rounded text-xs font-bold uppercase tracking-widest text-orange-600">High Risk</SelectItem>
              <SelectItem value="low" className="rounded text-xs font-bold uppercase tracking-widest text-emerald-600">Stable</SelectItem>
            </SelectContent>
          </Select>
      </div>

      {}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">
            Patient List — {filteredPatients.length}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-200 border border-slate-200">
          {filteredPatients.map((patient) => (
            <Link key={patient.patientId} href={`/doctor/dashboard/${doctorId}/patient/${patient.patientId}`} className="group block bg-white hover:bg-slate-50/50 transition-all">
              <div className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-slate-950 rounded-md flex items-center justify-center text-white group-hover:bg-teal-600 transition-all duration-300">
                        <Activity className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 text-sm leading-tight tracking-tight">{patient.fullName}</h4>
                        <p className="font-mono text-[8px] text-slate-400 uppercase tracking-widest mt-0.5">ID: {patient.patientId.slice(0, 8)}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 border text-[8px] font-bold uppercase tracking-widest ${getRiskColor(patient.redFlagScore)}`}>
                    {getRiskLabel(patient.redFlagScore)}
                  </div>
                </div>

                <div className="space-y-2.5 mb-5">
                    <div className="flex justify-between items-center text-[11px] border-b border-slate-100 pb-2">
                        <span className="text-slate-400 font-medium uppercase tracking-widest">Condition</span>
                        <span className="text-slate-900 font-semibold">{patient.diseaseType.split('(')[0]}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] border-b border-slate-100 pb-2">
                        <span className="text-slate-400 font-medium uppercase tracking-widest">Status</span>
                        <div className="flex items-center gap-1.5">
                            <div className="w-8 h-1 bg-slate-100 overflow-hidden">
                                <div className={`h-full ${patient.redFlagScore >= 7 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${patient.redFlagScore * 10}%` }} />
                            </div>
                            <span className="font-mono text-slate-900 font-semibold">{patient.redFlagScore}/10</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 font-medium uppercase tracking-widest">Last Update</span>
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-300" />
                            <span className="text-slate-900 font-semibold">{formatDate(patient.lastLogDate)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                    <div className="flex -space-x-1.5">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-5 h-5 rounded-full bg-slate-100 border-2 border-white" />
                        ))}
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-slate-300 group-hover:text-slate-950 transition-colors flex items-center gap-1.5">
                        View Profile
                        <ArrowUpRight className="w-3 h-3" />
                    </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredPatients.length === 0 && (
          <div className="py-16 text-center border border-dashed border-slate-200">
            <div className="w-14 h-14 bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-slate-300" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-slate-900 mb-1.5 tracking-tight">No patients found</h3>
            <p className="text-slate-400 text-xs font-medium max-w-xs mx-auto">Try adjusting your filters or search criteria.</p>
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