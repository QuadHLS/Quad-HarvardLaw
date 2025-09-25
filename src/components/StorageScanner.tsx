import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Database, Info } from 'lucide-react';

interface StorageScannerProps {
  onOutlinesLoaded?: (outlines: any[]) => void;
}

export function StorageScanner({ onOutlinesLoaded }: StorageScannerProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Upload Outlines
        </CardTitle>
        <CardDescription>
          Upload functionality is currently disabled. Use the search tab to find existing outlines.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Upload Feature Coming Soon!</strong><br />
            The upload functionality is temporarily disabled. You can currently search and view all existing outlines using the search filters above.
          </AlertDescription>
        </Alert>

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Current Status:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>✅ Search and filter existing outlines</li>
            <li>✅ Preview and download outlines</li>
            <li>✅ Save outlines to your collection</li>
            <li>⏳ Upload new outlines (coming soon)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
