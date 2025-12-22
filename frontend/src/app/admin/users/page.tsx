'use client';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function AdminUsersPage() {
    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar />
            <div className="flex-1 overflow-auto">
                <Header title="User Management" subtitle="Administer system users" />
                <div className="p-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Users</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600">User management is under construction.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
