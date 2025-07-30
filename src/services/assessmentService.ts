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
      // First, create the main submission
      const { data: submission, error: submissionError } = await supabase
        .from('assessment_submissions')
        .insert({
          submission_data: data.formData,
          user_email: data.userEmail,
          user_name: data.userName,
          status: 'submitted'
        })
        .select('id')
        .single();

      if (submissionError) {
        console.error('Error creating submission:', submissionError);
        return { success: false, error: submissionError.message };
      }

      // Then, save individual answers for detailed analytics
      await this.saveDetailedAnswers(submission.id, data.formData);

      return { success: true, submissionId: submission.id };
    } catch (error) {
      console.error('Error submitting assessment:', error);
      return { success: false, error: 'Failed to submit assessment' };
    }
  },

  async saveDetailedAnswers(submissionId: string, formData: FormData) {
    const { assessmentSections } = await import('@/data/assessmentData');
    const answers: any[] = [];

    // Process each section and question
    for (const section of assessmentSections) {
      const sectionData = formData[section.id] || {};
      
      for (const question of section.questions) {
        const answerValue = sectionData[question.id];
        
        if (answerValue !== undefined && answerValue !== '' && !(Array.isArray(answerValue) && answerValue.length === 0)) {
          answers.push({
            submission_id: submissionId,
            section_id: section.id,
            section_name: section.title,
            question_id: question.id,
            question_text: question.text,
            question_type: question.type,
            answer_value: Array.isArray(answerValue) ? null : String(answerValue),
            answer_array: Array.isArray(answerValue) ? answerValue : null,
            is_required: question.required || false
          });
        }
      }
    }

    // Insert all answers in batch
    if (answers.length > 0) {
      const { error } = await supabase
        .from('assessment_answers')
        .insert(answers);

      if (error) {
        console.error('Error saving detailed answers:', error);
        // Don't fail the main submission if this fails
      }
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
        'data-governance': 'basic',
        'data-infrastructure': 'adequate'
      },
      'ai-capabilities': {
        'current-ai-usage': 'none',
        'ai-strategy': 'developing',
        'ai-team': 'limited'
      },
      'technology-infrastructure': {
        'cloud-readiness': 'hybrid',
        'data-integration': 'some',
        'security-compliance': 'basic'
      }
    };

    return this.submitAssessment({
      formData: testData,
      userEmail: 'test@example.com',
      userName: 'Test User'
    });
  },

  async getDetailedAnswers(submissionId?: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      let query = supabase
        .from('assessment_answers')
        .select('*')
        .order('created_at', { ascending: false });

      if (submissionId) {
        query = query.eq('submission_id', submissionId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching detailed answers:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching detailed answers:', error);
      return { success: false, error: 'Failed to fetch detailed answers' };
    }
  }
};