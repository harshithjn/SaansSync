"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { getDoctorBySession, type DoctorSession } from "@/lib/doctor-session"
import { getDoctorPatientFolders, getDoctorAlertCounts, searchPatients } from "@/lib/doctor-patient-mapping"
import { initializeDemoAlerts } from "@/lib/alert-system"
import { PatientFolder } from "@/lib/monitoring-types"
import { Users, AlertTriangle, TrendingUp, Clock, Search, Plus, Bell, Edit, UserPlus } from "lucide-react"
import ImportPatientModal from "@/components/doctor/ImportPatientModal"

export default function DoctorDashboard({
  params,
}: {
  params: Promise<{ doctorId: string }>
}) {
  const [doctorSession, setDoctorSession] = useState<DoctorSession | null>(null)
  const [doctorId, setDoctorId] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDisease, setSelectedDisease] = useState("all")
  const [selectedRisk, setSelectedRisk] = useState("all")
  const [patientFolders, setPatientFolders] = useState<PatientFolder[]>([])
  const [alertCounts, setAlertCounts] = useState({
    critical: 0,
    highRisk: 0,
    pendingReview: 0,
    total: 0
  })
  const [filteredPatients, setFilteredPatients] = useState<PatientFolder[]>([])
  const [showImportModal, setShowImportModal] = useState(false)

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params
      setDoctorId(resolvedParams.doctorId)
      
      // Initialize demo patients if none exist
      const { initializeDemoPatients } = await import('@/lib/patient-storage')
      initializeDemoPatients()
      
      // Initialize demo alerts
      initializeDemoAlerts()
      
      // Load patient folders for this doctor
      const folders = getDoctorPatientFolders(resolvedParams.doctorId)
      setPatientFolders(folders)
      setFilteredPatients(folders)
      
      // Load alert counts
      const counts = getDoctorAlertCounts(resolvedParams.doctorId)
      setAlertCounts(counts)
    }

    const session = getDoctorBySession()
    setDoctorSession(session)
    initializeParams()
  }, [params])

  // Filter patients based on search and filters
  useEffect(() => {
    let filtered = patientFolders

    // Search filter
    if (searchTerm.trim()) {
      filtered = searchPatients(doctorId, searchTerm)
    }

    // Disease filter
    if (selectedDisease !== "all") {
      filtered = filtered.filter(patient => 
        patient.diseaseType.toLowerCase() === selectedDisease.toLowerCase()
      )
    }

    // Risk filter
    if (selectedRisk !== "all") {
      filtered = filtered.filter(patient => {
        if (selectedRisk === "critical") return patient.redFlagScore >= 9
        if (selectedRisk === "high") return patient.redFlagScore >= 7 && patient.redFlagScore < 9
        if (selectedRisk === "moderate") return patient.redFlagScore >= 4 && patient.redFlagScore < 7
        if (selectedRisk === "low") return patient.redFlagScore < 4
        return true
      })
    }

    setFilteredPatients(filtered)
  }, [searchTerm, selectedDisease, selectedRisk, patientFolders, doctorId])

  const getFolderGlowClass = (color: 'green' | 'yellow' | 'red') => {
    switch (color) {
      case 'green':
        return 'border-green-200 bg-green-50/30 shadow-green-100 hover:shadow-green-200'
      case 'yellow':
        return 'border-yellow-200 bg-yellow-50/30 shadow-yellow-100 hover:shadow-yellow-200'
      case 'red':
        return 'border-red-200 bg-red-50/30 shadow-red-100 hover:shadow-red-200 animate-pulse'
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

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      {doctorSession && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                Welcome back, Dr. {doctorSession.name.split(' ')[0]}!
              </h1>
              <p className="text-gray-600">
                Remote Respiratory Monitoring Dashboard - Manage your patients and monitor their health status
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <div className="relative">
                <Link href={`/doctor/dashboard/${doctorId}/alerts`}>
                  <Button variant="outline" size="sm" className="relative">
                    <Bell className="w-4 h-4" />
                    {alertCounts.total > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                        {alertCounts.total > 99 ? '99+' : alertCounts.total}
                      </Badge>
                    )}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-0 shadow-sm bg-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{patientFolders.length}</p>
              <p className="text-sm text-gray-600">Total Patients</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-sm bg-red-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{alertCounts.critical}</p>
              <p className="text-sm text-gray-600">Critical Alerts</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-sm bg-amber-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{alertCounts.highRisk}</p>
              <p className="text-sm text-gray-600">High Risk</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-sm bg-yellow-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{alertCounts.pendingReview}</p>
              <p className="text-sm text-gray-600">Pending Review</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filter Controls */}
      <Card className="p-4 border-0 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search patients by name or ID..."
              className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={selectedDisease} onValueChange={setSelectedDisease}>
            <SelectTrigger className="w-48 border-gray-200">
              <SelectValue placeholder="Filter by Disease" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Diseases</SelectItem>
              <SelectItem value="asthma">Asthma</SelectItem>
              <SelectItem value="copd">COPD</SelectItem>
              <SelectItem value="ild">ILD</SelectItem>
              <SelectItem value="bronchiectasis">Bronchiectasis</SelectItem>
              <SelectItem value="post-infection">Post-Infection</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedRisk} onValueChange={setSelectedRisk}>
            <SelectTrigger className="w-48 border-gray-200">
              <SelectValue placeholder="Filter by Risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              <SelectItem value="critical">Critical (9-10)</SelectItem>
              <SelectItem value="high">High Risk (7-8)</SelectItem>
              <SelectItem value="moderate">Moderate (4-6)</SelectItem>
              <SelectItem value="low">Low Risk (1-3)</SelectItem>
            </SelectContent>
          </Select>

          <Link href={`/doctor/dashboard/${doctorId}/create-patient`}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Patient
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            onClick={() => setShowImportModal(true)}
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Import Patient
          </Button>
        </div>
      </Card>

      {/* Patient Folder View */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Patient Folders ({filteredPatients.length})
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Stable</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>Warning</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Critical</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => (
            <div key={patient.patientId} className="relative group">
              <Card 
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${getFolderGlowClass(patient.folderColor)}`}
              >
                <Link href={`/doctor/dashboard/${doctorId}/patient/${patient.patientId}`}>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${
                          patient.folderColor === 'green' ? 'bg-green-500' :
                          patient.folderColor === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <h4 className="font-semibold text-gray-900">{patient.fullName}</h4>
                      </div>
                      <Badge className={`text-xs ${getRiskBadgeClass(patient.redFlagScore)}`}>
                        {patient.redFlagScore}/10
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Age:</span>
                        <span className="font-medium">{patient.age} years</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Disease:</span>
                        <span className="font-medium">{patient.diseaseType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Risk Level:</span>
                        <span className={`font-medium ${
                          patient.redFlagScore >= 9 ? 'text-red-600' :
                          patient.redFlagScore >= 7 ? 'text-red-500' :
                          patient.redFlagScore >= 4 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {getRiskLabel(patient.redFlagScore)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Log:</span>
                        <span className="font-medium">
                          {new Date(patient.lastLogDate).toLocaleDateString()}
                        </span>
                      </div>
                      {patient.alertCount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Alerts:</span>
                          <Badge variant="destructive" className="text-xs">
                            {patient.alertCount} active
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <span className="text-xs text-gray-500">Click to view details</span>
                    </div>
                  </div>
                </Link>
              </Card>
              
              {/* Action Buttons */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link href={`/doctor/dashboard/${doctorId}/patient/${patient.patientId}/edit`}>
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0 bg-white/90 hover:bg-white">
                    <Edit className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredPatients.length === 0 && (
          <Card className="p-8 text-center border-0 shadow-sm">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedDisease !== "all" || selectedRisk !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first patient"}
            </p>
            {!searchTerm && selectedDisease === "all" && selectedRisk === "all" && (
              <Link href={`/doctor/dashboard/${doctorId}/create-patient`}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Patient
                </Button>
              </Link>
            )}
          </Card>
        )}
      </div>
      
      {/* Import Patient Modal */}
      <ImportPatientModal
        doctorId={doctorId}
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          // Refresh patient folders after successful import
          const folders = getDoctorPatientFolders(doctorId)
          setPatientFolders(folders)
          setFilteredPatients(folders)
        }}
      />
    </div>
  )
}