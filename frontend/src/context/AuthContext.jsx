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
  const r = role ? String(role).toLowerCase().trim() : '';
  switch (r) {
    case 'admin':
      return '/admin/dashboard';
    case 'teamlead':
    case 'team_lead':
      return '/teamlead';
    case 'user':
    case 'student':
    default:
      return '/student';
  }
};

export const isStudentProfileComplete = (user) => {
  if (!user) return false;
  // Admin and Team Lead roles do not require student roll/branch onboarding details
  if (user.role === 'admin' || user.role === 'teamlead' || user.role === 'team_lead') return true;
  return Boolean(
    user.rollNumber &&
      typeof user.rollNumber === 'string' &&
      user.rollNumber.trim() &&
      user.branch &&
      typeof user.branch === 'string' &&
      user.branch.trim() &&
      user.year &&
      user.memberType
  );
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('c4gt_token') || null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const updateToken = (newToken) => {
    setToken(newToken || null);
    try {
      if (newToken) {
        localStorage.setItem('c4gt_token', newToken);
      } else {
        localStorage.removeItem('c4gt_token');
      }
    } catch (e) {
      // ignore
    }
  };

  // Fetch LIVE user from MongoDB Atlas via cookie or Bearer token
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = (typeof window !== 'undefined' && localStorage.getItem('c4gt_token')) || token;
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          credentials: 'include', // Automatically sends HTTP cookie if allowed
          headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : {},
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            setUser(data.user);
            if (data.token) {
              updateToken(data.token);
            }
          } else {
            setUser(null);
            updateToken(null);
          }
        } else {
          // Token invalid or expired
          setUser(null);
          updateToken(null);
        }
      } catch (error) {
        console.error('Database unreachable during auth verification:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Roll Number & Password Login (Student, Team Lead, and Admin)
  const loginWithRollNumber = async (rollNumber, password) => {
    if (!rollNumber || !password) {
      throw new Error('Please enter both Roll Number and Password.');
    }

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ rollNumber, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      setUser(null);
      updateToken(null);
      throw new Error(data.message || 'Login failed. Please check your Roll Number and Password.');
    }

    setUser(data.user);
    if (data.token) {
      updateToken(data.token);
    }

    return data.user;
  };

  // Strict Google Sign-In (Legacy fallback)
  const loginWithGoogle = async (credential) => {
    if (!credential) {
      throw new Error('Google credential is required. Real Google OAuth is mandatory.');
    }

    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ credential }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      setUser(null);
      updateToken(null);
      throw new Error(data.message || 'Database error: Failed to authenticate or save user in MongoDB Atlas');
    }

    setUser(data.user);
    if (data.token) {
      updateToken(data.token);
    }

    return data.user;
  };

  const logout = async () => {
    try {
      const storedToken = token || (typeof window !== 'undefined' ? localStorage.getItem('c4gt_token') : null);
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : {},
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      updateToken(null);
    }
  };

  // Refresh user data directly from MongoDB Atlas via session cookie or Bearer token
  const refreshUser = async () => {
    try {
      const storedToken = token || (typeof window !== 'undefined' ? localStorage.getItem('c4gt_token') : null);
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        credentials: 'include',
        headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
          if (data.token) {
            updateToken(data.token);
          }
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error refreshing user from database:', err);
    }
  };

  // Update student profile directly in MongoDB Atlas
  const updateProfile = async (profileData) => {
    const storedToken = token || (typeof window !== 'undefined' ? localStorage.getItem('c4gt_token') : null);
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(profileData),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to update student profile in MongoDB Atlas');
    }

    if (data.user) {
      setUser(data.user);
    }
    return data.user;
  };

  // Change password in MongoDB Atlas (Mandatory on first login for Team Leads)
  const changePassword = async (currentPassword, newPassword) => {
    const storedToken = token || (typeof window !== 'undefined' ? localStorage.getItem('c4gt_token') : null);
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to update password');
    }

    if (data.user) {
      setUser(data.user);
    }
    return data.user;
  };

  const isProfileComplete = isStudentProfileComplete(user);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user),
    isProfileComplete,
    role: user?.role || null,
    loginWithRollNumber,
    loginWithGoogle,
    logout,
    refreshUser,
    updateProfile,
    changePassword,
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
