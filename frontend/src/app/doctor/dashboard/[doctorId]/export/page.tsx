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
import { Download, FileText, Calendar, Users, Filter, CheckCircle } from "lucide-react"

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
    
    // Load export history
    loadExportHistory()
  }

  const loadExportHistory = () => {
    try {
      const stored = localStorage.getItem('export_history')
      const history = stored ? JSON.parse(stored) : []
      setExportHistory(history.slice(0, 10)) // Show last 10 exports
    } catch (error) {
      console.error('Error loading export history:', error)
    }
  }

  const saveExportHistory = (exportRecord: any) => {
    try {
      const stored = localStorage.getItem('export_history')
      const history = stored ? JSON.parse(stored) : []
      history.unshift(exportRecord)
      localStorage.setItem('export_history', JSON.stringify(history.slice(0, 50))) // Keep last 50
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
      
      // Download the file
      downloadFile(exportResult.data, exportResult.filename, exportResult.mimeType)
      
      // Save to export history
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
      
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Export failed. Please try again.')
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Export Data</h1>
          <p className="text-gray-600">Export patient monitoring data and reports</p>
        </div>
      </div>

      {/* Export Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-0 shadow-sm bg-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{summary.totalPatients}</p>
              <p className="text-sm text-gray-600">Total Patients</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-sm bg-green-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{Object.keys(summary.byDisease).length}</p>
              <p className="text-sm text-gray-600">Disease Types</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-sm bg-orange-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Download className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{summary.totalAlerts}</p>
              <p className="text-sm text-gray-600">Total Alerts</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-sm bg-red-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Download className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{summary.criticalAlerts}</p>
              <p className="text-sm text-gray-600">Critical Alerts</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Selection */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Select Patients</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedPatients.length === patients.length}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium">
                  Select All Patients ({patients.length})
                </label>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {patients.map(patient => (
                  <div key={patient.patientId} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={patient.patientId}
                        checked={selectedPatients.includes(patient.patientId)}
                        onCheckedChange={(checked) => handlePatientSelection(patient.patientId, checked as boolean)}
                      />
                      <label htmlFor={patient.patientId} className="text-sm">
                        {patient.fullName}
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {patient.diseaseType}
                      </Badge>
                      <Badge className={`text-xs ${
                        patient.redFlagScore >= 9 ? 'bg-red-600' :
                        patient.redFlagScore >= 7 ? 'bg-orange-600' :
                        patient.redFlagScore >= 4 ? 'bg-yellow-600' : 'bg-green-600'
                      } text-white`}>
                        {patient.redFlagScore}/10
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Export Options */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold">Export Options</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">File Format</label>
                <Select 
                  value={exportOptions.format} 
                  onValueChange={(value) => setExportOptions(prev => ({ ...prev, format: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="pdf">PDF Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data Frequency</label>
                <Select 
                  value={exportOptions.frequency} 
                  onValueChange={(value) => setExportOptions(prev => ({ ...prev, frequency: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={exportOptions.dateRange.start}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: e.target.value }
                  }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={exportOptions.dateRange.end}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: e.target.value }
                  }))}
                />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="disease-specific"
                  checked={exportOptions.diseaseSpecific}
                  onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, diseaseSpecific: checked as boolean }))}
                />
                <label htmlFor="disease-specific" className="text-sm">
                  Include disease-specific data
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-graphs"
                  checked={exportOptions.includeGraphs}
                  onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeGraphs: checked as boolean }))}
                />
                <label htmlFor="include-graphs" className="text-sm">
                  Include graphs and charts (PDF only)
                </label>
              </div>
            </div>

            <div className="mt-6">
              <Button 
                onClick={handleExport} 
                disabled={isExporting || selectedPatients.length === 0}
                className="w-full"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export Data ({selectedPatients.length || patients.length} patients)
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Export History */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold">Export History</h3>
            </div>

            {exportHistory.length > 0 ? (
              <div className="space-y-3">
                {exportHistory.map(record => (
                  <div key={record.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{record.filename}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {record.format.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-gray-600">
                            {record.patientCount} patients
                          </span>
                          <span className="text-xs text-gray-600">
                            {formatFileSize(record.size)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(record.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No exports yet</p>
              </div>
            )}
          </Card>

          {/* Quick Export Templates */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Export Templates</h3>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  setSelectedPatients(patients.filter(p => p.redFlagScore >= 7).map(p => p.patientId))
                  setExportOptions(prev => ({ ...prev, format: 'csv', diseaseSpecific: true }))
                }}
              >
                High Risk Patients
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  setSelectedPatients(patients.map(p => p.patientId))
                  setExportOptions(prev => ({ ...prev, format: 'pdf', includeGraphs: true }))
                }}
              >
                Complete Report (PDF)
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  setSelectedPatients(patients.filter(p => p.alertCount > 0).map(p => p.patientId))
                  setExportOptions(prev => ({ ...prev, format: 'excel', diseaseSpecific: false }))
                }}
              >
                Patients with Alerts
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}