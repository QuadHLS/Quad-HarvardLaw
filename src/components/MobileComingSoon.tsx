import React from 'react';

export const MobileComingSoon: React.FC = () => {
  return (
    <div 
      className="w-full flex flex-col items-center px-4"
      style={{ 
        backgroundColor: 'var(--background-color, #f9f5f0)',
        minHeight: '100vh',
        height: '100vh',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      {/* Logo at the top - moved down with margin */}
      <div className="flex-shrink-0" style={{ paddingTop: '120px', paddingBottom: '32px' }}>
        <img 
          src="/QUAD.svg" 
          alt="Quad Logo" 
          className="w-auto h-32 object-contain"
        />
      </div>
      
      {/* Message in the middle - centered */}
      <div className="flex-1 flex items-center justify-center w-full" style={{ paddingBottom: '32px' }}>
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">
            Continue on Your Desktop 🚀
          </h1>
          <p className="text-lg text-gray-700 leading-relaxed">
            The mobile version is coming soon! Please visit us on your desktop or laptop for the best experience. Thank you!
          </p>
        </div>
      </div>
    </div>
  );
};

