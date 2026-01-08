'use client';

import { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import {
    MessageSquare,
    Send,
    Plus,
    ChevronDown,
    Loader2,
    User,
    Bot,
    Database
} from 'lucide-react';

export default function ChatsPage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [chats, setChats] = useState<any[]>([]);
    const [activeChatId, setActiveChatId] = useState<string>('');
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [loadingChats, setLoadingChats] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (selectedProjectId) {
            fetchChats(selectedProjectId);
        }
    }, [selectedProjectId]);

    useEffect(() => {
        if (activeChatId) {
            fetchMessages(activeChatId);
        } else {
            setMessages([]);
        }
    }, [activeChatId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchProjects = async () => {
        try {
            const { data } = await api.get('/projects');
            setProjects(data.projects || []);
            if (data.projects?.length > 0) {
                setSelectedProjectId(data.projects[0].id);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const fetchChats = async (projectId: string) => {
        setLoadingChats(true);
        try {
            const { data } = await api.get(`/projects/${projectId}/chats`);
            setChats(data.chats || []);
            if (data.chats?.length > 0) {
                setActiveChatId(data.chats[0].id);
            } else {
                setActiveChatId('');
            }
        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            setLoadingChats(false);
        }
    };

    const fetchMessages = async (chatId: string) => {
        setLoadingMessages(true);
        try {
            const { data } = await api.get(`/projects/${selectedProjectId}/chats/${chatId}/messages`);
            setMessages(data.messages || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleCreateChat = async () => {
        if (!selectedProjectId) return;
        try {
            const name = `Chat ${chats.length + 1}`;
            const { data } = await api.post(`/projects/${selectedProjectId}/chats`, { name });
            setChats([data.chat, ...chats]);
            setActiveChatId(data.chat.id);
        } catch (error) {
            console.error('Error creating chat:', error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !activeChatId || sending) return;

        const userMsg = { role: 'user', content: inputText, created_at: new Date().toISOString() };
        setMessages([...messages, userMsg]);
        setInputText('');
        setSending(true);

        try {
            const { data } = await api.post(`/projects/${selectedProjectId}/chats/${activeChatId}/messages`, {
                content: inputText
            });
            setMessages(prev => [...prev, data.message]);
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Error al enviar el mensaje');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-950 text-white">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header title="AI Chats" subtitle="Conversa con tus datos en tiempo real" />

                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar de Chats */}
                    <aside className="w-80 border-r border-gray-800 flex flex-col bg-gray-900/50">
                        <div className="p-4 space-y-4">
                            <div className="relative">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                                    Proyecto Activo
                                </label>
                                <select
                                    value={selectedProjectId}
                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
                                >
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-7 h-4 w-4 text-gray-500 pointer-events-none" />
                            </div>

                            <Button
                                onClick={handleCreateChat}
                                className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-500 text-white"
                                variant="default"
                            >
                                <Plus className="h-4 w-4" /> Nuevo Chat
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {loadingChats ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
                                </div>
                            ) : chats.length === 0 ? (
                                <div className="text-center py-8 px-4">
                                    <p className="text-xs text-gray-500">No hay chats aún en este proyecto.</p>
                                </div>
                            ) : (
                                chats.map(chat => (
                                    <button
                                        key={chat.id}
                                        onClick={() => setActiveChatId(chat.id)}
                                        className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all flex items-center gap-3 ${activeChatId === chat.id
                                                ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                                                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                                            }`}
                                    >
                                        <MessageSquare className="h-4 w-4 flex-shrink-0" />
                                        <span className="truncate">{chat.name}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </aside>

                    {/* Área de Mensajes */}
                    <main className="flex-1 flex flex-col bg-gray-950 relative">
                        {!activeChatId ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                <div className="h-20 w-20 bg-gray-900 rounded-3xl flex items-center justify-center mb-6 border border-gray-800">
                                    <Bot className="h-10 w-10 text-blue-500" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Asistente DataLive</h3>
                                <p className="text-gray-500 max-w-sm">
                                    Selecciona un chat o crea uno nuevo para empezar a analizar tus datos técnicos con IA.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {loadingMessages ? (
                                        <div className="flex justify-center py-20">
                                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                        </div>
                                    ) : (
                                        messages.map((msg, i) => (
                                            <div
                                                key={i}
                                                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                            >
                                                <div className={`h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-blue-400 border border-gray-700'
                                                    }`}>
                                                    {msg.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                                                </div>
                                                <div className={`max-w-[70%] space-y-2`}>
                                                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                                            : 'bg-gray-900 text-gray-200 border border-gray-800 rounded-tl-none'
                                                        }`}>
                                                        {msg.content}
                                                    </div>
                                                    <span className="text-[10px] text-gray-600 px-1">
                                                        {new Date(msg.created_at).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    {sending && (
                                        <div className="flex gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-gray-800 text-blue-400 border border-gray-700 flex items-center justify-center">
                                                <Bot className="h-5 w-5" />
                                            </div>
                                            <div className="bg-gray-900 p-4 rounded-2xl rounded-tl-none border border-gray-800">
                                                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input de Mensaje */}
                                <div className="p-6 bg-gradient-to-t from-gray-950 via-gray-950 to-transparent">
                                    <form
                                        onSubmit={handleSendMessage}
                                        className="max-w-4xl mx-auto relative group"
                                    >
                                        <div className="absolute -top-10 left-0 flex items-center gap-2 text-[10px] text-blue-400 font-bold uppercase tracking-wider bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                                            <Database className="h-3 w-3" />
                                            Analizando capturas técnicas en tiempo real
                                        </div>
                                        <input
                                            type="text"
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                            placeholder="Pregunta algo sobre tus datos (ej: ¿Cuántos clientes activos hay?)"
                                            className="w-full bg-gray-900 border border-gray-800 text-white rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-2xl"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!inputText.trim() || sending}
                                            className="absolute right-3 top-2.5 h-11 w-11 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 transition-all shadow-lg"
                                        >
                                            <Send className="h-5 w-5" />
                                        </button>
                                    </form>
                                    <p className="text-center text-[10px] text-gray-600 mt-4">
                                        DataLive AI utiliza los datos capturados de tus APIs para generar respuestas precisas.
                                    </p>
                                </div>
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
