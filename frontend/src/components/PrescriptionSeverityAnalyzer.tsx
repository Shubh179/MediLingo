import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle2, Activity } from 'lucide-react';

interface SeverityAnalysis {
  severityScore: number;
  severityLevel: string;
  conditions: string[];
  medications: string[];
  riskFactors: string[];
  recommendations: string[];
  summary: string;
  databaseMatches?: Array<{
    disease: string;
    severity: string;
    precautions: string[];
    remedy: string;
  }>;
}

export const PrescriptionSeverityAnalyzer: React.FC = () => {
  const [prescriptionText, setPrescriptionText] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<SeverityAnalysis | null>(null);
  const [error, setError] = useState('');

  const analyzePrescription = async () => {
    if (!prescriptionText.trim()) {
      setError('Please enter prescription text');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/prescriptions/analyze-severity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prescriptionText,
          // Add userId if available from auth context
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAnalysis(data.analysis);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (score: number) => {
    if (score <= 3) return 'text-green-600 bg-green-50 border-green-200';
    if (score <= 6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score <= 8) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getSeverityIcon = (level: string) => {
    if (level === 'Low') return <CheckCircle2 className="w-6 h-6 text-green-600" />;
    if (level === 'Moderate') return <Activity className="w-6 h-6 text-yellow-600" />;
    return <AlertTriangle className="w-6 h-6 text-red-600" />;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Prescription Severity Analyzer
          </CardTitle>
          <CardDescription>
            Upload or paste your prescription to get an AI-powered severity analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Prescription Text</label>
            <Textarea
              value={prescriptionText}
              onChange={(e) => setPrescriptionText(e.target.value)}
              placeholder="Enter prescription text here (from OCR scan or manual input)..."
              rows={8}
              className="w-full"
            />
          </div>

          <Button 
            onClick={analyzePrescription} 
            disabled={loading || !prescriptionText.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Prescription'
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {analysis && (
        <div className="space-y-4">
          {/* Severity Score Card */}
          <Card className={`border-2 ${getSeverityColor(analysis.severityScore)}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium opacity-70">Severity Level</div>
                  <div className="text-3xl font-bold mt-1">{analysis.severityLevel}</div>
                </div>
                <div className="flex items-center gap-4">
                  {getSeverityIcon(analysis.severityLevel)}
                  <div className="text-right">
                    <div className="text-sm font-medium opacity-70">Score</div>
                    <div className="text-3xl font-bold">{analysis.severityScore}/10</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{analysis.summary}</p>
            </CardContent>
          </Card>

          {/* Conditions */}
          {analysis.conditions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detected Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {analysis.conditions.map((condition, idx) => (
                    <li key={idx} className="text-gray-700">{condition}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Medications */}
          {analysis.medications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Medications</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {analysis.medications.map((med, idx) => (
                    <li key={idx} className="text-gray-700">{med}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Risk Factors */}
          {analysis.riskFactors.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Risk Factors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {analysis.riskFactors.map((risk, idx) => (
                    <li key={idx} className="text-gray-700">{risk}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {analysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-gray-700">{rec}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Database Matches */}
          {analysis.databaseMatches && analysis.databaseMatches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Medical Knowledge Database Matches</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.databaseMatches.map((match, idx) => (
                  <div key={idx} className="border-l-4 border-primary pl-4 py-2">
                    <div className="font-semibold">{match.disease}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Severity: {match.severity}
                    </div>
                    {match.precautions.length > 0 && (
                      <div className="text-sm text-gray-600 mt-1">
                        Precautions: {match.precautions.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
