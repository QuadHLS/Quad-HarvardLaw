import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card } from './ui/card';

// Main BigLawGuidePage Component
// Deployment trigger comment
export function BigLawGuidePage() {
  const [activeTab, setActiveTab] = React.useState('intro');
  
  // Helper function to get image paths for a firm
  const getFirmImages = (firmName: string, firmId: string): string[] => {
    if (firmId === 'intro') {
      return ['/intro1.png', '/intro2.png', '/intro3.png'];
    }
    
    // Map firm IDs to their actual image file names
    const imageNameMap: Record<string, string> = {
      'kirkland': 'Kirkland&Ellis',
      'wachtell': 'Wachtell, Lipton',
      'cravath': 'Cravath',
      'sullivan': 'Sullivan & Cromwell',
      'skadden': 'Skadden',
      'quinn': 'Quinn Emanuel',
      'sidley': 'Sidley Austin',
      'paulweiss': 'Paul, Weiss',
      'gibsondunn': 'Gibson Dunn',
      'latham': 'Latham & Watkins',
      'davispolk': 'Davis Polk',
      'simpson': 'Simpson Thacher'
    };
    
    const baseName = imageNameMap[firmId] || firmName;
    const imagePaths: string[] = [];
    
    // Check for image 1 and 2
    imagePaths.push(`/${baseName}1.png`);
    imagePaths.push(`/${baseName}2.png`);
    
    return imagePaths;
  };
  
  const lawFirms = [
    {
      id: 'intro',
      name: 'Intro',
      content: ''
    },
    {
      id: 'kirkland',
      name: 'Kirkland & Ellis',
      content: ''
    },
    {
      id: 'wachtell',
      name: 'Wachtell, Lipton',
      content: ''
    },
    {
      id: 'cravath',
      name: 'Cravath',
      content: ''
    },
    {
      id: 'sullivan',
      name: 'Sullivan & Cromwell',
      content: ''
    },
    {
      id: 'skadden',
      name: 'Skadden',
      content: ''
    },
    {
      id: 'quinn',
      name: 'Quinn Emanuel',
      content: ''
    },
    {
      id: 'sidley',
      name: 'Sidley Austin',
      content: ''
    },
    {
      id: 'paulweiss',
      name: 'Paul, Weiss',
      content: ''
    },
    {
      id: 'gibsondunn',
      name: 'Gibson Dunn',
      content: ''
    },
    {
      id: 'latham',
      name: 'Latham & Watkins',
      content: ''
    },
    {
      id: 'davispolk',
      name: 'Davis Polk',
      content: ''
    },
    {
      id: 'simpson',
      name: 'Simpson Thacher',
      content: ''
    }
  ];

  return (
    <div className="h-full overflow-auto" style={{ backgroundColor: '#FAF5EF' }}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-medium text-gray-900 mb-2">Big Law Guide</h1>
          <p className="text-gray-600">Comprehensive information about the nation's most prestigious law firms</p>
        </div>

        {/* Tabs */}
        <Card className="overflow-hidden" style={{ backgroundColor: '#FEFBF6' }}>
          <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="intro" className="w-full">
            <div className="border-b" style={{ backgroundColor: '#F8F4ED' }}>
              <TabsList className="w-full justify-start h-auto flex-wrap bg-transparent p-2 gap-1">
                {lawFirms.map((firm) => (
                  <TabsTrigger
                    key={firm.id}
                    value={firm.id}
                    className={`text-gray-700 hover:text-gray-900 hover:bg-white/50 rounded px-3 py-2 transition-all font-medium border-0 ${
                      activeTab === firm.id 
                        ? 'bg-[#752432] text-white' 
                        : ''
                    }`}
                    style={
                      activeTab === firm.id
                        ? { backgroundColor: '#752432', color: 'white' }
                        : undefined
                    }
                  >
                    {firm.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {lawFirms.map((firm) => {
              const images = getFirmImages(firm.name, firm.id);
              
              return (
                <TabsContent key={firm.id} value={firm.id} className="p-0 mt-0">
                  {/* Firm Content */}
                  <div className="p-8">
                    {/* Firm Images */}
                    <div className="flex flex-col items-center">
                      {images.map((imagePath, index) => (
                        <div key={index} className="max-w-2xl w-full">
                          <img
                            src={imagePath}
                            alt={`${firm.name} ${index + 1}`}
                            className="w-full h-auto object-contain"
                            onError={(e) => {
                              // Hide image if it doesn't exist
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    
                    {firm.content && (
                      <div className="prose prose-gray max-w-none">
                        {firm.content.split('\n\n').map((paragraph, index) => (
                          <p key={index} className="text-gray-700 mb-4 whitespace-pre-line leading-relaxed">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
