import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function Login() {
  return (
    <div className="max-w-md mx-auto mt-12">
      <Card>
        <CardHeader>
          <CardTitle>Portal Login</CardTitle>
          <CardDescription>
            Select your role to access your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link to="/team-lead" className="block">
            <Button variant="outline" className="w-full justify-start cursor-pointer">
              Team Lead Access
            </Button>
          </Link>
          <Link to="/student" className="block">
            <Button variant="outline" className="w-full justify-start cursor-pointer">
              Student Access
            </Button>
          </Link>
          <p className="text-xs text-gray-500 pt-2">
            Authentication workflows will be connected in subsequent feature phases.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
