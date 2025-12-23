'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import {
    Database,
    ChevronDown,
    ChevronRight,
    Terminal,
    Calendar,
    Search,
    Maximize2,
    FileJson,
    RefreshCw,
    Folder
} from 'lucide-react';

export default function DataPage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [apiData, setApiData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [inspectingData, setInspectingData] = useState<any | null>(null);

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (selectedProjectId) {
            fetchData(selectedProjectId);
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

    const fetchData = async (projectId: string) => {
        setLoading(true);
        try {
            const { data } = await api.get(`/projects/${projectId}/data`);
            setApiData(data.data || []);
        } catch (error) {
            console.error('Error fetching API data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-50/50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header title="Data" subtitle="Explore data extracted from your APIs" />

                <main className="flex-1 overflow-auto p-6">
                    <div className="max-w-6xl mx-auto space-y-6">

                        {/* Project Selector & Actions */}
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
                                <Button variant="outline" size="sm" onClick={() => fetchData(selectedProjectId)}>
                                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                                </Button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                                <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
                                <p className="text-gray-500 font-medium">Fetching collected data...</p>
                            </div>
                        ) : apiData.length === 0 ? (
                            <Card className="border-dashed py-20 text-center">
                                <div className="mx-auto h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                    <Database className="h-10 w-10 text-gray-300" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No Data Collected Yet</h3>
                                <p className="text-gray-500 max-w-md mx-auto mb-8">
                                    Configure and execute your discovered APIs to start collecting data from your services.
                                </p>
                                <Button onClick={() => window.location.href = '/my-apis'}>
                                    Configure APIs
                                </Button>
                            </Card>
                        ) : (
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Source API</th>
                                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Endpoint</th>
                                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Records</th>
                                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Status</th>
                                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Executed At</th>
                                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {apiData.map((item) => (
                                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-gray-900">
                                                        {item.discovered_apis?.name || 'Unknown API'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                                                                {item.api_endpoints?.method}
                                                            </span>
                                                            <span className="font-mono text-xs text-gray-600">{item.api_endpoints?.path}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                                            {item.record_count} items
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                            }`}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-500 text-xs">
                                                        {new Date(item.executed_at).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            onClick={() => setInspectingData(item)}
                                                        >
                                                            <FileJson className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                {/* JSON Inspector Overlay/Modal logic would go here */}
                {inspectingData && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <Card className="w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
                            <CardHeader className="border-b bg-gray-50">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Terminal className="h-5 w-5 text-primary" />
                                            Inspector de Datos
                                        </CardTitle>
                                        <CardDescription>
                                            {inspectingData.discovered_apis?.name} - {inspectingData.api_endpoints?.path}
                                        </CardDescription>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setInspectingData(null)}>
                                        Cerrar
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-auto p-0 bg-gray-900 border-t border-gray-800">
                                <pre className="p-4 text-xs font-mono text-emerald-400">
                                    {JSON.stringify(inspectingData.data, null, 2)}
                                </pre>
                            </CardContent>
                            <div className="p-4 bg-gray-50 border-t flex justify-between items-center text-[10px] text-gray-400">
                                <span>FORMAT: JSON</span>
                                <span>ID: {inspectingData.id}</span>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}

