// STORAGE SCANNER CODE - SAVED FOR FUTURE USE
// Copy this code back to StorageScanner.tsx when you want to re-enable the storage scanning functionality

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Database, CheckCircle, XCircle } from 'lucide-react';
import { scanAndPopulateOutlines } from '../utils/scanStorageBucket';
import { testStorageAccess } from '../utils/testStorageAccess';

interface StorageScannerProps {
  onOutlinesLoaded?: (outlines: any[]) => void;
}

export function StorageScanner({ onOutlinesLoaded }: StorageScannerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    count: number;
    error?: string;
  } | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleScanStorage = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const result = await scanAndPopulateOutlines();
      setResult(result);

      if (result.success && onOutlinesLoaded) {
        console.log(`Successfully loaded ${result.count} outlines from storage`);
      }
    } catch (error) {
      setResult({
        success: false,
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestAccess = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      const result = await testStorageAccess();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Storage Bucket Scanner
        </CardTitle>
        <CardDescription>
          Scan your Outline storage bucket and populate the database with your actual files
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Test Storage Access</h3>
              <p className="text-sm text-gray-600">
                First, test if we can access your storage bucket
              </p>
            </div>
            <Button 
              onClick={handleTestAccess}
              disabled={isLoading}
              variant="outline"
              className="min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Access'
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Scan Storage Bucket</h3>
              <p className="text-sm text-gray-600">
                This will scan your Outline storage bucket and add all files to the database
              </p>
            </div>
            <Button 
              onClick={handleScanStorage}
              disabled={isLoading}
              className="min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                'Scan Storage Bucket'
              )}
            </Button>
          </div>
        </div>

        {testResult && (
          <Alert className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <AlertDescription className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                {testResult.message}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {result && (
          <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
                {result.success ? (
                  <>
                    Successfully found and added <strong>{result.count}</strong> outline files from your storage bucket!
                  </>
                ) : (
                  <>
                    Error: {result.error}
                  </>
                )}
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>What this does:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Scans your Outline storage bucket recursively</li>
            <li>Finds all PDF and DOCX files</li>
            <li>Extracts course, instructor, year, and grade from file paths</li>
            <li>Adds metadata to the outlines database table</li>
            <li>Enables searching and filtering in your app</li>
          </ul>
          <p className="mt-2"><strong>Expected file structure:</strong> Course/Instructor/Year/Grade/Filename.ext</p>
        </div>
      </CardContent>
    </Card>
  );
}

