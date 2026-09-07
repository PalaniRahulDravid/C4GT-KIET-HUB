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
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Clear any legacy localStorage token on mount to ensure pure cookie-based auth
  useEffect(() => {
    try {
      localStorage.removeItem('c4gt_token');
    } catch (e) {
      // ignore
    }
  }, []);

  // Fetch LIVE user from MongoDB Atlas via HTTP-only session cookie
  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          credentials: 'include', // Automatically sends HTTP cookie
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            // Live user verified directly from MongoDB Atlas
            setUser(data.user);
          } else {
            setUser(null);
          }
        } else {
          // Cookie expired, invalid, or database rejected it
          setUser(null);
        }
      } catch (error) {
        // Database / Backend is unreachable: DO NOT pretend user is logged in!
        console.error('Database unreachable during cookie auth verification:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Strict Google Sign-In: requires real Google ID credential and sets HTTP-only Cookie
  const loginWithGoogle = async (credential) => {
    if (!credential) {
      throw new Error('Google credential is required. Real Google OAuth is mandatory.');
    }

    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Instructs browser to accept and store the HTTP cookie
      body: JSON.stringify({ credential }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      setUser(null);
      setToken(null);
      throw new Error(data.message || 'Database error: Failed to authenticate or save user in MongoDB Atlas');
    }

    // Token is stored in HTTP-only Cookie by backend. User object set in React memory only.
    setUser(data.user);
    if (data.token) {
      setToken(data.token);
    }

    return data.user;
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Tells backend to clear the cookie
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setToken(null);
    }
  };

  // Refresh user data directly from MongoDB Atlas via session cookie
  const refreshUser = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
        }
      } else {
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
    isAuthenticated: Boolean(user),
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
