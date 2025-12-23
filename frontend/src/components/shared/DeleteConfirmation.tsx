'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteConfirmationProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    title: string;
    entityName: string;
    dependencyUrl: string;
    type: 'project' | 'document';
}

export function DeleteConfirmation({
    isOpen,
    onClose,
    onConfirm,
    title,
    entityName,
    dependencyUrl,
    type
}: DeleteConfirmationProps) {
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [dependencies, setDependencies] = useState<any>(null);

    useEffect(() => {
        if (isOpen) {
            fetchDependencies();
        }
    }, [isOpen, dependencyUrl]);

    const fetchDependencies = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(dependencyUrl);
            setDependencies(data.counts);
        } catch (error) {
            console.error('Error fetching dependencies:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        try {
            setDeleting(true);
            await onConfirm();
            onClose();
        } catch (error) {
            console.error('Error deleting:', error);
            alert('Failed to delete item');
        } finally {
            setDeleting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <Card className="w-full max-w-md animate-in fade-in zoom-in-95 border-red-200">
                <CardHeader>
                    <div className="flex items-center gap-2 text-red-600 mb-2">
                        <AlertTriangle className="h-5 w-5" />
                        <CardTitle>Confirm Deletion</CardTitle>
                    </div>
                    <CardDescription>
                        Are you sure you want to delete <span className="font-semibold">{entityName}</span>?
                        This action cannot be undone.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            <span className="ml-2 text-sm text-gray-500">Checking dependencies...</span>
                        </div>
                    ) : dependencies ? (
                        <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-100 dark:border-red-900/50">
                            <p className="text-sm font-medium text-red-800 dark:text-red-400 mb-2">
                                The following items will also be permanently deleted:
                            </p>
                            <ul className="text-sm text-red-700 dark:text-red-500 list-disc list-inside space-y-1">
                                {type === 'project' && (
                                    <>
                                        <li>{dependencies.documents} Documents</li>
                                        <li>{dependencies.apis} Discovered APIs</li>
                                        <li>{dependencies.data} Collected Data records</li>
                                        <li>{dependencies.insights} AI Insights</li>
                                        <li>{dependencies.dashboards} Dashboards</li>
                                    </>
                                )}
                                {type === 'document' && (
                                    <>
                                        <li>{dependencies.apis} Discovered APIs extracted from this document</li>
                                        <li>The file record in cloud storage (Gemini)</li>
                                    </>
                                )}
                            </ul>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic">No dependencies found.</p>
                    )}
                </CardContent>
                <CardFooter className="flex justify-end gap-2 bg-gray-50 dark:bg-gray-800/50 p-4">
                    <Button variant="ghost" onClick={onClose} disabled={deleting}>
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleConfirm}
                        disabled={deleting || (loading && !dependencies)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {deleting ? 'Deleting...' : 'Delete Everything'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
