import { AQIData } from './monitoring-types'

const WAQI_API_TOKEN = '0b5abce79114d01bd0dff0b54cc84e1ba35cc22d'
const WAQI_BASE_URL = 'https://api.waqi.info'

interface LocationCoords {
    latitude: number
    longitude: number
    timestamp: string
}

interface OpenWeatherAQIResponse {
    coord: {
        lon: number
        lat: number
    }
    list: [{
        main: {
            aqi: number
        }
        components: {
            co: number
            no: number
            no2: number
            o3: number
            so2: number
            pm2_5: number
            pm10: number
            nh3: number
        }
        dt: number
    }]
}

interface WAQIResponse {
    status: string
    data: {
        aqi: number
        idx: number
        city: {
            name: string
            geo: [number, number]
        }
        iaqi: {
            pm25?: { v: number }
            pm10?: { v: number }
        }
        time: {
            s: string
        }
    }
}

const LOCATION_STORAGE_KEY = 'patient_location_data'
const AQI_CACHE_KEY = 'aqi_cache_data'
const CACHE_DURATION = 30 * 60 * 1000

export async function requestLocationPermission(): Promise<LocationCoords | null> {
    if (typeof window === 'undefined' || !navigator.geolocation) {
        console.info('Geolocation not supported by this browser')
        return null
    }

    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords: LocationCoords = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    timestamp: new Date().toISOString()
                }

                localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(coords))
                console.info('Location access granted, using precise AQI data')
                resolve(coords)
            },
            (error) => {

                let errorMessage = 'Location access not available'
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location access denied by user - using general area data'
                        break
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information unavailable - using general area data'
                        break
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out - using general area data'
                        break
                }

                console.info(errorMessage)
                resolve(null)
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        )
    })
}

export function getStoredLocation(): LocationCoords | null {
    if (typeof window === 'undefined') return null

    try {
        const stored = localStorage.getItem(LOCATION_STORAGE_KEY)
        return stored ? JSON.parse(stored) : null
    } catch (error) {
        console.error('Error reading stored location:', error)
        return null
    }
}

export async function fetchRealTimeAQI(coords?: LocationCoords): Promise<AQIData> {
    try {

        const cached = getCachedAQI()
        if (cached && !shouldRefreshAQI(cached.fetchedAt)) {
            return cached
        }

        let aqiData: AQIData | null = null

        if (!coords) {
            console.info('Requesting location for accurate AQI data...')
            const requestedCoords = await requestLocationPermission()
            coords = requestedCoords || undefined

            if (!coords) {
                console.info('Using IP-based location for AQI data')
            }
        }

        try {
            let apiUrl: string

            if (coords) {

                apiUrl = `${WAQI_BASE_URL}/feed/geo:${coords.latitude};${coords.longitude}/?token=${WAQI_API_TOKEN}`
            } else {

                apiUrl = `${WAQI_BASE_URL}/feed/here/?token=${WAQI_API_TOKEN}`
            }

            console.info('Fetching AQI from WAQI API:', coords ? 'using GPS coordinates' : 'using IP location')
            const response = await fetch(apiUrl)
            const data: WAQIResponse = await response.json()

            console.info('WAQI API Response status:', data.status)

            if (data.status === 'ok' && data.data && data.data.aqi > 0) {
                aqiData = {
                    aqi: data.data.aqi,
                    pm25: data.data.iaqi?.pm25?.v || 0,
                    pm10: data.data.iaqi?.pm10?.v || 0,
                    location: data.data.city?.name || 'Unknown Location',
                    category: getAQICategory(data.data.aqi),
                    healthImplications: getHealthImplications(data.data.aqi),
                    fetchedAt: new Date().toISOString(),
                    coordinates: coords ? [coords.latitude, coords.longitude] : data.data.city?.geo || [0, 0]
                }

                console.info('Successfully fetched live AQI data for:', aqiData.location)
            } else {
                console.info('WAQI API returned no data, using fallback')
            }
        } catch (error) {
            console.info('WAQI API unavailable, using fallback data')
        }

        if (!aqiData) {
            console.info('Using location-based AQI estimation')
            aqiData = getLocationBasedAQI(coords)
        }

        cacheAQIData(aqiData)
        return aqiData

    } catch (error) {
        console.info('AQI service temporarily unavailable, using cached or estimated data')

        const cached = getCachedAQI()
        if (cached) {
            console.info('Using cached AQI data')
            return cached
        }

        console.info('Using estimated AQI data')
        return getLocationBasedAQI()
    }
}

