'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import {
    LayoutDashboard,
    BarChart3,
    LineChart,
    PieChart,
    Table as TableIcon,
    ChevronDown,
    RefreshCw,
    Plus,
    Activity,
    Maximize2,
    Zap
} from 'lucide-react';


export default function DashboardsPage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [dashboards, setDashboards] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (selectedProjectId) {
            fetchDashboards(selectedProjectId);
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

    const fetchDashboards = async (projectId: string) => {
        setLoading(true);
        try {
            const { data } = await api.get(`/projects/${projectId}/dashboards`);
            setDashboards(data.dashboards || []);
        } catch (error) {
            console.error('Error fetching dashboards:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!selectedProjectId) return;
        setGenerating(true);
        try {
            await api.post(`/projects/${selectedProjectId}/dashboards/generate`, {});
            fetchDashboards(selectedProjectId);
        } catch (error) {
            console.error('Error generating dashboards:', error);
            alert('Error al generar el tablero. Asegúrate de tener datos capturados.');
        } finally {
            setGenerating(false);
        }
    };

    const getWidgetIcon = (type: string) => {
        switch (type) {
            case 'bar': return <BarChart3 className="h-5 w-5 text-blue-400" />;
            case 'line': return <LineChart className="h-5 w-5 text-purple-400" />;
            case 'pie': return <PieChart className="h-5 w-5 text-pink-400" />;
            case 'table': return <TableIcon className="h-5 w-5 text-emerald-400" />;
            case 'stat': return <Activity className="h-5 w-5 text-orange-400" />;
            default: return <LayoutDashboard className="h-5 w-5 text-gray-400" />;
        }
    };

    const activeDashboard = dashboards.find(d => d.is_active) || dashboards[0];

    return (
        <div className="flex h-screen bg-gray-950 text-white">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header title="Tableros de Mando" subtitle="Visualización dinámica de tus indicadores de negocio" />

                <main className="flex-1 overflow-auto p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/5 via-gray-950 to-gray-950">
                    <div className="max-w-7xl mx-auto space-y-8">

                        {/* Selector y Acciones */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="relative w-full md:w-80">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                                        Proyecto Global
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
                            </div>

                            <Button
                                onClick={handleGenerate}
                                disabled={generating || !selectedProjectId}
                                className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-6 rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                            >
                                {generating ? (
                                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-2 h-5 w-5" />
                                )}
                                {generating ? 'Actualizando Tablero...' : 'Actualizar Tablero con IA'}
                            </Button>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="h-16 w-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin mb-6" />
                                <p className="text-gray-400 font-medium animate-pulse">Reconstruyendo visualizaciones...</p>
                            </div>
                        ) : !activeDashboard ? (
                            <Card className="bg-gray-900/50 border-gray-800 border-dashed py-32 text-center">
                                <div className="mx-auto h-24 w-24 bg-gray-800 rounded-full flex items-center justify-center mb-8 shadow-inner">
                                    <LayoutDashboard className="h-12 w-12 text-gray-700" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">No hay un Tablero Configurado</h3>
                                <p className="text-gray-400 max-w-md mx-auto mb-10 text-lg">
                                    Haz clic en el botón superior para que nuestra IA analice tus datos y construya un tablero automático para ti.
                                </p>
                            </Card>
                        ) : (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-3xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                                            {activeDashboard.title}
                                        </h2>
                                        <p className="text-gray-500 mt-1 font-medium">Dashboard inteligente auto-generado por DataLive</p>
                                    </div>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                                        <Zap className="h-5 w-5 fill-current" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {activeDashboard.config?.widgets?.map((widget: any, idx: number) => (
                                        <Card key={idx} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-all group">
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                                <CardTitle className="text-md font-bold text-gray-200">
                                                    {widget.title}
                                                </CardTitle>
                                                <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-gray-700 transition-colors">
                                                    {getWidgetIcon(widget.type)}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                <div className="h-44 bg-gray-800/20 rounded-xl border border-gray-800/50 flex flex-col items-center justify-center gap-2 group-hover:bg-gray-800/30 transition-all relative overflow-hidden p-4">
                                                    {widget.data && widget.data.length > 0 ? (
                                                        <div className="w-full h-full flex items-end justify-around gap-2 pb-6">
                                                            {widget.data.map((item: any, i: number) => {
                                                                const maxValue = Math.max(...widget.data.map((d: any) => d.value || 0));
                                                                const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                                                                return (
                                                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group/bar h-full justify-end">
                                                                        <div
                                                                            className="w-full bg-blue-500/40 group-hover/bar:bg-blue-400 transition-all rounded-t-sm relative"
                                                                            style={{ height: `${height}%` }}
                                                                        >
                                                                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-gray-400 opacity-0 group-hover/bar:opacity-100 transition-opacity">
                                                                                {item.value}
                                                                            </span>
                                                                        </div>
                                                                        <span className="text-[8px] text-gray-500 font-medium truncate w-full text-center">
                                                                            {item.label}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="absolute inset-0 opacity-10 flex items-end justify-center gap-1 p-4">
                                                                {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                                                                    <div key={i} className="bg-blue-500 w-full" style={{ height: `${h}%` }} />
                                                                ))}
                                                            </div>
                                                            <div className="z-10 bg-gray-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-gray-700 shadow-xl">
                                                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                                                    <Activity className="h-3 w-3" /> Visualización Lista
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                <div className="flex items-end justify-between">
                                                    <div className="space-y-1">
                                                        <p className="text-xs text-gray-500 font-medium">{widget.description}</p>
                                                        {widget.current_value && (
                                                            <div className="flex items-baseline gap-2">
                                                                <span className="text-2xl font-black text-white">{widget.current_value}</span>
                                                                {widget.trend && (
                                                                    <span className={`text-[10px] font-bold ${widget.trend.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                        {widget.trend}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {widget.suggested_fields?.map((field: string, fidx: number) => (
                                                        <span key={fidx} className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded-md text-[9px] font-mono border border-gray-700">
                                                            {field}
                                                        </span>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}

                                    {/* Add Widget Mockup */}
                                    <button className="flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed border-gray-800 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-gray-600 hover:text-blue-400 group">
                                        <Plus className="h-10 w-10 mb-2 group-hover:scale-110 transition-transform" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Añadir Métrica Manual</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
