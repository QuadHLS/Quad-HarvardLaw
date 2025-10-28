import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';

export function FeedbackPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !feedback.trim()) {
      toast.error('Please select a category and enter your feedback');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success('Thank you! Your feedback has been submitted successfully.');
      
      // Reset form
      setName('');
      setEmail('');
      setCategory('');
      setFeedback('');
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="h-screen overflow-y-auto" style={{ backgroundColor: '#FEFBF6' }}>
      {/* Logo */}
      <div className="max-w-4xl mx-auto px-8 pt-12 pb-6">
        <div className="flex justify-center">
          <img src="/QUAD.svg" alt="Quad Logo" className="w-[120px] h-auto" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-8 pb-8">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
          <div className="mb-6">
            <h2 className="text-gray-800 mb-2">Share Your Thoughts</h2>
            <p className="text-gray-600 text-sm">
              We value your feedback! Let us know about bugs, feature requests, or general suggestions to help us make Quad better.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm text-gray-700 mb-2">
                Name (Optional)
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full"
              />
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm text-gray-700 mb-2">
                Email (Optional)
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                We'll only use this to follow up on your feedback if needed
              </p>
            </div>

            {/* Category Field */}
            <div>
              <label htmlFor="category" className="block text-sm text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">Bug Report</SelectItem>
                  <SelectItem value="feature">Feature Request</SelectItem>
                  <SelectItem value="improvement">Improvement Suggestion</SelectItem>
                  <SelectItem value="content">Content Issue</SelectItem>
                  <SelectItem value="ui">Design/UI Feedback</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Feedback Field */}
            <div>
              <label htmlFor="feedback" className="block text-sm text-gray-700 mb-2">
                Your Feedback <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us what's on your mind..."
                className="w-full min-h-[200px] resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Please be as detailed as possible
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6"
                  style={{ 
                    backgroundColor: '#04913A',
                    color: 'white'
                  }}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </div>
              <div className="flex justify-end mt-2">
                <p className="text-xs text-gray-500">
                  <span className="text-red-500">*</span> Required fields
                </p>
              </div>
            </div>
          </form>

          {/* Footer Links */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center gap-6">
              <a
                href="#"
                className="text-sm hover:underline"
                style={{ color: '#752432' }}
                onClick={(e) => {
                  e.preventDefault();
                  toast.info('Privacy Policy page coming soon');
                }}
              >
                Privacy Policy
              </a>
              <span className="text-gray-300">|</span>
              <a
                href="#"
                className="text-sm hover:underline"
                style={{ color: '#752432' }}
                onClick={(e) => {
                  e.preventDefault();
                  toast.info('Terms of Service page coming soon');
                }}
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}