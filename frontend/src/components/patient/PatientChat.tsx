"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { usePatientAuth } from "@/lib/auth-guard"
import { Send, User, Bot, Loader2 } from "lucide-react"
import { api } from "@/lib/api"

interface Message {
    id: string
    patient_id: string
    doctor_id?: string
    sender_role: 'patient' | 'doctor'
    content: string
    created_at: string
    is_read: boolean
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
            // Poll for new messages every 10 seconds
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
            // Assume api.get is set up in database-service to hit backend
            // If not, we might need a direct fetch or update database-service
            // For now, using api.get assuming it calls /api/messages/patient/:id
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
            await loadMessages() // Refresh immediately
        } catch (error) {
            console.error('Error sending message:', error)
        } finally {
            setIsSending(false)
        }
    }

    return (
        <Card className="flex flex-col h-[calc(100vh-120px)] bg-white shadow-sm border border-gray-200">
            <div className="p-4 border-b flex items-center justify-between bg-white rounded-t-lg">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Bot className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-900">Dr. {profile?.patient_data?.assignedDoctor || 'Support Team'}</h2>
                        <p className="text-xs text-green-600 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span>
                            Online
                        </p>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1 p-4 bg-gray-50" ref={scrollRef}>
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            <p>No messages yet.</p>
                            <p className="text-sm">Start a conversation with your doctor.</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender_role === 'patient' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`
                                        max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm
                                        ${msg.sender_role === 'patient'
                                            ? 'bg-green-600 text-white rounded-br-none'
                                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                        }
                                    `}
                                >
                                    <p>{msg.content}</p>
                                    <p className={`text-[10px] mt-1 ${msg.sender_role === 'patient' ? 'text-green-100' : 'text-gray-400'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            <div className="p-4 bg-white border-t">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                    className="flex items-center gap-2"
                >
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                        disabled={isSending}
                    />
                    <Button
                        type="submit"
                        disabled={isSending || !newMessage.trim()}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-full w-10 h-10 p-0 flex items-center justify-center shrink-0 shadow-md transition-all hover:scale-105 active:scale-95"
                    >
                        {isSending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5 ml-0.5" />
                        )}
                    </Button>
                </form>
            </div>
        </Card>
    )
}
