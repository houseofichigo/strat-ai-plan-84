import { useState } from 'react';

export interface ProgressData {
  id: string;
  module_type: 'assessment' | 'training' | 'workflow' | 'use_case';
  module_id: string;
  progress_percentage: number;
  status: 'not_started' | 'in_progress' | 'completed';
  last_accessed: string;
}

export const useProgress = (userId?: string) => {
  // Simplified mock implementation for now
  const [progress, setProgress] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(false);

  const updateProgress = async (
    moduleType: string,
    moduleId: string,
    progressPercentage: number,
    status?: string
  ) => {
    // Mock implementation
    const newProgress: ProgressData = {
      id: crypto.randomUUID(),
      module_type: moduleType as any,
      module_id: moduleId,
      progress_percentage: progressPercentage,
      status: (status as any) || 'in_progress',
      last_accessed: new Date().toISOString(),
    };
    setProgress(prev => [...prev.filter(p => !(p.module_type === moduleType && p.module_id === moduleId)), newProgress]);
  };

  const getModuleProgress = (moduleType: string, moduleId: string) => {
    return progress.find(p => p.module_type === moduleType && p.module_id === moduleId);
  };

  const getOverallProgress = (moduleType?: string) => {
    const filteredProgress = moduleType 
      ? progress.filter(p => p.module_type === moduleType)
      : progress;
    
    if (filteredProgress.length === 0) return 0;
    
    const totalProgress = filteredProgress.reduce((sum, p) => sum + p.progress_percentage, 0);
    return Math.round(totalProgress / filteredProgress.length);
  };

  const refreshProgress = async () => {
    // Mock implementation
  };

  return {
    progress,
    loading,
    updateProgress,
    getModuleProgress,
    getOverallProgress,
    refreshProgress,
  };
};