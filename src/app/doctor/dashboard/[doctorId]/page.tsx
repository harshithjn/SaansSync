"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { getDoctorBySession, type DoctorSession } from "@/lib/doctor-session"
import { Users, AlertTriangle, TrendingUp, Clock, Search, Plus, Edit, Trash2, Eye, MoreHorizontal } from "lucide-react"

const patients = [
  {
    id: "1",
    name: "Rahul Kumar",
    disease: "COPD",
    subDisease: "Severe COPD",
    status: "green",
    lastVisit: "2024-01-20",
    riskScore: 2.3,
    riskLevel: "Low"
  },
  {
    id: "2",
    name: "Anita Sharma",
    disease: "Asthma",
    subDisease: "Allergic Asthma",
    status: "yellow",
    lastVisit: "2024-01-18",
    riskScore: 5.7,
    riskLevel: "Medium"
  },
  {
    id: "3",
    name: "John Doe",
    disease: "ILD",
    subDisease: "IPF",
    status: "red",
    lastVisit: "2024-01-15",
    riskScore: 8.2,
    riskLevel: "High"
  },
  {
    id: "4",
    name: "Priya Singh",
    disease: "Bronchiectasis",
    subDisease: "Cystic Fibrosis",
    status: "green",
    lastVisit: "2024-01-22",
    riskScore: 3.1,
    riskLevel: "Low"
  },
  {
    id: "5",
    name: "Michael Brown",
    disease: "Post ICU",
    subDisease: "ARDS Recovery",
    status: "yellow",
    lastVisit: "2024-01-19",
    riskScore: 6.4,
    riskLevel: "Medium"
  },
]

const getRiskScoreColor = (score: number) => {
  if (score >= 7) return "text-red-600 bg-red-50"
  if (score >= 4) return "text-amber-600 bg-amber-50"
  return "text-green-600 bg-green-50"
}

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

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params
      setDoctorId(resolvedParams.doctorId)
    }

    const session = getDoctorBySession()
    setDoctorSession(session)
    initializeParams()
  }, [params])

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.disease.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDisease = selectedDisease === "all" || patient.disease.toLowerCase() === selectedDisease
    const matchesRisk = selectedRisk === "all" || patient.riskLevel.toLowerCase() === selectedRisk

    return matchesSearch && matchesDisease && matchesRisk
  })

  const handleDeletePatient = (patientId: string) => {
    if (confirm("Are you sure you want to delete this patient?")) {
      // Handle delete logic here
      console.log("Delete patient:", patientId)
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      {doctorSession && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Welcome back, {doctorSession.name.split(' ')[0]}!
          </h1>
          <p className="text-gray-600">
            Here's an overview of your patients and recent activity.
          </p>
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
              <p className="text-2xl font-semibold text-gray-900">24</p>
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
              <p className="text-2xl font-semibold text-gray-900">3</p>
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
              <p className="text-2xl font-semibold text-gray-900">5</p>
              <p className="text-sm text-gray-600">High Risk</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-sm bg-green-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">7</p>
              <p className="text-sm text-gray-600">Pending Reviews</p>
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
              placeholder="Search patients..."
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
              <SelectItem value="copd">COPD</SelectItem>
              <SelectItem value="asthma">Asthma</SelectItem>
              <SelectItem value="ild">ILD</SelectItem>
              <SelectItem value="bronchiectasis">Bronchiectasis</SelectItem>
              <SelectItem value="post icu">Post ICU</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedRisk} onValueChange={setSelectedRisk}>
            <SelectTrigger className="w-48 border-gray-200">
              <SelectValue placeholder="Filter by Risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
              <SelectItem value="medium">Medium Risk</SelectItem>
              <SelectItem value="low">Low Risk</SelectItem>
            </SelectContent>
          </Select>

          <Link href={`/doctor/dashboard/${doctorId}/create-patient`}>
            <Button className="bg-gray-900 hover:bg-gray-800 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Patient
            </Button>
          </Link>
        </div>
      </Card>

      {/* Patient List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Patients ({filteredPatients.length})
          </h3>
        </div>

        <div className="space-y-3">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-3 h-3 rounded-full ${patient.status === 'green' ? 'bg-green-500' :
                          patient.status === 'yellow' ? 'bg-amber-500' : 'bg-red-500'
                        }`} />
                      <span className="text-xs text-gray-500">Status</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900 text-lg">{patient.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskScoreColor(patient.riskScore)}`}>
                          Risk: {patient.riskScore}
                        </span>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span>
                          <span className="font-medium">{patient.disease}</span>
                          {patient.subDisease && (
                            <span className="text-gray-500"> • {patient.subDisease}</span>
                          )}
                        </span>
                        <span>Last visit: {patient.lastVisit}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/doctor/dashboard/${doctorId}/patient/${patient.id}`}>
                      <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </Link>

                    <Link href={`/doctor/dashboard/${doctorId}/patient/${patient.id}/edit`}>
                      <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </Link>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-red-600"
                      onClick={() => handleDeletePatient(patient.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
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
                <Button className="bg-gray-900 hover:bg-gray-800 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Patient
                </Button>
              </Link>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}