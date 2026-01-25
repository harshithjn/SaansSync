import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const analyticsData = {
    patientOutcomes: [
        { disease: "COPD", improved: 12, stable: 8, declined: 2 },
        { disease: "Asthma", improved: 15, stable: 5, declined: 1 },
        { disease: "ILD", improved: 6, stable: 4, declined: 3 },
        { disease: "Bronchiectasis", improved: 8, stable: 6, declined: 1 },
    ],
    monthlyStats: [
        { month: "Jan 2024", newPatients: 8, totalVisits: 45, emergencies: 3 },
        { month: "Dec 2023", newPatients: 6, totalVisits: 42, emergencies: 2 },
        { month: "Nov 2023", newPatients: 10, totalVisits: 48, emergencies: 4 },
        { month: "Oct 2023", newPatients: 7, totalVisits: 38, emergencies: 1 },
    ],
    riskDistribution: {
        high: 8,
        medium: 12,
        low: 15
    }
}

export default async function AnalyticsPage({
    params,
}: {
    params: Promise<{ doctorId: string }>
}) {
    const { doctorId } = await params

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Analytics & Reports</h1>
                <div className="space-x-2">
                    <Select>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Time Period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="week">Last Week</SelectItem>
                            <SelectItem value="month">Last Month</SelectItem>
                            <SelectItem value="quarter">Last Quarter</SelectItem>
                            <SelectItem value="year">Last Year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button>Export Report</Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="p-4">
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-green-600">89%</h3>
                        <p className="text-sm text-gray-600">Patient Satisfaction</p>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-blue-600">76%</h3>
                        <p className="text-sm text-gray-600">Treatment Success Rate</p>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-purple-600">4.2</h3>
                        <p className="text-sm text-gray-600">Avg. Visits per Patient</p>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-orange-600">12</h3>
                        <p className="text-sm text-gray-600">Emergency Cases</p>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Patient Outcomes by Disease */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Patient Outcomes by Disease</h3>
                    <div className="space-y-4">
                        {analyticsData.patientOutcomes.map((outcome) => (
                            <div key={outcome.disease} className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="font-medium">{outcome.disease}</span>
                                    <span className="text-sm text-gray-500">
                                        Total: {outcome.improved + outcome.stable + outcome.declined}
                                    </span>
                                </div>
                                <div className="flex space-x-1 h-4">
                                    <div
                                        className="bg-green-500 rounded-l"
                                        style={{ width: `${(outcome.improved / (outcome.improved + outcome.stable + outcome.declined)) * 100}%` }}
                                    />
                                    <div
                                        className="bg-yellow-400"
                                        style={{ width: `${(outcome.stable / (outcome.improved + outcome.stable + outcome.declined)) * 100}%` }}
                                    />
                                    <div
                                        className="bg-red-500 rounded-r"
                                        style={{ width: `${(outcome.declined / (outcome.improved + outcome.stable + outcome.declined)) * 100}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Improved: {outcome.improved}</span>
                                    <span>Stable: {outcome.stable}</span>
                                    <span>Declined: {outcome.declined}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Risk Distribution */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Patient Risk Distribution</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-red-600 font-medium">High Risk</span>
                            <span className="text-2xl font-bold text-red-600">{analyticsData.riskDistribution.high}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div className="bg-red-500 h-3 rounded-full" style={{ width: `${(analyticsData.riskDistribution.high / 35) * 100}%` }}></div>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-yellow-600 font-medium">Medium Risk</span>
                            <span className="text-2xl font-bold text-yellow-600">{analyticsData.riskDistribution.medium}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div className="bg-yellow-400 h-3 rounded-full" style={{ width: `${(analyticsData.riskDistribution.medium / 35) * 100}%` }}></div>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-green-600 font-medium">Low Risk</span>
                            <span className="text-2xl font-bold text-green-600">{analyticsData.riskDistribution.low}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div className="bg-green-500 h-3 rounded-full" style={{ width: `${(analyticsData.riskDistribution.low / 35) * 100}%` }}></div>
                        </div>
                    </div>
                </Card>

                {/* Monthly Statistics */}
                <Card className="p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-4">Monthly Statistics</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2">Month</th>
                                    <th className="text-left py-2">New Patients</th>
                                    <th className="text-left py-2">Total Visits</th>
                                    <th className="text-left py-2">Emergency Cases</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analyticsData.monthlyStats.map((stat) => (
                                    <tr key={stat.month} className="border-b">
                                        <td className="py-2 font-medium">{stat.month}</td>
                                        <td className="py-2">{stat.newPatients}</td>
                                        <td className="py-2">{stat.totalVisits}</td>
                                        <td className="py-2">
                                            <span className={`px-2 py-1 rounded text-sm ${stat.emergencies > 3 ? 'bg-red-100 text-red-800' :
                                                    stat.emergencies > 1 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-green-100 text-green-800'
                                                }`}>
                                                {stat.emergencies}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </>
    )
}