'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Save, Info, ChevronDown, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function SettingsPage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const models = [
        {
            id: 'gemini-2.5-flash',
            provider: 'Google',
            name: 'Gemini 2.5 Flash',
            description: 'Ultra-rápido y optimizado para análisis de gran volumen. Ideal para DataLive.',
            pricing: 'Económico',
            recommended: true
        },
        {
            id: 'haiku',
            provider: 'Anthropic',
            name: 'Claude 3.5 Haiku',
            description: 'Respuesta rápida y eficiente para tareas de descubrimiento sencillas.',
            pricing: 'Económico',
            recommended: false
        },
        {
            id: 'sonnet',
            provider: 'Anthropic',
            name: 'Claude 3.5 Sonnet',
            description: 'Máxima inteligencia y razonamiento para documentación compleja.',
            pricing: 'Premium',
            recommended: false
        }
    ];

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (selectedProjectId) {
            const project = projects.find(p => p.id === selectedProjectId);
            if (project?.settings?.ai_model) {
                setSelectedModel(project.settings.ai_model);
            }
        }
    }, [selectedProjectId, projects]);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/projects');
            setProjects(data.projects || []);
            if (data.projects?.length > 0) {
                setSelectedProjectId(data.projects[0].id);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedProjectId) return;

        try {
            setSaving(true);
            await api.put(`/projects/${selectedProjectId}`, {
                settings: {
                    ai_model: selectedModel,
                    language: 'es',
                    tone: 'commercial'
                }
            });
            setSaved(true);
            // Update local state
            setProjects(projects.map(p =>
                p.id === selectedProjectId
                    ? { ...p, settings: { ...p.settings, ai_model: selectedModel } }
                    : p
            ));
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Error al guardar la configuración');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-900 text-gray-100">
            <Sidebar />
            <div className="flex-1 overflow-auto">
                <Header title="Configuración Global" subtitle="Gestión de modelos de IA y preferencias del sistema" />

                <div className="p-8 max-w-4xl mx-auto space-y-8">

                    {/* Project Selection */}
                    <section className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <ChevronDown className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Proyecto a Configurar</h2>
                                <p className="text-sm text-gray-400">Selecciona qué proyecto quieres personalizar</p>
                            </div>
                        </div>

                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
                        >
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </section>

                    {/* AI Model Selection */}
                    <section className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <Info className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Cerebro de Inteligencia Artificial</h2>
                                <p className="text-sm text-gray-400">El modelo seleccionado procesará tus documentos y generará el chat</p>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            {models.map((model) => (
                                <div
                                    key={model.id}
                                    onClick={() => setSelectedModel(model.id)}
                                    className={`
                                        relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-200
                                        ${selectedModel === model.id
                                            ? 'border-blue-500 bg-blue-500/10'
                                            : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
                                        }
                                    `}
                                >
                                    {model.recommended && (
                                        <div className="absolute top-4 right-4 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                            Recomendado
                                        </div>
                                    )}

                                    <div className="flex gap-4">
                                        <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedModel === model.id ? 'border-blue-500 bg-blue-500' : 'border-gray-600'
                                            }`}>
                                            {selectedModel === model.id && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase">{model.provider}</span>
                                                <h3 className="text-lg font-bold text-white">{model.name}</h3>
                                            </div>
                                            <p className="text-gray-400 text-sm">{model.description}</p>

                                            <div className="mt-4 flex items-center gap-4 text-xs">
                                                <span className="text-gray-500">Tier: <span className="text-gray-300">{model.pricing}</span></span>
                                                <span className="text-blue-400 font-semibold cursor-pointer hover:underline">Ver detalles técnicos</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-4">
                        <div className="flex items-center gap-3">
                            {saved && (
                                <div className="flex items-center gap-2 text-green-400 font-bold text-sm animate-in fade-in slide-in-from-left-4">
                                    <CheckCircle2 className="w-5 h-5" />
                                    Configuración Aplicada Exitosamente
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`
                                flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all shadow-lg
                                ${saving
                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-105 active:scale-95'
                                }
                            `}
                        >
                            {saving ? 'Guardando...' : <><Save className="w-5 h-5" /> Guardar Cambios</>}
                        </button>
                    </div>

                    {/* Bottom Info */}
                    <div className="bg-gray-800/30 rounded-xl p-5 border border-gray-700/50">
                        <p className="text-xs text-gray-500 leading-relaxed">
                            <strong className="text-gray-400">Nota sobre persistencia:</strong> Esta configuración se guarda directamente en la base de datos de DataLive.
                            Cualquier cambio afectará inmediatamente a los servicios de análisis de documentos y al asistente de chat para este proyecto específico.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
