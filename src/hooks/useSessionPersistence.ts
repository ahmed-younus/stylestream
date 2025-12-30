import { useState, useEffect, useCallback } from "react";
import { Product } from "@/types/product";

interface TryOnSession {
  avatarImageRef: string; // Store only URL references, not base64
  selectedProductIds: string[];
  timestamp: number;
}

const SESSION_KEY = "styledream_tryon_session";
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB limit

const isBase64Image = (str: string): boolean => {
  return str?.startsWith('data:image');
};

const getStorageSize = (): number => {
  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage.getItem(key)?.length || 0;
    }
  }
  return total * 2; // UTF-16 encoding = 2 bytes per char
};

export const useSessionPersistence = () => {
  const [abandonedSession, setAbandonedSession] = useState<{
    avatarImageRef: string;
    selectedProductIds: string[];
  } | null>(null);

  // Load abandoned session on mount
  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        const session: TryOnSession = JSON.parse(stored);
        const isExpired = Date.now() - session.timestamp > SESSION_EXPIRY_MS;
        
        if (!isExpired && session.avatarImageRef && session.selectedProductIds.length > 0) {
          setAbandonedSession({
            avatarImageRef: session.avatarImageRef,
            selectedProductIds: session.selectedProductIds,
          });
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  // Save session - only store URL references, skip base64
  const saveSession = useCallback((avatarImage: string, selectedProducts: Product[]) => {
    // Don't store base64 images - they're too large
    if (isBase64Image(avatarImage)) {
      return;
    }

    // Check storage quota before saving
    if (getStorageSize() > MAX_STORAGE_SIZE) {
      localStorage.removeItem(SESSION_KEY);
      return;
    }

    if (avatarImage && selectedProducts.length > 0) {
      const session: TryOnSession = {
        avatarImageRef: avatarImage,
        selectedProductIds: selectedProducts.map(p => p.id),
        timestamp: Date.now(),
      };
      
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } catch (e) {
        // Quota exceeded - clear and skip
        console.warn('Session storage quota exceeded, clearing session');
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  // Clear session
  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setAbandonedSession(null);
  }, []);

  // Dismiss abandoned session notification
  const dismissAbandonedSession = useCallback(() => {
    setAbandonedSession(null);
  }, []);

  return {
    abandonedSession,
    saveSession,
    clearSession,
    dismissAbandonedSession,
  };
};
