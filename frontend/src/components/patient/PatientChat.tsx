"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { usePatientAuth } from "@/lib/auth-guard"
import { Send, User, Bot, Loader2, ShieldCheck, Zap, MessageSquare, Clock } from "lucide-react"
import { api } from "@/lib/api"

interface Message {
    id: string
    patientId: string
    doctorId?: string
    senderRole: 'patient' | 'doctor'
    content: string
    createdAt: string
    isRead: boolean
}

export default function PatientChat() {
    const { profile } = usePatientAuth()
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (profile?.id) {
            loadMessages()
            const interval = setInterval(loadMessages, 10000)
            return () => clearInterval(interval)
        }
    }, [profile?.id])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const loadMessages = async () => {
        try {
            const data = await api.get<Message[]>(`/messages/patient/${profile?.id}`)
            if (data) {
                setMessages(data)
                setIsLoading(false)
            }
        } catch (error) {
            console.error('Error loading messages:', error)
            setIsLoading(false)
        }
    }

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !profile?.id) return

        setIsSending(true)
        try {
            const messageData = {
                patient_id: profile.id,
                sender_role: 'patient',
                content: newMessage
            }

            await api.post('/messages/send', messageData)
            setNewMessage("")
            await loadMessages()
        } catch (error) {
            console.error('Error sending message:', error)
        } finally {
            setIsSending(false)
        }
    }

    return (
        <Card className="flex flex-col h-[calc(100vh-250px)] bg-white border-none shadow-sm rounded-[3rem] overflow-hidden border border-slate-50 relative">
            {/* Communication Header */}
            <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm overflow-hidden group">
                        <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Doctor`}
                            alt="Doctor"
                            className="w-10 h-10 object-contain group-hover:scale-110 transition-transform"
                        />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-xl font-black text-slate-950 tracking-tight leading-none">
                            Clinical Support Team
                        </h2>
                        <p className="text-[9px] text-emerald-500 font-black uppercase tracking-[0.3em] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Secure Direct Channel
                        </p>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">End-to-End Encrypted</span>
                </div>
            </div>

            {}
            <ScrollArea className="flex-1 p-10 bg-slate-50/30" ref={scrollRef}>
                <div className="space-y-10 max-w-4xl mx-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Accessing Care Logs...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-20 px-8">
                            <div className="w-20 h-20 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-sm">
                                <MessageSquare className="w-8 h-8 text-slate-100" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Establish Communication</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] max-w-xs mx-auto leading-relaxed">Initiate a secure dialogue with your clinical care team for support or inquiries.</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.senderRole === 'patient' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-700`}
                            >
                                <div className={`flex flex-col ${msg.senderRole === 'patient' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                                    <div
                                        className={`
                                            rounded-[2rem] px-8 py-5 shadow-sm transition-all hover:shadow-xl
                                            ${msg.senderRole === 'patient'
                                                ? 'bg-slate-950 text-white rounded-br-none shadow-slate-200'
                                                : 'bg-white text-slate-900 border border-slate-100 rounded-bl-none'
                                            }
                                        `}
                                    >
                                        <p className="text-sm font-bold leading-relaxed">{msg.content}</p>
                                    </div>
                                    <div className="flex items-center gap-2 mt-3 px-3">
                                        <Clock className="w-2.5 h-2.5 text-slate-300" />
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${msg.senderRole === 'patient' ? 'text-slate-300' : 'text-slate-400'}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {msg.senderRole === 'patient' && <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            {}
            <div className="p-10 bg-white border-t border-slate-50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.03)]">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                    className="flex items-center gap-6 max-w-5xl mx-auto"
                >
                    <div className="flex-1 relative group">
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="TRANSMIT MESSAGE TO CLINICAL TEAM..."
                            className="h-16 bg-slate-50 border-none rounded-[1.5rem] px-8 font-black text-[10px] uppercase tracking-widest text-slate-950 focus-visible:ring-slate-100 ring-offset-0 placeholder:text-slate-200 transition-all group-focus-within:bg-white group-focus-within:shadow-2xl group-focus-within:border group-focus-within:border-slate-50"
                            disabled={isSending}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                            <Zap className="w-4 h-4 text-slate-100 group-focus-within:text-emerald-400 transition-colors" />
                        </div>
                    </div>
                    <Button
                        type="submit"
                        disabled={isSending || !newMessage.trim()}
                        className="bg-slate-950 hover:bg-slate-800 text-white rounded-[1.5rem] w-16 h-16 p-0 flex items-center justify-center shrink-0 shadow-2xl shadow-slate-200 transition-all duration-300 active:scale-90 disabled:opacity-50"
                    >
                        {isSending ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <Send className="w-6 h-6" />
                        )}
                    </Button>
                </form>
                <div className="mt-6 flex items-center justify-center gap-6 opacity-30">
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                        <ShieldCheck className="w-2.5 h-2.5" /> RSA-4096 Transmit Active
                    </p>
                    <div className="w-1 h-1 bg-slate-200 rounded-full" />
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.3em]">Patient Communication Core 1.2.0</p>
                </div>
            </div>
        </Card>
    )
}
