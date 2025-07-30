import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AssessmentSection } from '@/components/assessment/AssessmentSection';
import { AssessmentResults } from '@/components/assessment/AssessmentResults';
import { ChevronRight, ChevronLeft, TestTube, AlertCircle, Save, CheckCircle } from 'lucide-react';
import { assessmentSections } from '@/data/assessmentData';
import { useAssessmentForm } from '@/hooks/useAssessmentForm';
import { assessmentService } from '@/services/assessmentService';
import { useToast } from '@/hooks/use-toast';

const Assessment = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [showValidationAlert, setShowValidationAlert] = useState(false);
  const { 
    formData, 
    updateAnswer, 
    validateSection, 
    isComplete, 
    getProgress, 
    getSectionProgress,
    errors,
    isAutoSaving,
    clearDraft
  } = useAssessmentForm();
  const { toast } = useToast();

  const totalSections = assessmentSections.length;
  const progressInfo = getProgress();
  const sectionProgress = getSectionProgress(currentSection);

  // Scroll to top when section changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentSection]);

  const handleNext = async () => {
    // Hide any previous alerts
    setShowValidationAlert(false);
    
    if (validateSection(currentSection)) {
      if (currentSection < totalSections - 1) {
        setCurrentSection(currentSection + 1);
      } else {
        await handleSubmit();
      }
    } else {
      // Show validation alert
      setShowValidationAlert(true);
      // Scroll to first error
      setTimeout(() => {
        const firstError = document.querySelector('[data-error="true"]');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const handleSubmit = async () => {
    if (isComplete()) {
      try {
        // Extract email from form data for submission
        const email = formData['metadata-respondent-info']?.['email'] || 'user@example.com';
        const fullName = formData['metadata-respondent-info']?.['full-name'] || 'Anonymous User';
        
        const result = await assessmentService.submitAssessment({
          formData,
          userEmail: email as string,
          userName: fullName as string
        });
        
        if (result.success) {
          toast({
            title: 'Assessment Submitted',
            description: `Your assessment has been submitted successfully. ID: ${result.submissionId}`,
          });
          clearDraft(); // Clear saved draft after successful submission
          setShowResults(true);
        } else {
          toast({
            title: 'Submission Failed',
            description: result.error || 'Failed to submit assessment',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Submission Error',
          description: 'An unexpected error occurred',
          variant: 'destructive',
        });
      }
    }
  };

  const handleTestSubmission = async () => {
    try {
      const result = await assessmentService.testSubmission();
      if (result.success) {
        toast({
          title: 'Test Submission Successful',
          description: `Test data submitted successfully. ID: ${result.submissionId}`,
        });
      } else {
        toast({
          title: 'Test Submission Failed',
          description: result.error || 'Failed to submit test data',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Test Submission Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const handlePrevious = () => {
    setShowValidationAlert(false);
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  if (showResults) {
    return <AssessmentResults formData={formData} />;
  }

  const currentSectionData = assessmentSections[currentSection];
  const hasErrors = Object.keys(errors).some(key => key.startsWith(currentSectionData.id));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-foreground">AI Maturity Assessment</h1>
            <div className="flex items-center gap-4">
              <Button
                onClick={handleTestSubmission}
                variant="outline"
                size="sm"
              >
                <TestTube className="w-4 h-4 mr-2" />
                Test Submission
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {isAutoSaving && (
                  <div className="flex items-center gap-1">
                    <Save className="w-3 h-3 animate-pulse" />
                    <span>Saving...</span>
                  </div>
                )}
                <span>Section {currentSection + 1} of {totalSections}</span>
              </div>
            </div>
          </div>
          
          <Progress value={progressInfo.percentage} className="h-3" />
          
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>
              Progress: {Math.round(progressInfo.percentage)}% 
              ({progressInfo.answered} of {progressInfo.total} questions)
            </span>
            <span>Est. {currentSectionData.estimatedTime} remaining</span>
          </div>
        </div>

        {/* Validation Alert */}
        {showValidationAlert && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Missing Required Information</AlertTitle>
            <AlertDescription>
              Please complete all required fields before proceeding to the next section.
              {hasErrors && " Check the highlighted questions below."}
            </AlertDescription>
          </Alert>
        )}

        {/* Current Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                {currentSection + 1}
              </span>
              {currentSectionData.title}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({currentSectionData.weight})
              </span>
              {sectionProgress.answered === sectionProgress.total && (
                <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
              )}
            </CardTitle>
            <div className="mt-4 space-y-2">
              <p className="text-muted-foreground">
                {currentSectionData.description}
              </p>
              {currentSectionData.detailedDescription && (
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border">
                  💡 {currentSectionData.detailedDescription}
                </p>
              )}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  Section Progress: {sectionProgress.answered} of {sectionProgress.total} questions completed
                </span>
                {sectionProgress.answered === sectionProgress.total && (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <AssessmentSection
              section={currentSectionData}
              sectionIndex={currentSection}
              formData={formData}
              updateAnswer={updateAnswer}
            />
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center sticky bottom-4 bg-background/95 backdrop-blur-sm p-4 rounded-lg border shadow-lg">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentSection === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            {assessmentSections.map((_, index) => {
              const sectionProgress = getSectionProgress(index);
              const isComplete = sectionProgress.answered === sectionProgress.total;
              
              return (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentSection
                      ? 'bg-primary ring-2 ring-primary/30'
                      : isComplete
                      ? 'bg-green-600'
                      : index < currentSection
                      ? 'bg-primary/60'
                      : 'bg-muted'
                  }`}
                  title={`Section ${index + 1}: ${assessmentSections[index].title}`}
                />
              );
            })}
          </div>
          
          <Button
            onClick={handleNext}
            className="flex items-center gap-2"
            variant={currentSection === totalSections - 1 ? "default" : "default"}
          >
            {currentSection === totalSections - 1 ? 'Complete Assessment' : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Assessment;