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

  // Test function to send sample assessment data with all questions answered
  async testSubmission(): Promise<{ success: boolean; submissionId?: string; error?: string }> {
    const testData: FormData = {
      'business-strategy': {
        'identified-problems': '1–2 clear use-cases defined',
        'roi-quantification': 'Basic cost-benefit model',
        'strategic-alignment': 'Mostly aligned (clear connection to main KPIs/OKRs)',
        'use-case-prioritization': 'Prioritized by estimated value or quick wins',
        'primary-objective': 'Save time / increase productivity',
        'competitive-pressure': 'Moderate – I see competitors experimenting with AI',
        'decision-speed': 'Medium – taking time to validate and plan before acting',
        'biggest-blocker': 'Technical expertise / skills gap',
        'ai-strategy-owner': 'Head of Operations / COO',
        'strategy-review-frequency': 'Monthly reviews with quarterly planning'
      },
      'financial-readiness': {
        'monthly-budget': '$1K–$5K',
        'annual-budget-share': '6–10% of total budget',
        'funding-runway': '6–12 months of experimentation funding',
        'investor-commitment': 'Supportive but cautious – they want to see measurable results',
        'investor-context': 'We have outside investors or board oversight',
        'expected-timeline': '6–12 months to show meaningful business impact',
        'compliance-frameworks': ['SOC 2'],
        'success-metrics': 'Efficiency gains (time saved, faster processes)',
        'financial-tracking': 'Basic tracking (spreadsheets, manual cost tracking)',
        'strategic-partnerships': 'Limited (1–2 vendor or consulting partnerships)',
        'ai-budget-prioritization': 'Balanced (mix of infrastructure, tools, and talent)',
        'long-term-financial-plan': '2–3 year financial roadmap with AI investments planned'
      },
      'data-maturity': {
        'data-storage': 'Mix of cloud and on-premise',
        'data-consistency': 'Mostly consistent but some duplicates or gaps',
        'data-governance': 'Basic policies (data stewards assigned, some documentation)',
        'data-ownership': 'Clear ownership for most datasets',
        'data-confidence': 'Fairly confident (most data accurate, some quality checks)',
        'security-controls': 'Standard security (access controls, encryption, monitoring)',
        'pii-handling': 'Clear PII policies (documented procedures, basic compliance)',
        'audit-readiness': 'Moderately ready (some documentation, manual processes)',
        'data-preprocessing-consistency': 'Somewhat consistent (similar tools, some standardization)',
        'analytics-tools-integration': 'Partially integrated (some tools connected, manual steps)',
        'data-lineage-tracking': 'Basic tracking (know source systems, limited automation)',
        'external-data-validation': 'Basic validation (spot checks, simple quality tests)',
        'data-anonymization': 'Basic anonymization (remove direct identifiers, simple techniques)'
      },
      'technical-infrastructure': {
        'digital-platforms': 'Multiple platforms, some integration',
        'tool-integration': 'Partial integration (APIs, some manual steps)',
        'integration-reliability': 'Generally reliable (occasional issues, mostly stable)',
        'implementation-ownership': 'Mixed (IT leads, business teams provide input)',
        'manual-transfers': 'Some manual steps (weekly or monthly transfers)',
        'automation-comfort': 'Somewhat comfortable (have some automation, open to more)',
        'automation-platforms': 'Basic automation tools (Zapier, simple scripts)',
        'system-reliability': 'Generally reliable (99%+ uptime, quick issue resolution)',
        'gpu-compute-resources': 'Limited cloud GPU access (AWS, Azure, GCP)',
        'resource-allocation-scaling': 'Some scalability (can increase resources with planning)',
        'high-throughput-systems': 'Moderate throughput (handles current load, some bottlenecks)',
        'ai-specific-security': 'Enhanced security measures for AI (additional monitoring, access controls)',
        'power-energy-impact': 'Some consideration (basic monitoring, efficiency initiatives)'
      },
      'automation-ai-agents': {
        'repetitive-tasks': 'Some tasks automated (basic workflows, rule-based automation)',
        'manual-customer-journeys': 'Partially automated (some touchpoints, manual handoffs)',
        'automated-alerts': 'Basic alerts (system notifications, simple rules)',
        'top-automation-priority': 'Customer service',
        'never-automate': 'Strategic planning',
        'ai-agent-tasks': ['Customer support (chatbots, ticket routing)', 'Data analysis and reporting'],
        'agent-autonomy': 'Guided autonomy (AI suggests, human approves)',
        'agent-interface': 'Simple dashboards (basic monitoring, manual intervention)',
        'deployment-blockers': ['Integration complexity', 'Change management / user adoption'],
        'agent-data-access': 'Controlled access (specific datasets, audit trails)',
        'process-documentation': 'Some documentation (key processes mapped, basic workflows)',
        'automation-maturity': 'Expanding (implementing more automation, scaling existing)',
        'ai-agent-access-controls': 'Role-based permissions (different access levels, basic audit)'
      },
      'team-ai-literacy': {
        'current-ai-tools': ['ChatGPT or similar conversational AI', 'Document/content generation tools'],
        'ai-usage-frequency': 'Weekly (regular integration into workflows)',
        'ai-use-cases': ['Writing and content creation', 'Research and information gathering'],
        'skill-exposure-level': 'Mixed (some team members experienced, others learning)',
        'knowledge-sharing': 'Informal sharing (team discussions, ad-hoc training)',
        'upskilling-approach': 'Mixed approach (external training + internal knowledge sharing)',
        'ai-ownership': 'Mixed ownership (dedicated person + distributed responsibility)',
        'learning-adaptability': 'Moderately adaptable (open to change, some resistance)',
        'ai-accessibility': 'Some tools accessible (basic AI tools, limited advanced features)',
        'ai-talent-strategy': 'Hybrid approach (train existing staff + selective hiring)'
      },
      'ethics-experimentation': {
        'ai-risk-management': 'Basic risk awareness (understand main risks, informal mitigation)',
        'model-explainability': 'Some explainability (understand general AI decision-making)',
        'experimentation-cadence': 'Monthly experiments (regular testing, structured approach)',
        'failure-strategy': 'Learn and iterate (analyze failures, improve processes)',
        'ethics-owner': 'Shared responsibility (team-based ethics considerations)',
        'failure-tolerance': 'Moderate tolerance (accept some failures for learning)',
        'ai-bias-fairness': 'Basic awareness (understand bias exists, informal monitoring)',
        'cross-border-data-compliance': 'Partially compliant (understand some requirements, basic measures)'
      },
      'metadata-respondent-info': {
        'email': 'test.user@example.com',
        'full-name': 'Test User',
        'role': 'Operations Manager',
        'company-name': 'Sample Tech Company',
        'company-size': '51–200 employees',
        'country': 'United States',
        'sector-industry': 'Technology / Software',
        'annual-revenue': '$1M–$10M',
        'regulated-industry': 'No',
        'website': 'https://example.com',
        'personal-ai-maturity': 'Intermediate (use AI tools regularly, understand capabilities)',
        'team-ai-maturity': 'Beginner (limited AI experience, basic tool usage)',
        'priority-timeframe': '3–6 months'
      }
    };

    return this.submitAssessment({
      formData: testData,
      userEmail: 'test.user@example.com',
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