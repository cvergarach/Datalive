'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import {
    TrendingUp,
    AlertCircle,
    Zap,
    Lightbulb,
    ChevronDown,
    RefreshCw,
    CheckCircle2,
    Calendar,
    Target
} from 'lucide-react';

export default function InsightsPage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [insights, setInsights] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (selectedProjectId) {
            fetchInsights(selectedProjectId);
        }
    }, [selectedProjectId]);

    const fetchProjects = async () => {
        try {
            const { data } = await api.get('/projects');
            setProjects(data.projects || []);
            if (data.projects?.length > 0 && !selectedProjectId) {
                setSelectedProjectId(data.projects[0].id);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const fetchInsights = async (projectId: string) => {
        setLoading(true);
        try {
            const { data } = await api.get(`/projects/${projectId}/insights`);
            setInsights(data.insights || []);
        } catch (error) {
            console.error('Error fetching insights:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!selectedProjectId) return;
        setGenerating(true);
        try {
            // Fetch recent data IDs for context if needed, but the backend is now updated to fetch content
            await api.post(`/projects/${selectedProjectId}/insights/generate`, {
                data_ids: [] // The backend will now auto-fetch if empty or use recent ones
            });
            fetchInsights(selectedProjectId);
        } catch (error) {
            console.error('Error generating insights:', error);
            alert('Error al generar insights. Asegúrate de tener datos capturados.');
        } finally {
            setGenerating(false);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'trend': return <TrendingUp className="h-5 w-5 text-blue-400" />;
            case 'anomaly': return <AlertCircle className="h-5 w-5 text-red-400" />;
            case 'recommendation': return <Zap className="h-5 w-5 text-yellow-400" />;
            case 'correlation': return <Target className="h-5 w-5 text-purple-400" />;
            default: return <Lightbulb className="h-5 w-5 text-green-400" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'trend': return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
            case 'anomaly': return 'bg-red-500/10 border-red-500/20 text-red-400';
            case 'recommendation': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
            case 'correlation': return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
            default: return 'bg-green-500/10 border-green-500/20 text-green-400';
        }
    };

    return (
        <div className="flex h-screen bg-gray-950 text-white">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header title="Business Insights" subtitle="Inteligencia estratégica derivada de tus APIs" />

                <main className="flex-1 overflow-auto p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-gray-950 to-gray-950">
                    <div className="max-w-6xl mx-auto space-y-8">

                        {/* Project Selector & Global Actions */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="relative w-full md:w-80">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                                    Proyecto Seleccionado
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedProjectId}
                                        onChange={(e) => setSelectedProjectId(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
                                    >
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                                </div>
                            </div>

                            <Button
                                onClick={handleGenerate}
                                disabled={generating || !selectedProjectId}
                                className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-6 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                            >
                                {generating ? (
                                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <Zap className="mr-2 h-5 w-5 fill-current" />
                                )}
                                {generating ? 'Analizando Datos...' : 'Generar Nuevos Insights'}
                            </Button>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="h-16 w-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin mb-6" />
                                <p className="text-gray-400 font-medium animate-pulse text-lg">Consultando al Analista AI...</p>
                            </div>
                        ) : insights.length === 0 ? (
                            <Card className="bg-gray-900/50 border-gray-800 border-dashed py-24 text-center">
                                <div className="mx-auto h-24 w-24 bg-gray-800 rounded-3xl flex items-center justify-center mb-8 rotate-3 shadow-xl">
                                    <Lightbulb className="h-12 w-12 text-gray-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">Sin Insights Disponibles</h3>
                                <p className="text-gray-400 max-w-md mx-auto mb-10 text-lg leading-relaxed">
                                    DataLive aún no ha generado hallazgos para este proyecto. Ejecuta tus APIs para recolectar datos y presiona el botón de generar.
                                </p>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {insights.map((insight) => (
                                    <Card key={insight.id} className="bg-gray-900 border-gray-800 hover:border-blue-500/50 transition-all duration-300 group overflow-hidden">
                                        <CardHeader className="pb-4">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getTypeColor(insight.type)}`}>
                                                    {insight.type}
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(insight.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className={`mt-1 p-2 rounded-lg ${getTypeColor(insight.type)} shrink-0`}>
                                                    {getTypeIcon(insight.type)}
                                                </div>
                                                <CardTitle className="text-xl group-hover:text-blue-400 transition-colors">
                                                    {insight.title}
                                                </CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <p className="text-gray-400 leading-relaxed">
                                                {insight.description}
                                            </p>

                                            {insight.metadata?.actionable_next_step && (
                                                <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Recomendación de Acción</span>
                                                    </div>
                                                    <p className="text-sm text-gray-300">
                                                        {insight.metadata.actionable_next_step}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500"
                                                            style={{ width: `${(insight.confidence || 0.8) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                                                        {(insight.confidence || 0.8) * 100}% Confianza
                                                    </span>
                                                </div>

                                                {insight.metadata?.auto_generated && (
                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                                                        <Zap className="h-3 w-3 fill-current" /> Auto-Capturado
                                                    </span>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
