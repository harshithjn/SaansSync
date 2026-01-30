"use client"

import { useEffect, useState } from 'react'
import { getStoredPatients, initializeDemoPatients, forceInitializeDemoPatients } from '@/lib/patient-storage'
import { Button } from '@/components/ui/button'

export default function TestPatientsPage() {
    const [patients, setPatients] = useState<any[]>([])

    const loadPatients = () => {
        const storedPatients = getStoredPatients()
        setPatients(storedPatients)
        console.log('Loaded patients:', storedPatients)
    }

    useEffect(() => {
        initializeDemoPatients()
        setTimeout(loadPatients, 1000)
    }, [])

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Test Patients Page</h1>
            
            <div className="space-x-4 mb-6">
                <Button onClick={loadPatients}>Reload Patients</Button>
                <Button onClick={() => {
                    initializeDemoPatients()
                    setTimeout(loadPatients, 1000)
                }}>Initialize Demo Patients</Button>
                <Button onClick={() => {
                    forceInitializeDemoPatients()
                    setTimeout(loadPatients, 1000)
                }} variant="destructive">Force Reset Patients</Button>
            </div>

            <div className="bg-gray-100 p-4 rounded">
                <h2 className="text-lg font-semibold mb-2">Stored Patients ({patients.length})</h2>
                {patients.length === 0 ? (
                    <p>No patients found</p>
                ) : (
                    <div className="space-y-2">
                        {patients.map((patient, index) => (
                            <div key={index} className="bg-white p-3 rounded border">
                                <p><strong>Name:</strong> {patient.patientData.fullName}</p>
                                <p><strong>Mobile:</strong> {patient.patientData.mobileNumber}</p>
                                <p><strong>Email:</strong> {patient.patientData.emailId}</p>
                                <p><strong>Diagnosis:</strong> {patient.patientData.diagnosis.primaryCategory}</p>
                                <p><strong>Patient ID:</strong> {patient.credentials.patientId}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}