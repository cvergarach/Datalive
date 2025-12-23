'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FileText, Upload, Folder, Trash2 } from 'lucide-react';
import { DeleteConfirmation } from '@/components/shared/DeleteConfirmation';

interface Project {
    id: string;
    name: string;
    description: string;
}

interface Document {
    id: string;
    title: string;
    status: 'processing' | 'analyzed' | 'completed' | 'error';
    created_at: string;
    file_type: string;
}

export default function DocumentsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Deletion state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [docToDelete, setDocToDelete] = useState<Document | null>(null);

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (selectedProject) {
            fetchDocuments(selectedProject);
        }
    }, [selectedProject]);

    const fetchProjects = async () => {
        try {
            const { data } = await api.get('/projects');
            if (data.projects && data.projects.length > 0) {
                setProjects(data.projects);
                setSelectedProject(data.projects[0].id);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const fetchDocuments = async (projectId: string) => {
        try {
            setLoading(true);
            const { data } = await api.get(`/projects/${projectId}/documents`);
            setDocuments(data.documents);
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !selectedProject) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setUploading(true);
            await api.post(`/projects/${selectedProject}/documents/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            // Refresh list
            fetchDocuments(selectedProject);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const confirmDeleteDocument = async () => {
        if (!docToDelete || !selectedProject) return;
        await api.delete(`/projects/${selectedProject}/documents/${docToDelete.id}`);
        fetchDocuments(selectedProject);
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar />
            <div className="flex-1 overflow-auto">
                <Header title="Documents" subtitle="Manage and analyze your API documentation" />

                <div className="p-6 space-y-6">
                    {/* Project Selector */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Folder className="h-5 w-5" />
                                Select Project
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {projects.length > 0 ? (
                                <div className="flex gap-4">
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={selectedProject || ''}
                                        onChange={(e) => setSelectedProject(e.target.value)}
                                    >
                                        {projects.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-gray-500 mb-4">No projects found. You need a project first.</p>
                                    <Button variant="outline" onClick={() => window.location.href = '/projects'}>
                                        Go to Projects
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Upload & List */}
                    {selectedProject && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Project Documents</CardTitle>
                                <div className="relative">
                                    <input
                                        type="file"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                    />
                                    <Button disabled={uploading}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        {uploading ? 'Uploading...' : 'Upload Document'}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <p>Loading documents...</p>
                                ) : documents.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        No documents uploaded yet.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {documents.map((doc) => (
                                            <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300">
                                                        <FileText className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{doc.title}</p>
                                                        <p className="text-xs text-gray-500">{new Date(doc.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium 
                            ${doc.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                            doc.status === 'error' ? 'bg-red-100 text-red-700' :
                                                                'bg-yellow-100 text-yellow-700'}`}>
                                                        {doc.status.toUpperCase()}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => {
                                                            setDocToDelete(doc);
                                                            setDeleteModalOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Delete Confirmation Modal */}
                {docToDelete && selectedProject && (
                    <DeleteConfirmation
                        isOpen={deleteModalOpen}
                        onClose={() => {
                            setDeleteModalOpen(false);
                            setDocToDelete(null);
                        }}
                        onConfirm={confirmDeleteDocument}
                        title="Delete Document"
                        entityName={docToDelete.title}
                        dependencyUrl={`/projects/${selectedProject}/documents/${docToDelete.id}/dependencies`}
                        type="document"
                    />
                )}
            </div>
        </div>
    );
}
            </div >
        </div >
    );
}

// Ensuring module detection
export const dynamic = 'force-dynamic';
