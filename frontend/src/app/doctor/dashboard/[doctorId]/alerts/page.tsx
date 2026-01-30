"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getDoctorAlertsSaansSync, acknowledgeSaansSyncAlert, type StoredDoctorAlert } from "@/lib/alert-engines"
import { AlertTriangle, Bell, CheckCircle, Clock, Search } from "lucide-react"

export default function AlertsPage({
  params,
}: {
  params: Promise<{ doctorId: string }>
}) {
  const [doctorId, setDoctorId] = useState<string>("")
  const [alerts, setAlerts] = useState<StoredDoctorAlert[]>([])
  const [filteredAlerts, setFilteredAlerts] = useState<StoredDoctorAlert[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [statistics, setStatistics] = useState({
    total: 0,
    red: 0,
    yellow: 0,
    green: 0,
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

  const loadAlerts = (docId: string) => {
    const doctorAlerts = getDoctorAlertsSaansSync(docId)
    setAlerts(doctorAlerts)
    setFilteredAlerts(doctorAlerts)
    setStatistics({
      total: doctorAlerts.filter(a => !a.acknowledged).length,
      red: doctorAlerts.filter(a => a.level === 'RED' && !a.acknowledged).length,
      yellow: doctorAlerts.filter(a => a.level === 'YELLOW' && !a.acknowledged).length,
      green: doctorAlerts.filter(a => a.level === 'GREEN').length,
      acknowledged: doctorAlerts.filter(a => a.acknowledged).length
    })
  }

  // Filter alerts based on search and filters
  useEffect(() => {
    let filtered = alerts

    if (searchTerm.trim()) {
      filtered = filtered.filter(alert =>
        alert.reason_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (alert.patientName && alert.patientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        alert.triggers.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (filterType !== "all") {
      filtered = filtered.filter(alert => alert.level === filterType)
    }

    if (filterStatus === "active") {
      filtered = filtered.filter(alert => !alert.acknowledged)
    } else if (filterStatus === "acknowledged") {
      filtered = filtered.filter(alert => alert.acknowledged)
    }

    setFilteredAlerts(filtered)
  }, [searchTerm, filterType, filterStatus, alerts])

  const handleAcknowledgeAlert = (alertId: string) => {
    acknowledgeSaansSyncAlert(alertId)
    loadAlerts(doctorId)
  }

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'RED':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'YELLOW':
        return <Bell className="w-5 h-5 text-yellow-600" />
      case 'GREEN':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const getAlertBadgeClass = (level: string) => {
    switch (level) {
      case 'RED':
        return "bg-red-600 text-white"
      case 'YELLOW':
        return "bg-yellow-600 text-white"
      case 'GREEN':
        return "bg-green-600 text-white"
      default:
        return "bg-gray-600 text-white"
    }
  }

  const getAlertBorderClass = (level: string, acknowledged: boolean) => {
    if (acknowledged) return "border-gray-200 bg-gray-50"
    switch (level) {
      case 'RED':
        return "border-red-200 bg-red-50"
      case 'YELLOW':
        return "border-yellow-200 bg-yellow-50"
      case 'GREEN':
        return "border-green-200 bg-green-50"
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

      {/* Statistics Cards — RED / YELLOW / GREEN (SaansSync) */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4 border-0 shadow-sm bg-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{statistics.total}</p>
              <p className="text-sm text-gray-600">Active Alerts</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-sm bg-red-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{statistics.red}</p>
              <p className="text-sm text-gray-600">RED (Action)</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-sm bg-yellow-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Bell className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{statistics.yellow}</p>
              <p className="text-sm text-gray-600">YELLOW (Review)</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-sm bg-green-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{statistics.green}</p>
              <p className="text-sm text-gray-600">GREEN (Stable)</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-sm bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-gray-600" />
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
              <SelectItem value="RED">RED</SelectItem>
              <SelectItem value="YELLOW">YELLOW</SelectItem>
              <SelectItem value="GREEN">GREEN</SelectItem>
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
                className={`p-4 border-l-4 ${getAlertBorderClass(alert.level, alert.acknowledged)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getAlertIcon(alert.level)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`${getAlertBadgeClass(alert.level)} text-xs`}>
                          {alert.level}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {alert.diseaseType}
                        </Badge>
                        {alert.acknowledged && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Acknowledged
                          </Badge>
                        )}
                      </div>

                      <h4 className="font-medium text-gray-900 mb-1">
                        Patient: {alert.patientName || alert.patientId}
                      </h4>
                      <p className="text-sm font-medium text-gray-700 mb-2">{alert.reason_text}</p>

                      {alert.triggers.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-gray-600 mb-1">Triggers:</p>
                          <div className="flex flex-wrap gap-1">
                            {alert.triggers.map((trigger, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {trigger}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>ID: {alert.patientId}</span>
                        <span>Created: {new Date(alert.timestamp).toLocaleString()}</span>
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