import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';

export default function StudentDashboard() {
  return (
    <div className="max-w-xl mx-auto mt-12">
      <Card>
        <CardHeader>
          <div className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 w-fit mb-2">
            Coming Soon
          </div>
          <CardTitle>Student Dashboard</CardTitle>
          <CardDescription>
            The Student dashboard is currently under development.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            This portal will allow participants to view task assignments, access curated learning resources, submit deliverables, and view performance milestones.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
