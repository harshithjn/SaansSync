import { api } from './api'
import { DoctorProfile } from './monitoring-types'
import { notifyAuthChange } from './auth-events'

export async function completeDoctorRegistration(
    phone: string,
    token: string,
    email: string,
    fullName: string,
    password: string,
    altPhone?: string
) {
    try {
        const result = await api.post<{ success: boolean; error?: string; doctorProfile?: DoctorProfile }>(
            '/auth/doctor/complete-registration',
            { phone, token, email, fullName, password, altPhone }
        )
        if (result?.success) notifyAuthChange()
        return result
    } catch (error) {
        return { success: false, error: (error as Error).message }
    }
}
