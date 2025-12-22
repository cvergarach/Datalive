'use client';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function SettingsPage() {
    return (
        <div className="flex h-screen">
            <Sidebar />
            <div className="flex-1 overflow-auto">
                <Header title="Settings" subtitle="Configure your account and workspace" />
                <div className="p-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Settings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600">This section is coming soon.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
