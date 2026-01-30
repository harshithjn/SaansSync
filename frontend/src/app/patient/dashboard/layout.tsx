"use client"

import { ReactNode } from "react"
import { LanguageProvider, LanguageToggle } from "@/lib/language-context"

export default function PatientDashboardLayout({
    children,
}: {
    children: ReactNode
}) {
    return (
        <LanguageProvider>
            <div className="flex justify-end p-2 border-b bg-gray-50">
                <LanguageToggle />
            </div>
            {children}
        </LanguageProvider>
    )
}

// Helper function to get dashboard slug from diagnosis category
function getDashboardSlug(category: string): string {
    switch (category) {
        case "Interstitial Lung Disease (ILD)":
            return "ild"
        case "Bronchial Asthma":
            return "asthma"
        case "COPD (Chronic Obstructive Pulmonary Disease)":
            return "oad"
        case "Obstructive Airway Disease (OAD)":
            return "oad"
        case "Bronchiectasis":
            return "bronchiectasis"
        case "Post ICU Recovery":
            return "post-icu"
        default:
            return "ild" // Default to ILD dashboard
    }
}