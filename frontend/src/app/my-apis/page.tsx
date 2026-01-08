'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import {
    Globe,
    Settings,
    ChevronRight,
    ChevronDown,
    Shield,
    Zap,
    Database,
    Search,
    CheckCircle2,
    AlertCircle,
    Plus,
    Lightbulb
} from 'lucide-react';
import { ConfigureApiModal } from '@/components/shared/ConfigureApiModal';
import { ExecuteEndpointModal } from '@/components/shared/ExecuteEndpointModal';

export default function APIsPage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [apis, setApis] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedApi, setExpandedApi] = useState<string | null>(null);

    // Configuration state
    const [configModalOpen, setConfigModalOpen] = useState(false);
    const [apiToConfigure, setApiToConfigure] = useState<any | null>(null);

    // Execute state
    const [executeModalOpen, setExecuteModalOpen] = useState(false);
    const [endpointToExecute, setEndpointToExecute] = useState<any | null>(null);
    const [selectedApiForExecution, setSelectedApiForExecution] = useState<string | null>(null);

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (selectedProjectId) {
            fetchApis(selectedProjectId);
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

    const fetchApiDetails = async (apiId: string, projectIdOverride?: string) => {
        const projectId = projectIdOverride || selectedProjectId;
        try {
            const { data } = await api.get(`/projects/${projectId}/apis/${apiId}`);
            // Update the apis state with the detailed info using functional update to ensure consistency
            setApis(prev => prev.map(a => a.id === apiId ? { ...a, endpoints: data.api.api_endpoints } : a));
        } catch (error) {
            console.error('Error fetching API details:', error);
        }
    };

    const toggleExpand = (apiId: string) => {
        if (expandedApi === apiId) {
            setExpandedApi(null);
        } else {
            setExpandedApi(apiId);
            // Fetch details if not already loaded
            const apiItem = apis.find(a => a.id === apiId);
            if (apiItem && !apiItem.endpoints) {
                fetchApiDetails(apiId);
            }
        }
    };

    const fetchApis = async (projectId: string) => {
        setLoading(true);
        try {
            const { data } = await api.get(`/projects/${projectId}/apis`);
            const discoveredApis = data.apis || [];
            setApis(discoveredApis);

            // Automatically fetch capabilities for each service
            discoveredApis.forEach((apiItem: any) => {
                fetchApiDetails(apiItem.id, projectId);
            });
        } catch (error) {
            console.error('Error fetching APIs:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-50/50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header title="Catálogo de Servicios" subtitle="Descubre y gestiona las capacidades inteligentes de tu proyecto" />

                <main className="flex-1 overflow-auto p-6">
                    <div className="max-w-6xl mx-auto space-y-6">

                        {/* Project Selector */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="relative w-full sm:w-64">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">
                                    Proyecto Seleccionado
                                </label>                                <select
                                    value={selectedProjectId}
                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                                >
                                    <option value="" disabled>Seleccione un proyecto</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-[34px] h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>

                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="rounded-lg text-gray-600 border-gray-200" onClick={() => fetchApis(selectedProjectId)}>
                                    <Zap className="mr-2 h-4 w-4" /> Actualizar Catálogo
                                </Button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                                <div className="h-12 w-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin mb-4" />
                                <p className="text-gray-500 font-medium">Buscando capacidades inteligentes...</p>
                            </div>
                        ) : apis.length === 0 ? (
                            <Card className="border-dashed py-20 text-center">
                                <div className="mx-auto h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                    <Globe className="h-10 w-10 text-gray-300" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No hay servicios descubiertos</h3>
                                <p className="text-gray-500 max-w-md mx-auto mb-8">
                                    Suba documentación técnica (PDF, TXT, JSON) en la sección de Documentos para activar el descubrimiento inteligente.
                                </p>
                                <Button className="rounded-xl px-8" onClick={() => window.location.href = '/documents'}>
                                    Ir a Documentos
                                </Button>
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {apis.map((apiItem) => (
                                    <Card key={apiItem.id} className="overflow-hidden border-gray-200 hover:border-primary/30 transition-all duration-300">
                                        <div className="p-5">
                                            <div className="flex items-start justify-between">
                                                <div className="flex gap-4">
                                                    <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                                                        <Globe className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="text-lg font-bold text-gray-900">{apiItem.name || 'Servicio Externo'}</h3>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${apiItem.api_configurations?.[0]?.is_active
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : 'bg-orange-100 text-orange-600'
                                                                }`}>
                                                                {apiItem.api_configurations?.[0]?.is_active ? 'Conectado' : 'Pendiente de Credenciales'}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-500 font-medium font-mono">{apiItem.base_url}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg"
                                                        onClick={() => {
                                                            setApiToConfigure(apiItem);
                                                            setConfigModalOpen(true);
                                                        }}
                                                    >
                                                        <Settings className="mr-2 h-4 w-4" /> Configurar Credenciales
                                                    </Button>
                                                </div>
                                            </div>

                                            {apiItem.description && (
                                                <p className="mt-6 text-sm text-gray-600 leading-relaxed bg-slate-50/50 p-5 rounded-xl border border-slate-100 italic">
                                                    {apiItem.description}
                                                </p>
                                            )}

                                            {/* Executive Capability Summary */}
                                            {apiItem.execution_strategy && (
                                                <div className="mt-8 bg-blue-50/20 rounded-2xl p-6 border border-blue-100/30">
                                                    <div className="flex items-center gap-3 text-blue-600 font-bold text-xs uppercase tracking-widest mb-3">
                                                        <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                                                            <Lightbulb className="h-3.5 w-3.5" />
                                                        </div>
                                                        Potencial de Automatización
                                                    </div>
                                                    <p className="text-sm text-gray-700 leading-relaxed">
                                                        {apiItem.execution_strategy.length > 250
                                                            ? apiItem.execution_strategy.substring(0, 250) + "..."
                                                            : apiItem.execution_strategy}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="px-5 pb-5">
                                            <div className="border-t border-gray-100 pt-8">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 px-2">Capacidades Disponibles de Negocio</h4>

                                                <div className="grid gap-3">
                                                    {!apiItem.endpoints ? (
                                                        <div className="py-10 text-center text-gray-400 italic">
                                                            Identificando acciones de negocio...
                                                        </div>
                                                    ) : apiItem.endpoints.length === 0 ? (
                                                        <div className="py-10 text-center text-gray-400 italic">
                                                            No se detectaron acciones automáticas para este servicio.
                                                        </div>
                                                    ) : (
                                                        apiItem.endpoints.map((ep: any) => (
                                                            <div key={ep.id} className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 bg-white border border-gray-100 rounded-2xl hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all group">
                                                                <div className="flex items-center gap-4 flex-1">
                                                                    <div className={`p-3 rounded-xl ${ep.method === 'GET' ? 'bg-blue-50 text-blue-600' :
                                                                        ep.method === 'POST' ? 'bg-indigo-50 text-indigo-600' :
                                                                            'bg-slate-50 text-slate-500'
                                                                        }`}>
                                                                        {ep.category === 'auth' ? <Shield className="h-5 w-5" /> :
                                                                            ep.category === 'data_fetch' ? <Database className="h-5 w-5" /> :
                                                                                <Zap className="h-5 w-5" />}
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <h5 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{ep.description || 'Acción de Sistema'}</h5>
                                                                        <p className="text-xs text-gray-500 leading-relaxed pr-8">
                                                                            {ep.execution_steps || 'Permite procesar información y automatizar tareas operativas de forma segura.'}
                                                                        </p>
                                                                        <div className="pt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <span className="text-[10px] uppercase font-mono bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded border border-gray-100">
                                                                                {ep.method} • {ep.path}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-4">
                                                                    <span className="hidden md:flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                                                                        LISTO
                                                                    </span>
                                                                    <Button
                                                                        onClick={() => {
                                                                            setEndpointToExecute(ep);
                                                                            setSelectedApiForExecution(apiItem.id);
                                                                            setExecuteModalOpen(true);
                                                                        }}
                                                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl px-10 py-7 h-auto shadow-xl shadow-blue-500/20 transition-all border-none transform hover:-translate-y-1 active:translate-y-0"
                                                                    >
                                                                        <Zap className="mr-2 h-5 w-5 fill-white" />
                                                                        Ejecutar Acción
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </main>

                {/* Configure API Modal */}
                {apiToConfigure && (
                    <ConfigureApiModal
                        isOpen={configModalOpen}
                        onClose={() => {
                            setConfigModalOpen(false);
                            setApiToConfigure(null);
                        }}
                        onSuccess={() => {
                            fetchApis(selectedProjectId);
                        }}
                        projectId={selectedProjectId}
                        apiItem={apiToConfigure}
                    />
                )}

                {/* Execute Endpoint Modal */}
                {endpointToExecute && selectedApiForExecution && (
                    <ExecuteEndpointModal
                        isOpen={executeModalOpen}
                        onClose={() => {
                            setExecuteModalOpen(false);
                            setEndpointToExecute(null);
                            setSelectedApiForExecution(null);
                        }}
                        onSuccess={(result) => {
                            console.log('Execution result:', result);
                            // Optionally refresh data or show success message
                        }}
                        projectId={selectedProjectId}
                        apiId={selectedApiForExecution}
                        endpoint={endpointToExecute}
                    />
                )}
            </div>
        </div>
    );
}

