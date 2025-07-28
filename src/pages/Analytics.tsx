import React from 'react';
import { UserAnalytics } from '@/components/dashboard/admin/UserAnalytics';

export default function Analytics() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
        <UserAnalytics />
      </div>
    </div>
  );
}