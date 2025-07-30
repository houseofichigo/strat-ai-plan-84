import { FormData } from '@/data/assessmentData';

export interface SavedDraft {
  data: FormData;
  timestamp: string;
  version: number;
}

export const autosaveService = {
  saveDraft: (data: FormData): void => {
    try {
      const draft: SavedDraft = {
        data,
        timestamp: new Date().toISOString(),
        version: 1
      };
      localStorage.setItem('assessment_draft', JSON.stringify(draft));
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  },

  loadDraft: (): SavedDraft | null => {
    try {
      const saved = localStorage.getItem('assessment_draft');
      if (!saved) return null;
      
      const draft: SavedDraft = JSON.parse(saved);
      
      // Only return draft if it's less than 24 hours old
      const hoursSinceLastSave = (new Date().getTime() - new Date(draft.timestamp).getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastSave > 24) {
        localStorage.removeItem('assessment_draft');
        return null;
      }
      
      return draft;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  },

  clearDraft: (): void => {
    try {
      localStorage.removeItem('assessment_draft');
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  },

  hasDraft: (): boolean => {
    return !!autosaveService.loadDraft();
  }
};