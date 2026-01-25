import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function SettingsPage({
    params,
}: {
    params: Promise<{ doctorId: string }>
}) {
    const { doctorId } = await params

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Settings</h1>
                <Button>Save All Changes</Button>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="alerts">Alert Settings</TabsTrigger>
                    <TabsTrigger value="system">System</TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Doctor Profile</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Full Name</label>
                                <Input defaultValue="Dr. Sarah Johnson" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Medical License</label>
                                <Input defaultValue="MD-12345-2024" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Specialization</label>
                                <Select defaultValue="pulmonology">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pulmonology">Pulmonology</SelectItem>
                                        <SelectItem value="cardiology">Cardiology</SelectItem>
                                        <SelectItem value="internal">Internal Medicine</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Hospital/Clinic</label>
                                <Input defaultValue="City General Hospital" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Phone</label>
                                <Input defaultValue="+1 (555) 123-4567" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input defaultValue="dr.johnson@hospital.com" />
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="email-alerts" defaultChecked />
                                <label htmlFor="email-alerts" className="text-sm font-medium">
                                    Email notifications for critical alerts
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox id="sms-alerts" defaultChecked />
                                <label htmlFor="sms-alerts" className="text-sm font-medium">
                                    SMS notifications for emergencies
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox id="app-notifications" defaultChecked />
                                <label htmlFor="app-notifications" className="text-sm font-medium">
                                    In-app notifications
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox id="daily-summary" />
                                <label htmlFor="daily-summary" className="text-sm font-medium">
                                    Daily patient summary email
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox id="appointment-reminders" defaultChecked />
                                <label htmlFor="appointment-reminders" className="text-sm font-medium">
                                    Appointment reminders
                                </label>
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="alerts">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Alert Thresholds</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h4 className="font-medium text-red-600">Critical Alerts</h4>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">SpO2 Critical Level (%)</label>
                                    <Input type="number" defaultValue="85" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Heart Rate Critical (bpm)</label>
                                    <Input type="number" defaultValue="120" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Blood Pressure Systolic</label>
                                    <Input type="number" defaultValue="180" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-medium text-yellow-600">Warning Alerts</h4>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">SpO2 Warning Level (%)</label>
                                    <Input type="number" defaultValue="90" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Missed Medication (hours)</label>
                                    <Input type="number" defaultValue="2" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Overdue Checkup (days)</label>
                                    <Input type="number" defaultValue="30" />
                                </div>
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="system">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">System Preferences</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Time Zone</label>
                                <Select defaultValue="est">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="est">Eastern Standard Time</SelectItem>
                                        <SelectItem value="cst">Central Standard Time</SelectItem>
                                        <SelectItem value="mst">Mountain Standard Time</SelectItem>
                                        <SelectItem value="pst">Pacific Standard Time</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Date Format</label>
                                <Select defaultValue="mdy">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                                        <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                                        <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Language</label>
                                <Select defaultValue="en">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="en">English</SelectItem>
                                        <SelectItem value="es">Spanish</SelectItem>
                                        <SelectItem value="fr">French</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox id="auto-backup" defaultChecked />
                                <label htmlFor="auto-backup" className="text-sm font-medium">
                                    Enable automatic data backup
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox id="analytics-tracking" />
                                <label htmlFor="analytics-tracking" className="text-sm font-medium">
                                    Allow anonymous usage analytics
                                </label>
                            </div>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </>
    )
}