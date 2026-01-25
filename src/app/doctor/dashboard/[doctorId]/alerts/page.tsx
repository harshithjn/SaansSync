"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert } from "@/lib/monitoring-types"
import { getDoctorAlerts, acknowledgeAlert, getAlertStatistics } from "@/lib/alert-system"
import { AlertTriangle, Bell, CheckCircle, Clock, Filter, Search } from "lucide-react"

export default function AlertsPage({
  params,
}: {
  params: Promise<{ doctorId: string }>
}) {
  const [doctorId, setDoctorId] = useState<string>("")
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [statistics, setStatistics] = useState({
    total: 0,
    critical: 0,
    highRisk: 0,
    pendingReview: 0,
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

  const loadAlerts = (doctorId: string) => {
    const doctorAlerts = getDoctorAlerts(doctorId)
    const stats = getAlertStatistics(doctorId)
    
    setAlerts(doctorAlerts)
    setFilteredAlerts(doctorAlerts)
    setStatistics(stats)
  }

  // Filter alerts based on search and filters
  useEffect(() => {
    let filtered = alerts

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(alert => 
        alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.factors.some(factor => factor.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter(alert => alert.type === filterType)
    }

    // Status filter
    if (filterStatus === "active") {
      filtered = filtered.filter(alert => !alert.acknowledged)
    } else if (filterStatus === "acknowledged") {
      filtered = filtered.filter(alert => alert.acknowledged)
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    setFilteredAlerts(filtered)
  }, [searchTerm, filterType, filterStatus, alerts])

  const handleAcknowledgeAlert = (alertId: string) => {
    acknowledgeAlert(alertId)
    loadAlerts(doctorId) // Reload alerts
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'high-risk':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />
      case 'pending-review':
        return <Bell className="w-5 h-5 text-yellow-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const getAlertBadgeClass = (type: string) => {
    switch (type) {
      case 'critical':
        return "bg-red-600 text-white"
      case 'high-risk':
        return "bg-orange-600 text-white"
      case 'pending-review':
        return "bg-yellow-600 text-white"
      default:
        return "bg-gray-600 text-white"
    }
  }

  const getAlertBorderClass = (type: string, acknowledged: boolean) => {
    if (acknowledged) return "border-gray-200 bg-gray-50"
    
    switch (type) {
      case 'critical':
        return "border-red-200 bg-red-50"
      case 'high-risk':
        return "border-orange-200 bg-orange-50"
      case 'pending-review':
        return "border-yellow-200 bg-yellow-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Alert Management</h1>
          <p className="text-gray-600">Monitor and manage patient alerts</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4 border-0 shadow-sm bg-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{statistics.total}</p>
              <p className="text-sm text-gray-600">Total Alerts</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-sm bg-red-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{statistics.critical}</p>
              <p className="text-sm text-gray-600">Critical</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-sm bg-orange-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{statistics.highRisk}</p>
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
              <p className="text-2xl font-semibold text-gray-900">{statistics.pendingReview}</p>
              <p className="text-sm text-gray-600">Pending Review</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-sm bg-green-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{statistics.acknowledged}</p>
              <p className="text-sm text-gray-600">Acknowledged</p>
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
              placeholder="Search alerts by message, patient ID, or factors..."
              className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48 border-gray-200">
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high-risk">High Risk</SelectItem>
              <SelectItem value="pending-review">Pending Review</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48 border-gray-200">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Alerts List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Alerts ({filteredAlerts.length})
          </h3>
        </div>

        {filteredAlerts.length > 0 ? (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <Card 
                key={alert.id} 
                className={`p-4 border-l-4 ${getAlertBorderClass(alert.type, alert.acknowledged)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`${getAlertBadgeClass(alert.type)} text-xs`}>
                          {alert.type.replace('-', ' ').toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {alert.diseaseType}
                        </Badge>
                        <Badge className="bg-gray-100 text-gray-800 text-xs">
                          Score: {alert.redFlagScore}/10
                        </Badge>
                        {alert.acknowledged && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Acknowledged
                          </Badge>
                        )}
                      </div>
                      
                      <h4 className="font-medium text-gray-900 mb-1">
                        Patient: {alert.patientId}
                      </h4>
                      <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                      
                      {alert.factors.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-gray-600 mb-1">Contributing Factors:</p>
                          <div className="flex flex-wrap gap-1">
                            {alert.factors.map((factor, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {factor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Created: {new Date(alert.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!alert.acknowledged && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center border-0 shadow-sm">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
            <p className="text-gray-600">
              {searchTerm || filterType !== "all" || filterStatus !== "all"
                ? "Try adjusting your search or filters"
                : "All clear! No alerts at the moment."}
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}