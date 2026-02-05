"use client"

import PatientChat from "@/components/patient/PatientChat"

export default function PatientMessagesPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>
            <PatientChat />
        </div>
    )
}
