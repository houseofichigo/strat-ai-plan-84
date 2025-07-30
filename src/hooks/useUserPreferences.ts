import { useState } from 'react';
import i18n from '@/i18n';

export interface UserPreferencesData {
  id: string;
  language: string;
  timezone: string;
  notifications_enabled: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export const useUserPreferences = () => {
  // Simplified mock implementation for now
  const [preferences, setPreferences] = useState<UserPreferencesData | null>({
    id: crypto.randomUUID(),
    language: 'en',
    timezone: 'UTC',
    notifications_enabled: true,
    onboarding_completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(false);

  const updatePreferences = async (updates: Partial<UserPreferencesData>) => {
    if (preferences) {
      const updated = { ...preferences, ...updates, updated_at: new Date().toISOString() };
      setPreferences(updated);
      
      // Update i18n language if changed
      if (updates.language) {
        i18n.changeLanguage(updates.language);
      }
    }
  };

  const completeOnboarding = async () => {
    await updatePreferences({ onboarding_completed: true });
  };

  const refreshPreferences = async () => {
    // Mock implementation
  };

  return {
    preferences,
    loading,
    updatePreferences,
    completeOnboarding,
    refreshPreferences,
  };
};