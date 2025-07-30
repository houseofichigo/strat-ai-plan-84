-- Fix security warnings by setting proper search paths for all functions

-- Update has_role function with proper search path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- Update is_license_owner function with proper search path
CREATE OR REPLACE FUNCTION public.is_license_owner(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.licenses
    WHERE license_owner_id = _user_id
      AND is_active = true
  )
$function$;

-- Update get_user_license function with proper search path
CREATE OR REPLACE FUNCTION public.get_user_license(_user_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT l.id
  FROM public.licenses l
  JOIN public.license_assignments la ON l.id = la.license_id
  WHERE la.user_id = _user_id
    AND l.is_active = true
  LIMIT 1
$function$;

-- Update update_updated_at_column function with proper search path
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