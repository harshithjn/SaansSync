"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { getDoctorPatientFolders } from "@/lib/doctor-patient-mapping"
import { exportPatientData, generateExportSummary, downloadFile } from "@/lib/export-service"
import { ExportOptions, PatientFolder } from "@/lib/monitoring-types"
import { toast } from "@/lib/toast"
import { 
    Bell, 
    CheckCircle2, 
    AlertCircle, 
    Info, 
    Filter, 
    Search, 
    ShieldCheck, 
    Calendar, 
    ArrowRight,
    Loader2,
    CheckCircle,
    Users,
    Activity,
    Database,
    Zap,
    Download,
    FileText,
    ArrowUpRight
} from "lucide-react"
import Link from "next/link"

export default function ExportDataPage({
  params,
}: {
  params: Promise<{ doctorId: string }>
}) {
  const [doctorId, setDoctorId] = useState<string>("")
  const [patients, setPatients] = useState<PatientFolder[]>([])
  const [selectedPatients, setSelectedPatients] = useState<string[]>([])
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    patientIds: [],
    diseaseSpecific: true,
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    frequency: 'daily',
    format: 'csv',
    includeGraphs: false
  })
  const [isExporting, setIsExporting] = useState(false)
  const [exportHistory, setExportHistory] = useState<any[]>([])
  const [summary, setSummary] = useState({
    totalPatients: 0,
    byDisease: {} as Record<string, number>,
    byRiskLevel: {} as Record<string, number>,
    totalAlerts: 0,
    criticalAlerts: 0
  })

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params
      setDoctorId(resolvedParams.doctorId)
      loadData(resolvedParams.doctorId)
    }
    initializeParams()
  }, [params])

  const loadData = (doctorId: string) => {
    const patientFolders = getDoctorPatientFolders(doctorId)
    setPatients(patientFolders)
    
    const exportSummary = generateExportSummary(doctorId)
    setSummary(exportSummary)
    
    loadExportHistory()
  }

  const loadExportHistory = () => {
    try {
      const stored = localStorage.getItem('export_history')
      const history = stored ? JSON.parse(stored) : []
      setExportHistory(history.slice(0, 10))
    } catch (error) {
      console.error('Error loading export history:', error)
    }
  }

  const saveExportHistory = (exportRecord: any) => {
    try {
      const stored = localStorage.getItem('export_history')
      const history = stored ? JSON.parse(stored) : []
      history.unshift(exportRecord)
      localStorage.setItem('export_history', JSON.stringify(history.slice(0, 50)))
      loadExportHistory()
    } catch (error) {
      console.error('Error saving export history:', error)
    }
  }

  const handlePatientSelection = (patientId: string, checked: boolean) => {
    if (checked) {
      setSelectedPatients(prev => [...prev, patientId])
    } else {
      setSelectedPatients(prev => prev.filter(id => id !== patientId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPatients(patients.map(p => p.patientId))
    } else {
      setSelectedPatients([])
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      const finalOptions: ExportOptions = {
        ...exportOptions,
        patientIds: selectedPatients.length > 0 ? selectedPatients : patients.map(p => p.patientId)
      }

      const exportResult = exportPatientData(doctorId, finalOptions)
      downloadFile(exportResult.data, exportResult.filename, exportResult.mimeType)
      
      const exportRecord = {
        id: Date.now().toString(),
        filename: exportResult.filename,
        format: finalOptions.format,
        patientCount: finalOptions.patientIds.length,
        dateRange: finalOptions.dateRange,
        createdAt: new Date().toISOString(),
        size: new Blob([exportResult.data]).size
      }
      
      saveExportHistory(exportRecord)
      toast.success("Data Exported Successfully")
      
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('System Export Failure')
    } finally {
      setIsExporting(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-12 font-['Matter_Regular',sans-serif]">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Data Export</p>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tighter">Secure Data Export</h1>
        </div>
        <div className="flex items-center gap-3">
             <div className="flex flex-col items-end mr-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Secure Transfer Enabled</span>
             </div>
             <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">AES-256 Encrypted Transfer</span>
             </div>
        </div>
      </div>

      {/* Aggregate Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <MetricCard label="Candidate Pool" count={summary.totalPatients} icon={Users} color="text-slate-950" bg="bg-slate-50" />
        <MetricCard label="Disease Vectors" count={Object.keys(summary.byDisease).length} icon={Activity} color="text-slate-950" bg="bg-slate-50" />
        <MetricCard label="Telemetry Logs" count={summary.totalAlerts} icon={Database} color="text-slate-950" bg="bg-slate-50" />
        <MetricCard label="Critical Points" count={summary.criticalAlerts} icon={Zap} color="text-rose-600" bg="bg-rose-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Export Configuration Engine */}
        <div className="lg:col-span-2 space-y-10">
          <Card className="p-10 border-none bg-white rounded-[3rem] shadow-sm border border-slate-50 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -translate-y-16 translate-x-16 opacity-50" />
            <div className="flex items-center gap-4 mb-10 relative z-10">
              <div className="w-12 h-12 bg-slate-950 text-white rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Patient Filter</h3>
                <p className="text-xs font-medium text-slate-400">Select clinical subjects for data extraction.</p>
              </div>
            </div>
            
            <div className="space-y-6 relative z-10">
              <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <Checkbox
                  id="select-all"
                  checked={selectedPatients.length === patients.length && patients.length > 0}
                  onCheckedChange={handleSelectAll}
                  className="w-5 h-5 border-slate-200 data-[state=checked]:bg-slate-950"
                />
                <label htmlFor="select-all" className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-950 cursor-pointer">
                  Universal Selection ({patients.length} Total Nodes)
                </label>
              </div>

              <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {patients.map(patient => (
                  <div key={patient.patientId} className="flex items-center justify-between p-5 bg-white border border-slate-50 rounded-2xl hover:border-slate-200 transition-all group">
                    <div className="flex items-center space-x-4">
                      <Checkbox
                        id={patient.patientId}
                        checked={selectedPatients.includes(patient.patientId)}
                        onCheckedChange={(checked) => handlePatientSelection(patient.patientId, checked as boolean)}
                        className="w-5 h-5 border-slate-200 data-[state=checked]:bg-slate-950"
                      />
                      <div>
                        <label htmlFor={patient.patientId} className="text-sm font-black text-slate-900 leading-none cursor-pointer">
                           {patient.fullName}
                        </label>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: {patient.patientId.slice(0, 12)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-slate-100 bg-slate-50/50 px-3 py-1">
                        {patient.diseaseType.split('(')[0]}
                      </Badge>
                      <div className={`w-2 h-2 rounded-full ${
                        patient.redFlagScore >= 7 ? 'bg-rose-500' : 'bg-emerald-500'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-10 border-none bg-white rounded-[3rem] shadow-sm border border-slate-50">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <Filter className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Options</h3>
                <p className="text-xs font-medium text-slate-400">Configure file architecture and observation window.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">File Format</label>
                <Select 
                  value={exportOptions.format} 
                  onValueChange={(v: "csv" | "excel" | "pdf") => setExportOptions(prev => ({ ...prev, format: v }))}
                >
                  <SelectTrigger className="h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-xs uppercase tracking-widest text-slate-950 focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl p-2 font-['Matter_Regular',sans-serif]">
                    <SelectItem value="csv" className="rounded-xl text-xs font-bold uppercase tracking-widest">STRUCTURED CSV</SelectItem>
                    <SelectItem value="excel" className="rounded-xl text-xs font-bold uppercase tracking-widest">EXCEL WORKBOOK</SelectItem>
                    <SelectItem value="pdf" className="rounded-xl text-xs font-bold uppercase tracking-widest">CLINICAL PDF REPORT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Data Frequency</label>
                <Select 
                  value={exportOptions.frequency} 
                  onValueChange={(v: "daily" | "weekly" | "monthly") => setExportOptions(prev => ({ ...prev, frequency: v }))}
                >
                  <SelectTrigger className="h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-xs uppercase tracking-widest text-slate-950 focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl p-2 font-['Matter_Regular',sans-serif]">
                    <SelectItem value="daily" className="rounded-xl text-xs font-bold uppercase tracking-widest">HIGH-RES (DAILY)</SelectItem>
                    <SelectItem value="weekly" className="rounded-xl text-xs font-bold uppercase tracking-widest">AGGREGATE (WEEKLY)</SelectItem>
                    <SelectItem value="monthly" className="rounded-xl text-xs font-bold uppercase tracking-widest">SUMMARY (MONTHLY)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Start Date</label>
                <Input
                  type="date"
                  value={exportOptions.dateRange.start}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: e.target.value }
                  }))}
                  className="h-14 bg-slate-50 border-none rounded-2xl px-6 font-black text-xs uppercase tracking-widest text-slate-950"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">End Date</label>
                <Input
                  type="date"
                  value={exportOptions.dateRange.end}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: e.target.value }
                  }))}
                  className="h-14 bg-slate-50 border-none rounded-2xl px-6 font-black text-xs uppercase tracking-widest text-slate-950"
                />
              </div>
            </div>

            <div className="mt-12 p-8 bg-slate-50 rounded-[2.5rem] space-y-5 border border-slate-100">
               <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Export Options</h4>
               <div className="flex items-center space-x-4 group cursor-pointer" onClick={() => setExportOptions(prev => ({ ...prev, diseaseSpecific: !prev.diseaseSpecific }))}>
                <Checkbox
                  id="disease-specific"
                  checked={exportOptions.diseaseSpecific}
                  onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, diseaseSpecific: checked as boolean }))}
                  className="w-5 h-5 border-slate-200 data-[state=checked]:bg-slate-950"
                />
                <label htmlFor="disease-specific" className="text-[10px] font-bold uppercase tracking-widest text-slate-600 cursor-pointer">
                  Inject Disease-Specific Telemetry Markers
                </label>
              </div>

              <div className="flex items-center space-x-4 group cursor-pointer" onClick={() => setExportOptions(prev => ({ ...prev, includeGraphs: !prev.includeGraphs }))}>
                <Checkbox
                  id="include-graphs"
                  checked={exportOptions.includeGraphs}
                  onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeGraphs: checked as boolean }))}
                  className="w-5 h-5 border-slate-200 data-[state=checked]:bg-slate-950"
                />
                <label htmlFor="include-graphs" className="text-[10px] font-bold uppercase tracking-widest text-slate-600 cursor-pointer">
                  Compile Longitudinal Trend Graphs (PDF Only)
                </label>
              </div>
            </div>

            <div className="mt-10">
              <Button 
                onClick={handleExport} 
                disabled={isExporting || (selectedPatients.length === 0 && patients.length === 0)}
                className="w-full h-20 bg-slate-950 hover:bg-slate-800 text-white rounded-[2rem] font-bold text-sm uppercase tracking-[0.2em] transition-all duration-300 shadow-2xl shadow-slate-200 active:scale-[0.98] flex items-center justify-center gap-4"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-4 border-slate-200 border-t-white mr-2"></div>
                    Processing Export...
                  </>
                ) : (
                  <>
                    Initialize Export Transaction
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Audit Log / History */}
        <div className="space-y-10">
          <Card className="p-8 border-none bg-white rounded-[3rem] shadow-sm border border-slate-50">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Export History</h3>
            </div>

            {exportHistory.length > 0 ? (
              <div className="space-y-4">
                {exportHistory.map(record => (
                  <div key={record.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-white hover:shadow-xl transition-all duration-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-950 truncate mb-2">{record.filename}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border-slate-200 bg-white">
                            {record.format.toUpperCase()}
                          </Badge>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                            {record.patientCount} Nodes
                          </span>
                        </div>
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-2">
                           {new Date(record.createdAt).toLocaleDateString()} • {formatFileSize(record.size)}
                        </p>
                      </div>
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto border border-slate-50 opacity-50">
                   <FileText className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No previous audit logs</p>
              </div>
            )}
          </Card>

          <Card className="p-8 bg-slate-950 rounded-[3rem] text-white overflow-hidden relative group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-slate-900 rounded-full translate-x-16 -translate-y-16 group-hover:scale-150 transition-all duration-1000" />
             <div className="relative z-10 space-y-6">
                <h3 className="text-lg font-bold tracking-tight">Templates</h3>
                <div className="space-y-3">
                  <TemplateButton 
                    label="CRITICAL TRIAGE POOL" 
                    onClick={() => {
                      setSelectedPatients(patients.filter(p => p.redFlagScore >= 9).map(p => p.patientId))
                      setExportOptions(prev => ({ ...prev, format: 'pdf', includeGraphs: true }))
                      toast.success("Template: Critical Triage Loaded")
                    }}
                  />
                  <TemplateButton 
                    label="MONTHLY LONGITUDINAL" 
                    onClick={() => {
                      setSelectedPatients(patients.map(p => p.patientId))
                      setExportOptions(prev => ({ ...prev, format: 'pdf', includeGraphs: true }))
                      toast.success("Template: Monthly Longitudinal Loaded")
                    }}
                  />
                   <TemplateButton 
                    label="DAILY TELEMETRY SYNC" 
                    onClick={() => {
                      setSelectedPatients(patients.map(p => p.patientId))
                      setExportOptions(prev => ({ ...prev, format: 'csv', frequency: 'daily' }))
                      toast.success("Template: Daily Telemetry Loaded")
                    }}
                  />
                </div>
             </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, count, icon: Icon, color, bg }: any) {
    return (
        <Card className="p-8 border-none bg-white rounded-[2.5rem] shadow-sm border border-slate-50 group hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 ${bg} ${color} rounded-2xl flex items-center justify-center shadow-sm duration-500 group-hover:rotate-12`}>
                    <Icon className="w-6 h-6" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-100 group-hover:text-slate-900 transition-colors" />
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{count}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3">{label}</p>
        </Card>
    )
}

function TemplateButton({ label, onClick }: any) {
    return (
        <button 
            onClick={onClick}
            className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all text-left group"
        >
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 group-hover:text-white transition-colors">{label}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-1 group-hover:text-white transition-all" />
        </button>
    )
}