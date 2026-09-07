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
          if (data.success && data.user) {
            // Live user verified directly from MongoDB Atlas
            setUser(data.user);
            setToken(storedToken);
          } else {
            // Invalid user or DB issue -> clear storage immediately
            localStorage.removeItem('c4gt_token');
            setToken(null);
            setUser(null);
          }
        } else {
          // Token is invalid, expired, or database rejected it
          localStorage.removeItem('c4gt_token');
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        // Database / Backend is unreachable: DO NOT pretend user is logged in!
        console.error('Database unreachable during auth verification:', error);
        localStorage.removeItem('c4gt_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Strict Google Sign-In: requires real Google ID credential and saves strictly to MongoDB Atlas
  const loginWithGoogle = async (credential) => {
    if (!credential) {
      throw new Error('Google credential is required. Real Google OAuth is mandatory.');
    }

    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credential }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      // CLEAR any stored token immediately on database failure
      localStorage.removeItem('c4gt_token');
      setToken(null);
      setUser(null);
      throw new Error(data.message || 'Database error: Failed to authenticate or save user in MongoDB Atlas');
    }

    // Strictly store ONLY the session token in localStorage (NO cached user objects)
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

  // Refresh user data directly from MongoDB Atlas (e.g. after role assignment)
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
        if (data.success && data.user) {
          setUser(data.user);
        }
      } else {
        localStorage.removeItem('c4gt_token');
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Error refreshing user from database:', err);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    role: user?.role || null,
    loginWithGoogle,
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
