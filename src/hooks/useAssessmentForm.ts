import { useState, useEffect } from 'react';
import { assessmentSections, FormData } from '@/data/assessmentData';
import { assessmentService } from '@/services/assessmentService';
import { useToast } from '@/hooks/use-toast';

// Validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    // If not a full URL, check if it's a valid domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    return domainRegex.test(url) || url.startsWith('www.');
  }
};

export const useAssessmentForm = () => {
  const [formData, setFormData] = useState<FormData>({});
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const { toast } = useToast();

  // Auto-save functionality
  const autoSave = async (data: FormData) => {
    if (Object.keys(data).length === 0) return; // Don't save empty data
    
    setIsAutoSaving(true);
    try {
      // Save to localStorage as backup
      localStorage.setItem('assessment_draft', JSON.stringify({
        data,
        timestamp: new Date().toISOString()
      }));
      
      // Optional: Save to database as draft
      // await assessmentService.saveDraft(data);
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Load saved data on init
  useEffect(() => {
    try {
      const saved = localStorage.getItem('assessment_draft');
      if (saved) {
        const { data, timestamp } = JSON.parse(saved);
        // Only load if saved within last 24 hours
        if (new Date().getTime() - new Date(timestamp).getTime() < 24 * 60 * 60 * 1000) {
          setFormData(data);
          toast({
            title: 'Draft Restored',
            description: 'Your previous answers have been restored.',
          });
        }
      }
    } catch (error) {
      console.error('Failed to load saved data:', error);
    }
  }, []);

  const updateAnswer = (sectionId: string, questionId: string, value: string | string[]) => {
    const newFormData = {
      ...formData,
      [sectionId]: {
        ...formData[sectionId],
        [questionId]: value
      }
    };
    
    setFormData(newFormData);
    
    // Clear error when user provides answer
    const errorKey = `${sectionId}.${questionId}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }

    // Auto-save after answer update
    setTimeout(() => autoSave(newFormData), 500); // Debounce auto-save
  };

  const validateSection = (sectionIndex: number): boolean => {
    const section = assessmentSections[sectionIndex];
    const sectionData = formData[section.id] || {};
    const newErrors: {[key: string]: string} = {};
    
    let isValid = true;
    
    section.questions.forEach(question => {
      const answer = sectionData[question.id];
      const errorKey = `${section.id}.${question.id}`;
      
      // Check if required field is empty
      if (!answer || (Array.isArray(answer) && answer.length === 0) || answer === '') {
        newErrors[errorKey] = 'This field is required';
        isValid = false;
        return;
      }

      // Specific validation for different field types
      if (question.id === 'email' && typeof answer === 'string') {
        if (!validateEmail(answer)) {
          newErrors[errorKey] = 'Please enter a valid email address';
          isValid = false;
        }
      }
      
      if (question.id === 'website' && typeof answer === 'string' && answer.trim()) {
        if (!validateUrl(answer)) {
          newErrors[errorKey] = 'Please enter a valid URL or domain (e.g., example.com)';
          isValid = false;
        }
      }
    });
    
    setErrors(prev => ({ ...prev, ...newErrors }));
    return isValid;
  };

  const isComplete = (): boolean => {
    return assessmentSections.every((_, index) => validateSection(index));
  };

  const getError = (sectionId: string, questionId: string): string | undefined => {
    return errors[`${sectionId}.${questionId}`];
  };

  // Calculate progress based on answered questions
  const getProgress = (): { percentage: number; answered: number; total: number } => {
    let totalQuestions = 0;
    let answeredQuestions = 0;

    assessmentSections.forEach(section => {
      const sectionData = formData[section.id] || {};
      
      section.questions.forEach(question => {
        totalQuestions++;
        const answer = sectionData[question.id];
        
        if (answer && answer !== '' && !(Array.isArray(answer) && answer.length === 0)) {
          answeredQuestions++;
        }
      });
    });

    return {
      percentage: totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0,
      answered: answeredQuestions,
      total: totalQuestions
    };
  };

  // Get section completion status
  const getSectionProgress = (sectionIndex: number): { answered: number; total: number } => {
    const section = assessmentSections[sectionIndex];
    const sectionData = formData[section.id] || {};
    let answered = 0;

    section.questions.forEach(question => {
      const answer = sectionData[question.id];
      if (answer && answer !== '' && !(Array.isArray(answer) && answer.length === 0)) {
        answered++;
      }
    });

    return { answered, total: section.questions.length };
  };

  const clearDraft = () => {
    localStorage.removeItem('assessment_draft');
  };

  return {
    formData,
    updateAnswer,
    validateSection,
    isComplete,
    getError,
    getProgress,
    getSectionProgress,
    errors,
    isAutoSaving,
    clearDraft
  };
};