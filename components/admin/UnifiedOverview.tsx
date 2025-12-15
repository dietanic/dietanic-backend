
import React from 'react';
import { DashboardHome } from './DashboardHome';
import { ProactiveManagement } from './ProactiveManagement';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { Product, Order, User, ChatSession } from '../../types';

interface UnifiedOverviewProps {
  products: Product[];
  orders: Order[];
  users: User[];
  sessions: ChatSession[];
  isAdmin: boolean;
  onNavigate: (tab: any) => void;
}

export const UnifiedOverview: React.FC<UnifiedOverviewProps> = (props) => {
  return (
    <div className="space-y-8 pb-12">
      {/* 1. Operational Dashboard (Top Level Metrics & Quick Actions) */}
      <DashboardHome {...props} />

      {/* 2. Proactive Insights (Alerts, Retention, Risks) */}
      <div id="proactive-section" className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl border border-gray-200">
          <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Proactive Intelligence</h2>
              <p className="text-gray-500">AI-driven insights to prevent issues before they happen.</p>
          </div>
          <ProactiveManagement data={props} /> 
      </div>

      {/* 3. Deep Dive Analytics */}
      <div id="analytics-section">
          <div className="mb-6 px-2">
              <h2 className="text-2xl font-bold text-gray-900">Performance Analytics</h2>
              <p className="text-gray-500">Detailed reports on sales, subscriptions, and traffic.</p>
          </div>
          <AnalyticsDashboard data={props} />
      </div>
    </div>
  );
};
