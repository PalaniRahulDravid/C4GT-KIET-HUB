import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth, getDashboardPath } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function NotFound() {
  const { user, isAuthenticated } = useAuth();
  const destPath = isAuthenticated ? getDashboardPath(user?.role) : '/login';
  const buttonLabel = isAuthenticated ? 'Return to Dashboard' : 'Return to Login';

  return (
    <div className="max-w-md mx-auto mt-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle>404 - Page Not Found</CardTitle>
          <CardDescription>
            The requested page does not exist in the C4GT HUB system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to={destPath}>
            <Button variant="outline" size="sm">
              {buttonLabel}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
