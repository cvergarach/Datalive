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
    AlertCircle
} from 'lucide-react';

export default function APIsPage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [apis, setApis] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedApi, setExpandedApi] = useState<string | null>(null);

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

    const fetchApiDetails = async (apiId: string) => {
        try {
            const { data } = await api.get(`/projects/${selectedProjectId}/apis/${apiId}`);
            // Update the apis state with the detailed info
            setApis(apis.map(a => a.id === apiId ? { ...a, endpoints: data.api.api_endpoints } : a));
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
            setApis(data.apis || []);
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
                <Header title="APIs" subtitle="Discover and manage your project APIs" />

                <main className="flex-1 overflow-auto p-6">
                    <div className="max-w-6xl mx-auto space-y-6">

                        {/* Project Selector */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="relative w-full sm:w-64">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Active Project
                                </label>
                                <select
                                    value={selectedProjectId}
                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                                >
                                    <option value="" disabled>Select a project</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-[34px] h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>

                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => fetchApis(selectedProjectId)}>
                                    <Zap className="mr-2 h-4 w-4" /> Refresh
                                </Button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                                <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
                                <p className="text-gray-500 font-medium">Scanning for APIs...</p>
                            </div>
                        ) : apis.length === 0 ? (
                            <Card className="border-dashed py-20 text-center">
                                <div className="mx-auto h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                    <Globe className="h-10 w-10 text-gray-300" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No APIs Discovered Yet</h3>
                                <p className="text-gray-500 max-w-md mx-auto mb-8">
                                    Upload API documentation (PDF, TXT, JSON) in the Documents section to start the discovery process.
                                </p>
                                <Button onClick={() => window.location.href = '/documents'}>
                                    Go to Documents
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
                                                            <h3 className="text-lg font-bold text-gray-900">{apiItem.name || 'External API'}</h3>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${apiItem.api_configurations?.[0]?.is_active
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                {apiItem.api_configurations?.[0]?.is_active ? 'Active' : 'Unconfigured'}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-500 font-medium font-mono">{apiItem.base_url}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm">
                                                        <Settings className="mr-2 h-4 w-4" /> Configure
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleExpand(apiItem.id)}
                                                    >
                                                        Endpoints
                                                        {expandedApi === apiItem.id ? <ChevronDown className="ml-2 h-4 w-4" /> : <ChevronRight className="ml-2 h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </div>

                                            {apiItem.description && (
                                                <p className="mt-4 text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                    {apiItem.description}
                                                </p>
                                            )}
                                        </div>

                                        {expandedApi === apiItem.id && (
                                            <div className="border-t border-gray-100 bg-gray-50/30">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left text-sm">
                                                        <thead className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50/80">
                                                            <tr>
                                                                <th className="px-6 py-4">Method</th>
                                                                <th className="px-6 py-4">Endpoint</th>
                                                                <th className="px-6 py-4 w-1/2">Description</th>
                                                                <th className="px-6 py-4">Value</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {!apiItem.endpoints ? (
                                                                <tr>
                                                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">
                                                                        Loading endpoints...
                                                                    </td>
                                                                </tr>
                                                            ) : apiItem.endpoints.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">
                                                                        No endpoints found for this API.
                                                                    </td>
                                                                </tr>
                                                            ) : (
                                                                apiItem.endpoints.map((ep: any) => (
                                                                    <tr key={ep.id} className="bg-transparent hover:bg-white transition-colors">
                                                                        <td className="px-6 py-4">
                                                                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${ep.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                                                                                ep.method === 'POST' ? 'bg-green-100 text-green-700' :
                                                                                    ep.method === 'PUT' ? 'bg-yellow-100 text-yellow-700' :
                                                                                        'bg-gray-100 text-gray-700'
                                                                                }`}>
                                                                                {ep.method}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-6 py-4 font-mono text-xs">{ep.path}</td>
                                                                        <td className="px-6 py-4 text-gray-600">{ep.description}</td>
                                                                        <td className="px-6 py-4">
                                                                            <span className="flex items-center text-amber-600 font-bold">
                                                                                <Zap className="h-3 w-3 mr-1" /> {ep.estimated_value}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
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

