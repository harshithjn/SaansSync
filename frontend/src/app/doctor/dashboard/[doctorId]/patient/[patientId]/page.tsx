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
import { getPatientPrescriptions, formatPrescriptionCard } from "@/lib/prescription-service"
import { diagnosisToDiseaseType } from "@/lib/supabase-auth"
import { resolveUserProfile } from "@/lib/session-manager"
import { ArrowLeft, User, Calendar, MapPin, Phone, Mail, AlertTriangle, Pill, FileText, TrendingUp, Download, Edit, Bell, MessageSquare, Trash2, Share, Import, MoreHorizontal, FileOutput } from "lucide-react"
import Link from "next/link"
import PrescriptionModal from "@/components/doctor/PrescriptionModal"
import { toast } from "@/lib/toast"

export default function PatientDetailView({
  params,
}: {
  params: Promise<{ doctorId: string; patientId: string }>
}) {
  const router = useRouter()
  const [doctorId, setDoctorId] = useState<string>("")
  const [patientId, setPatientId] = useState<string>("")
  const [patientFolder, setPatientFolder] = useState<PatientFolder | null>(null)
  const [patientData, setPatientData] = useState<any>(null)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [instructions, setInstructions] = useState<DoctorInstruction[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)
  const [doctorSession, setDoctorSession] = useState<any>(null)

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params
      setDoctorId(resolvedParams.doctorId)
      setPatientId(resolvedParams.patientId)

      // Remove doctor session loading - handled by auth guard
      console.log('Production mode - using Supabase auth')

      console.log('Loading patient details for:', resolvedParams.patientId)

      // Load patient folder
      const folders = getDoctorPatientFolders(resolvedParams.doctorId)
      let folder = folders.find(f => f.patientId === resolvedParams.patientId)

      // Load patient data from database
      let data = await getPatientProfile(resolvedParams.patientId)

      // If not found in database, return error
      if (!data) {
        console.log('❌ Patient not found in database:', resolvedParams.patientId)
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Patient Not Found</h1>
              <p className="text-gray-600 mb-4">The requested patient could not be found in the database.</p>
              <Link href={`/doctor/dashboard/${resolvedParams.doctorId}`}>
                <Button>Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        )
      }
      setPatientData(data)

      // Fallback: If folder is missing or has incomplete data (like age 0), construct from patient data
      if (!folder || folder.age === 0) {
        console.log('⚠️ Reconstructing patient folder from database profile')
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

      // Load prescriptions
      await loadPrescriptions(resolvedParams.patientId)

      // Load instructions
      loadInstructions(resolvedParams.patientId)

      // Load alerts
      loadAlerts(resolvedParams.patientId)

      // Load messages
      loadMessages(resolvedParams.patientId)

      // Resolve doctor session for name
      try {
        const up = await resolveUserProfile()
        if (up.profile) {
          setDoctorSession({ name: (up.profile as any).full_name })
        }
      } catch (e) {
        console.warn("Could not resolve doctor session", e)
      }

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


  const loadMessages = (patientId: string) => {
    try {
      const stored = localStorage.getItem(`messages_${patientId}`)
      if (stored) {
        setMessages(JSON.parse(stored))
      }
    } catch (error) {
      console.error("Error loading messages:", error)
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
    const text = prompt("Enter instruction for the patient:")
    if (!text || !text.trim()) return

    try {
      const result = await addPatientInstruction(patientId, doctorId, text.trim())
      if (result.success || result.instruction || result.id) {
        toast.success("Instruction added and sent to patient dashboard")
        loadInstructions(patientId)
      } else {
        toast.error("Failed to add instruction")
      }
    } catch (e) {
      toast.error("An error occurred")
    }
  }

  const handleAddMedication = async () => {
    // Simple prompt-based medication addition for now
    const drugName = prompt("Enter drug name:")
    if (!drugName) return
    const dose = prompt("Enter dose (e.g., 500mg):")
    const frequency = prompt("Enter frequency (e.g., Twice daily):")

    try {
      const newMed = {
        id: Date.now().toString(),
        drugName,
        dose,
        frequency,
        startDate: new Date().toISOString(),
        isActive: true
      }

      const updatedMeds = [...(patientData.medications || []), newMed]
      const updatedPatientData = { ...patientData, medications: updatedMeds }

      const result = await updatePatientData(patientId, patientFolder?.fullName || "Patient", updatedPatientData)
      if (result.success || result === true) {
        toast.success("Medication added")
        setPatientData(updatedPatientData)
      } else {
        toast.error("Failed to add medication")
      }
    } catch (e) {
      toast.error("An error occurred")
    }
  }

  const handleAddPFT = async () => {
    const fev1 = prompt("Enter FEV1 %:")
    if (fev1 === null) return
    const fvc = prompt("Enter FVC %:")
    if (fvc === null) return

    try {
      const f1 = parseFloat(fev1)
      const f2 = parseFloat(fvc)
      if (isNaN(f1) || isNaN(f2)) {
        toast.error("Please enter valid numbers")
        return
      }

      const newPFT = {
        date: new Date().toISOString().split('T')[0],
        fev1: f1,
        fvc: f2,
        ratio: (f1 / (f2 || 1)) * 100
      }

      const updatedPFTs = [...(patientData.pftRecords || []), newPFT]
      const updatedPatientData = { ...patientData, pftRecords: updatedPFTs }

      const result = await updatePatientData(patientId, patientFolder?.fullName || "Patient", updatedPatientData)
      if (result.success || result === true) {
        toast.success("PFT record added")
        setPatientData(updatedPatientData)
      } else {
        toast.error("Failed to add PFT record")
      }
    } catch (e) {
      toast.error("An error occurred")
    }
  }

  const handleGenerateAnalytics = () => {
    if (!patientFolder) return
    const activeAlerts = alerts.filter(a => !a.acknowledged)
    const latestLogs = patientFolder.lastLogDate

    let summary = `Health Analytics Summary for ${patientFolder.fullName}\n`
    summary += `--------------------------------------------------\n`
    summary += `Risk Score: ${patientFolder.redFlagScore}/10 (${getRiskLabel(patientFolder.redFlagScore)})\n`
    summary += `Status: ${patientFolder.folderColor.toUpperCase()}\n\n`

    if (activeAlerts.length > 0) {
      summary += `ACTIVE ALERTS (${activeAlerts.length}):\n`
      activeAlerts.forEach((a, i) => {
        summary += `${i + 1}. [${a.level}] ${a.reason_text || a.message}\n`
      })
      summary += `\n`
    } else {
      summary += `No active health alerts.\n\n`
    }

    summary += `LATEST VITALS & HISTORY:\n`
    summary += `- Last Log Date: ${new Date(latestLogs).toLocaleDateString()}\n`
    summary += `- Diagnosis: ${patientData.diagnosis.primaryCategory}\n`
    summary += `- Medications: ${patientData.medications?.length || 0} active\n`
    summary += `- PFT Status: ${patientData.pftRecords?.length || 0} records available\n\n`

    summary += `CLINICAL ASSESSMENT:\n`
    if (patientFolder.redFlagScore >= 7) {
      summary += `- CRITICAL: Urgent intervention required. Monitor vitals closely.\n`
    } else if (patientFolder.redFlagScore >= 4) {
      summary += `- MODERATE: Follow up scheduled. Review medication compliance.\n`
    } else {
      summary += `- STABLE: Patient is responding well to treatment.\n`
    }

    const w = window.open('', '_blank')
    if (w) {
      w.document.write(`<pre style="font-family: monospace; white-space: pre-wrap; padding: 20px; font-size: 14px; max-width: 600px; border: 1px solid #ccc; margin: 20px auto; background: #f9f9f9; border-radius: 8px;">${summary}</pre>`)
      w.document.close()
    }
    toast.success("Analytics generated")
  }

  const getFolderGlowClass = (color: 'green' | 'yellow' | 'red' | 'orange') => {
    switch (color) {
      case 'green':
        return 'border-green-200 bg-green-50/30'
      case 'yellow':
        return 'border-yellow-200 bg-yellow-50/30'
      case 'orange':
        return 'border-orange-200 bg-orange-50/30'
      case 'red':
        return 'border-red-200 bg-red-50/30'
      default:
        return 'border-gray-200 bg-gray-50/30'
    }
  }

  const getRiskBadgeClass = (score: number) => {
    if (score >= 9) return "bg-red-600 text-white"
    if (score >= 7) return "bg-red-500 text-white"
    if (score >= 4) return "bg-yellow-500 text-white"
    return "bg-green-500 text-white"
  }

  const getRiskLabel = (score: number) => {
    if (score >= 9) return "Critical"
    if (score >= 7) return "High Risk"
    if (score >= 4) return "Moderate"
    return "Low Risk"
  }

  const handleDeletePatient = () => {
    if (confirm(`Are you sure you want to delete patient ${patientFolder?.fullName}? This action cannot be undone.`)) {
      try {
        // Remove from doctor's patient folders
        const folders = getDoctorPatientFolders(doctorId)
        const updatedFolders = folders.filter(f => f.patientId !== patientId)
        localStorage.setItem(`doctor_patients_${doctorId}`, JSON.stringify(updatedFolders))

        // Remove patient data
        localStorage.removeItem(`patient_${patientId}`)
        localStorage.removeItem(`prescriptions_${patientId}`)
        localStorage.removeItem(`instructions_${patientId}`)
        localStorage.removeItem(`alerts_${patientId}`)
        localStorage.removeItem(`messages_${patientId}`)

        toast.success('Patient deleted successfully')
        router.push(`/doctor/dashboard/${doctorId}`)
      } catch (error) {
        console.error('Error deleting patient:', error)
        toast.error('Failed to delete patient')
      }
    }
  }

  const handleSendMessage = () => {
    router.push(`/doctor/messages?patientId=${patientId}`)
  }

  const handleExportPatient = () => {
    try {
      const exportData = {
        patientFolder,
        patientData,
        prescriptions,
        instructions,
        alerts,
        messages: JSON.parse(localStorage.getItem(`messages_${patientId}`) || '[]'),
        exportedAt: new Date().toISOString(),
        exportedBy: doctorId
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })

      const link = document.createElement('a')
      link.href = URL.createObjectURL(dataBlob)
      link.download = `patient_${patientFolder?.fullName?.replace(/\s+/g, '_') || 'unknown'}_${patientId}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Patient data exported successfully')
    } catch (error) {
      console.error('Error exporting patient:', error)
      toast.error('Failed to export patient data')
    }
  }

  const handleImportPatient = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const importData = JSON.parse(e.target?.result as string)

            // Validate import data structure
            if (!importData.patientFolder || !importData.patientData) {
              throw new Error('Invalid patient data format')
            }

            // Generate new patient ID to avoid conflicts
            const newPatientId = `PAT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

            // Update patient data with new ID
            const newPatientFolder = {
              ...importData.patientFolder,
              patientId: newPatientId,
              doctorId: doctorId,
              importedAt: new Date().toISOString(),
              originalPatientId: importData.patientFolder.patientId
            }

            const newPatientData = {
              ...importData.patientData,
              patientId: newPatientId,
              importedAt: new Date().toISOString()
            }

            // Store imported patient data
            const folders = getDoctorPatientFolders(doctorId)
            folders.push(newPatientFolder)
            localStorage.setItem(`doctor_patients_${doctorId}`, JSON.stringify(folders))
            localStorage.setItem(`patient_${newPatientId}`, JSON.stringify(newPatientData))

            // Store related data with new patient ID
            if (importData.prescriptions) {
              localStorage.setItem(`prescriptions_${newPatientId}`, JSON.stringify(importData.prescriptions))
            }
            if (importData.instructions) {
              localStorage.setItem(`instructions_${newPatientId}`, JSON.stringify(importData.instructions))
            }
            if (importData.alerts) {
              localStorage.setItem(`alerts_${newPatientId}`, JSON.stringify(importData.alerts))
            }
            if (importData.messages) {
              localStorage.setItem(`messages_${newPatientId}`, JSON.stringify(importData.messages))
            }

            toast.success('Patient imported', `New ID: ${newPatientId}`)
            router.push(`/doctor/dashboard/${doctorId}`)
          } catch (error) {
            console.error('Error importing patient:', error)
            toast.error('Failed to import patient data. Please check the file format.')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patient details...</p>
        </div>
      </div>
    )
  }

  if (!patientFolder || !patientData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Patient Not Found</h2>
        <p className="text-gray-600 mb-4">The requested patient could not be found.</p>
        <Link href={`/doctor/dashboard/${doctorId}`}>
          <Button>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/doctor/dashboard/${doctorId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{patientFolder.fullName}</h1>
            <p className="text-gray-600">Patient ID: {patientFolder.patientId}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge className={`${getRiskBadgeClass(patientFolder.redFlagScore)} text-lg px-4 py-2`}>
            {getRiskLabel(patientFolder.redFlagScore)} ({patientFolder.redFlagScore}/10)
          </Badge>
          {patientFolder.alertCount > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Bell className="w-3 h-3" />
              {patientFolder.alertCount} Alerts
            </Badge>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendMessage}
              className="flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Send Message
            </Button>

            <Link href={`/doctor/dashboard/${doctorId}/patient/${patientId}/edit`}>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Patient
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPatient}
              className="flex items-center gap-2"
            >
              <Share className="w-4 h-4" />
              Export Data
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleImportPatient}
              className="flex items-center gap-2"
            >
              <Import className="w-4 h-4" />
              Import Patient
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDeletePatient}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Patient Overview Card */}
      <Card className={`p-6 ${getFolderGlowClass(patientFolder.folderColor)}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">Basic Information</span>
            </div>
            <div className="space-y-1">
              <p><span className="font-medium">Age:</span> {patientData?.age || patientFolder.age} years</p>
              <p><span className="font-medium">Gender:</span> {patientData.sex}</p>
              <p><span className="font-medium">Disease:</span> {patientFolder.diseaseType}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">Contact Information</span>
            </div>
            <div className="space-y-1">
              <p className="flex items-center gap-2">
                <Phone className="w-3 h-3" />
                {patientData.mobileNumber}
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3 h-3" />
                {patientData.emailId}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">Timeline</span>
            </div>
            <div className="space-y-1">
              <p><span className="font-medium">Registration:</span> {new Date(patientData.registrationDate).toLocaleDateString()}</p>
              <p><span className="font-medium">Last Log:</span> {new Date(patientFolder.lastLogDate).toLocaleDateString()}</p>
              <p><span className="font-medium">Diagnosis:</span> {patientData.diagnosis.primaryCategory}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs for Different Views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="pft-history">PFT History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="instructions">Instructions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Medical History */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Medical History</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Primary Diagnosis:</span> {patientData.diagnosis.primaryCategory}</p>
                {patientData.diagnosis.subtype && (
                  <p><span className="font-medium">Subtype:</span> {patientData.diagnosis.subtype}</p>
                )}
                <p><span className="font-medium">Medical History:</span> {patientData.medicalHistory}</p>
                <p><span className="font-medium">Smoking Status:</span> {patientData.smokingStatus}</p>
                {patientData.packYears && (
                  <p><span className="font-medium">Pack Years:</span> {patientData.packYears}</p>
                )}
                {patientData.comorbidities.length > 0 && (
                  <div>
                    <span className="font-medium">Comorbidities:</span>
                    <ul className="list-disc list-inside ml-2">
                      {patientData.comorbidities.map((condition: string, index: number) => (
                        <li key={index}>{condition}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>

            {/* Current Status */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Current Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Risk Score</span>
                  <Badge className={getRiskBadgeClass(patientFolder.redFlagScore)}>
                    {patientFolder.redFlagScore}/10
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Active Alerts</span>
                  <Badge variant={patientFolder.alertCount > 0 ? "destructive" : "secondary"}>
                    {patientFolder.alertCount}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Activity</span>
                  <span className="text-sm text-gray-600">
                    {new Date(patientFolder.lastLogDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Recent Activity</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Patient registered on {new Date(patientData.registrationDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Last log entry on {new Date(patientFolder.lastLogDate).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="medications" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Medication Management</h3>
            <div className="flex gap-2">
              <Button onClick={() => setShowPrescriptionModal(true)} disabled={!patientData}>
                <FileOutput className="w-4 h-4 mr-2" />
                Generate Prescription
              </Button>
              <Button variant="outline" onClick={handleAddMedication}>
                <Pill className="w-4 h-4 mr-2" />
                Add Medication
              </Button>
            </div>
          </div>

          {/* Current Medications from Patient Data */}
          {patientData.medications && patientData.medications.length > 0 && (
            <Card className="p-4">
              <h4 className="font-medium mb-3">Current Medications</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Route</th>
                      <th className="text-left p-2">Drug Name</th>
                      <th className="text-left p-2">Dose</th>
                      <th className="text-left p-2">Frequency</th>
                      <th className="text-left p-2">Start Date</th>
                      <th className="text-left p-2">End Date</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientData.medications.map((med: any, index: number) => (
                      <tr key={med.id || index} className="border-b">
                        <td className="p-2">{med.route}</td>
                        <td className="p-2">{med.customDrugName || med.drugName}</td>
                        <td className="p-2">{med.dose}</td>
                        <td className="p-2">{med.frequency}</td>
                        <td className="p-2">{new Date(med.startDate).toLocaleDateString()}</td>
                        <td className="p-2">{med.endDate ? new Date(med.endDate).toLocaleDateString() : 'Ongoing'}</td>
                        <td className="p-2">
                          <Badge variant={med.isActive ? "default" : "secondary"}>
                            {med.isActive ? "Active" : "Past"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Previous prescriptions (by date) */}
          {prescriptions.length > 0 ? (
            <Card className="p-4">
              <h4 className="font-medium mb-3">Previous prescriptions (by date)</h4>
              <div className="space-y-3">
                {prescriptions.map((rx) => (
                  <div key={rx.id} className="border rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{rx.date} — {rx.patientName}</p>
                      <p className="text-xs text-gray-600">{rx.diagnosis}</p>
                      <p className="text-xs text-gray-500">{rx.medications.length} medication(s)</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const text = formatPrescriptionCard(rx)
                        const w = window.open('', '_blank')
                        if (w) {
                          w.document.write(`<pre style="font-family: Arial; margin: 20px;">${text.replace(/</g, '&lt;')}</pre>`)
                          w.document.close()
                        }
                      }}
                    >
                      <FileOutput className="w-3 h-3 mr-1" />
                      View card
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {/* Generate prescription card */}
          <Card className="p-4 mt-4">
            <h4 className="font-medium mb-2">Prescription card</h4>
            <p className="text-sm text-gray-600 mb-3">Generate a prescription card from current medications and personalized alerts.</p>
            <Button onClick={() => setShowPrescriptionModal(true)} disabled={!patientData}>
              <FileOutput className="w-4 h-4 mr-2" />
              Generate prescription card
            </Button>
          </Card>

          {prescriptions.length === 0 && patientData && (!patientData.medications || patientData.medications.length === 0) && (
            <Card className="p-8 text-center mt-4">
              <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Medications</h3>
              <p className="text-gray-600 mb-4">No medications have been added for this patient yet.</p>
              <Button onClick={() => setShowPrescriptionModal(true)} disabled={!patientData}>
                <FileOutput className="w-4 h-4 mr-2" />
                Generate First Prescription
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pft-history" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">PFT History</h3>
            <Button onClick={handleAddPFT}>
              <FileText className="w-4 h-4 mr-2" />
              Add PFT Record
            </Button>
          </div>

          <Card className="p-8 text-center">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">PFT History</h3>
            <p className="text-gray-600 mb-4">Track pulmonary function test results over time.</p>
            <Button onClick={handleAddPFT}>
              <FileText className="w-4 h-4 mr-2" />
              Add First PFT Record
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Graphs & Analytics</h3>
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>

          <Card className="p-8 text-center">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
            <p className="text-gray-600 mb-4">View trends, patterns, and insights from patient data.</p>
            <Button onClick={handleGenerateAnalytics}>
              <TrendingUp className="w-4 h-4 mr-2" />
              Generate Analytics
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Alert & Notification System</h3>
            <Badge variant="destructive">
              {alerts.length} Active Alerts
            </Badge>
          </div>

          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <Card key={alert.id} className={`p-4 border-l-4 ${alert.level === 'RED' ? 'border-red-500' : 'border-yellow-500'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`w-5 h-5 mt-0.5 ${alert.level === 'RED' ? 'text-red-600' : 'text-yellow-600'}`} />
                      <div>
                        <h4 className={`font-medium ${alert.level === 'RED' ? 'text-red-900' : 'text-yellow-900'}`}>{alert.level} ALERT</h4>
                        <p className="text-sm text-gray-700 mt-1">{alert.reason_text || alert.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={alert.level === 'RED' ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}>
                            {alert.disease_type}
                          </Badge>
                          <span className="text-xs text-gray-600">
                            {new Date(alert.created_at || alert.createdAt || Date.now()).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!alert.acknowledged && (
                      <Button size="sm" variant="outline" onClick={() => handleAcknowledgeAlert(alert.id)}>
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Alerts</h3>
              <p className="text-gray-600">All clear! No alerts for this patient at the moment.</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="instructions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Doctor Instructions</h3>
            <Button onClick={handleAddInstruction}>
              <FileText className="w-4 h-4 mr-2" />
              Add Instruction
            </Button>
          </div>

          {instructions.length > 0 ? (
            <div className="space-y-3">
              {instructions.map((instruction) => (
                <Card key={instruction.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm">{instruction.instruction}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={instruction.isActive ? "default" : "secondary"}>
                          {instruction.isActive ? "Active" : "Archived"}
                        </Badge>
                        <span className="text-xs text-gray-600">
                          {new Date(instruction.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Edit className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Instructions</h3>
              <p className="text-gray-600 mb-4">No doctor instructions have been added for this patient yet.</p>
              <Button onClick={handleAddInstruction}>
                <FileText className="w-4 h-4 mr-2" />
                Add First Instruction
              </Button>
            </Card>
          )}
        </TabsContent>

      </Tabs>

      {/* Prescription Modal */}
      {patientData && (
        <PrescriptionModal
          isOpen={showPrescriptionModal}
          onClose={() => { setShowPrescriptionModal(false); loadPrescriptions(patientId) }}
          patientData={patientData}
          patientId={patientId}
          doctorId={doctorId}
          doctorName={doctorSession?.name || "Dr. Unknown"}
        />
      )}
    </div>
  )
}