function getLocationBasedAQI(coords?: LocationCoords | null): AQIData {

    if (coords) {

        if (coords.latitude >= 6 && coords.latitude <= 37 && coords.longitude >= 68 && coords.longitude <= 97) {
            return {
                aqi: Math.floor(Math.random() * 100) + 150,
                pm25: Math.floor(Math.random() * 80) + 70,
                pm10: Math.floor(Math.random() * 120) + 100,
                location: 'India (Estimated)',
                category: 'Unhealthy',
                healthImplications: 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.',
                fetchedAt: new Date().toISOString(),
                coordinates: [coords.latitude, coords.longitude]
            }
        }

        if (coords.latitude >= 18 && coords.latitude <= 54 && coords.longitude >= 73 && coords.longitude <= 135) {
            return {
                aqi: Math.floor(Math.random() * 80) + 80,
                pm25: Math.floor(Math.random() * 60) + 40,
                pm10: Math.floor(Math.random() * 80) + 60,
                location: 'China (Estimated)',
                category: 'Moderate to Unhealthy',
                healthImplications: 'Air quality is acceptable for most people. However, sensitive groups may experience minor to moderate symptoms.',
                fetchedAt: new Date().toISOString(),
                coordinates: [coords.latitude, coords.longitude]
            }
        }

        if ((coords.latitude >= 25 && coords.latitude <= 49 && coords.longitude >= -125 && coords.longitude <= -66) ||
            (coords.latitude >= 35 && coords.latitude <= 71 && coords.longitude >= -10 && coords.longitude <= 40)) {
            return {
                aqi: Math.floor(Math.random() * 60) + 30,
                pm25: Math.floor(Math.random() * 30) + 10,
                pm10: Math.floor(Math.random() * 40) + 20,
                location: 'US/Europe (Estimated)',
                category: 'Good to Moderate',
                healthImplications: 'Air quality is considered satisfactory, and air pollution poses little or no risk.',
                fetchedAt: new Date().toISOString(),
                coordinates: [coords.latitude, coords.longitude]
            }
        }
    }

    return {
        aqi: Math.floor(Math.random() * 50) + 100,
        pm25: Math.floor(Math.random() * 40) + 50,
        pm10: Math.floor(Math.random() * 60) + 70,
        location: 'Current Location (Estimated)',
        category: 'Unhealthy for Sensitive Groups',
        healthImplications: 'Members of sensitive groups may experience health effects. The general public is not likely to be affected.',
        fetchedAt: new Date().toISOString(),
        coordinates: coords ? [coords.latitude, coords.longitude] : [28.6139, 77.2090]
    }
}

function shouldRefreshAQI(lastFetch: string): boolean {
    const lastFetchTime = new Date(lastFetch).getTime()
    const now = new Date().getTime()
    return (now - lastFetchTime) > CACHE_DURATION
}

function getCachedAQI(): AQIData | null {
    if (typeof window === 'undefined') return null

    try {
        const cached = localStorage.getItem(AQI_CACHE_KEY)
        return cached ? JSON.parse(cached) : null
    } catch (error) {
        console.error('Error reading cached AQI:', error)
        return null
    }
}

function cacheAQIData(aqiData: AQIData): void {
    if (typeof window === 'undefined') return

    try {
        localStorage.setItem(AQI_CACHE_KEY, JSON.stringify(aqiData))
    } catch (error) {
        console.error('Error caching AQI data:', error)
    }
}

export function getAQICategory(aqi: number): string {
    if (aqi <= 50) return 'Good'
    if (aqi <= 100) return 'Moderate'
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups'
    if (aqi <= 200) return 'Unhealthy'
    if (aqi <= 300) return 'Very Unhealthy'
    return 'Hazardous'
}

export function getAQIColor(aqi: number): string {
    if (aqi <= 50) return '#00E400'
    if (aqi <= 100) return '#FFFF00'
    if (aqi <= 150) return '#FF7E00'
    if (aqi <= 200) return '#FF0000'
    if (aqi <= 300) return '#8F3F97'
    return '#7E0023'
}

