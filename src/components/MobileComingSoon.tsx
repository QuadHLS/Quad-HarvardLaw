import React from 'react';

export const MobileComingSoon: React.FC = () => {
  return (
    <div 
      className="h-screen w-full flex flex-col items-center px-4"
      style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}
    >
      {/* Logo at the top */}
      <div className="flex-shrink-0 pt-8 pb-6">
        <img 
          src="/QUAD.svg" 
          alt="Quad Logo" 
          className="w-auto h-20 object-contain"
        />
      </div>
      
      {/* Message in the middle - centered */}
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">
            Continue on Your Desktop
          </h1>
          <p className="text-lg text-gray-700 leading-relaxed">
            The mobile version is coming soon! Please visit us on your desktop or laptop for the best experience. Thank you!
          </p>
        </div>
      </div>
    </div>
  );
};

