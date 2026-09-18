import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('civilsense_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('civilsense_token') || '');
  const [activeProjectId, setActiveProjectId] = useState(() => localStorage.getItem('civilsense_active_proj') || 'proj_1');
  const [lang, setLang] = useState(() => localStorage.getItem('civilsense_lang') || 'en');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('civilsense_user', JSON.stringify(user));
      if (user.preferredLanguage && !localStorage.getItem('civilsense_lang')) {
        setLang(user.preferredLanguage);
      }
    } else {
      localStorage.removeItem('civilsense_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('civilsense_token', token);
    } else {
      localStorage.removeItem('civilsense_token');
    }
  }, [token]);

  useEffect(() => {
    localStorage.setItem('civilsense_active_proj', activeProjectId);
  }, [activeProjectId]);

  useEffect(() => {
    localStorage.setItem('civilsense_lang', lang);
  }, [lang]);

  // Quick switch role (Owner, Supervisor, Accountant, Contractor)
  const quickLogin = async (role = 'Owner') => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/quick-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setToken(data.token);
        if (data.user.preferredLanguage) {
          setLang(data.user.preferredLanguage);
        }
        return { success: true };
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Quick login error:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // OTP Login
  const requestOtp = async (phone) => {
    const res = await fetch('/api/auth/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    return res.json();
  };

  const verifyOtp = async (phone, otp, role, name) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, role, name })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setToken(data.token);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('civilsense_user');
    localStorage.removeItem('civilsense_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        activeProjectId,
        setActiveProjectId,
        lang,
        setLang,
        loading,
        quickLogin,
        requestOtp,
        verifyOtp,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
