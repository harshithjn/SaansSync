import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "../../../../../components/ui/badge"

const appointments = [
    {
        id: "1",
        patientName: "Rahul Kumar",
        patientId: "1",
        date: "2024-01-26",
        time: "09:00",
        type: "Follow-up",
        status: "confirmed",
        duration: "30 min",
        notes: "COPD monitoring, PFT review"
    },
    {
        id: "2",
        patientName: "Anita Sharma",
        patientId: "2",
        date: "2024-01-26",
        time: "10:30",
        type: "Emergency",
        status: "urgent",
        duration: "45 min",
        notes: "Acute asthma exacerbation"
    },
    {
        id: "3",
        patientName: "John Doe",
        patientId: "3",
        date: "2024-01-26",
        time: "14:00",
        type: "Consultation",
        status: "confirmed",
        duration: "60 min",
        notes: "ILD progression assessment"
    },
    {
        id: "4",
        patientName: "Priya Singh",
        patientId: "4",
        date: "2024-01-27",
        time: "11:00",
        type: "Follow-up",
        status: "pending",
        duration: "30 min",
        notes: "Bronchiectasis treatment review"
    },
    {
        id: "5",
        patientName: "Michael Brown",
        patientId: "5",
        date: "2024-01-27",
        time: "15:30",
        type: "Check-up",
        status: "confirmed",
        duration: "45 min",
        notes: "Post-ICU recovery assessment"
    },
    {
        id: "6",
        patientName: "Sarah Wilson",
        patientId: "6",
        date: "2024-01-28",
        time: "10:00",
        type: "New Patient",
        status: "confirmed",
        duration: "60 min",
        notes: "Initial consultation for chronic cough"
    }
]

const statusColors = {
    confirmed: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    urgent: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800"
}

const typeColors = {
    "Follow-up": "bg-blue-100 text-blue-800",
    "Emergency": "bg-red-100 text-red-800",
    "Consultation": "bg-purple-100 text-purple-800",
    "Check-up": "bg-green-100 text-green-800",
    "New Patient": "bg-orange-100 text-orange-800"
}

export default async function AppointmentsPage({
    params,
}: {
    params: Promise<{ doctorId: string }>
}) {
    const { doctorId } = await params

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Appointments</h1>
                <div className="space-x-2">
                    <Button variant="outline">View Calendar</Button>
                    <Button>Schedule New</Button>
                </div>
            </div>

            {/* Appointment Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="p-4">
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-blue-600">8</h3>
                        <p className="text-sm text-gray-600">Today's Appointments</p>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-green-600">15</h3>
                        <p className="text-sm text-gray-600">This Week</p>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-orange-600">2</h3>
                        <p className="text-sm text-gray-600">Pending Confirmation</p>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-red-600">1</h3>
                        <p className="text-sm text-gray-600">Urgent</p>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <Input placeholder="Search appointments..." className="max-w-sm" />

                <Select>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by Date" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="tomorrow">Tomorrow</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                </Select>

                <Select>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                </Select>

                <Select>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="followup">Follow-up</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="consultation">Consultation</SelectItem>
                        <SelectItem value="checkup">Check-up</SelectItem>
                        <SelectItem value="new">New Patient</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Appointments List */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Upcoming Appointments</h3>

                <div className="space-y-3">
                    {appointments.map((appointment) => (
                        <Card key={appointment.id} className="p-4">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="font-semibold text-lg">{appointment.patientName}</h4>
                                        <Badge className={statusColors[appointment.status as keyof typeof statusColors]}>
                                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                        </Badge>
                                        <Badge variant="outline" className={typeColors[appointment.type as keyof typeof typeColors]}>
                                            {appointment.type}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                        <div>
                                            <span className="font-medium">Date & Time:</span><br />
                                            {appointment.date} at {appointment.time}
                                        </div>
                                        <div>
                                            <span className="font-medium">Duration:</span><br />
                                            {appointment.duration}
                                        </div>
                                        <div>
                                            <span className="font-medium">Notes:</span><br />
                                            {appointment.notes}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col space-y-2">
                                    <Button variant="outline" size="sm">
                                        View Patient
                                    </Button>
                                    <Button variant="outline" size="sm">
                                        Reschedule
                                    </Button>
                                    {appointment.status === 'pending' && (
                                        <Button size="sm">
                                            Confirm
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <Card className="p-6 mt-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Button variant="outline" className="h-16 flex flex-col">
                        <span className="font-medium">Emergency Slot</span>
                        <span className="text-xs text-gray-500">Add urgent appointment</span>
                    </Button>

                    <Button variant="outline" className="h-16 flex flex-col">
                        <span className="font-medium">Block Time</span>
                        <span className="text-xs text-gray-500">Reserve time slot</span>
                    </Button>

                    <Button variant="outline" className="h-16 flex flex-col">
                        <span className="font-medium">Send Reminders</span>
                        <span className="text-xs text-gray-500">Notify patients</span>
                    </Button>

                    <Button variant="outline" className="h-16 flex flex-col">
                        <span className="font-medium">View Calendar</span>
                        <span className="text-xs text-gray-500">Monthly view</span>
                    </Button>
                </div>
            </Card>
        </>
    )
}