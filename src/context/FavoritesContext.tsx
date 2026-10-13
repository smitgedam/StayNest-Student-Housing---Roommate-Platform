import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Property, MessProvider } from '../types';
import { useAuth } from './AuthContext';

interface FavoritesState {
  properties: Property[];
  messes: MessProvider[];
}

interface FavoritesContextType {
  favoriteProperties: Property[];
  favoriteMesses: MessProvider[];
  totalFavoritesCount: number;
  isPropertyFavorite: (id: string) => boolean;
  isMessFavorite: (id: string) => boolean;
  togglePropertyFavorite: (property: Property) => void;
  toggleMessFavorite: (mess: MessProvider) => void;
  removePropertyFavorite: (id: string) => void;
  removeMessFavorite: (id: string) => void;
  clearAllFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const storageKey = `staynest_favorites_${user?.id || 'guest'}`;

  const [favorites, setFavorites] = useState<FavoritesState>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return { properties: [], messes: [] };
  });

  // Re-load favorites whenever active user changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setFavorites(JSON.parse(stored));
      } else {
        setFavorites({ properties: [], messes: [] });
      }
    } catch {
      setFavorites({ properties: [], messes: [] });
    }
  }, [storageKey]);

  // Persist to localStorage whenever favorites change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(favorites));
    } catch {
      // ignore
    }
  }, [favorites, storageKey]);

  const isPropertyFavorite = (id: string): boolean => {
    return favorites.properties.some((p) => p.id === id);
  };

  const isMessFavorite = (id: string): boolean => {
    return favorites.messes.some((m) => m.id === id);
  };

  const togglePropertyFavorite = (property: Property) => {
    setFavorites((prev) => {
      const exists = prev.properties.some((p) => p.id === property.id);
      if (exists) {
        return {
          ...prev,
          properties: prev.properties.filter((p) => p.id !== property.id),
        };
      } else {
        return {
          ...prev,
          properties: [property, ...prev.properties],
        };
      }
    });
  };

  const toggleMessFavorite = (mess: MessProvider) => {
    setFavorites((prev) => {
      const exists = prev.messes.some((m) => m.id === mess.id);
      if (exists) {
        return {
          ...prev,
          messes: prev.messes.filter((m) => m.id !== mess.id),
        };
      } else {
        return {
          ...prev,
          messes: [mess, ...prev.messes],
        };
      }
    });
  };

  const removePropertyFavorite = (id: string) => {
    setFavorites((prev) => ({
      ...prev,
      properties: prev.properties.filter((p) => p.id !== id),
    }));
  };

  const removeMessFavorite = (id: string) => {
    setFavorites((prev) => ({
      ...prev,
      messes: prev.messes.filter((m) => m.id !== id),
    }));
  };

  const clearAllFavorites = () => {
    setFavorites({ properties: [], messes: [] });
  };

  const totalFavoritesCount = favorites.properties.length + favorites.messes.length;

  return (
    <FavoritesContext.Provider
      value={{
        favoriteProperties: favorites.properties,
        favoriteMesses: favorites.messes,
        totalFavoritesCount,
        isPropertyFavorite,
        isMessFavorite,
        togglePropertyFavorite,
        toggleMessFavorite,
        removePropertyFavorite,
        removeMessFavorite,
        clearAllFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
