"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { getDoctorPatientFolders } from "@/lib/doctor-patient-mapping"
import { generatePatientAnalytics, AnalyticsData } from "@/lib/analytics-service"
import { PatientFolder } from "@/lib/monitoring-types"
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Users, BarChart3, PieChart, Download, FileText, Calendar, ArrowUpRight, CheckCircle } from "lucide-react"

export default function AnalyticsPage({
  params,
}: {
  params: Promise<{ doctorId: string }>
}) {
  const [doctorId, setDoctorId] = useState<string>("")
  const [patients, setPatients] = useState<PatientFolder[]>([])
  const [selectedPatient, setSelectedPatient] = useState<string>("all")
  const [dateRange, setDateRange] = useState("30")
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [overviewStats, setOverviewStats] = useState({
    totalPatients: 0,
    criticalPatients: 0,
    averageRiskScore: 0,
    totalAlerts: 0
  })

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params
      setDoctorId(resolvedParams.doctorId)
      loadPatients(resolvedParams.doctorId)
    }
    initializeParams()
  }, [params])

  const loadPatients = (doctorId: string) => {
    const patientFolders = getDoctorPatientFolders(doctorId)
    setPatients(patientFolders)

    const totalPatients = patientFolders.length
    const criticalPatients = patientFolders.filter(p => p.redFlagScore >= 9).length
    const averageRiskScore = totalPatients > 0
      ? patientFolders.reduce((sum, p) => sum + p.redFlagScore, 0) / totalPatients
      : 0
    const totalAlerts = patientFolders.reduce((sum, p) => sum + p.alertCount, 0)

    setOverviewStats({
      totalPatients,
      criticalPatients,
      averageRiskScore,
      totalAlerts
    })
  }

  useEffect(() => {
    if (selectedPatient !== "all") {
      const patient = patients.find(p => p.patientId === selectedPatient)
      if (patient) {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(endDate.getDate() - parseInt(dateRange))
        setAnalyticsData(generatePatientAnalytics(patient.patientId, patient.diseaseType, {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        }))
      }
    } else {
      setAnalyticsData(null)
    }
  }, [selectedPatient, dateRange, patients])

  const diseaseDistribution = (() => {
    const d: Record<string, number> = {}
    patients.forEach(p => { d[p.diseaseType] = (d[p.diseaseType] || 0) + 1 })
    return d
  })()

  const riskDistribution = (() => {
    const d = { low: 0, moderate: 0, high: 0, critical: 0 }
    patients.forEach(p => {
      if (p.redFlagScore >= 9) d.critical++
      else if (p.redFlagScore >= 7) d.high++
      else if (p.redFlagScore >= 4) d.moderate++
      else d.low++
    })
    return d
  })()

  return (
    <div className="space-y-12">
      {}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Overview</p>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tighter">Analytics</h1>
        </div>
        <div className="flex items-center gap-3">
             <Button className="h-12 px-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs uppercase tracking-widest transition-all">
               <Download className="w-4 h-4 mr-2" />
               Generate Monthly Report
             </Button>
        </div>
      </div>

      {}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard label="Total Population" count={overviewStats.totalPatients} color="text-slate-950" bg="bg-slate-50" icon={Users} />
        <StatCard label="Critical Triage" count={overviewStats.criticalPatients} color="text-rose-600" bg="bg-rose-50" icon={AlertTriangle} />
        <StatCard label="Avg. Risk Index" count={overviewStats.averageRiskScore.toFixed(1)} color="text-emerald-600" bg="bg-emerald-50" icon={Activity} />
        <StatCard label="Cumulative Alerts" count={overviewStats.totalAlerts} color="text-orange-600" bg="bg-orange-50" icon={Activity} />
      </div>

      {}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 flex-1 px-4">
            <Users className="w-5 h-5 text-slate-300" />
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger className="border-none bg-transparent hover:bg-slate-50 rounded-xl px-2 font-bold text-xs uppercase tracking-widest text-slate-900 focus:ring-0">
                <SelectValue placeholder="Target Population" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                <SelectItem value="all" className="rounded-xl text-xs font-bold uppercase tracking-widest">Global Overview</SelectItem>
                {patients.map(p => (
                  <SelectItem key={p.patientId} value={p.patientId} className="rounded-xl text-xs font-bold uppercase tracking-widest">
                    {p.fullName} • {p.diseaseType.split('(')[0]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="h-8 w-[1px] bg-slate-100 hidden md:block" />

          <div className="flex items-center gap-3 flex-1 px-4">
            <Calendar className="w-5 h-5 text-slate-300" />
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="border-none bg-transparent hover:bg-slate-50 rounded-xl px-2 font-bold text-xs uppercase tracking-widest text-slate-900 focus:ring-0">
                <SelectValue placeholder="Observation Window" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                <SelectItem value="7" className="rounded-xl text-xs font-bold uppercase tracking-widest">L-7 Days</SelectItem>
                <SelectItem value="30" className="rounded-xl text-xs font-bold uppercase tracking-widest">L-30 Days</SelectItem>
                <SelectItem value="90" className="rounded-xl text-xs font-bold uppercase tracking-widest">L-Quarter</SelectItem>
                <SelectItem value="180" className="rounded-xl text-xs font-bold uppercase tracking-widest">L-6 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
      </div>

      {selectedPatient === "all" ? (

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-10 border-none bg-white rounded-[3rem] shadow-sm border border-slate-50">
             <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-teal-50 text-teal-500 rounded-2xl flex items-center justify-center">
                    <PieChart className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Disease Distribution</h3>
                    <p className="text-xs font-medium text-slate-400">Prevalence per clinical category.</p>
                </div>
             </div>
             <div className="space-y-6">
                {Object.entries(diseaseDistribution).map(([disease, count]) => (
                   <div key={disease} className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{disease.split('(')[0]}</span>
                         <span className="text-xs font-black text-slate-900">{count}</span>
                      </div>
                      <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                         <div className="h-full bg-slate-950 rounded-full transition-all duration-1000" style={{ width: `${(count / overviewStats.totalPatients) * 100}%` }} />
                      </div>
                   </div>
                ))}
             </div>
          </Card>

          <Card className="p-10 border-none bg-white rounded-[3rem] shadow-sm border border-slate-50">
             <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Risk Assessment</h3>
                    <p className="text-xs font-medium text-slate-400">Severity split across population.</p>
                </div>
             </div>
             <div className="space-y-6">
                <DistributionRow label="Low Risk Index" count={riskDistribution.low} total={overviewStats.totalPatients} color="bg-emerald-500" />
                <DistributionRow label="Moderate Index" count={riskDistribution.moderate} total={overviewStats.totalPatients} color="bg-amber-500" />
                <DistributionRow label="High Risk Index" count={riskDistribution.high} total={overviewStats.totalPatients} color="bg-orange-500" />
                <DistributionRow label="Critical Index" count={riskDistribution.critical} total={overviewStats.totalPatients} color="bg-rose-500" />
             </div>
          </Card>
        </div>
      ) : analyticsData ? (

        <div className="space-y-10">
           {}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="p-10 border-none bg-white rounded-[3rem] shadow-sm border border-slate-50 md:col-span-2">
                 <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Health Trends</h3>
                        <p className="text-xs font-medium text-slate-400">Identified patterns from recent monitoring logs.</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {analyticsData.insights.map((insight, idx) => (
                       <div key={idx} className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 group transition-all">
                          <div className="flex items-start gap-4">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                                insight.type === 'positive' ? 'bg-emerald-100 text-emerald-600' :
                                insight.type === 'critical' ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-500'
                             }`}>
                                {insight.type === 'positive' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                             </div>
                             <div>
                                <h4 className="text-sm font-bold text-slate-900 tracking-tight mb-1">{insight.title}</h4>
                                <p className="text-xs font-medium text-slate-500 leading-relaxed">{insight.description}</p>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </Card>

              <Card className="p-10 border-none bg-white rounded-[3rem] shadow-sm border border-slate-50">
                 <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 mb-8 pb-4 border-b border-slate-50">Recommendations</h4>
                 <div className="space-y-4">
                    {analyticsData.recommendations.map((rec, i) => (
                       <div key={i} className="flex items-start gap-3">
                          <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                          <p className="text-sm font-bold text-slate-700 leading-snug">{rec}</p>
                       </div>
                    ))}
                 </div>
              </Card>

              <Card className="p-10 border-none bg-slate-950 rounded-[3rem] shadow-2xl shadow-slate-200 flex flex-col justify-center items-center text-center overflow-hidden relative">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-slate-900 rounded-full -translate-y-32 translate-x-32" />
                 <Activity className="w-16 h-16 text-slate-800 mb-6" />
                 <h3 className="text-xl font-bold text-white relative z-10">Health Analytics</h3>
                 <p className="text-white/40 text-xs mt-2 relative z-10">Advanced patient data visualization</p>
                 <Button variant="ghost" className="mt-8 text-white h-12 rounded-2xl bg-white/5 hover:bg-white/10 border-none font-bold text-[10px] uppercase tracking-widest relative z-10">
                    View Details
                 </Button>
              </Card>
           </div>
        </div>
      ) : (
        <Card className="p-24 text-center bg-white rounded-[3rem] border border-slate-50">
          <BarChart3 className="w-16 h-16 text-slate-100 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Selection Required</h3>
          <p className="text-slate-400 mt-2 max-w-xs mx-auto text-sm font-medium">Please specify a patient or population segment to initialize analytics processing.</p>
        </Card>
      )}
    </div>
  )
}

function StatCard({ label, count, color, bg, icon: Icon }: any) {
    return (
        <Card className="p-8 border-none bg-white rounded-[2.5rem] shadow-sm border border-slate-50 group hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 ${bg} ${color} rounded-2xl flex items-center justify-center`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 tracking-tighter">{count}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</p>
        </Card>
    )
}

function DistributionRow({ label, count, total, color }: any) {
    return (
        <div className="space-y-2">
           <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
              <span className="text-xs font-black text-slate-900">{count}</span>
           </div>
           <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
              <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${(count / (total || 1)) * 100}%` }} />
           </div>
        </div>
    )
}