"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { debugPatientPhoneNumbers, findPatientByPhone } from "@/lib/auth-service"
import { supabase } from "@/lib/supabase"

export default function DebugPhonePage() {
    const [phoneInput, setPhoneInput] = useState("")
    const [searchResult, setSearchResult] = useState<any>(null)
    const [allPatients, setAllPatients] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    const loadAllPatients = async () => {
        setLoading(true)
        try {
            const { data: patients, error } = await supabase
                .from('patients')
                .select('id, phone, full_name, email, created_at')
                .order('created_at', { ascending: false })
                .limit(20)
            
            if (error) {
                console.error('Error loading patients:', error)
            } else {
                setAllPatients(patients || [])
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = async () => {
        if (!phoneInput.trim()) return
        
        setLoading(true)
        try {
            const result = await findPatientByPhone(phoneInput)
            setSearchResult(result)
        } catch (error) {
            console.error('Search error:', error)
        } finally {
            setLoading(false)
        }
    }

    const runDebug = async () => {
        await debugPatientPhoneNumbers()
        await loadAllPatients()
    }

    useEffect(() => {
        loadAllPatients()
    }, [])

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <Card className="p-6">
                    <h1 className="text-2xl font-bold mb-4">Phone Number Debug Tool</h1>
                    
                    <div className="space-y-4">
                        <Button onClick={runDebug} disabled={loading}>
                            {loading ? 'Loading...' : 'Run Debug & Refresh'}
                        </Button>
                        
                        <div className="flex gap-2">
                            <Input
                                value={phoneInput}
                                onChange={(e) => setPhoneInput(e.target.value)}
                                placeholder="Enter phone number to search"
                                className="flex-1"
                            />
                            <Button onClick={handleSearch} disabled={loading || !phoneInput.trim()}>
                                Search
                            </Button>
                        </div>
                        
                        {searchResult && (
                            <Card className="p-4">
                                <h3 className="font-semibold mb-2">Search Result:</h3>
                                <pre className="text-sm bg-gray-100 p-2 rounded">
                                    {JSON.stringify(searchResult, null, 2)}
                                </pre>
                            </Card>
                        )}
                    </div>
                </Card>

                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">All Patients ({allPatients.length})</h2>
                    
                    {allPatients.length === 0 ? (
                        <p className="text-gray-500">No patients found in database</p>
                    ) : (
                        <div className="space-y-3">
                            {allPatients.map((patient, index) => (
                                <div key={patient.id} className="border rounded p-3 bg-white">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                        <div>
                                            <strong>Name:</strong><br />
                                            {patient.full_name || 'No name'}
                                        </div>
                                        <div>
                                            <strong>Phone:</strong><br />
                                            <code className="bg-yellow-100 px-1 rounded">
                                                "{patient.phone}"
                                            </code><br />
                                            <span className="text-xs text-gray-500">
                                                Length: {patient.phone?.length || 0}
                                            </span>
                                        </div>
                                        <div>
                                            <strong>Email:</strong><br />
                                            {patient.email || 'No email'}
                                        </div>
                                        <div>
                                            <strong>Created:</strong><br />
                                            <span className="text-xs">
                                                {new Date(patient.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setPhoneInput(patient.phone || '')
                                                handleSearch()
                                            }}
                                        >
                                            Test This Phone
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    )
}