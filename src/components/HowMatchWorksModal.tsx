import { useState } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

import { Button } from './ui/button';

import { Heart, Inbox, Users, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';



interface HowMatchWorksModalProps {

  isOpen: boolean;

  onClose: () => void;

}



export function HowMatchWorksModal({ isOpen, onClose }: HowMatchWorksModalProps) {

  const [currentStep, setCurrentStep] = useState(0);



  const steps = [

    {

      title: 'Welcome to Match!',

      icon: <Sparkles className="w-16 h-16 mx-auto mb-4" style={{ color: '#752432' }} />,

      description: 'Match is a fun, anonymous way to connect with classmates you\'re interested in getting to know better.',

      content: (

        <div className="space-y-4 text-center">

          <p className="text-gray-700">

            Whether you're looking to make new friends, find study partners, or connect with someone special, Match helps you take that first step.

          </p>

        </div>

      )

    },

    {

      title: 'How to Send a Match',

      icon: <Heart className="w-16 h-16 mx-auto mb-4" style={{ color: '#752432' }} />,

      description: 'Visit any student\'s profile and click the "Match" button to send them an anonymous match.',

      content: (

        <div className="space-y-4">

          <p className="text-gray-700 text-center">

            They'll receive a notification that someone is interested, but your identity stays hidden until they match back.

          </p>

          <div className="rounded-lg p-4 border border-blue-200" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>

            <p className="text-gray-700 text-sm mb-2">

              <strong className="text-gray-900">Match Limits:</strong>

            </p>

            <ul className="text-gray-700 text-sm space-y-1 ml-4">

              <li className="list-disc">You can send up to <strong>2 matches per day</strong></li>

              <li className="list-disc">You can send up to <strong>10 matches per week</strong></li>

            </ul>

          </div>

          <div className="rounded-lg p-4 border border-red-200" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>

            <p className="text-gray-700 text-sm">

              <strong className="text-gray-900">Tip:</strong> You can find students through your courses or the directory. When you see someone interesting, just click Match!

            </p>

          </div>

        </div>

      )

    },

    {

      title: 'Match Inbox',

      icon: <Inbox className="w-16 h-16 mx-auto mb-4" style={{ color: '#752432' }} />,

      description: 'Check your Match Inbox to see who has sent you matches and who you\'ve sent matches to.',

      content: (

        <div className="space-y-4">

          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">

            <div className="flex items-center gap-3">

              <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">

                ❤️

              </div>

              <div className="flex-1">

                <p className="text-sm text-gray-900">Someone on Quad matched with you</p>

                <p className="text-xs text-gray-500">2 hours ago</p>

              </div>

            </div>

            <div className="flex items-center gap-3">

              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">

                💚

              </div>

              <div className="flex-1">

                <p className="text-sm text-gray-900">Quentin Quadly matched with you</p>

                <p className="text-xs text-gray-500">2 days ago</p>

              </div>

            </div>

          </div>

          <p className="text-gray-700 text-center text-sm">

            Mutual matches reveal the person's name!

          </p>

        </div>

      )

    },

    {

      title: 'When It\'s a Mutual Match',

      icon: <Users className="w-16 h-16 mx-auto mb-4" style={{ color: '#752432' }} />,

      description: 'When you both match with each other, you can see who it is!',

      content: (

        <div className="space-y-4">

          <div className="rounded-lg p-6 border-2 border-green-200 text-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>

            <div className="text-4xl mb-3">🎉</div>

            <p className="text-lg text-gray-900 mb-2">It's a Match!</p>

            <p className="text-sm text-gray-700">

              You and <strong>Quentin Quadly</strong> have matched

            </p>

          </div>

          <p className="text-gray-700 text-center">

            Your match inbox will show their full name. Time to break the ice!

          </p>

        </div>

      )

    },

    {

      title: 'Privacy & Respect',

      icon: <Sparkles className="w-16 h-16 mx-auto mb-4" style={{ color: '#752432' }} />,

      description: 'Match is designed to be safe, fun, and respectful for everyone.',

      content: (

        <div className="space-y-4">

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">

            <ul className="space-y-2 text-sm text-gray-700">

              <li className="flex items-start gap-2">

                <span className="text-blue-600 mt-0.5">•</span>

                <span>All matches are anonymous until both people match</span>

              </li>

              <li className="flex items-start gap-2">

                <span className="text-blue-600 mt-0.5">•</span>

                <span>You can adjust your visibility settings anytime</span>

              </li>

              <li className="flex items-start gap-2">

                <span className="text-blue-600 mt-0.5">•</span>

                <span>Always be respectful when reaching out to matches</span>

              </li>

            </ul>

          </div>

          <p className="text-center text-sm text-gray-600">

            Ready to start matching? Visit other students' profiles and click the Match button!

          </p>

        </div>

      )

    }

  ];



  const handleNext = () => {

    if (currentStep < steps.length - 1) {

      setCurrentStep(currentStep + 1);

    } else {

      handleClose();

    }

  };



  const handlePrevious = () => {

    if (currentStep > 0) {

      setCurrentStep(currentStep - 1);

    }

  };



  const handleClose = () => {

    setCurrentStep(0);

    onClose();

  };



  const currentStepData = steps[currentStep];



  return (

    <Dialog open={isOpen} onOpenChange={handleClose}>

      <DialogContent className="max-w-2xl">

        <DialogHeader>

          <DialogTitle className="text-2xl">{currentStepData.title}</DialogTitle>

          <DialogDescription className="text-base pt-2">

            {currentStepData.description}

          </DialogDescription>

        </DialogHeader>



        <div className="py-6">

          {currentStepData.icon}

          {currentStepData.content}

        </div>



        {/* Progress Dots */}

        <div className="flex items-center justify-center gap-2 py-2">

          {steps.map((_, index) => (

            <button

              key={index}

              onClick={() => setCurrentStep(index)}

              className={`h-2 rounded-full transition-all ${

                index === currentStep

                  ? 'w-8'

                  : 'w-2'

              }`}

              style={{

                backgroundColor: index === currentStep ? '#752432' : '#D1D5DB'

              }}

            />

          ))}

        </div>



        {/* Navigation Buttons */}

        <div className="flex items-center justify-between pt-4 border-t">

          <Button

            variant="outline"

            onClick={handlePrevious}

            disabled={currentStep === 0}

            className="gap-2"

          >

            <ChevronLeft className="w-4 h-4" />

            Previous

          </Button>



          <span className="text-sm text-gray-500">

            {currentStep + 1} of {steps.length}

          </span>



          <Button

            onClick={handleNext}

            className="gap-2 text-white"

            style={{ backgroundColor: '#752432' }}

          >

            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}

            {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}

          </Button>

        </div>

      </DialogContent>

    </Dialog>

  );

}

