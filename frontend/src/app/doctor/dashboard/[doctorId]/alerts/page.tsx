"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getDoctorAlerts, acknowledgeAlert } from "@/lib/database-service"
import { AlertTriangle, Bell, CheckCircle, Clock, Search, Filter, Shield, Activity, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

interface StoredDoctorAlert {
  id: string
  patientId: string
  patientName?: string
  doctorId: string
  level: string
  reasonText: string
  triggers: string[]
  diseaseType: string
  timestamp: string
  acknowledged: boolean
}

export default function AlertsPage({
  params,
}: {
  params: Promise<{ doctorId: string }>
}) {
  const [doctorId, setDoctorId] = useState<string>("")
  const [alerts, setAlerts] = useState<StoredDoctorAlert[]>([])
  const [filteredAlerts, setFilteredAlerts] = useState<StoredDoctorAlert[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("active")
  const [loading, setLoading] = useState(true)
  const [statistics, setStatistics] = useState({
    total: 0,
    red: 0,
    orange: 0,
    yellow: 0,
    acknowledged: 0
  })

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params
      setDoctorId(resolvedParams.doctorId)
      loadAlerts(resolvedParams.doctorId)
    }
    initializeParams()
  }, [params])

  const loadAlerts = async (docId: string) => {
    setLoading(true)
    try {
      const rawAlerts = await getDoctorAlerts(docId)
      const mappedAlerts: StoredDoctorAlert[] = (rawAlerts || []).map((a: any) => ({
        id: a.id,
        patientId: a.patientId,
        patientName: a.patientName || a.patientId,
        doctorId: a.doctorId,
        level: a.level,
        reasonText: a.reasonText,
        triggers: a.alertData?.drivers || [],
        diseaseType: a.diseaseType || 'Unknown',
        timestamp: a.createdAt,
        acknowledged: !!a.acknowledged
      }))

      const severityMap: { [key: string]: number } = { 'RED': 0, 'ORANGE': 1, 'YELLOW': 2, 'GREEN': 3 }
      mappedAlerts.sort((a, b) => {
        if (a.acknowledged !== b.acknowledged) return a.acknowledged ? 1 : -1
        const sevA = severityMap[a.level] ?? 99
        const sevB = severityMap[b.level] ?? 99
        if (sevA !== sevB) return sevA - sevB
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      })

      setAlerts(mappedAlerts)
      setStatistics({
        total: mappedAlerts.filter(a => !a.acknowledged).length,
        red: mappedAlerts.filter(a => a.level === 'RED' && !a.acknowledged).length,
        orange: mappedAlerts.filter(a => a.level === 'ORANGE' && !a.acknowledged).length,
        yellow: mappedAlerts.filter(a => a.level === 'YELLOW' && !a.acknowledged).length,
        acknowledged: mappedAlerts.filter(a => a.acknowledged).length
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = [...alerts]
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase()
      filtered = filtered.filter(a =>
        a.reasonText.toLowerCase().includes(s) ||
        a.patientId.toLowerCase().includes(s) ||
        (a.patientName && a.patientName.toLowerCase().includes(s))
      )
    }
    if (filterType !== "all") filtered = filtered.filter(a => a.level === filterType)
    if (filterStatus === "active") filtered = filtered.filter(a => !a.acknowledged)
    else if (filterStatus === "acknowledged") filtered = filtered.filter(a => a.acknowledged)
    setFilteredAlerts(filtered)
  }, [searchTerm, filterType, filterStatus, alerts])

  const handleAcknowledgeAlert = async (alertId: string) => {
    await acknowledgeAlert(alertId)
    loadAlerts(doctorId)
  }

  const getAlertConfig = (level: string) => {
    switch (level) {
      case 'RED': return { icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', label: 'Critical Action' }
      case 'ORANGE': return { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', label: 'High Priority' }
      case 'YELLOW': return { icon: Bell, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', label: 'Clinical Review' }
      default: return { icon: Shield, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100', label: 'Monitoring' }
    }
  }

  return (
    <div className="space-y-12">
      {}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Alerts</p>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tighter">System Alerts</h1>
        </div>
        <div className="flex items-center gap-3">
             <Button variant="outline" onClick={() => loadAlerts(doctorId)} className="h-12 px-6 rounded-xl border-slate-200 font-bold text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-50">
               Refresh Data
             </Button>
        </div>
      </div>

      {}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard label="Critical" count={statistics.red} color="text-rose-600" bg="bg-rose-50" icon={AlertTriangle} />
        <StatCard label="High Priority" count={statistics.orange} color="text-orange-600" bg="bg-orange-50" icon={AlertTriangle} />
        <StatCard label="Clinical Review" count={statistics.yellow} color="text-amber-600" bg="bg-amber-50" icon={Bell} />
        <StatCard label="Resolved" count={statistics.acknowledged} color="text-emerald-600" bg="bg-emerald-50" icon={CheckCircle} />
      </div>

      {}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-slate-300 w-5 h-5 group-focus-within:text-slate-900 transition-colors" />
            <Input
              placeholder="Filter by patient, symptom or triage reason..."
              className="h-14 pl-14 bg-slate-50 border-none rounded-2xl focus-visible:ring-slate-100 transition-all text-sm font-bold placeholder:font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-56 h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-xs uppercase tracking-widest text-slate-500 focus:ring-slate-100">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
              <SelectItem value="all" className="rounded-xl text-xs font-bold uppercase tracking-widest">All Severities</SelectItem>
              <SelectItem value="RED" className="rounded-xl text-xs font-bold uppercase tracking-widest text-rose-600">Critical (RED)</SelectItem>
              <SelectItem value="ORANGE" className="rounded-xl text-xs font-bold uppercase tracking-widest text-orange-600">High (ORANGE)</SelectItem>
              <SelectItem value="YELLOW" className="rounded-xl text-xs font-bold uppercase tracking-widest text-amber-600">Review (YELLOW)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-56 h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-xs uppercase tracking-widest text-slate-500 focus:ring-slate-100">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
              <SelectItem value="active" className="rounded-xl text-xs font-bold uppercase tracking-widest">Active Triages</SelectItem>
              <SelectItem value="acknowledged" className="rounded-xl text-xs font-bold uppercase tracking-widest">Historical Logs</SelectItem>
            </SelectContent>
          </Select>
      </div>

      {}
      <div className="space-y-4">
        {loading ? (
          <div className="py-24 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Synchronizing clinical logs...</div>
        ) : filteredAlerts.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredAlerts.map((alert) => {
              const config = getAlertConfig(alert.level)
              return (
                <Card key={alert.id} className={`p-8 border-none bg-white rounded-[2.5rem] shadow-[0_12px_24px_-8px_rgba(0,0,0,0.02)] border border-slate-50 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden relative group`}>
                   {}
                   {!alert.acknowledged && <div className={`absolute top-0 right-0 w-32 h-32 opacity-[0.03] -translate-y-16 translate-x-16 rounded-full ${config.bg.replace('50', '500')}`} />}

                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                      <div className="flex items-start gap-6">
                         <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center transition-all duration-500 ${alert.acknowledged ? 'bg-slate-50 text-slate-300' : config.bg + ' ' + config.color}`}>
                            <config.icon className="w-7 h-7" />
                         </div>
                         <div>
                            <div className="flex items-center gap-3 mb-2">
                               <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${alert.acknowledged ? 'bg-slate-100 text-slate-400' : config.bg + ' ' + config.color}`}>
                                 {config.label}
                               </span>
                               <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">
                                 {alert.diseaseType}
                               </span>
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 tracking-tight mb-1">
                               {alert.patientName} <span className="text-slate-300 font-medium ml-2 text-sm italic">ID: {alert.patientId.slice(0, 8)}</span>
                            </h4>
                            <p className={`text-sm font-bold leading-relaxed mb-4 ${alert.acknowledged ? 'text-slate-400' : 'text-slate-600'}`}>{alert.reasonText}</p>

                            <div className="flex items-center gap-6 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                               <div className="flex items-center gap-2">
                                 <Clock className="w-3.5 h-3.5" />
                                 {new Date(alert.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                               </div>
                               {alert.triggers.length > 0 && (
                                 <div className="flex items-center gap-2">
                                   <Activity className="w-3.5 h-3.5" />
                                   {alert.triggers.join(' • ')}
                                 </div>
                               )}
                            </div>
                         </div>
                      </div>

                      <div className="flex items-center gap-4 border-t md:border-t-0 pt-6 md:pt-0">
                         {alert.acknowledged ? (
                            <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[9px] uppercase tracking-widest px-4 py-2 rounded-full">
                               Cleared by Physician
                            </Badge>
                         ) : (
                            <Button
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                              className="h-12 px-8 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-slate-100 transition-all active:scale-95"
                            >
                              Archive Alert
                            </Button>
                         )}
                         <Link href={`/doctor/dashboard/${doctorId}/patient/${alert.patientId}`}>
                            <Button variant="ghost" className="h-12 w-12 rounded-xl text-slate-300 hover:text-slate-900 hover:bg-slate-50 transition-all">
                               <ArrowUpRight className="w-5 h-5" />
                            </Button>
                         </Link>
                      </div>
                   </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="py-24 text-center bg-white rounded-[3rem] border border-slate-50">
            <Bell className="w-16 h-16 text-slate-100 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">No Active Alerts</h3>
            <p className="text-slate-400 mt-2 max-w-xs mx-auto text-sm font-medium">No active triages detected for the current selection.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, count, color, bg, icon: Icon }: any) {
    return (
        <Card className="p-8 border-none bg-white rounded-[2.5rem] shadow-sm border border-slate-50 group transition-all">
            <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 ${bg} ${color} rounded-2xl flex items-center justify-center transition-all duration-500`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 tracking-tighter">{count}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</p>
        </Card>
    )
}