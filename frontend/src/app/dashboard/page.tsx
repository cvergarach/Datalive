'use client';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BarChart3, FileText, Database, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    { name: 'Total Projects', value: '12', icon: FileText, change: '+2.5%' },
    { name: 'Active APIs', value: '34', icon: Database, change: '+12%' },
    { name: 'Data Points', value: '1.2M', icon: BarChart3, change: '+8.2%' },
    { name: 'Insights Generated', value: '156', icon: TrendingUp, change: '+23%' },
  ];

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Header title="Dashboard" subtitle="Overview of your DataLive workspace" />
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {stats.map((stat) => (
              <Card key={stat.name}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{stat.name}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                      <p className="text-sm text-green-600 mt-1">{stat.change}</p>
                    </div>
                    <stat.icon className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
              <CardContent><p className="text-gray-600">Your recent activity will appear here</p></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
              <CardContent><p className="text-gray-600">Quick actions available here</p></CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
