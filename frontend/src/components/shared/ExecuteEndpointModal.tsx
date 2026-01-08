'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, CheckCircle2, AlertCircle, Zap, Code } from 'lucide-react';

interface ExecuteEndpointModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (result: any) => void;
    projectId: string;
    apiId: string;
    endpoint: {
        id: string;
        method: string;
        path: string;
        description: string;
        parameters?: Array<{
            name: string;
            type: string;
            required: boolean;
            description: string;
            example?: string;
        }>;
    };
}

export function ExecuteEndpointModal({
    isOpen,
    onClose,
    onSuccess,
    projectId,
    apiId,
    endpoint
}: ExecuteEndpointModalProps) {
    const [params, setParams] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<any>(null);

    const handleExecute = async () => {
        try {
            setLoading(true);
            setError(null);
            setResult(null);

            const { data } = await api.post(`/projects/${projectId}/apis/${apiId}/execute`, {
                endpoint_ids: [endpoint.id],
                parameters: params
            });

            setResult(data);
            setTimeout(() => {
                onSuccess(data);
                onClose();
            }, 2000);
        } catch (error: any) {
            console.error('Error executing endpoint:', error);
            setError(error.response?.data?.error || 'Failed to execute endpoint');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const requiredParams = endpoint.parameters?.filter(p => p.required) || [];
    const optionalParams = endpoint.parameters?.filter(p => !p.required) || [];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
                <CardHeader>
                    <div className="flex items-center gap-3 text-blue-600 mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Zap className="h-5 w-5 fill-current" />
                        </div>
                        <CardTitle className="text-xl font-bold">Solicitud de Operación</CardTitle>
                    </div>
                    <CardDescription>
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-gray-900">{endpoint.description || 'Procesar Solicitud'}</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                    {endpoint.method}
                                </span>
                                <span className="text-[10px] font-mono text-gray-400 truncate max-w-sm">
                                    {endpoint.path}
                                </span>
                            </div>
                        </div>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {requiredParams.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                Datos Requeridos
                            </h3>
                            {requiredParams.map((param) => (
                                <div key={param.name} className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        {param.name}
                                        <span className="text-xs text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                        placeholder={param.example || `Ingrese ${param.name}`}
                                        value={params[param.name] || ''}
                                        onChange={(e) => setParams({ ...params, [param.name]: e.target.value })}
                                    />
                                    <p className="text-[11px] text-gray-500 italic">{param.description}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {optionalParams.length > 0 && (
                        <div className="space-y-3 pt-2">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                Datos Opcionales
                            </h3>
                            {optionalParams.map((param) => (
                                <div key={param.name} className="space-y-2">
                                    <label className="text-sm font-medium text-gray-600">{param.name}</label>
                                    <input
                                        type="text"
                                        className="flex h-11 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                        placeholder={param.example || `Ingrese ${param.name} (opcional)`}
                                        value={params[param.name] || ''}
                                        onChange={(e) => setParams({ ...params, [param.name]: e.target.value })}
                                    />
                                    <p className="text-[11px] text-gray-500 italic">{param.description}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {endpoint.parameters?.length === 0 && (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700 flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            Este servicio no requiere parámetros adicionales para su ejecución.
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    {result && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span className="font-semibold">¡Ejecución Exitosa!</span>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 bg-white border-green-200 text-green-700 hover:bg-green-50"
                                    onClick={() => window.location.href = '/data'}
                                >
                                    Ir a Sección de Datos
                                </Button>
                            </div>
                            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto border border-gray-700">
                                <pre>{JSON.stringify(result, null, 2)}</pre>
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-end gap-3 bg-gray-50/80 p-6 rounded-b-2xl border-t border-gray-100">
                    <Button variant="ghost" onClick={onClose} disabled={loading} className="text-gray-500 hover:text-gray-900 font-medium">
                        Cancelar
                    </Button>
                    <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 h-11 rounded-xl shadow-sm hover:shadow-md transition-all transform hover:scale-[1.02] active:scale-95"
                        onClick={handleExecute}
                        disabled={loading || requiredParams.some(p => !params[p.name])}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-4 animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            <>
                                <Zap className="mr-2 h-5 w-4 fill-white" />
                                Ejecutar Acción
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
