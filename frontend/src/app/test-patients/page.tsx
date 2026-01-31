"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export default function TestPatientsPage() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Test Patients Page</h1>
            
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
                <p><strong>Notice:</strong> This test page has been disabled in production mode.</p>
                <p>Patient data is now managed through the production database system.</p>
            </div>

            <div className="bg-gray-100 p-4 rounded">
                <h2 className="text-lg font-semibold mb-2">Production Mode</h2>
                <p>Patient data is now stored in the Supabase database and managed through the proper authentication system.</p>
                <p>Use the doctor dashboard to view and manage patients.</p>
            </div>
        </div>
    )
}