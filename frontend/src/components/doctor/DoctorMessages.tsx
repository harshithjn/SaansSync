"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, MessageSquare, Send, User } from "lucide-react"
import { api } from "@/lib/api"
import { useDoctorAuth } from "@/lib/auth-guard"

interface Thread {
    id: string
    content: string
    created_at: string
    patient_id: string
    sender_role: 'patient' | 'doctor'
    is_read: boolean
    patient: {
        id: string
        full_name: string
    }
}

interface Message {
    id: string
    content: string
    sender_role: 'patient' | 'doctor'
    created_at: string
}

export default function DoctorMessages() {
    const { user, profile } = useDoctorAuth()
    const doctor = profile || user // Prefer profile (DB record) over user (Auth)
    // Note: profile.id and user.id SHOULD be the same if everything is synced, 
    // but profile confirms DB existence.
    const [threads, setThreads] = useState<Thread[]>([])
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
    const [activeConversation, setActiveConversation] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)

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

    const loadThreads = async () => {
        try {
            const data = await api.get<Thread[]>(`/messages/doctor/threads?doctorId=${doctor?.id}`)
            if (data) {
                // Group by patient and take latest
                // The backend returns a flat list of messages sorted by date desc
                // We need to deduplicate by patient_id to show threads
                const uniqueThreads = data.reduce((acc: Thread[], curr) => {
                    if (!acc.find(t => t.patient_id === curr.patient_id)) {
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
            await loadThreads() // Refresh latest message preview
        } catch (error) {
            console.error('Error sending message:', error)
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
            {/* Thread List */}
            <Card className="col-span-1 border-r bg-white flex flex-col">
                <div className="p-4 border-b">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Inbox
                    </h2>
                </div>
                <ScrollArea className="flex-1">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                    ) : threads.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 p-4">
                            No messages found.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {threads.map(thread => (
                                <div
                                    key={thread.id}
                                    onClick={() => setSelectedPatientId(thread.patient_id)}
                                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedPatientId === thread.patient_id ? 'bg-blue-50' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-medium text-gray-900">{thread.patient?.full_name || 'Unknown Patient'}</span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(thread.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 truncate">{thread.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </Card>

            {/* Chat Area */}
            <Card className="col-span-1 md:col-span-2 flex flex-col bg-white">
                {selectedPatientId ? (
                    <>
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900">
                                        {threads.find(t => t.patient_id === selectedPatientId)?.patient?.full_name}
                                    </h3>
                                    <p className="text-xs text-green-600">Patient ID: {selectedPatientId}</p>
                                </div>
                            </div>
                        </div>

                        <ScrollArea className="flex-1 p-4">
                            <div className="space-y-4">
                                {activeConversation.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.sender_role === 'doctor' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.sender_role === 'doctor'
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                                            }`}>
                                            <p>{msg.content}</p>
                                            <p className={`text-[10px] mt-1 text-right ${msg.sender_role === 'doctor' ? 'text-blue-100' : 'text-gray-400'}`}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <div className="p-4 border-t bg-white rounded-b-lg">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                                className="flex gap-2"
                            >
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your reply..."
                                    className="flex-1"
                                    disabled={isSending}
                                />
                                <Button type="submit" disabled={isSending || !newMessage.trim()} className="bg-blue-600 hover:bg-blue-700">
                                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                        <p>Select a conversation to start messaging</p>
                    </div>
                )}
            </Card>
        </div>
    )
}
