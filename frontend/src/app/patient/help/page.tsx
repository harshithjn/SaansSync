"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"

export default function PatientHelpPage() {
    const handleContactClick = (method: string) => {
        switch (method) {
            case 'phone':
                window.location.href = 'tel:+1-555-123-4567'
                break
            case 'email':
                window.location.href = 'mailto:support@clinic.com'
                break
            default:
                toast.info(`Contact via ${method}`)
        }
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Help & Contact</h1>
                <p className="text-gray-600">
                    Get help with your patient portal or contact your healthcare team
                </p>
            </div>

            {/* Emergency Contact */}
            <Card className="p-6 border-red-200 bg-red-50">
                <h2 className="text-lg font-semibold mb-4 text-red-600">🚨 Emergency Contact</h2>
                <div className="space-y-3">
                    <p className="text-red-800 font-medium">
                        If you are experiencing a medical emergency, call 911 immediately.
                    </p>
                    <div className="p-3 bg-red-100 rounded-lg">
                        <p className="text-sm text-red-700">
                            <strong>Emergency situations include:</strong> Severe difficulty breathing, chest pain,
                            loss of consciousness, severe allergic reactions, or any life-threatening symptoms.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Contact Your Healthcare Team */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-blue-600">📞 Contact Your Healthcare Team</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-medium text-blue-800 mb-2">Clinic Phone</h3>
                        <p className="text-blue-700 mb-2">+1 (555) 123-4567</p>
                        <p className="text-sm text-blue-600 mb-3">
                            Monday - Friday: 8:00 AM - 5:00 PM<br />
                            Saturday: 9:00 AM - 1:00 PM
                        </p>
                        <Button
                            onClick={() => handleContactClick('phone')}
                            className="w-full"
                        >
                            Call Now
                        </Button>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                        <h3 className="font-medium text-green-800 mb-2">Email Support</h3>
                        <p className="text-green-700 mb-2">support@clinic.com</p>
                        <p className="text-sm text-green-600 mb-3">
                            Response within 24-48 hours<br />
                            For non-urgent questions only
                        </p>
                        <Button
                            onClick={() => handleContactClick('email')}
                            variant="outline"
                            className="w-full"
                        >
                            Send Email
                        </Button>
                    </div>
                </div>
            </Card>

            {/* After Hours Care */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-orange-600">🌙 After Hours Care</h2>
                <div className="p-4 bg-orange-50 rounded-lg">
                    <h3 className="font-medium text-orange-800 mb-2">Urgent Care Line</h3>
                    <p className="text-orange-700 mb-2">+1 (555) 123-4568</p>
                    <p className="text-sm text-orange-600 mb-3">
                        Available: Evenings, weekends, and holidays<br />
                        For urgent (but not emergency) medical concerns
                    </p>
                    <div className="text-sm text-orange-700">
                        <p className="font-medium mb-1">Use for:</p>
                        <ul className="space-y-1">
                            <li>• Worsening symptoms that can't wait until morning</li>
                            <li>• Questions about medications</li>
                            <li>• Fever or signs of infection</li>
                            <li>• Increased shortness of breath</li>
                        </ul>
                    </div>
                </div>
            </Card>

            {/* Frequently Asked Questions */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-purple-600">❓ Frequently Asked Questions</h2>
                <div className="space-y-4">
                    <div className="p-4 bg-purple-50 rounded-lg">
                        <h3 className="font-medium text-purple-800 mb-2">How do I request prescription refills?</h3>
                        <p className="text-sm text-purple-700">
                            Call our clinic at least 48 hours before you run out of medication. Have your
                            prescription bottle ready with the medication name and dosage.
                        </p>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg">
                        <h3 className="font-medium text-purple-800 mb-2">How do I schedule an appointment?</h3>
                        <p className="text-sm text-purple-700">
                            Call our clinic during business hours. We'll work with you to find a convenient
                            appointment time that fits your schedule.
                        </p>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg">
                        <h3 className="font-medium text-purple-800 mb-2">Can I get my test results online?</h3>
                        <p className="text-sm text-purple-700">
                            Yes! Your test results are available in the "My Reports" section of this portal.
                            You'll receive an email notification when new results are available.
                        </p>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg">
                        <h3 className="font-medium text-purple-800 mb-2">What if I forget my password?</h3>
                        <p className="text-sm text-purple-700">
                            Contact our clinic and we can help reset your password. You'll need to verify
                            your identity with personal information.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Using Your Patient Portal */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-indigo-600">💻 Using Your Patient Portal</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <h3 className="font-medium text-indigo-800">Dashboard Features</h3>
                        <ul className="text-sm text-indigo-700 space-y-1">
                            <li>• View your diagnosis and treatment plan</li>
                            <li>• See current medications and instructions</li>
                            <li>• Review latest test results</li>
                            <li>• Track your health progress</li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <h3 className="font-medium text-indigo-800">Reports & Records</h3>
                        <ul className="text-sm text-indigo-700 space-y-1">
                            <li>• Download test results and reports</li>
                            <li>• View prescription history</li>
                            <li>• Access lab and imaging results</li>
                            <li>• Print records for other doctors</li>
                        </ul>
                    </div>
                </div>
            </Card>

            {/* Technical Support */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-600">🔧 Technical Support</h2>
                <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-800 mb-2">Having trouble with the portal?</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                        <p><strong>Common solutions:</strong></p>
                        <ul className="space-y-1 ml-4">
                            <li>• Try refreshing your browser page</li>
                            <li>• Clear your browser cache and cookies</li>
                            <li>• Make sure you're using a supported browser (Chrome, Firefox, Safari, Edge)</li>
                            <li>• Check your internet connection</li>
                        </ul>
                        <p className="mt-3">
                            <strong>Still having issues?</strong> Call our technical support line at
                            <span className="font-medium"> +1 (555) 123-4569</span> or email
                            <span className="font-medium"> tech-support@clinic.com</span>
                        </p>
                    </div>
                </div>
            </Card>

            {/* Privacy & Security */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-green-600">🔒 Privacy & Security</h2>
                <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                        <h3 className="font-medium text-green-800 mb-2">Your Information is Protected</h3>
                        <p className="text-sm text-green-700">
                            This patient portal uses secure, encrypted connections to protect your health information.
                            We follow all HIPAA privacy regulations to keep your data safe.
                        </p>
                    </div>

                    <div className="p-4 bg-yellow-50 rounded-lg">
                        <h3 className="font-medium text-yellow-800 mb-2">Keep Your Account Secure</h3>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            <li>• Don't share your login credentials with anyone</li>
                            <li>• Always log out when finished</li>
                            <li>• Use a secure internet connection</li>
                            <li>• Contact us immediately if you suspect unauthorized access</li>
                        </ul>
                    </div>
                </div>
            </Card>

            {/* Feedback */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-pink-600">💬 Feedback</h2>
                <div className="p-4 bg-pink-50 rounded-lg">
                    <h3 className="font-medium text-pink-800 mb-2">Help Us Improve</h3>
                    <p className="text-sm text-pink-700 mb-3">
                        We value your feedback about this patient portal. Your suggestions help us provide
                        better care and improve your experience.
                    </p>
                    <Button
                        onClick={() => handleContactClick('feedback')}
                        variant="outline"
                        className="border-pink-300 text-pink-700 hover:bg-pink-100"
                    >
                        Send Feedback
                    </Button>
                </div>
            </Card>
        </div>
    )
}