import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Database, CheckCircle, XCircle } from 'lucide-react';
import { populateOutlinesTable, fetchOutlines } from '../utils/outlineUtils';
// Mock data functions removed - only use real database data

interface OutlineDatabaseManagerProps {
  onOutlinesLoaded?: (outlines: any[]) => void;
}

export function OutlineDatabaseManager({ onOutlinesLoaded }: OutlineDatabaseManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    count: number;
    error?: string;
  } | null>(null);
  const [clearResult, setClearResult] = useState<{
    success: boolean;
    error?: string;
  } | null>(null);

  const handlePopulateDatabase = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      // Only use real data from storage bucket - no mock data
      const result = await populateOutlinesTable();
      setResult(result);

      if (result.success && onOutlinesLoaded) {
        // Fetch the newly populated outlines
        const outlines = await fetchOutlines();
        onOutlinesLoaded(outlines);
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

  const handleClearDatabase = async () => {
    setIsLoading(true);
    setClearResult(null);

    try {
      const result = await clearOutlinesDatabase();
      setClearResult(result);

      if (result.success && onOutlinesLoaded) {
        // Clear the outlines in the app
        onOutlinesLoaded([]);
      }
    } catch (error) {
      setClearResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
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
          Outline Database Manager
        </CardTitle>
        <CardDescription>
          Scan your storage bucket and populate the database with outline files
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Populate Database</h3>
              <p className="text-sm text-gray-600">
                This will scan your Outline storage bucket and add all files to the database
              </p>
            </div>
            <Button 
              onClick={handlePopulateDatabase}
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                'Populate Database'
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Clear Database</h3>
              <p className="text-sm text-gray-600">
                Remove all outlines from the database
              </p>
            </div>
            <Button 
              onClick={handleClearDatabase}
              disabled={isLoading}
              variant="destructive"
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Clearing...
                </>
              ) : (
                'Clear Database'
              )}
            </Button>
          </div>
        </div>

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
                    Successfully populated database with <strong>{result.count}</strong> outline files!
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

        {clearResult && (
          <Alert className={clearResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <div className="flex items-center gap-2">
              {clearResult.success ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <AlertDescription className={clearResult.success ? 'text-green-800' : 'text-red-800'}>
                {clearResult.success ? (
                  <>
                    Database cleared successfully!
                  </>
                ) : (
                  <>
                    Error: {clearResult.error}
                  </>
                )}
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Expected file structure:</strong> Course/Instructor/Year/Grade/Filename.ext</p>
          <p><strong>Example:</strong> Contracts/Einer Elhauge/2020/DS/HandsomelyFoamy.docx</p>
          <p><strong>Supported formats:</strong> PDF (.pdf) and Word (.docx)</p>
        </div>
      </CardContent>
    </Card>
  );
}
