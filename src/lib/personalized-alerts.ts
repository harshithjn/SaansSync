// Personalized Alerts Management System
import { PersonalizedAlert } from './patient-types'

const PERSONALIZED_ALERTS_STORAGE_KEY = 'personalized_alerts'

// Store personalized alerts for a patient
export function storePersonalizedAlerts(patientId: string, alerts: PersonalizedAlert[]): void {
    if (typeof window === 'undefined') return

    try {
        const stored = localStorage.getItem(PERSONALIZED_ALERTS_STORAGE_KEY)
        const allAlerts: { [patientId: string]: PersonalizedAlert[] } = stored ? JSON.parse(stored) : {}

        allAlerts[patientId] = alerts
        localStorage.setItem(PERSONALIZED_ALERTS_STORAGE_KEY, JSON.stringify(allAlerts))
    } catch (error) {
        console.error('Error storing personalized alerts:', error)
    }
}

// Get personalized alerts for a patient
export function getPersonalizedAlerts(patientId: string): PersonalizedAlert[] {
    if (typeof window === 'undefined') return []

    try {
        const stored = localStorage.getItem(PERSONALIZED_ALERTS_STORAGE_KEY)
        const allAlerts: { [patientId: string]: PersonalizedAlert[] } = stored ? JSON.parse(stored) : {}

        return allAlerts[patientId] || []
    } catch (error) {
        console.error('Error getting personalized alerts:', error)
        return []
    }
}

// Add a personalized alert for a patient
export function addPersonalizedAlert(patientId: string, alert: PersonalizedAlert): void {
    const existingAlerts = getPersonalizedAlerts(patientId)
    existingAlerts.push(alert)
    storePersonalizedAlerts(patientId, existingAlerts)
}

// Update a personalized alert
export function updatePersonalizedAlert(patientId: string, alertId: string, updatedAlert: Partial<PersonalizedAlert>): void {
    const existingAlerts = getPersonalizedAlerts(patientId)
    const alertIndex = existingAlerts.findIndex(alert => alert.id === alertId)

    if (alertIndex >= 0) {
        existingAlerts[alertIndex] = { ...existingAlerts[alertIndex], ...updatedAlert }
        storePersonalizedAlerts(patientId, existingAlerts)
    }
}

// Remove a personalized alert
export function removePersonalizedAlert(patientId: string, alertId: string): void {
    const existingAlerts = getPersonalizedAlerts(patientId)
    const filteredAlerts = existingAlerts.filter(alert => alert.id !== alertId)
    storePersonalizedAlerts(patientId, filteredAlerts)
}

// Get active personalized alerts for a patient
export function getActivePersonalizedAlerts(patientId: string): PersonalizedAlert[] {
    const alerts = getPersonalizedAlerts(patientId)
    return alerts.filter(alert => alert.isActive)
}

// Format alert for display in patient dashboard
export function formatAlertForDisplay(alert: PersonalizedAlert): string {
    let displayText = alert.name

    if (alert.type !== 'custom') {
        // Use the predefined name for non-custom alerts
        const alertTypeConfig = {
            'pulmonary-rehabilitation': 'Pulmonary Rehabilitation',
            'chest-physiotherapy': 'Chest Physiotherapy',
            'suctioning': 'Suctioning'
        }
        displayText = alertTypeConfig[alert.type as keyof typeof alertTypeConfig] || alert.name
    }

    displayText += ` - ${alert.frequency}`

    if (alert.interval) {
        displayText += ` ${alert.interval}`
    }

    return displayText
}

// Check if it's time for an alert (basic implementation)
export function shouldShowAlert(alert: PersonalizedAlert): boolean {
    if (!alert.isActive) return false

    // This is a basic implementation - in a real app, you'd have more sophisticated timing logic
    const now = new Date()
    const hour = now.getHours()

    // Simple logic based on frequency
    if (alert.frequency.includes('1 time a day')) {
        return hour === 9 // Show at 9 AM
    } else if (alert.frequency.includes('2 times a day')) {
        return hour === 9 || hour === 18 // Show at 9 AM and 6 PM
    } else if (alert.frequency.includes('3 times a day')) {
        return hour === 9 || hour === 14 || hour === 19 // Show at 9 AM, 2 PM, and 7 PM
    } else if (alert.frequency.includes('4 times a day')) {
        return hour === 8 || hour === 12 || hour === 16 || hour === 20 // Show every 4 hours
    }

    // For interval-based alerts
    if (alert.interval) {
        if (alert.interval.includes('every 6 hours')) {
            return hour % 6 === 0
        } else if (alert.interval.includes('every 4 hours')) {
            return hour % 4 === 0
        } else if (alert.interval.includes('every 8 hours')) {
            return hour % 8 === 0
        } else if (alert.interval.includes('every 12 hours')) {
            return hour % 12 === 0
        }
    }

    return false
}

// Get alerts that should be shown now
export function getCurrentAlerts(patientId: string): PersonalizedAlert[] {
    const activeAlerts = getActivePersonalizedAlerts(patientId)
    return activeAlerts.filter(alert => shouldShowAlert(alert))
}

// Initialize default medication alert for all patients
export function initializeDefaultMedicationAlert(patientId: string): void {
    const existingAlerts = getPersonalizedAlerts(patientId)

    // Check if medication alert already exists
    const hasMedicationAlert = existingAlerts.some(alert =>
        alert.name.toLowerCase().includes('medication') ||
        alert.type === 'custom' && alert.name.toLowerCase().includes('medication')
    )

    if (!hasMedicationAlert) {
        const defaultMedicationAlert: PersonalizedAlert = {
            id: `medication-alert-${Date.now()}`,
            type: 'custom',
            name: 'Medication Reminder',
            frequency: '2 times a day',
            interval: 'every 12 hours',
            instructions: 'Take your prescribed medications as directed',
            isActive: true
        }

        addPersonalizedAlert(patientId, defaultMedicationAlert)
    }
}