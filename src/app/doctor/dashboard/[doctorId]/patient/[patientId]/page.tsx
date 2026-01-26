"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PatientFolder, PrescribedMedication, DoctorInstruction, Alert } from "@/lib/monitoring-types"
import { getDoctorPatientFolders } from "@/lib/doctor-patient-mapping"
import { getPatientDataById } from "@/lib/patient-storage"
import { ArrowLeft, User, Calendar, MapPin, Phone, Mail, AlertTriangle, Pill, FileText, TrendingUp, Download, Edit, Bell, MessageSquare, Trash2, Share, Import, MoreHorizontal } from "lucide-react"
import Link from "next/link"

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
  const [prescriptions, setPrescriptions] = useState<PrescribedMedication[]>([])
  const [instructions, setInstructions] = useState<DoctorInstruction[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params
      setDoctorId(resolvedParams.doctorId)
      setPatientId(resolvedParams.patientId)

      console.log('Loading patient details for:', resolvedParams.patientId)

      // Load patient folder
      const folders = getDoctorPatientFolders(resolvedParams.doctorId)
      const folder = folders.find(f => f.patientId === resolvedParams.patientId)
      setPatientFolder(folder || null)

      // Load patient data
      let data = getPatientDataById(resolvedParams.patientId)

      // If not found, check stored patients directly
      if (!data) {
        const { getStoredPatients } = await import('@/lib/patient-storage')
        const allPatients = getStoredPatients()
        const patientRecord = allPatients.find(p => p.credentials.patientId === resolvedParams.patientId)
        if (patientRecord) {
          data = patientRecord.patientData
        }
      }

      // Also check if data is stored in the old format (patient_${id})
      if (!data) {
        try {
          const oldFormatData = localStorage.getItem(`patient_${resolvedParams.patientId}`)
          if (oldFormatData) {
            data = JSON.parse(oldFormatData)
          }
        } catch (error) {
          console.error('Error reading old format data:', error)
        }
      }

      setPatientData(data)

      // Load prescriptions
      loadPrescriptions(resolvedParams.patientId)

      // Load instructions
      loadInstructions(resolvedParams.patientId)

      // Load alerts
      loadAlerts(resolvedParams.patientId)

      // Load messages
      loadMessages(resolvedParams.patientId)

      setLoading(false)
    }

    initializeParams()
  }, [params])

  const loadPrescriptions = (patientId: string) => {
    try {
      const stored = localStorage.getItem(`prescriptions_${patientId}`)
      if (stored) {
        setPrescriptions(JSON.parse(stored))
      }
    } catch (error) {
      console.error("Error loading prescriptions:", error)
    }
  }

  const loadInstructions = (patientId: string) => {
    try {
      const stored = localStorage.getItem(`instructions_${patientId}`)
      if (stored) {
        setInstructions(JSON.parse(stored))
      }
    } catch (error) {
      console.error("Error loading instructions:", error)
    }
  }

  const loadAlerts = (patientId: string) => {
    try {
      const stored = localStorage.getItem(`alerts_${patientId}`)
      if (stored) {
        setAlerts(JSON.parse(stored))
      }
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

  const getFolderGlowClass = (color: 'green' | 'yellow' | 'red') => {
    switch (color) {
      case 'green':
        return 'border-green-200 bg-green-50/30'
      case 'yellow':
        return 'border-yellow-200 bg-yellow-50/30'
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

        alert('Patient deleted successfully')
        router.push(`/doctor/dashboard/${doctorId}`)
      } catch (error) {
        console.error('Error deleting patient:', error)
        alert('Failed to delete patient')
      }
    }
  }

  const handleSendMessage = () => {
    const message = prompt(`Send a message to ${patientFolder?.fullName}:`)
    if (message && message.trim()) {
      try {
        // Store message in patient's messages
        const existingMessages = JSON.parse(localStorage.getItem(`messages_${patientId}`) || '[]')
        const newMessage = {
          id: Date.now().toString(),
          from: 'doctor',
          doctorId,
          message: message.trim(),
          timestamp: new Date().toISOString(),
          read: false
        }
        existingMessages.push(newMessage)
        localStorage.setItem(`messages_${patientId}`, JSON.stringify(existingMessages))

        // Update local state
        setMessages(existingMessages)

        alert('Message sent successfully')
      } catch (error) {
        console.error('Error sending message:', error)
        alert('Failed to send message')
      }
    }
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
      link.download = `patient_${patientFolder.fullName.replace(/\s+/g, '_')}_${patientId}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      alert('Patient data exported successfully')
    } catch (error) {
      console.error('Error exporting patient:', error)
      alert('Failed to export patient data')
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

            alert(`Patient imported successfully with new ID: ${newPatientId}`)
            router.push(`/doctor/dashboard/${doctorId}`)
          } catch (error) {
            console.error('Error importing patient:', error)
            alert('Failed to import patient data. Please check the file format.')
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
              <p><span className="font-medium">Age:</span> {patientFolder.age} years</p>
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
          <TabsTrigger value="messages">Messages</TabsTrigger>
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
            <Button>
              <Pill className="w-4 h-4 mr-2" />
              Add Prescription
            </Button>
          </div>

          {prescriptions.length > 0 ? (
            <Card className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">S.No</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Drug Name</th>
                      <th className="text-left p-2">Dose</th>
                      <th className="text-left p-2">Start Date</th>
                      <th className="text-left p-2">End Date</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptions.map((med) => (
                      <tr key={med.id} className="border-b">
                        <td className="p-2">{med.serialNo}</td>
                        <td className="p-2">{med.type}</td>
                        <td className="p-2">{med.drugName}</td>
                        <td className="p-2">{med.dose}</td>
                        <td className="p-2">{new Date(med.startDate).toLocaleDateString()}</td>
                        <td className="p-2">{med.endDate ? new Date(med.endDate).toLocaleDateString() : 'Ongoing'}</td>
                        <td className="p-2">
                          <Badge variant={med.isActive ? "default" : "secondary"}>
                            {med.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Button size="sm" variant="outline">
                            <Edit className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Medications</h3>
              <p className="text-gray-600 mb-4">No prescriptions have been added for this patient yet.</p>
              <Button>
                <Pill className="w-4 h-4 mr-2" />
                Add First Prescription
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pft-history" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">PFT History</h3>
            <Button>
              <FileText className="w-4 h-4 mr-2" />
              Add PFT Record
            </Button>
          </div>

          <Card className="p-8 text-center">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">PFT History</h3>
            <p className="text-gray-600 mb-4">Track pulmonary function test results over time.</p>
            <Button>
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
            <Button>
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
                <Card key={alert.id} className="p-4 border-l-4 border-red-500">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-red-900">{alert.type.toUpperCase()}</h4>
                        <p className="text-sm text-red-700 mt-1">{alert.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="bg-red-100 text-red-800">
                            Score: {alert.redFlagScore}/10
                          </Badge>
                          <span className="text-xs text-gray-600">
                            {new Date(alert.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Acknowledge
                    </Button>
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
            <Button>
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
              <Button>
                <FileText className="w-4 h-4 mr-2" />
                Add First Instruction
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Messages</h3>
            <Button onClick={handleSendMessage}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </div>

          {messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map((message) => (
                <Card key={message.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={message.from === 'doctor' ? "default" : "secondary"}>
                          {message.from === 'doctor' ? 'From Doctor' : 'From Patient'}
                        </Badge>
                        <span className="text-xs text-gray-600">
                          {new Date(message.timestamp).toLocaleString()}
                        </span>
                        {!message.read && (
                          <Badge variant="destructive" className="text-xs">
                            Unread
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-900">{message.message}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Messages</h3>
              <p className="text-gray-600 mb-4">No messages have been sent to this patient yet.</p>
              <Button onClick={handleSendMessage}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Send First Message
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}