"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquare, Send, User, Search, Filter, MoreVertical, CheckCircle2, Clock, Loader2, ShieldCheck, Zap, ArrowUpRight, Plus, Hash, Activity } from "lucide-react"
import { formatDate } from '@/lib/utils'
import { api } from "@/lib/api"
import { useDoctorAuth } from "@/lib/auth-guard"

interface Thread {
    id: string
    content: string
    createdAt: string
    patientId: string
    senderRole: 'patient' | 'doctor'
    isRead: boolean
    patient: {
        id: string
        fullName: string
    }
}

interface Message {
    id: string
    content: string
    senderRole: 'patient' | 'doctor'
    createdAt: string
}

export default function DoctorMessages() {
    const { user, profile } = useDoctorAuth()
    const doctor = profile || user
    const [threads, setThreads] = useState<Thread[]>([])
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
    const [activeConversation, setActiveConversation] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (doctor?.id) {
            loadThreads()
            const interval = setInterval(loadThreads, 15000)
            return () => clearInterval(interval)
        }
    }, [doctor?.id])

    useEffect(() => {
        if (selectedPatientId) {
            loadConversation(selectedPatientId)
            const interval = setInterval(() => loadConversation(selectedPatientId), 5000)
            return () => clearInterval(interval)
        }
    }, [selectedPatientId])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [activeConversation])

    const loadThreads = async () => {
        try {
            const data = await api.get<Thread[]>(`/messages/doctor/threads?doctorId=${doctor?.id}`)
            if (data) {
                const uniqueThreads = data.reduce((acc: Thread[], curr) => {
                    if (!acc.find(t => t.patientId === curr.patientId)) {
                        acc.push(curr)
                    }
                    return acc
                }, [])
                setThreads(uniqueThreads)
            }
        } catch (error) {
            console.error('Error loading threads:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const loadConversation = async (patientId: string) => {
        try {
            const data = await api.get<Message[]>(`/messages/patient/${patientId}`)
            if (data) setActiveConversation(data)
        } catch (error) {
            console.error('Error loading conversation:', error)
        }
    }

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedPatientId || !doctor?.id) return

        setIsSending(true)
        try {
            await api.post('/messages/send', {
                patient_id: selectedPatientId,
                doctor_id: doctor.id,
                sender_role: 'doctor',
                content: newMessage
            })
            setNewMessage("")
            await loadConversation(selectedPatientId)
            await loadThreads()
        } catch (error) {
            console.error('Error sending message:', error)
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-[calc(100vh-220px)]">
            {/* Communication Directory */}
            <Card className="md:col-span-4 border-none bg-white rounded-[2.5rem] shadow-sm border border-slate-50 flex flex-col overflow-hidden">
                <div className="p-8 border-b border-slate-50">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-950 text-white rounded-xl flex items-center justify-center">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Messaging</h2>
                        </div>
                        <Button variant="ghost" className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 p-0">
                           <Plus className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-slate-950 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search chats..."
                            className="w-full h-12 bg-slate-50 rounded-2xl pl-12 pr-4 text-[10px] font-bold tracking-tight text-slate-950 border-none outline-none focus:ring-4 focus:ring-slate-50 transition-all placeholder:text-slate-200"
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Loading Chats...</p>
                        </div>
                    ) : threads.length === 0 ? (
                        <div className="text-center py-20 px-8">
                            <div className="w-16 h-16 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                <Hash className="w-8 h-8 text-slate-200" />
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 mb-2">Null Communications</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">No active chats found.</p>
                        </div>
                    ) : (
                        <div className="p-4 space-y-2">
                            {threads.map(thread => (
                                <div
                                    key={thread.id}
                                    onClick={() => setSelectedPatientId(thread.patientId)}
                                    className={`p-5 rounded-[1.75rem] cursor-pointer transition-all duration-500 group relative ${
                                        selectedPatientId === thread.patientId
                                            ? 'bg-slate-950 text-white shadow-2xl shadow-slate-200 scale-[1.02]'
                                            : 'bg-white hover:bg-slate-50 border border-transparent hover:border-slate-100'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                                                selectedPatientId === thread.patientId ? 'bg-white/10' : 'bg-slate-100 text-slate-400'
                                            }`}>
                                                {thread.patient?.fullName?.charAt(0) || 'P'}
                                            </div>
                                            <span className="text-sm font-bold tracking-tight text-slate-950">{thread.patient?.fullName || 'Patient'}</span>
                                        </div>
                                        <span className={`text-[8px] font-bold uppercase tracking-widest ${
                                            selectedPatientId === thread.patientId ? 'text-slate-400' : 'text-slate-300'
                                        }`}>
                                            {formatDate(thread.createdAt)}
                                        </span>
                                    </div>
                                    <p className={`text-[11px] font-medium truncate ${
                                        selectedPatientId === thread.patientId ? 'text-slate-400' : 'text-slate-500'
                                    }`}>{thread.content}</p>

                                    {thread.isRead === false && (
                                        <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </Card>

            {}
            <Card className="md:col-span-8 flex flex-col border-none bg-white rounded-[2.5rem] shadow-sm border border-slate-50 overflow-hidden relative">
                {selectedPatientId ? (
                    <>
                        <div className="px-10 py-6 border-b border-slate-50 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10 transition-all duration-500">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group">
                                     <img
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${threads.find(t => t.patientId === selectedPatientId)?.patient?.fullName}`}
                                        alt="Avatar"
                                        className="w-10 h-10 object-contain group-hover:scale-110 transition-transform"
                                     />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                                        {threads.find(t => t.patientId === selectedPatientId)?.patient?.fullName}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">End-to-End Secure Channel</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button variant="ghost" className="h-12 px-6 rounded-xl bg-slate-50 font-bold text-[9px] uppercase tracking-widest text-slate-500 hover:text-slate-950 transition-all">
                                    Patient Profile
                                    <ArrowUpRight className="w-3.5 h-3.5 ml-2" />
                                </Button>
                                <Button variant="ghost" className="w-12 h-12 rounded-xl text-slate-300 hover:text-slate-950">
                                    <MoreVertical className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        <div ref={scrollRef} className="flex-1 p-10 overflow-y-auto no-scrollbar bg-slate-50/30">
                            <div className="space-y-8 max-w-4xl mx-auto">
                                <div className="text-center py-4">
                                   <Badge className="bg-slate-100 text-slate-400 border-none font-bold text-[8px] uppercase tracking-[0.3em] px-4 py-1.5 rounded-full">
                                      Session Keys Rotated • {new Date().toLocaleDateString()}
                                   </Badge>
                                </div>

                                {activeConversation.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.senderRole === 'doctor' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                                        <div className={`group flex flex-col ${msg.senderRole === 'doctor' ? 'items-end' : 'items-start'}`}>
                                            <div className={`max-w-[85%] rounded-[1.75rem] px-8 py-5 shadow-sm transition-all hover:shadow-xl ${
                                                msg.senderRole === 'doctor'
                                                    ? 'bg-slate-950 text-white rounded-br-none'
                                                    : 'bg-white border border-slate-100 text-slate-900 rounded-bl-none'
                                                }`}>
                                                <p className="text-sm font-bold leading-relaxed">{msg.content}</p>
                                            </div>
                                            <div className="flex items-center gap-2 mt-3 px-2">
                                                <Clock className="w-2.5 h-2.5 text-slate-300" />
                                                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {msg.senderRole === 'doctor' && <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-8 border-t border-slate-50 bg-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.03)]">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                                className="flex gap-4 max-w-5xl mx-auto"
                            >
                                <div className="flex-1 relative group">
                                   <Input
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="TRANSMIT CLINICAL DIRECTIVE OR RESPONSE..."
                                        className="h-16 bg-slate-50 border-none rounded-[1.5rem] px-8 font-bold text-[10px] uppercase tracking-widest text-slate-950 focus-visible:ring-slate-100 ring-offset-0 placeholder:text-slate-200 transition-all group-focus-within:bg-white group-focus-within:shadow-xl group-focus-within:border group-focus-within:border-slate-50"
                                        disabled={isSending}
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pr-2">
                                       <Zap className="w-4 h-4 text-slate-200" />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={isSending || !newMessage.trim()}
                                    className="h-16 w-16 bg-slate-950 hover:bg-slate-800 text-white rounded-[1.5rem] shadow-2xl shadow-slate-200 active:scale-90 transition-all duration-300 flex items-center justify-center disabled:opacity-50"
                                >
                                    {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                                </Button>
                            </form>
                            <div className="mt-4 flex items-center justify-center gap-6">
                               <p className="text-[8px] font-bold text-slate-200 uppercase tracking-[0.2em] flex items-center gap-2">
                                  <ShieldCheck className="w-3 h-3" /> Secure Medical Communication
                               </p>
                               <p className="text-[8px] font-bold text-slate-200 uppercase tracking-[0.2em]">Clinical Communication Protocol v1.0.4</p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-20 animate-in fade-in zoom-in-95 duration-1000">
                        <div className="w-24 h-24 bg-slate-50 rounded-[3rem] flex items-center justify-center mb-10 shadow-inner">
                            <MessageSquare className="w-10 h-10 text-slate-100" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-950 tracking-tighter mb-4">Secure Messaging</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] max-w-xs leading-relaxed">Select a patient from the list to start a secure conversation.</p>

                        <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-md">
                           <div className="p-6 rounded-3xl bg-slate-50 border border-slate-50 flex flex-col items-start gap-3">
                              <Zap className="w-5 h-5 text-slate-200" />
                              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Low Latency Chat</p>
                           </div>
                           <div className="p-6 rounded-3xl bg-slate-50 border border-slate-50 flex flex-col items-start gap-3">
                              <ShieldCheck className="w-5 h-5 text-slate-200" />
                              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Verified Privacy</p>
                           </div>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    )
}
