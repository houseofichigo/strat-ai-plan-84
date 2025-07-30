-- Create table for detailed assessment answers
CREATE TABLE public.assessment_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES public.assessment_submissions(id) ON DELETE CASCADE NOT NULL,
  section_id TEXT NOT NULL,
  section_name TEXT NOT NULL,
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('radio', 'multiselect', 'dropdown', 'text', 'textarea')),
  answer_value TEXT,
  answer_array TEXT[],
  is_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.assessment_answers ENABLE ROW LEVEL SECURITY;

-- Create policies for assessment answers
CREATE POLICY "Anyone can create assessment answers" 
ON public.assessment_answers 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view assessment answers" 
ON public.assessment_answers 
FOR SELECT 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_assessment_answers_submission_id ON public.assessment_answers(submission_id);
CREATE INDEX idx_assessment_answers_section_id ON public.assessment_answers(section_id);
CREATE INDEX idx_assessment_answers_question_id ON public.assessment_answers(question_id);
CREATE INDEX idx_assessment_answers_created_at ON public.assessment_answers(created_at DESC);

-- Enable realtime for both tables
ALTER TABLE public.assessment_submissions REPLICA IDENTITY FULL;
ALTER TABLE public.assessment_answers REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.assessment_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.assessment_answers;