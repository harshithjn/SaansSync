"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { getDoctorPatientFolders } from "@/lib/doctor-patient-mapping"
import { generatePatientAnalytics, AnalyticsData } from "@/lib/analytics-service"
import { PatientFolder } from "@/lib/monitoring-types"
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Users, BarChart3, PieChart, Download } from "lucide-react"

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
    
    // Calculate overview stats
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

  const generateAnalytics = () => {
    if (selectedPatient === "all") {
      // Generate overview analytics for all patients
      setAnalyticsData(null)
      return
    }

    const patient = patients.find(p => p.patientId === selectedPatient)
    if (!patient) return

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - parseInt(dateRange))

    const analytics = generatePatientAnalytics(
      patient.patientId,
      patient.diseaseType,
      {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      }
    )

    setAnalyticsData(analytics)
  }

  useEffect(() => {
    if (selectedPatient !== "all") {
      generateAnalytics()
    } else {
      setAnalyticsData(null)
    }
  }, [selectedPatient, dateRange])

  const getDiseaseDistribution = () => {
    const distribution: Record<string, number> = {}
    patients.forEach(patient => {
      distribution[patient.diseaseType] = (distribution[patient.diseaseType] || 0) + 1
    })
    return distribution
  }

  const getRiskDistribution = () => {
    const distribution = { low: 0, moderate: 0, high: 0, critical: 0 }
    patients.forEach(patient => {
      if (patient.redFlagScore >= 9) distribution.critical++
      else if (patient.redFlagScore >= 7) distribution.high++
      else if (patient.redFlagScore >= 4) distribution.moderate++
      else distribution.low++
    })
    return distribution
  }

  const diseaseDistribution = getDiseaseDistribution()
  const riskDistribution = getRiskDistribution()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Insights and trends from patient monitoring data</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-0 shadow-sm bg-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{overviewStats.totalPatients}</p>
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
              <p className="text-2xl font-semibold text-gray-900">{overviewStats.criticalPatients}</p>
              <p className="text-sm text-gray-600">Critical Patients</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-sm bg-green-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{overviewStats.averageRiskScore.toFixed(1)}</p>
              <p className="text-sm text-gray-600">Avg Risk Score</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-sm bg-orange-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{overviewStats.totalAlerts}</p>
              <p className="text-sm text-gray-600">Active Alerts</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Analytics Controls */}
      <Card className="p-4 border-0 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Patient:</label>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger className="w-64 border-gray-200">
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Patients Overview</SelectItem>
                {patients.map(patient => (
                  <SelectItem key={patient.patientId} value={patient.patientId}>
                    {patient.fullName} ({patient.diseaseType})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Time Range:</label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32 border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">6 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {selectedPatient === "all" ? (
        /* Overview Analytics */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Disease Distribution */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Disease Distribution</h3>
            </div>
            <div className="space-y-3">
              {Object.entries(diseaseDistribution).map(([disease, count]) => (
                <div key={disease} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{disease}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(count / overviewStats.totalPatients) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Risk Distribution */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold">Risk Level Distribution</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Low Risk (1-3)</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(riskDistribution.low / overviewStats.totalPatients) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{riskDistribution.low}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Moderate (4-6)</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: `${(riskDistribution.moderate / overviewStats.totalPatients) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{riskDistribution.moderate}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">High Risk (7-8)</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full" 
                      style={{ width: `${(riskDistribution.high / overviewStats.totalPatients) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{riskDistribution.high}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Critical (9-10)</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${(riskDistribution.critical / overviewStats.totalPatients) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{riskDistribution.critical}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : analyticsData ? (
        /* Individual Patient Analytics */
        <div className="space-y-6">
          {/* Patient Info */}
          <Card className="p-4 bg-blue-50/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {patients.find(p => p.patientId === selectedPatient)?.fullName}
                </h3>
                <p className="text-gray-600">
                  {analyticsData.diseaseType} • Patient ID: {analyticsData.patientId}
                </p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                {dateRange} days analysis
              </Badge>
            </div>
          </Card>

          {/* Insights */}
          {analyticsData.insights.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
              <div className="space-y-3">
                {analyticsData.insights.map((insight, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg border-l-4 ${
                      insight.type === 'critical' ? 'border-red-500 bg-red-50' :
                      insight.type === 'concerning' ? 'border-orange-500 bg-orange-50' :
                      insight.type === 'positive' ? 'border-green-500 bg-green-50' :
                      'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {insight.type === 'positive' ? (
                        <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                      ) : insight.type === 'concerning' || insight.type === 'critical' ? (
                        <TrendingDown className="w-5 h-5 text-red-600 mt-0.5" />
                      ) : (
                        <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium">{insight.title}</h4>
                        <p className="text-sm text-gray-700 mt-1">{insight.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              insight.impact === 'high' ? 'border-red-200 text-red-700' :
                              insight.impact === 'medium' ? 'border-orange-200 text-orange-700' :
                              'border-gray-200 text-gray-700'
                            }`}
                          >
                            {insight.impact} impact
                          </Badge>
                          {insight.actionRequired && (
                            <Badge variant="destructive" className="text-xs">
                              Action Required
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recommendations */}
          {analyticsData.recommendations.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
              <div className="space-y-2">
                {analyticsData.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <p className="text-sm text-gray-700">{recommendation}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Placeholder for Charts */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Trend Analysis</h3>
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Trend charts will be displayed here</p>
              <p className="text-sm">SpO₂ trends, symptom progression, medication compliance</p>
            </div>
          </Card>
        </div>
      ) : (
        /* No Patient Selected */
        <Card className="p-8 text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Patient</h3>
          <p className="text-gray-600">Choose a patient from the dropdown to view detailed analytics</p>
        </Card>
      )}
    </div>
  )
}