-- Fix the update_updated_at_column function with proper search path
-- This function is actually used in the database
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Add foreign key constraint to ensure assessment_answers are always linked to a valid submission
-- This prevents orphaned answers and ensures data integrity
ALTER TABLE public.assessment_answers 
ADD CONSTRAINT fk_assessment_answers_submission_id 
FOREIGN KEY (submission_id) REFERENCES public.assessment_submissions(id) 
ON DELETE CASCADE;