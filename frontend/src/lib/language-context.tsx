"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

type Language = 'en' | 'hi'

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const translations = {
    en: {

        'common.loading': 'Loading...',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.submit': 'Submit',
        'common.yes': 'Yes',
        'common.no': 'No',
        'common.others': 'Others',
        'common.temperature': 'Temperature',
        'common.fahrenheit': 'Fahrenheit',

        'dashboard.title': 'Patient Dashboard',
        'dashboard.welcome': 'Welcome',
        'dashboard.vitals': 'Vital Signs (SpO₂)',
        'dashboard.symptoms': 'Symptoms',
        'dashboard.medications': 'Medications',
        'dashboard.oxygenation': 'Oxygenation Status',
        'dashboard.roomAir': 'Room Air',

        'vitals.spo2': 'SpO₂ (spo2)',
        'vitals.spo2AtRest': 'SpO₂ at Rest',
        'vitals.spo2OnExertion': 'SpO₂ on Exertion',
        'vitals.oxygenationChange': 'Is there any change in oxygenation status?',
        'vitals.improvement': 'Improvement',
        'vitals.worsening': 'Worsening',
        'vitals.oxygenDecreased': 'Oxygen requirement decreased by',
        'vitals.oxygenIncreased': 'Oxygen requirement increased by',
        'vitals.saturationLow': 'Is your saturation less than 88% for more than 3 hours in a day?',

        'mmrc.title': 'mMRC Dyspnea Scale',
        'mmrc.grade0': 'I only get breathless with strenuous exercise',
        'mmrc.grade1': 'I get short of breath when hurrying on level ground or walking up a slight hill',
        'mmrc.grade2': 'On level ground, I walk slower than people of the same age because of breathlessness, or I have to stop for breath when walking at my own pace',
        'mmrc.grade3': 'I stop for breath after walking about 100 yards or after a few minutes on level ground',
        'mmrc.grade4': 'I am too breathless to leave the house or I am breathless when dressing',

        'symptoms.cough': 'Cough',
        'symptoms.fever': 'Fever',
        'symptoms.expectoration': 'Expectoration',
        'symptoms.chestPain': 'Chest Pain',
        'symptoms.wheezing': 'Wheezing',
        'symptoms.stridor': 'Stridor',
        'symptoms.weakness': 'Generalised Weakness',
        'symptoms.pedalEdema': 'Pedal Edema',

        'sideEffects.title': 'Medication Side Effects',
        'sideEffects.fever': 'Fever',
        'sideEffects.dizziness': 'Dizziness',
        'sideEffects.itching': 'Itching',

        'control.wellControlled': 'Well Controlled',
        'control.partlyControlled': 'Partly Controlled',
        'control.poorlyControlled': 'Poorly Controlled',

        'rehabilitation.title': 'Virtual Pulmonary Rehabilitation',
        'rehabilitation.description': 'Access guided breathing exercises and rehabilitation programs',
        'rehabilitation.start': 'Start Session',
    },
    hi: {

        'common.loading': 'लोड हो रहा है...',
        'common.save': 'सेव करें',
        'common.cancel': 'रद्द करें',
        'common.submit': 'जमा करें',
        'common.yes': 'हाँ',
        'common.no': 'नहीं',
        'common.others': 'अन्य',
        'common.temperature': 'तापमान',
        'common.fahrenheit': 'फारेनहाइट',

        'dashboard.title': 'मरीज़ डैशबोर्ड',
        'dashboard.welcome': 'स्वागत',
        'dashboard.vitals': 'महत्वपूर्ण संकेत (SpO₂)',
        'dashboard.symptoms': 'लक्षण',
        'dashboard.medications': 'दवाइयां',
        'dashboard.oxygenation': 'ऑक्सीजन स्थिति',
        'dashboard.roomAir': 'कमरे की हवा',

        'vitals.spo2': 'SpO₂ (sपो2)',
        'vitals.spo2AtRest': 'आराम के समय SpO₂',
        'vitals.spo2OnExertion': 'मेहनत के समय SpO₂',
        'vitals.oxygenationChange': 'क्या ऑक्सीजन स्थिति में कोई बदलाव है?',
        'vitals.improvement': 'सुधार',
        'vitals.worsening': 'बिगड़ना',
        'vitals.oxygenDecreased': 'ऑक्सीजन की आवश्यकता कम हुई',
        'vitals.oxygenIncreased': 'ऑक्सीजन की आवश्यकता बढ़ी',
        'vitals.saturationLow': 'क्या आपका सैचुरेशन दिन में 3 घंटे से ज्यादा 88% से कम रहता है?',

        'mmrc.title': 'mMRC सांस की तकलीफ स्केल',
        'mmrc.grade0': 'मुझे केवल कड़ी मेहनत के दौरान सांस की तकलीफ होती है',
        'mmrc.grade1': 'समतल जमीन पर जल्दी चलने या हल्की चढ़ाई पर मुझे सांस की तकलीफ होती है',
        'mmrc.grade2': 'समतल जमीन पर मैं सांस की तकलीफ के कारण अपनी उम्र के लोगों से धीमा चलता हूं, या अपनी गति से चलते समय सांस लेने के लिए रुकना पड़ता है',
        'mmrc.grade3': 'लगभग 100 गज चलने के बाद या समतल जमीन पर कुछ मिनट चलने के बाद मुझे सांस लेने के लिए रुकना पड़ता है',
        'mmrc.grade4': 'मैं घर से निकलने के लिए बहुत सांस फूलता हूं या कपड़े पहनते समय सांस फूलती है',

        'symptoms.cough': 'खांसी',
        'symptoms.fever': 'बुखार',
        'symptoms.expectoration': 'कफ',
        'symptoms.chestPain': 'छाती में दर्द',
        'symptoms.wheezing': 'सांस में आवाज',
        'symptoms.stridor': 'स्ट्राइडर',
        'symptoms.weakness': 'सामान्य कमजोरी',
        'symptoms.pedalEdema': 'पैरों में सूजन',

        'sideEffects.title': 'दवा के साइड इफेक्ट्स',
        'sideEffects.fever': 'बुखार',
        'sideEffects.dizziness': 'चक्कर आना',
        'sideEffects.itching': 'खुजली',

        'control.wellControlled': 'अच्छी तरह नियंत्रित',
        'control.partlyControlled': 'आंशिक रूप से नियंत्रित',
        'control.poorlyControlled': 'खराब नियंत्रित',

        'rehabilitation.title': 'वर्चुअल पल्मोनरी रिहैबिलिटेशन',
        'rehabilitation.description': 'निर्देशित सांस की एक्सरसाइज और रिहैबिलिटेशन प्रोग्राम का उपयोग करें',
        'rehabilitation.start': 'सेशन शुरू करें',
    }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('en')

    useEffect(() => {

        const savedLanguage = localStorage.getItem('patient-language') as Language
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'hi')) {
            setLanguage(savedLanguage)
        }
    }, [])

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang)
        localStorage.setItem('patient-language', lang)
    }

    const t = (key: string): string => {
        return translations[language][key as keyof typeof translations[typeof language]] || key
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}

export function LanguageToggle() {
    const { language, setLanguage } = useLanguage()

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 text-sm rounded ${language === 'en'
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
            >
                EN
            </button>
            <button
                onClick={() => setLanguage('hi')}
                className={`px-3 py-1 text-sm rounded ${language === 'hi'
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
            >
                हिं
            </button>
        </div>
    )
}