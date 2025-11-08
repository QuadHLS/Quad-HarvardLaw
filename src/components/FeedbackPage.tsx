import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function FeedbackPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    // Count lines by splitting on newlines
    const lines = value.split('\n').length;
    
    // If we're at 20 lines and user tries to add more, prevent it
    if (lines > 20) {
      return; // Don't update the state
    }
    
    setFeedback(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !feedback.trim()) {
      toast.error('Please select a category and enter your feedback');
      return;
    }

    if (!user) {
      toast.error('Please log in to submit feedback');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: user.id,
          name: name.trim() || null,
          email: email.trim() || null,
          category: category,
          feedback_text: feedback.trim()
        });

      if (error) {
        console.error('Error submitting feedback:', error);
        toast.error('Failed to submit feedback. Please try again.');
        return;
      }

      toast.success('Thank you! Your feedback has been submitted successfully.');
      
      // Reset form
      setName('');
      setEmail('');
      setCategory('');
      setFeedback('');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen overflow-y-auto" style={{ backgroundColor: '#FEFBF6' }}>
      {/* Logo */}
      <div className="max-w-4xl mx-auto px-8 pb-6" style={{ paddingTop: '40px' }}>
        <div className="flex justify-center">
          <img src="/QUAD.svg" alt="Quad Logo" className="h-auto" style={{ width: '110px' }} />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-8" style={{ paddingBottom: '30px' }}>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
          <div className="mb-6">
            <h2 className="text-gray-800 mb-2">Share Your Thoughts</h2>
            <p className="text-gray-600 text-sm">
              We value your feedback! Let us know about bugs, feature requests, or general suggestions to help us make Quad better.
            </p>
            
            {/* LinkedIn Contact Section */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Prefer to connect directly?</h3>
              <p className="text-xs text-gray-600 mb-3">
                You can also reach out directly on LinkedIn for more personal feedback or questions.
              </p>
              <a
                href="https://www.linkedin.com/in/justin-li-1454b0381"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#0077B5] text-sm font-medium rounded-md border border-[#0077B5] transition-colors"
                style={{
                  '--hover-bg': '#2967b220'
                } as React.CSSProperties}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2967b220';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <img src="/LI-In-Bug.png" alt="LinkedIn" className="h-6 w-auto" />
                Connect on LinkedIn
              </a>
            </div>
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
                onChange={handleFeedbackChange}
                placeholder="Tell us what's on your mind..."
                className="w-full min-h-[200px] resize-none"
                maxLength={1000}
                rows={20}
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
                href="/QUADPRIVACYPOLICY.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm hover:underline"
                style={{ color: '#752432' }}
              >
                Privacy Policy
              </a>
              <span className="text-gray-300">|</span>
              <a
                href="/QUADTERMSOFSERVICE.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm hover:underline"
                style={{ color: '#752432' }}
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