import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"

const exportHistory = [
    {
        id: "1",
        type: "Patient Data",
        format: "CSV",
        date: "2024-01-25",
        size: "2.4 MB",
        status: "Completed"
    },
    {
        id: "2",
        type: "Analytics Report",
        format: "PDF",
        date: "2024-01-20",
        size: "1.8 MB",
        status: "Completed"
    },
    {
        id: "3",
        type: "Alert History",
        format: "Excel",
        date: "2024-01-15",
        size: "856 KB",
        status: "Completed"
    },
    {
        id: "4",
        type: "Appointment Data",
        format: "CSV",
        date: "2024-01-10",
        size: "1.2 MB",
        status: "Completed"
    }
]

export default async function ExportPage({
    params,
}: {
    params: Promise<{ doctorId: string }>
}) {
    const { doctorId } = await params

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Export Data</h1>
                <Button variant="outline">Schedule Export</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Export Configuration */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Create New Export</h3>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Export Type</label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select data type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="patients">Patient Data</SelectItem>
                                    <SelectItem value="analytics">Analytics Report</SelectItem>
                                    <SelectItem value="alerts">Alert History</SelectItem>
                                    <SelectItem value="appointments">Appointment Data</SelectItem>
                                    <SelectItem value="medications">Medication Records</SelectItem>
                                    <SelectItem value="all">Complete Database</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">File Format</label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select format" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="csv">CSV</SelectItem>
                                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                                    <SelectItem value="pdf">PDF Report</SelectItem>
                                    <SelectItem value="json">JSON</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Date Range</label>
                            <div className="grid grid-cols-2 gap-2">
                                <Input type="date" defaultValue="2024-01-01" />
                                <Input type="date" defaultValue="2024-01-25" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium">Include Fields</label>

                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="personal-info" defaultChecked />
                                    <label htmlFor="personal-info" className="text-sm">Personal Information</label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox id="medical-history" defaultChecked />
                                    <label htmlFor="medical-history" className="text-sm">Medical History</label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox id="vital-signs" defaultChecked />
                                    <label htmlFor="vital-signs" className="text-sm">Vital Signs</label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox id="medications" />
                                    <label htmlFor="medications" className="text-sm">Medications</label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox id="test-results" />
                                    <label htmlFor="test-results" className="text-sm">Test Results</label>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Filter by Risk Level</label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="All patients" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Patients</SelectItem>
                                    <SelectItem value="high">High Risk Only</SelectItem>
                                    <SelectItem value="medium">Medium Risk Only</SelectItem>
                                    <SelectItem value="low">Low Risk Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button className="w-full">Generate Export</Button>
                    </div>
                </Card>

                {/* Export History */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Export History</h3>

                    <div className="space-y-3">
                        {exportHistory.map((export_item) => (
                            <div key={export_item.id} className="flex justify-between items-center p-3 border rounded-lg">
                                <div>
                                    <p className="font-medium">{export_item.type}</p>
                                    <p className="text-sm text-gray-500">
                                        {export_item.format} • {export_item.date} • {export_item.size}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                        {export_item.status}
                                    </span>
                                    <Button variant="outline" size="sm">
                                        Download
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Quick Export Options */}
                <Card className="p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-4">Quick Export Options</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button variant="outline" className="h-20 flex flex-col">
                            <span className="font-medium">Patient Summary</span>
                            <span className="text-xs text-gray-500">PDF Report</span>
                        </Button>

                        <Button variant="outline" className="h-20 flex flex-col">
                            <span className="font-medium">Monthly Analytics</span>
                            <span className="text-xs text-gray-500">Excel Format</span>
                        </Button>

                        <Button variant="outline" className="h-20 flex flex-col">
                            <span className="font-medium">Alert History</span>
                            <span className="text-xs text-gray-500">CSV Format</span>
                        </Button>

                        <Button variant="outline" className="h-20 flex flex-col">
                            <span className="font-medium">High Risk Patients</span>
                            <span className="text-xs text-gray-500">PDF Report</span>
                        </Button>

                        <Button variant="outline" className="h-20 flex flex-col">
                            <span className="font-medium">Medication List</span>
                            <span className="text-xs text-gray-500">Excel Format</span>
                        </Button>

                        <Button variant="outline" className="h-20 flex flex-col">
                            <span className="font-medium">Complete Backup</span>
                            <span className="text-xs text-gray-500">JSON Format</span>
                        </Button>
                    </div>
                </Card>
            </div>
        </>
    )
}