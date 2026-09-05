import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          System administration, user oversight, team management, and global resource configuration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Oversight of Admins, Team Leads, and Students.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Placeholder for user provisioning and role assignment.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Management</CardTitle>
            <CardDescription>Team structures and assigned leads.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Placeholder for team creation and assignment controls.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Global Resources</CardTitle>
            <CardDescription>Central learning materials and repositories.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Placeholder for shared repository configuration.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