export function shouldAlertForAQI(aqi: number): boolean {
    return aqi > 200
}

function getHealthImplications(aqi: number): string {
    if (aqi <= 50) return 'Air quality is considered satisfactory, and air pollution poses little or no risk.'
    if (aqi <= 100) return 'Air quality is acceptable for most people. However, sensitive groups may experience minor to moderate symptoms.'
    if (aqi <= 150) return 'Members of sensitive groups may experience health effects. The general public is not likely to be affected.'
    if (aqi <= 200) return 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.'
    if (aqi <= 300) return 'Health warnings of emergency conditions. The entire population is more likely to be affected.'
    return 'Health alert: everyone may experience more serious health effects.'
}

export function getAQIHealthAdvice(aqi: number, diseaseType?: string): string {
    const category = getAQICategory(aqi)

    const baseAdvice = {
        'Good': 'Air quality is good. Normal outdoor activities are safe.',
        'Moderate': 'Air quality is acceptable. Sensitive individuals should consider limiting prolonged outdoor exertion.',
        'Unhealthy for Sensitive Groups': 'Sensitive groups should reduce outdoor activities.',
        'Unhealthy': 'Everyone should limit outdoor activities. Sensitive groups should avoid outdoor activities.',
        'Very Unhealthy': 'Everyone should avoid outdoor activities. Stay indoors with air purification if possible.',
        'Hazardous': 'Emergency conditions. Everyone should remain indoors and avoid all outdoor activities.'
    }

    let advice = baseAdvice[category as keyof typeof baseAdvice] || baseAdvice['Hazardous']

    if (diseaseType && aqi > 100) {
        switch (diseaseType) {
            case 'Asthma':
                advice += ' Keep rescue inhaler readily available.'
                break
            case 'COPD':
                advice += ' Use prescribed bronchodilators as needed.'
                break
            case 'ILD':
                advice += ' Monitor oxygen levels closely and use supplemental oxygen if prescribed.'
                break
            case 'Bronchiectasis':
                advice += ' Maintain airway clearance techniques and stay hydrated.'
                break
        }
    }

    return advice
}

const AQI_HISTORY_KEY = 'patient_aqi_history'

export function storeAQIData(patientId: string, aqiData: AQIData): void {
    if (typeof window === 'undefined') return

    try {
        const stored = localStorage.getItem(AQI_HISTORY_KEY)
        const allData = stored ? JSON.parse(stored) : {}

        if (!allData[patientId]) {
            allData[patientId] = []
        }

        allData[patientId].push(aqiData)

        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        allData[patientId] = allData[patientId].filter((data: AQIData) =>
            new Date(data.fetchedAt) > thirtyDaysAgo
        )

        localStorage.setItem(AQI_HISTORY_KEY, JSON.stringify(allData))
    } catch (error) {
        console.error('Error storing AQI data:', error)
    }
}

export function getStoredAQIData(patientId: string): AQIData[] {
    if (typeof window === 'undefined') return []

    try {
        const stored = localStorage.getItem(AQI_HISTORY_KEY)
        const allData = stored ? JSON.parse(stored) : {}
        return allData[patientId] || []
    } catch (error) {
        console.error('Error reading AQI data:', error)
        return []
    }
}

export async function initializePatientAQI(patientId: string, forceRefresh: boolean = false): Promise<AQIData> {
    try {

        if (forceRefresh) {
            localStorage.removeItem(AQI_CACHE_KEY)
        }

        const coords = await requestLocationPermission()

        const aqiData = await fetchRealTimeAQI(coords || undefined)

        storeAQIData(patientId, aqiData)

        return aqiData
    } catch (error) {
        console.info('Unable to initialize live AQI data, using estimated values')
        return getLocationBasedAQI()
    }
}

export async function forceRefreshAQI(patientId: string): Promise<AQIData> {
    return initializePatientAQI(patientId, true)
}

export function hasLocationChangedSignificantly(oldCoords: LocationCoords, newCoords: LocationCoords): boolean {
    const R = 6371
    const dLat = (newCoords.latitude - oldCoords.latitude) * Math.PI / 180
    const dLon = (newCoords.longitude - oldCoords.longitude) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(oldCoords.latitude * Math.PI / 180) * Math.cos(newCoords.latitude * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    return distance > 5
}