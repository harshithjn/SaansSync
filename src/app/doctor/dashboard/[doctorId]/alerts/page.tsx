import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "../../../../../components/ui/badge"
import { AlertTriangle, Clock, CheckCircle, Eye, MoreHorizontal } from "lucide-react"

const alerts = [
    {
        id: "1",
        patientName: "John Doe",
        patientId: "3",
        type: "Critical",
        message: "SpO2 levels dropped below 85% for 30+ minutes",
        timestamp: "2024-01-25 14:30",
        severity: "high",
        status: "unread"
    },
    {
        id: "2",
        patientName: "Anita Sharma",
        patientId: "2",
        type: "Warning",
        message: "Missed medication dose - Bronchodilator",
        timestamp: "2024-01-25 12:15",
        severity: "medium",
        status: "unread"
    },
    {
        id: "3",
        patientName: "Rahul Kumar",
        patientId: "1",
        type: "Info",
        message: "Scheduled for PFT test tomorrow",
        timestamp: "2024-01-25 09:45",
        severity: "low",
        status: "read"
    },
    {
        id: "4",
        patientName: "Priya Singh",
        patientId: "4",
        type: "Critical",
        message: "Emergency contact requested - breathing difficulties",
        timestamp: "2024-01-25 08:20",
        severity: "high",
        status: "unread"
    },
    {
        id: "5",
        patientName: "Michael Brown",
        patientId: "5",
        type: "Warning",
        message: "Oxygen flow rate adjusted - monitor closely",
        timestamp: "2024-01-24 16:30",
        severity: "medium",
        status: "read"
    }
]

const severityConfig = {
    high: {
        icon: AlertTriangle,
        color: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200",
        badge: "bg-red-100 text-red-700"
    },
    medium: {
        icon: Clock,
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        badge: "bg-amber-100 text-amber-700"
    },
    low: {
        icon: CheckCircle,
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-200",
        badge: "bg-blue-100 text-blue-700"
    }
}

export default async function AlertsPage({
    params,
}: {
    params: Promise<{ doctorId: string }>
}) {
    const { doctorId } = await params

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Alerts</h1>
                    <p className="text-gray-600 mt-1">Monitor patient notifications and critical updates</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="text-gray-600">
                        Mark All Read
                    </Button>
                    <Button variant="outline" size="sm" className="text-gray-600">
                        Settings
                    </Button>
                </div>
            </div>

            {/* Alert Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 border-0 shadow-sm bg-red-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-semibold text-gray-900">2</p>
                            <p className="text-sm text-gray-600">Critical</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4 border-0 shadow-sm bg-amber-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-semibold text-gray-900">2</p>
                            <p className="text-sm text-gray-600">Warnings</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4 border-0 shadow-sm bg-blue-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-semibold text-gray-900">1</p>
                            <p className="text-sm text-gray-600">Info</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Alerts List */}
            <div className="space-y-3">
                {alerts.map((alert) => {
                    const config = severityConfig[alert.severity as keyof typeof severityConfig]
                    const IconComponent = config.icon

                    return (
                        <Card key={alert.id} className={`border-0 shadow-sm hover:shadow-md transition-shadow ${alert.status === 'unread' ? 'ring-1 ring-blue-200' : ''}`}>
                            <div className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-3 flex-1">
                                        <div className={`p-2 rounded-lg ${config.bg}`}>
                                            <IconComponent className={`w-4 h-4 ${config.color}`} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.badge}`}>
                                                    {alert.type}
                                                </span>
                                                {alert.status === 'unread' && (
                                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                )}
                                            </div>

                                            <h3 className="font-medium text-gray-900 mb-1">
                                                {alert.patientName}
                                            </h3>

                                            <p className="text-gray-700 text-sm mb-2 leading-relaxed">
                                                {alert.message}
                                            </p>

                                            <p className="text-xs text-gray-500">
                                                {alert.timestamp}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 ml-4">
                                        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                                            <Eye className="w-4 h-4 mr-1" />
                                            View
                                        </Button>
                                        {alert.status === 'unread' && (
                                            <Button size="sm" className="bg-gray-900 hover:bg-gray-800 text-white">
                                                Mark Read
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}