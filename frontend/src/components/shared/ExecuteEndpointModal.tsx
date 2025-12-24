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
                    <div className="flex items-center gap-2 text-primary mb-2">
                        <Zap className="h-5 w-5" />
                        <CardTitle>Execute Endpoint</CardTitle>
                    </div>
                    <CardDescription>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${endpoint.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                                        endpoint.method === 'POST' ? 'bg-green-100 text-green-700' :
                                            endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 text-gray-700'
                                    }`}>
                                    {endpoint.method}
                                </span>
                                <span className="font-mono text-sm">{endpoint.path}</span>
                            </div>
                            <p className="text-xs text-gray-600">{endpoint.description}</p>
                        </div>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {requiredParams.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                Required Parameters
                            </h3>
                            {requiredParams.map((param) => (
                                <div key={param.name} className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        {param.name}
                                        <span className="text-xs text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        placeholder={param.example || `Enter ${param.name}`}
                                        value={params[param.name] || ''}
                                        onChange={(e) => setParams({ ...params, [param.name]: e.target.value })}
                                    />
                                    <p className="text-xs text-gray-500">{param.description}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {optionalParams.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                Optional Parameters
                            </h3>
                            {optionalParams.map((param) => (
                                <div key={param.name} className="space-y-2">
                                    <label className="text-sm font-medium">{param.name}</label>
                                    <input
                                        type="text"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        placeholder={param.example || `Enter ${param.name} (optional)`}
                                        value={params[param.name] || ''}
                                        onChange={(e) => setParams({ ...params, [param.name]: e.target.value })}
                                    />
                                    <p className="text-xs text-gray-500">{param.description}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {endpoint.parameters?.length === 0 && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                            ✅ No parameters required for this endpoint
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    {result && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="font-semibold">Execution Successful!</span>
                            </div>
                            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                                <pre>{JSON.stringify(result, null, 2)}</pre>
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-end gap-2 bg-gray-50 dark:bg-gray-800/50 p-4">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleExecute}
                        disabled={loading || requiredParams.some(p => !params[p.name])}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Executing...
                            </>
                        ) : (
                            <>
                                <Zap className="mr-2 h-4 w-4" />
                                Execute
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
