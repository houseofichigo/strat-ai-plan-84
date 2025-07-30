import { supabase } from '@/integrations/supabase/client';
import { FormData } from '@/data/assessmentData';

export interface AssessmentSubmission {
  id?: string;
  submission_data: FormData;
  status?: 'draft' | 'submitted' | 'reviewed';
  user_email?: string;
  user_name?: string;
  created_at?: string;
  updated_at?: string;
}

export const assessmentService = {
  async submitAssessment(data: {
    formData: FormData;
    userEmail?: string;
    userName?: string;
  }): Promise<{ success: boolean; submissionId?: string; error?: string }> {
    try {
      const { data: result, error } = await supabase
        .from('assessment_submissions')
        .insert({
          submission_data: data.formData,
          user_email: data.userEmail,
          user_name: data.userName,
          status: 'submitted'
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error submitting assessment:', error);
        return { success: false, error: error.message };
      }

      return { success: true, submissionId: result.id };
    } catch (error) {
      console.error('Error submitting assessment:', error);
      return { success: false, error: 'Failed to submit assessment' };
    }
  },

  async getSubmissions(): Promise<{ success: boolean; data?: AssessmentSubmission[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('assessment_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching submissions:', error);
        return { success: false, error: error.message };
      }

      // Transform the data to match our interface
      const transformedData: AssessmentSubmission[] = (data || []).map(item => ({
        id: item.id,
        submission_data: item.submission_data as FormData,
        status: item.status as 'draft' | 'submitted' | 'reviewed',
        user_email: item.user_email || undefined,
        user_name: item.user_name || undefined,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      return { success: true, data: transformedData };
    } catch (error) {
      console.error('Error fetching submissions:', error);
      return { success: false, error: 'Failed to fetch submissions' };
    }
  },

  // Test function to send sample assessment data
  async testSubmission(): Promise<{ success: boolean; submissionId?: string; error?: string }> {
    const testData: FormData = {
      'data-readiness': {
        'data-quality': 'good',
        'data-governance': 'basic'
      },
      'ai-capabilities': {
        'current-ai-usage': 'none',
        'ai-strategy': 'developing'
      }
    };

    return this.submitAssessment({
      formData: testData,
      userEmail: 'test@example.com',
      userName: 'Test User'
    });
  }
};