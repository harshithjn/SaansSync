// Utility to clear AQI cache for testing
export function clearAQICache(): void {
    if (typeof window === 'undefined') return
    
    try {
        localStorage.removeItem('aqi_cache_data')
        localStorage.removeItem('patient_location_data')
        console.log('AQI cache cleared - will fetch fresh data on next load')
    } catch (error) {
        console.error('Error clearing AQI cache:', error)
    }
}

// Call this function in browser console to clear cache: clearAQICache()
if (typeof window !== 'undefined') {
    (window as any).clearAQICache = clearAQICache
}