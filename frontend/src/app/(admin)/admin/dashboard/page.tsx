'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Users, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Stats {
  totalIncome: string;
  totalEnrolments: number;
}

interface CourseSummary {
  id: string;
  title: string;
  totalIncome: string;
  totalEnrolments: number;
}

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [summary, setSummary] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/stats'),
      api.get('/sales/summary'),
    ])
      .then(([statsRes, summaryRes]) => {
        setStats(statsRes.data.data ?? statsRes.data);
        const raw = summaryRes.data.data ?? summaryRes.data ?? [];
        setSummary(Array.isArray(raw) ? raw : []);
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const chartData = summary.map((c) => ({
    name: c.title.length > 20 ? c.title.slice(0, 20) + '…' : c.title,
    revenue: parseFloat(c.totalIncome) || 0,
    students: c.totalEnrolments,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Sales overview and analytics</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-16" /></CardContent></Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                <DollarSign className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${parseFloat(stats?.totalIncome ?? '0').toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Enrolments</CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalEnrolments ?? 0}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Revenue bar chart */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          <CardTitle>Revenue by Course</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : chartData.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-12">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    name === 'revenue' ? `$${value.toFixed(2)}` : value,
                    name === 'revenue' ? 'Revenue' : 'Students'
                  ]}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Students bar chart */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Users className="w-5 h-5" />
          <CardTitle>Enrolments by Course</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : chartData.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-12">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value: any) => [value, 'Students']}
                />
                <Bar dataKey="students" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Course summary table */}
      <Card>
        <CardHeader><CardTitle>Course Summary</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-40" />
          ) : summary.length === 0 ? (
            <p className="text-muted-foreground text-sm">No data yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground">Course</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Students</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((course) => (
                  <tr key={course.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{course.title}</td>
                    <td className="py-3 text-right">{course.totalEnrolments}</td>
                    <td className="py-3 text-right font-semibold">
                      ${parseFloat(course.totalIncome).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
