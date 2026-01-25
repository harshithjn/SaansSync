"use client"

import { ReactNode } from "react"

export default function PatientDashboardLayout({
    children,
}: {
    children: ReactNode
}) {
    return <>{children}</>
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