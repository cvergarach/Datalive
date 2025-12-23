'use client';
import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BarChart3, FileText, Database, TrendingUp, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/stats');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const getIcon = (name: string) => {
    switch (name) {
      case 'FileText': return FileText;
      case 'Database': return Database;
      case 'BarChart3': return BarChart3;
      case 'TrendingUp': return TrendingUp;
      default: return Database;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Header title="Dashboard" subtitle="Overview of your DataLive workspace" />
        <div className="p-4 sm:p-6 pt-16 lg:pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
            {(data?.stats || []).map((stat: any) => {
              const Icon = getIcon(stat.icon);
              return (
                <Card key={stat.name}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{stat.name}</p>
                        <p className="text-2xl font-bold mt-1 tracking-tight">{stat.value}</p>
                        <p className="text-sm text-green-600 mt-1">{stat.change}</p>
                      </div>
                      <Icon className="h-8 w-8 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data?.recentActivity?.length > 0 ? (
                    data.recentActivity.map((activity: any) => (
                      <div key={activity.id} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                        <p className="text-sm text-gray-700">{activity.description}</p>
                        <p className="text-xs text-gray-400">{activity.time}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm italic">No recent activity found.</p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <button className="p-3 text-sm font-medium bg-primary/5 text-primary rounded-lg border border-primary/10 hover:bg-primary/10 transition-colors text-left">
                    + New Project
                  </button>
                  <button className="p-3 text-sm font-medium bg-gray-50 text-gray-700 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors text-left">
                    Upload Document
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
