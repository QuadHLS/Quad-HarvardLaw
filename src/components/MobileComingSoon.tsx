import React from 'react';

export const MobileComingSoon: React.FC = () => {
  return (
    <div 
      className="min-h-screen flex flex-col items-center px-4"
      style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}
    >
      {/* Logo at the top */}
      <div className="flex-shrink-0 pt-12 pb-8">
        <img 
          src="/QUAD.svg" 
          alt="Quad Logo" 
          className="w-auto h-32 md:h-40 object-contain"
        />
      </div>
      
      {/* Message in the middle */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
            Continue on Your Desktop
          </h1>
          <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
            The mobile version is coming soon! Please visit us on your desktop or laptop for the best experience. Thank you!
          </p>
        </div>
      </div>
    </div>
  );
};

