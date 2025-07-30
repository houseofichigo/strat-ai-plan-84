-- Create table for assessment submissions
CREATE TABLE public.assessment_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'reviewed')),
  user_email TEXT,
  user_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.assessment_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for assessment submissions
CREATE POLICY "Anyone can create assessment submissions" 
ON public.assessment_submissions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own submissions" 
ON public.assessment_submissions 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own submissions" 
ON public.assessment_submissions 
FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_assessment_submissions_updated_at
BEFORE UPDATE ON public.assessment_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_assessment_submissions_user_id ON public.assessment_submissions(user_id);
CREATE INDEX idx_assessment_submissions_created_at ON public.assessment_submissions(created_at DESC);