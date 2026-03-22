"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { fetchRealTimeAQI, getAQIColor, forceRefreshAQI } from "@/lib/aqi-service"
import { createDailyLog, canLogToday, getPatientProfile, getPatientMedications, getPatientAlerts, acknowledgeAlert } from "@/lib/database-service"
import { useLanguage } from "@/lib/language-context"
import { toast } from "@/lib/toast"
import {
    Wind,
    Activity,
    Thermometer,
    AlertTriangle,
    Clock,
    RefreshCw,
    Heart,
    Zap,
    Pill,
    ChevronRight,
    CheckCircle2,
    Droplets,
    ShieldCheck
} from "lucide-react"

interface CleanBronchiectasisDashboardProps {
    patientId: string
    patientName?: string
    diagnosis?: string
    headless?: boolean
}

export default function CleanBronchiectasisDashboard({ patientId, patientName, diagnosis, headless = false }: CleanBronchiectasisDashboardProps) {
    const { t } = useLanguage()

    // State
    const [patientData, setPatientData] = useState<any>(null)
    const [aqiData, setAqiData] = useState<any>(null)
    const [aqiLoading, setAqiLoading] = useState(true)
    const [canLog, setCanLog] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [activeAlerts, setActiveAlerts] = useState<any[]>([])

    // Form Data
    const [formData, setFormData] = useState({
        spo2AtRest: 96,
        spo2OnExertion: 92,
        mMRCScale: 1,
        sputumVolume: 'moderate' as 'none' | 'small' | 'moderate' | 'large',
        sputumColor: 'white',
        hasHemoptysis: false,
        hemoptysisVolume: 0,
        hemoptysisAmount: 'none' as 'none' | 'streaks' | 'teaspoon' | 'more-than-teacup' | 'more-than-one-glass',
        malaise: false,
        fever: false,
        chestPain: false,
        breathlessness: 5,
        cough: 5,
        chestTightness: 5,
        fatigue: 5,
        medications: [] as any[],
        sideEffects: [] as string[]
    })

    useEffect(() => {
        const initialize = async () => {
            try {
                const [profile, meds, alerts, aqi, loggingStatus] = await Promise.all([
                    getPatientProfile(patientId),
                    getPatientMedications(patientId),
                    getPatientAlerts(patientId),
                    fetchRealTimeAQI(),
                    canLogToday(patientId)
                ])

                setPatientData(profile)
                setActiveAlerts(alerts?.filter((a: any) => !a.acknowledged) || [])
                setAqiData(aqi)
                setCanLog(loggingStatus)

                if (meds && meds.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        medications: meds.map((m: any, i: number) => ({
                            medicationId: m.id || `med-${i}`,
                            drugName: m.drugName || m.name,
                            dose: m.dose,
                            frequency: m.frequency,
                            taken: false
                        }))
                    }))
                }
            } catch (error) {
                console.error(error)
            } finally {
                setAqiLoading(false)
            }
        }
        initialize()
    }, [patientId])

    const handleSubmit = async () => {
        if (!canLog) return
        setIsSubmitting(true)
        try {
            const result = await createDailyLog(patientId, 'Bronchiectasis', {
                patientId,
                aqi: aqiData,
                spo2: { atRest: formData.spo2AtRest, onExertion: formData.spo2OnExertion },
                mMRCScale: formData.mMRCScale,
                medications: formData.medications,
                sideEffects: formData.sideEffects,
                symptoms: [
                    { name: 'Breathlessness', score: formData.breathlessness },
                    { name: 'Cough', score: formData.cough },
                    { name: 'Chest Tightness', score: formData.chestTightness },
                    { name: 'Fatigue', score: formData.fatigue }
                ]
            }, {
                patientId,
                logDate: new Date().toISOString().split('T')[0],
                sputumVolume: formData.sputumVolume,
                sputumColor: formData.sputumColor,
                hasHemoptysis: formData.hasHemoptysis,
                hemoptysisVolume: formData.hemoptysisVolume,
                hemoptysisAmount: formData.hemoptysisAmount,
                malaise: formData.malaise,
                fever: formData.fever,
                chestPain: formData.chestPain
            })

            if (result.success) {
                toast.success('Clinical snapshot recorded')
                setCanLog(false)
            }
        } catch (error) {
            toast.error('System failure during log submission')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-12 font-['Matter_Regular',sans-serif]">
            {/* Critical Alert Banner */}
            {formData.hasHemoptysis && (formData.hemoptysisVolume > 100 || formData.hemoptysisAmount === 'more-than-teacup') && (
                <div className="bg-rose-500 rounded-[2.5rem] p-8 text-white flex items-center gap-6 shadow-xl shadow-rose-100 animate-pulse">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xl shrink-0 border border-white/20">
                        <AlertTriangle className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold tracking-tight mb-1">Seek Medical Help</h3>
                        <p className="text-rose-50 text-xs font-bold uppercase tracking-widest opacity-90">Significant airway bleeding detected. Please contact your doctor immediately.</p>
                    </div>
                </div>
            )}

            {/* Environmental Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="p-8 border-none bg-white rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                <Wind className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Air Quality</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{aqiData?.location || 'Nearby'}</p>
                            </div>
                        </div>
                        <button 
                            disabled={aqiLoading}
                            onClick={async () => {
                                setAqiLoading(true)
                                const fresh = await forceRefreshAQI(patientId)
                                setAqiData(fresh)
                                setAqiLoading(false)
                            }}
                            className={`w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 hover:text-slate-600 transition-all ${aqiLoading ? 'animate-spin' : ''}`}
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <div className="flex items-baseline gap-3 relative z-10">
                        <span className="text-5xl font-bold text-slate-900 tracking-tight" style={{ color: getAQIColor(aqiData?.aqi || 0) }}>
                            {aqiData?.aqi || '--'}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-widest ml-1" style={{ color: getAQIColor(aqiData?.aqi || 0) }}>
                            {aqiData?.category || 'Refreshing...'}
                        </span>
                    </div>
                </Card>

                <Card className={`p-8 border-none rounded-[2.5rem] shadow-sm border flex flex-col justify-between transition-all duration-500 overflow-hidden relative ${canLog ? 'bg-purple-600 text-white shadow-xl shadow-purple-100' : 'bg-white border-slate-100'}`}>
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${canLog ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-200'}`}>
                            <Zap className="w-6 h-6" />
                        </div>
                        {canLog ? (
                             <Badge className="bg-white/20 text-white border-none font-bold text-[9px] uppercase tracking-widest px-3 py-1">Ready for update</Badge>
                        ) : (
                             <Badge className="bg-slate-50 text-slate-300 border-none font-bold text-[9px] uppercase tracking-widest px-3 py-1">Saved today</Badge>
                        )}
                    </div>
                    <div className="relative z-10">
                        <h3 className={`text-2xl font-bold tracking-tight mb-1 ${canLog ? 'text-white' : 'text-slate-900'}`}>
                            {canLog ? 'Daily Log' : 'Check-in Complete'}
                        </h3>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${canLog ? 'text-purple-100' : 'text-slate-300'}`}>
                            {canLog ? 'Update your health status' : 'Thank you for tracking today'}
                        </p>
                    </div>
                </Card>
            </div>

            {/* Entry Form */}
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-slate-50 pb-10">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Daily Check-in</h2>
                        <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Help us track your progress</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300">
                           <Clock className="w-5 h-5" />
                        </div>
                        <div className="text-right">
                           <p className="text-xs font-bold text-slate-900 tracking-tight">{new Date().toLocaleDateString('en-IN', { weekday: 'long' })}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                    <div className="space-y-10">
                        <div className="flex items-center gap-4 mb-2">
                            <Activity className="w-5 h-5 text-purple-600" />
                            <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-900">Health Readings</h4>
                        </div>
                        
                        <div className="space-y-10">
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        Oxygen level (Rest)
                                    </label>
                                    <span className="text-2xl font-bold text-slate-900 tracking-tight">{formData.spo2AtRest}%</span>
                                </div>
                                <Slider
                                    value={[formData.spo2AtRest]}
                                    onValueChange={(v) => setFormData(prev => ({ ...prev, spo2AtRest: v[0] }))}
                                    max={100} min={80} step={1}
                                    className="[&_[role=slider]]:h-7 [&_[role=slider]]:w-7 [&_[role=slider]]:bg-purple-600 [&_[role=track]]:h-2 [&_[role=track]]:bg-slate-100"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        Oxygen level (After activity)
                                    </label>
                                    <span className="text-2xl font-bold text-slate-900 tracking-tight">{formData.spo2OnExertion}%</span>
                                </div>
                                <Slider
                                    value={[formData.spo2OnExertion]}
                                    onValueChange={(v) => setFormData(prev => ({ ...prev, spo2OnExertion: v[0] }))}
                                    max={100} min={80} step={1}
                                    className="[&_[role=slider]]:h-7 [&_[role=slider]]:w-7 [&_[role=slider]]:bg-purple-600 [&_[role=track]]:h-2 [&_[role=track]]:bg-slate-100"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-10">
                        <div className="flex items-center gap-4 mb-2">
                            <Thermometer className="w-5 h-5 text-purple-600" />
                            <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-900">Activity & Fever</h4>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-4">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block px-1">How is your breathing?</label>
                                <Select value={formData.mMRCScale.toString()} onValueChange={(v) => setFormData(prev => ({ ...prev, mMRCScale: parseInt(v) }))}>
                                    <SelectTrigger className="h-14 rounded-xl bg-slate-50 border border-slate-100 font-bold text-slate-900 px-6 text-sm hover:bg-slate-100 transition-all focus:ring-purple-100 shadow-none">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-2 font-['Matter_Regular',sans-serif]">
                                        <SelectItem value="0" className="rounded-lg font-bold py-2.5">Normal breathing</SelectItem>
                                        <SelectItem value="1" className="rounded-lg font-bold py-2.5">Only during fast walks</SelectItem>
                                        <SelectItem value="2" className="rounded-lg font-bold py-2.5">Slower than others</SelectItem>
                                        <SelectItem value="3" className="rounded-lg font-bold py-2.5">Need to stop for breath</SelectItem>
                                        <SelectItem value="4" className="rounded-lg font-bold py-2.5">Limits daily activities</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                             <div className="grid grid-cols-1 gap-4">
                                {[
                                    { key: 'fever', label: 'Fever detected', icon: Thermometer },
                                    { key: 'malaise', label: 'Feeling unwell / Tired', icon: Zap },
                                    { key: 'chestPain', label: 'Chest pain', icon: Heart }
                                ].map(({ key, label, icon: Icon }) => (
                                    <div key={key} 
                                        className={`p-6 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${formData[key as keyof typeof formData] ? 'bg-rose-50 border-rose-100 shadow-sm' : 'bg-slate-50 border-slate-50 hover:border-slate-200'}`}
                                        onClick={() => setFormData(prev => ({ ...prev, [key]: !prev[key as keyof typeof formData] }))}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${formData[key as keyof typeof formData] ? 'bg-white text-rose-500 shadow-sm' : 'bg-white text-slate-200 border border-slate-100'}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-900 tracking-tight">{label}</span>
                                        </div>
                                        <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${formData[key as keyof typeof formData] ? 'bg-rose-500 border-rose-500 shadow-md' : 'bg-white border-slate-200'}`}>
                                            {formData[key as keyof typeof formData] && <CheckCircle2 className="w-4 h-4 text-white" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sputum Analysis */}
                <div className="mt-16 pt-12 border-t border-slate-50">
                    <div className="flex items-center gap-4 mb-10">
                        <Droplets className="w-5 h-5 text-purple-600" />
                        <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-900">Sputum Analysis</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                         <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-4">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block px-1">Sputum Volume</label>
                                <Select value={formData.sputumVolume} onValueChange={(v: any) => setFormData(prev => ({ ...prev, sputumVolume: v }))}>
                                    <SelectTrigger className="h-14 rounded-xl bg-slate-50 border border-slate-100 font-bold text-slate-900 px-6 text-sm hover:bg-slate-100 shadow-none">
                                        <SelectValue placeholder="Volume" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-2 font-['Matter_Regular',sans-serif]">
                                        <SelectItem value="none" className="rounded-lg font-bold">None / Dry</SelectItem>
                                        <SelectItem value="small" className="rounded-lg font-bold">Small (less than 5mL)</SelectItem>
                                        <SelectItem value="moderate" className="rounded-lg font-bold">Moderate (5-15mL)</SelectItem>
                                        <SelectItem value="large" className="rounded-lg font-bold">Large (more than 15mL)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                             <div className="space-y-4">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block px-1">Visual Characteristics</label>
                                <Select value={formData.sputumColor} onValueChange={(v) => setFormData(prev => ({ ...prev, sputumColor: v }))}>
                                    <SelectTrigger className="h-14 rounded-xl bg-slate-50 border border-slate-100 font-bold text-slate-900 px-6 text-sm hover:bg-slate-100 shadow-none">
                                        <SelectValue placeholder="Color" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-2 font-['Matter_Regular',sans-serif]">
                                        <SelectItem value="white" className="rounded-lg font-bold">White / Clear</SelectItem>
                                        <SelectItem value="pale-yellow" className="rounded-lg font-bold text-yellow-600">Pale Yellow</SelectItem>
                                        <SelectItem value="yellow" className="rounded-lg font-bold text-amber-600">Yellow</SelectItem>
                                        <SelectItem value="dark-green" className="rounded-lg font-bold text-emerald-700">Dark Green</SelectItem>
                                        <SelectItem value="blood-streaked" className="rounded-lg font-bold text-rose-600">Blood Streaks</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${formData.hasHemoptysis ? 'bg-rose-500 text-white shadow-md' : 'bg-white text-slate-200 border border-slate-100'}`}>
                                        <Droplets className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h5 className="text-sm font-bold text-slate-900 tracking-tight leading-tight">Airway Bleeding</h5>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${formData.hasHemoptysis ? 'text-rose-500' : 'text-slate-400'}`}>Blood in sputum?</p>
                                    </div>
                                </div>
                                <Checkbox 
                                    checked={formData.hasHemoptysis}
                                    onCheckedChange={(c) => setFormData(prev => ({ ...prev, hasHemoptysis: !!c }))}
                                    className="w-7 h-7 rounded-lg border-2 border-slate-200 data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
                                />
                             </div>

                             {formData.hasHemoptysis ? (
                                <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                             <label className="text-[10px] font-bold uppercase tracking-widest text-rose-500">Estimated volume</label>
                                             <span className="text-xl font-bold text-rose-900">{formData.hemoptysisVolume} mL</span>
                                        </div>
                                        <Slider
                                            value={[formData.hemoptysisVolume]}
                                            onValueChange={(v) => setFormData(prev => ({ ...prev, hemoptysisVolume: v[0] }))}
                                            max={500} min={0} step={5}
                                            className="[&_[role=slider]]:h-6 [&_[role=slider]]:w-6 [&_[role=slider]]:bg-rose-600 shadow-lg [&_[role=track]]:bg-rose-100"
                                        />
                                    </div>
                                    <Select value={formData.hemoptysisAmount} onValueChange={(v: any) => setFormData(prev => ({ ...prev, hemoptysisAmount: v }))}>
                                        <SelectTrigger className="h-12 rounded-xl bg-white border-rose-100 font-bold text-rose-900 px-6 text-[10px] uppercase tracking-widest shadow-none">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-100 shadow-xl font-bold text-[10px] uppercase tracking-widest py-2">
                                            <SelectItem value="none">None</SelectItem>
                                            <SelectItem value="streaks">Streaks Only</SelectItem>
                                            <SelectItem value="teaspoon">About 1 Teaspoon</SelectItem>
                                            <SelectItem value="more-than-teacup">Teacup or more</SelectItem>
                                            <SelectItem value="more-than-one-glass">Critical (more than 1 Glass)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                             ) : (
                                <div className="mt-8 p-6 bg-white rounded-2xl border border-dashed border-slate-200 text-center">
                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No bleeding reported</p>
                                </div>
                             )}
                        </div>
                    </div>
                </div>

                {/* How do you feel? */}
                <div className="mt-16 pt-12 border-t border-slate-50">
                    <div className="flex items-center gap-4 mb-10">
                        <Activity className="w-5 h-5 text-purple-600" />
                        <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-900">How do you feel?</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-12">
                        {[
                            { key: 'breathlessness', label: 'Shortness of breath', icon: Wind },
                            { key: 'cough', label: 'Cough', icon: Activity },
                            { key: 'chestTightness', label: 'Chest tightness', icon: Clock },
                            { key: 'fatigue', label: 'Tiredness', icon: Zap }
                        ].map(({ key, label, icon: Icon }) => (
                            <div key={key}>
                                <div className="flex items-center justify-between mb-6 group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 tracking-tight">{label}</span>
                                    </div>
                                    <span className="text-xl font-bold text-slate-900 tracking-tight">{formData[key as keyof typeof formData]}/10</span>
                                </div>
                                <Slider
                                    value={[formData[key as keyof typeof formData] as number]}
                                    onValueChange={(v) => setFormData(prev => ({ ...prev, [key]: v[0] }))}
                                    max={10} min={0} step={1}
                                    className="[&_[role=slider]]:h-6 [&_[role=slider]]:w-6 [&_[role=slider]]:bg-purple-600 [&_[role=track]]:h-1.5 [&_[role=track]]:bg-slate-100"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Submission Area */}
                <div className="mt-20 pt-16 border-t border-slate-50 flex flex-col items-center">
                    <Button
                        disabled={!canLog || isSubmitting}
                        onClick={handleSubmit}
                        className={`h-16 px-16 rounded-[1.5rem] font-bold text-xl tracking-tight transition-all duration-300 shadow-lg active:scale-[0.98] ${canLog ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-100' : 'bg-slate-50 text-slate-300 shadow-none cursor-not-allowed'}`}
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-4">
                                <RefreshCw className="w-6 h-6 animate-spin" />
                                Saving your update...
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                {canLog ? "Save today's Log" : 'Already Saved'}
                                <ChevronRight className="w-6 h-6" />
                            </div>
                        )}
                    </Button>
                    <div className="mt-10 flex items-center gap-3 text-slate-300">
                        <ShieldCheck className="w-4 h-4 opacity-50" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">
                            Securely connected to your care team
                        </p>
                    </div>
                    {!canLog && (
                        <p className="mt-6 text-[10px] font-bold text-purple-600 bg-purple-50 px-6 py-2 rounded-full uppercase tracking-widest">
                           Next check-in available tomorrow
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}