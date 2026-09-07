import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getRoleName = (role) => {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'teamlead':
    case 'team_lead':
      return 'Team Lead';
    case 'user':
    case 'student':
      return 'Student';
    default:
      return 'Student';
  }
};

export const getDashboardPath = (role) => {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'teamlead':
    case 'team_lead':
      return '/team-lead';
    case 'user':
    case 'student':
      return '/student';
    default:
      return '/student';
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('c4gt_token'));
  const [loading, setLoading] = useState(true);

  // Fetch LIVE user from MongoDB Atlas on every page load to pick up role changes
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('c4gt_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Always use the LIVE user data from DB (picks up role changes made in Atlas)
          setUser(data.user);
          setToken(storedToken);
        } else {
          // Token is invalid or expired
          localStorage.removeItem('c4gt_token');
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to verify session token:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Google Sign-In handler
  const loginWithGoogle = async (credential, fallbackPayload = {}) => {
    const payload = credential ? { credential } : fallbackPayload;

    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Google authentication failed');
    }

    localStorage.setItem('c4gt_token', data.token);
    setToken(data.token);
    setUser(data.user);

    return data.user;
  };

  // Development login helper (for fast local role preview)
  const devLogin = async (role, email, name) => {
    const response = await fetch(`${API_BASE_URL}/auth/dev-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role, email, name }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Development login failed');
    }

    localStorage.setItem('c4gt_token', data.token);
    setToken(data.token);
    setUser(data.user);

    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('c4gt_token');
    setToken(null);
    setUser(null);
  };

  // Refresh user data (e.g. after an admin update)
  const refreshUser = async () => {
    const currentToken = token || localStorage.getItem('c4gt_token');
    if (!currentToken) return;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    role: user?.role || null,
    loginWithGoogle,
    devLogin,
    logout,
    refreshUser,
    getRoleName,
    getDashboardPath,
    apiBaseUrl: API_BASE_URL,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
