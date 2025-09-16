import React, { useState } from 'react';
import { AccountCreation } from './AccountCreation';
import { OnboardingPage } from './OnboardingPage';

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState<'account' | 'academic'>('account');

  const handleAccountComplete = () => {
    setCurrentStep('academic');
  };

  const handleAcademicComplete = () => {
    onComplete();
  };

  if (currentStep === 'account') {
    return <AccountCreation onComplete={handleAccountComplete} />;
  }

  return <OnboardingPage onComplete={handleAcademicComplete} />;
}
