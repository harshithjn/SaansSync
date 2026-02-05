"use client"

import DoctorMessages from "@/components/doctor/DoctorMessages"

export default function DoctorMessagesPage() {
    return (
        <div className="bg-gray-50 min-h-full">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Patient Messages</h1>
            <DoctorMessages />
        </div>
    )
}
