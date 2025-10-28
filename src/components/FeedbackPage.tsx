import { MessageCircle } from 'lucide-react';

interface FeedbackPageProps {
  // Add any props you might need in the future
}

export function FeedbackPage({}: FeedbackPageProps) {
  return (
    <div className="h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
      <div className="text-center">
        <div className="mb-6">
          <MessageCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#752432' }} />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Feedback</h1>
          <p className="text-gray-600">This page is coming soon!</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 max-w-md mx-auto">
          <p className="text-sm text-gray-500">
            We're working on creating a feedback system to help improve your experience. 
            Check back soon for updates!
          </p>
        </div>
      </div>
    </div>
  );
}
