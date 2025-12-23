'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PlusCircle, Folder, MoreVertical, Calendar, Trash2 } from 'lucide-react';
import { DeleteConfirmation } from '@/components/shared/DeleteConfirmation';

interface Project {
    id: string;
    name: string;
    description: string;
    created_at: string;
    user_role: string;
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');
    const [creating, setCreating] = useState(false);

    // Deletion state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/projects');
            setProjects(data.projects || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;

        try {
            setCreating(true);
            await api.post('/projects', {
                name: newProjectName,
                description: newProjectDesc
            });
            setIsCreateModalOpen(false);
            setNewProjectName('');
            setNewProjectDesc('');
            fetchProjects();
        } catch (error) {
            console.error('Error creating project:', error);
            alert('Failed to create project');
        } finally {
            setCreating(false);
        }
    };

    const confirmDeleteProject = async () => {
        if (!projectToDelete) return;
        await api.delete(`/projects/${projectToDelete.id}`);
        fetchProjects();
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar />
            <div className="flex-1 overflow-auto">
                <Header title="Projects" subtitle="Manage your DataLive workspaces" />

                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Your Projects</h2>
                        <Button onClick={() => setIsCreateModalOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New Project
                        </Button>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <Card key={i} className="animate-pulse h-48 bg-gray-200 dark:bg-gray-800" />
                            ))}
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border border-dashed">
                            <div className="mx-auto h-12 w-12 text-gray-400 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Folder className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No projects yet</h3>
                            <p className="text-gray-500 mb-6">Create your first project to start analyzing data.</p>
                            <Button onClick={() => setIsCreateModalOpen(true)}>Create Project</Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.map((project) => (
                                <Card
                                    key={project.id}
                                    className="hover:shadow-md transition-shadow cursor-pointer relative group"
                                    onClick={() => window.location.href = `/documents?project=${project.id}`}
                                >
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setProjectToDelete(project);
                                                setDeleteModalOpen(true);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 mb-2">
                                                <Folder className="h-5 w-5" />
                                            </div>
                                        </div>
                                        <CardTitle className="text-lg">{project.name}</CardTitle>
                                        <CardDescription className="line-clamp-2">{project.description || 'No description'}</CardDescription>
                                    </CardHeader>
                                    <CardFooter className="pt-2 text-xs text-gray-500 flex items-center gap-2">
                                        <Calendar className="h-3 w-3" />
                                        Created {new Date(project.created_at).toLocaleDateString()}
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Create Project Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-md animate-in fade-in zoom-in-95">
                            <CardHeader>
                                <CardTitle>Create New Project</CardTitle>
                                <CardDescription>Start a new workspace for your data analysis.</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleCreateProject}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Project Name</label>
                                        <input
                                            autoFocus
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            placeholder="e.g. Q4 Financials"
                                            value={newProjectName}
                                            onChange={(e) => setNewProjectName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Description (Optional)</label>
                                        <textarea
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            placeholder="What is this project about?"
                                            value={newProjectDesc}
                                            onChange={(e) => setNewProjectDesc(e.target.value)}
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end gap-2">
                                    <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={creating}>
                                        {creating ? 'Creating...' : 'Create Project'}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {projectToDelete && (
                    <DeleteConfirmation
                        isOpen={deleteModalOpen}
                        onClose={() => {
                            setDeleteModalOpen(false);
                            setProjectToDelete(null);
                        }}
                        onConfirm={confirmDeleteProject}
                        title="Delete Project"
                        entityName={projectToDelete.name}
                        dependencyUrl={`/projects/${projectToDelete.id}/dependencies`}
                        type="project"
                    />
                )}
            </div>
        </div>
    );
}
