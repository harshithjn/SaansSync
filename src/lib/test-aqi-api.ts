// Test script to verify WAQI API is working
export async function testWAQIAPI() {
    const token = '0b5abce79114d01bd0dff0b54cc84e1ba35cc22d'
    
    try {
        // Test 1: Get AQI by IP location
        console.log('Testing WAQI API - IP location...')
        const ipResponse = await fetch(`https://api.waqi.info/feed/here/?token=${token}`)
        const ipData = await ipResponse.json()
        console.log('IP Location AQI:', ipData)
        
        // Test 2: Get AQI for specific coordinates (Delhi)
        console.log('Testing WAQI API - Delhi coordinates...')
        const coordResponse = await fetch(`https://api.waqi.info/feed/geo:28.6139;77.2090/?token=${token}`)
        const coordData = await coordResponse.json()
        console.log('Delhi AQI:', coordData)
        
        // Test 3: Get AQI for specific city
        console.log('Testing WAQI API - Mumbai city...')
        const cityResponse = await fetch(`https://api.waqi.info/feed/mumbai/?token=${token}`)
        const cityData = await cityResponse.json()
        console.log('Mumbai AQI:', cityData)
        
        return {
            ipLocation: ipData,
            delhi: coordData,
            mumbai: cityData
        }
    } catch (error) {
        console.error('Error testing WAQI API:', error)
        return null
    }
}

// Make it available in browser console for testing
if (typeof window !== 'undefined') {
    (window as any).testWAQIAPI = testWAQIAPI
}