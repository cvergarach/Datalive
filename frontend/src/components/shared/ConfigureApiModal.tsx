'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Settings, Loader2, CheckCircle2, AlertCircle, Key, Shield } from 'lucide-react';

interface ConfigureApiModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (config: any) => void;
    projectId: string;
    apiItem: {
        id: string;
        name: string;
        auth_type: string;
        base_url: string;
        auth_details?: {
            guide?: string;
        };
    };
}

export function ConfigureApiModal({
    isOpen,
    onClose,
    onSuccess,
    projectId,
    apiItem
}: ConfigureApiModalProps) {
    const [credentials, setCredentials] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleConfigure = async () => {
        try {
            setLoading(true);
            setError(null);
            setTestResult(null);

            const { data } = await api.post(`/projects/${projectId}/apis/${apiItem.id}/configure`, {
                credentials
            });

            if (data.config.test_status === 'success') {
                setTestResult({ success: true, message: data.message });
                setTimeout(() => {
                    onSuccess(data.config);
                    onClose();
                }, 1500);
            } else {
                setTestResult({ success: false, message: 'Configuration saved, but connection test failed.' });
            }
        } catch (error: any) {
            console.error('Error configuring API:', error);
            setError(error.response?.data?.error || 'Failed to configure API');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const renderAuthFields = () => {
        const type = apiItem.auth_type?.toLowerCase() || 'api_key';

        if (type === 'api_key' || type === 'bearer') {
            return (
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Key className="h-4 w-4 text-gray-400" />
                        {type === 'api_key' ? 'API Key' : 'Access Token'}
                    </label>
                    <input
                        type="password"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder={type === 'api_key' ? 'Enter API Key' : 'Enter Bearer Token'}
                        value={credentials.api_key || ''}
                        onChange={(e) => setCredentials({ ...credentials, api_key: e.target.value })}
                        autoFocus
                    />
                </div>
            );
        }

        return (
            <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500 italic">
                No extra parameters required for {type} auth.
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <Card className="w-full max-w-md animate-in fade-in zoom-in-95">
                <CardHeader>
                    <div className="flex items-center gap-2 text-primary mb-2">
                        <Settings className="h-5 w-5" />
                        <CardTitle>Configure API</CardTitle>
                    </div>
                    <CardDescription>
                        Set up credentials for <span className="font-semibold text-gray-900">{apiItem.name}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900/50">
                        <Shield className="h-5 w-5 text-blue-600" />
                        <div className="text-xs">
                            <p className="font-semibold text-blue-900 dark:text-blue-300">Authentication Type</p>
                            <p className="text-blue-700 dark:text-blue-400 uppercase">{apiItem.auth_type || 'None'}</p>
                        </div>
                    </div>

                    {apiItem.auth_details?.guide && (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Guide</p>
                            <p className="text-xs text-gray-600 leading-relaxed italic">
                                {apiItem.auth_details.guide}
                            </p>
                        </div>
                    )}

                    {renderAuthFields()}

                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    {testResult && (
                        <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                            {testResult.success ? <CheckCircle2 className="h-4 w-4 mt-0.5" /> : <AlertCircle className="h-4 w-4 mt-0.5" />}
                            <div>
                                <p className="font-semibold">{testResult.success ? 'Connection Success' : 'Connection Warning'}</p>
                                <p className="text-xs opacity-90">{testResult.message}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-end gap-2 bg-gray-50 dark:bg-gray-800/50 p-4">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfigure}
                        disabled={loading || (!credentials.api_key && apiItem.auth_type !== 'none')}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Testing Connection...
                            </>
                        ) : 'Save & Test'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
