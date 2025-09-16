import React from 'react';
import { OnboardingPage } from './OnboardingPage';

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  // Skip account creation step - go directly to class selection
  const handleAcademicComplete = () => {
    onComplete();
  };

  return <OnboardingPage onComplete={handleAcademicComplete} />;
}
