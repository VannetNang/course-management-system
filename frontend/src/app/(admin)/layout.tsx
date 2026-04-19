'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookOpen, Users, LogOut, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/courses', label: 'Courses', icon: BookOpen },
    { href: '/admin/enrolments', label: 'Enrolments', icon: Users },
  ];

  return (
    <div className="flex h-screen">
      <aside className={`${collapsed ? 'w-16' : 'w-60'} border-r bg-muted/30 shrink-0 flex flex-col transition-all duration-200`}>
        <div className="p-4 border-b flex items-center justify-between">
          {!collapsed && (
            <div>
              <h1 className="font-bold text-lg">Admin Panel</h1>
              {user && <p className="text-xs text-muted-foreground mt-1 truncate">{user.email}</p>}
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-lg hover:bg-muted transition-colors ml-auto"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="p-2 space-y-1 flex-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                ${collapsed ? 'justify-center' : ''}
                ${pathname === href ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && label}
            </Link>
          ))}
        </nav>

        <div className="p-2 border-t">
          <button
            onClick={logout}
            title={collapsed ? 'Logout' : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors w-full text-red-500 hover:text-red-600
              ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && 'Logout'}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
