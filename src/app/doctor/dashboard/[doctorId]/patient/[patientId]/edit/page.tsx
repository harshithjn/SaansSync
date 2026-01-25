"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { PatientFolder } from "@/lib/monitoring-types"
import { getDoctorPatientFolders } from "@/lib/doctor-patient-mapping"
import { getPatientDataById, updatePatientData } from "@/lib/patient-storage"
import { PatientData } from "@/lib/patient-types"
import { ArrowLeft, Save, User, Phone, Mail, MapPin, Calendar, Stethoscope } from "lucide-react"
import Link from "next/link"

export default function EditPatientPage({
  params,
}: {
  params: Promise<{ doctorId: string; patientId: string }>
}) {
  const router = useRouter()
  const [doctorId, setDoctorId] = useState<string>("")
  const [patientId, setPatientId] = useState<string>("")
  const [patientFolder, setPatientFolder] = useState<PatientFolder | null>(null)
  const [patientData, setPatientData] = useState<PatientData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editedData, setEditedData] = useState<Partial<PatientData>>({})

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params
      setDoctorId(resolvedParams.doctorId)
      setPatientId(resolvedParams.patientId)

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

      // Also check old format
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
      setEditedData(data || {})

      setIsLoading(false)
    }

    initializeParams()
  }, [params])

  const handleInputChange = (field: string, value: string) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNestedInputChange = (parentField: string, field: string, value: any) => {
    setEditedData(prev => ({
      ...prev,
      [parentField]: {
        ...(prev[parentField as keyof PatientData] as any),
        [field]: value
      }
    }))
  }

  const handleSave = async () => {
    if (!patientData || !editedData) return

    setIsSaving(true)
    try {
      const updatedData: PatientData = {
        ...patientData,
        ...editedData
      }

      const success = updatePatientData(patientId, updatedData)
      if (success) {
        router.push(`/doctor/dashboard/${doctorId}/patient/${patientId}`)
      } else {
        alert('Failed to update patient data')
      }
    } catch (error) {
      console.error('Error updating patient:', error)
      alert('Error updating patient data')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patient data...</p>
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
          <Link href={`/doctor/dashboard/${doctorId}/patient/${patientId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Patient
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Edit Patient</h1>
            <p className="text-gray-600">{patientFolder.fullName} - {patientFolder.patientId}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Basic Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Full Name</label>
            <Input
              value={editedData.fullName || ''}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="Enter full name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Age</label>
            <Input
              type="number"
              value={editedData.age || ''}
              onChange={(e) => handleInputChange('age', e.target.value)}
              placeholder="Enter age"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Gender</label>
            <Select
              value={editedData.sex || ''}
              onValueChange={(value) => handleInputChange('sex', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Registration Date</label>
            <Input
              type="date"
              value={editedData.registrationDate || ''}
              onChange={(e) => handleInputChange('registrationDate', e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Contact Information */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Phone className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold">Contact Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Mobile Number</label>
            <Input
              value={editedData.mobileNumber || ''}
              onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
              placeholder="Enter mobile number"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email Address</label>
            <Input
              type="email"
              value={editedData.emailId || ''}
              onChange={(e) => handleInputChange('emailId', e.target.value)}
              placeholder="Enter email address"
            />
          </div>
        </div>
      </Card>

      {/* Medical Information */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Stethoscope className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Medical Information</h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Primary Diagnosis</label>
              <Select
                value={editedData.diagnosis?.primaryCategory || ''}
                onValueChange={(value) => handleNestedInputChange('diagnosis', 'primaryCategory', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select diagnosis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Interstitial Lung Disease (ILD)">Interstitial Lung Disease (ILD)</SelectItem>
                  <SelectItem value="Bronchial Asthma">Bronchial Asthma</SelectItem>
                  <SelectItem value="COPD (Chronic Obstructive Pulmonary Disease)">COPD</SelectItem>
                  <SelectItem value="Bronchiectasis">Bronchiectasis</SelectItem>
                  <SelectItem value="Post ICU Recovery">Post ICU Recovery</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Subtype</label>
              <Input
                value={editedData.diagnosis?.subtype || ''}
                onChange={(e) => handleNestedInputChange('diagnosis', 'subtype', e.target.value)}
                placeholder="Enter subtype"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Medical History</label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-md resize-none"
              rows={3}
              value={editedData.medicalHistory || ''}
              onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
              placeholder="Enter medical history"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Additional Notes</label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-md resize-none"
              rows={3}
              value={editedData.additionalNotes || ''}
              onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
              placeholder="Enter additional notes"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Smoking Status</label>
              <Select
                value={editedData.smokingStatus || ''}
                onValueChange={(value) => handleInputChange('smokingStatus', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select smoking status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Never Smoked">Never Smoked</SelectItem>
                  <SelectItem value="Former Smoker">Former Smoker</SelectItem>
                  <SelectItem value="Current Smoker">Current Smoker</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Pack Years</label>
              <Input
                value={editedData.packYears || ''}
                onChange={(e) => handleInputChange('packYears', e.target.value)}
                placeholder="Enter pack years"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Occupational Exposure</label>
            <Input
              value={editedData.occupationalExposure || ''}
              onChange={(e) => handleInputChange('occupationalExposure', e.target.value)}
              placeholder="Enter occupational exposure details"
            />
          </div>
        </div>
      </Card>

      {/* Save Actions */}
      <div className="flex justify-end gap-3">
        <Link href={`/doctor/dashboard/${doctorId}/patient/${patientId}`}>
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}