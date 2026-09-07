import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';

export default function TeamLeadDashboard() {
  return (
    <div className="max-w-xl mx-auto mt-12">
      <Card>
        <CardHeader>
          <div className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 w-fit mb-2">
            Coming Soon
          </div>
          <CardTitle>Team Lead Dashboard</CardTitle>
          <CardDescription>
            The Team Lead dashboard is currently under development.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            This portal will provide features for cohort coordination, task assignment, progress monitoring, and submission reviews.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
