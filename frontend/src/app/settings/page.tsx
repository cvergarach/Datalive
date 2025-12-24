'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Save, Info } from 'lucide-react';

export default function SettingsPage() {
    const [selectedModel, setSelectedModel] = useState(
        typeof window !== 'undefined' ? localStorage.getItem('claude_model') || 'haiku' : 'haiku'
    );
    const [saved, setSaved] = useState(false);

    const models = [
        {
            id: 'haiku',
            name: 'Claude 3.5 Haiku',
            description: 'Rápido y económico - Ideal para pruebas y desarrollo',
            pricing: {
                input: '$0.80 por 1M tokens',
                output: '$4 por 1M tokens'
            },
            estimatedCost: '~$0.01 por 10 análisis',
            recommended: true
        },
        {
            id: 'sonnet',
            name: 'Claude 3.5 Sonnet',
            description: 'Mayor calidad - Mejor para documentación compleja',
            pricing: {
                input: '$3 por 1M tokens',
                output: '$15 por 1M tokens'
            },
            estimatedCost: '~$0.03 por 10 análisis',
            recommended: false
        }
    ];

    const handleSave = () => {
        localStorage.setItem('claude_model', selectedModel);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="flex h-screen">
            <Sidebar />
            <div className="flex-1 overflow-auto">
                <Header title="Configuración" subtitle="Personaliza tu experiencia con DataLive" />
                <div className="p-6 max-w-4xl">
                    {/* Claude Model Selection */}
                    <div className="bg-gray-800 rounded-lg p-6 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-xl font-semibold text-white">Modelo de IA</h2>
                            <div className="group relative">
                                <Info className="w-5 h-5 text-gray-400 cursor-help" />
                                <div className="absolute left-0 top-6 w-64 bg-gray-900 text-sm text-gray-300 p-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    Selecciona el modelo de Claude que se utilizará para analizar documentación de APIs
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {models.map((model) => (
                                <div
                                    key={model.id}
                                    onClick={() => setSelectedModel(model.id)}
                                    className={`
                    relative p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${selectedModel === model.id
                                            ? 'border-yellow-400 bg-yellow-400/10'
                                            : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                                        }
                  `}
                                >
                                    {model.recommended && (
                                        <div className="absolute top-2 right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded">
                                            RECOMENDADO
                                        </div>
                                    )}

                                    <div className="flex items-start gap-4">
                                        <input
                                            type="radio"
                                            checked={selectedModel === model.id}
                                            onChange={() => setSelectedModel(model.id)}
                                            className="mt-1 w-4 h-4 text-yellow-400 focus:ring-yellow-400"
                                        />

                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-white mb-1">{model.name}</h3>
                                            <p className="text-gray-400 text-sm mb-3">{model.description}</p>

                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-500">Entrada</p>
                                                    <p className="text-gray-300">{model.pricing.input}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Salida</p>
                                                    <p className="text-gray-300">{model.pricing.output}</p>
                                                </div>
                                            </div>

                                            <div className="mt-3 pt-3 border-t border-gray-700">
                                                <p className="text-xs text-gray-500">Costo estimado</p>
                                                <p className="text-sm font-semibold text-yellow-400">{model.estimatedCost}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
                        >
                            <Save className="w-5 h-5" />
                            Guardar Configuración
                        </button>

                        {saved && (
                            <div className="text-green-400 font-medium animate-fade-in">
                                ✓ Configuración guardada
                            </div>
                        )}
                    </div>

                    {/* Info Box */}
                    <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <div className="flex gap-3">
                            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-gray-300">
                                <p className="font-semibold text-blue-400 mb-1">Nota sobre los costos</p>
                                <p>
                                    Los costos mostrados son estimaciones basadas en análisis típicos de documentación API.
                                    El costo real puede variar según la complejidad y tamaño de los documentos.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
