import { useState, useCallback } from 'react';

const TOKEN_KEY = 'github_pat';

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function useAuth() {
  const [token, setTokenState] = useState<string | null>(getStoredToken);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isAuthed = token !== null && token.length > 0;

  const setToken = useCallback((newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setTokenState(newToken);
    setShowAuthModal(false);
  }, []);

  const clearToken = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setTokenState(null);
  }, []);

  return { token, isAuthed, setToken, clearToken, showAuthModal, setShowAuthModal };
}
