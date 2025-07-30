import React from 'react';
import { AssessmentQuestion } from '@/data/assessmentData';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAssessmentForm } from '@/hooks/useAssessmentForm';

interface QuestionTextProps {
  question: AssessmentQuestion;
  value: string;
  onChange: (value: string) => void;
  sectionId: string;
}

export const QuestionText: React.FC<QuestionTextProps> = ({
  question,
  value,
  onChange,
  sectionId
}) => {
  const { getError } = useAssessmentForm();
  const error = getError(sectionId, question.id);

  const getInputType = (question: AssessmentQuestion): string => {
    if (question.id === 'email') return 'email';
    if (question.id === 'website') return 'url';
    return 'text';
  };

  const getPlaceholder = (question: AssessmentQuestion): string => {
    if (question.id === 'email') return 'your.email@example.com';
    if (question.id === 'website') return 'https://example.com or example.com';
    if (question.id === 'full-name') return 'Enter your full name';
    if (question.id === 'company-name') return 'Enter your company name';
    if (question.type === 'textarea') return 'Please provide details...';
    return 'Type your answer here...';
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <Label className="text-base font-medium leading-relaxed">
              {question.text}
              {question.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {question.description && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {question.description}
              </p>
            )}
            {error && (
              <p className="text-sm text-destructive mt-1">{error}</p>
            )}
          </div>
          {question.tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{question.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        {question.type === 'textarea' ? (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={getPlaceholder(question)}
            className={`min-h-[100px] ${error ? 'border-destructive' : ''}`}
            data-error={!!error}
          />
        ) : (
          <Input
            type={getInputType(question)}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={getPlaceholder(question)}
            className={error ? 'border-destructive' : ''}
            data-error={!!error}
          />
        )}
      </div>
    </Card>
  );
};