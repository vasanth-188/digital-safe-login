import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertTriangle, CheckCircle, Info, Shield, AlertCircle } from 'lucide-react';
import { PhishingScanResult } from '@/hooks/usePhishingScanner';

interface ScanResultsProps {
  result: PhishingScanResult;
}

const getRiskColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'safe':
      return 'bg-green-500 text-white hover:bg-green-600';
    case 'low':
      return 'bg-yellow-400 text-gray-900 hover:bg-yellow-500';
    case 'medium':
      return 'bg-orange-500 text-white hover:bg-orange-600';
    case 'high':
      return 'bg-red-500 text-white hover:bg-red-600';
    case 'critical':
      return 'bg-red-900 text-white hover:bg-red-950';
    default:
      return 'bg-gray-500 text-white';
  }
};

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'info':
      return <Info className="h-4 w-4" />;
    case 'warning':
      return <AlertCircle className="h-4 w-4" />;
    case 'danger':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'info':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'danger':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function ScanResults({ result }: ScanResultsProps) {
  const getRiskIcon = () => {
    switch (result.risk_level) {
      case 'safe':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'low':
      case 'medium':
        return <Shield className="h-6 w-6 text-orange-500" />;
      case 'high':
      case 'critical':
        return <AlertTriangle className="h-6 w-6 text-red-500" />;
      default:
        return <Info className="h-6 w-6" />;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getRiskIcon()}
              <div>
                <CardTitle>Analysis Results</CardTitle>
                <CardDescription>AI-powered phishing detection analysis</CardDescription>
              </div>
            </div>
            <Badge className={getRiskColor(result.risk_level)}>
              {result.risk_level.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Confidence Score</span>
              <span className="font-medium">{result.confidence_score}%</span>
            </div>
            <Progress value={result.confidence_score} className="h-2" />
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Summary</h3>
            <p className="text-sm text-muted-foreground">{result.summary}</p>
          </div>

          {result.indicators.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Detected Indicators ({result.indicators.length})</h3>
              <Accordion type="single" collapsible className="w-full">
                {result.indicators.map((indicator, index) => (
                  <AccordionItem key={index} value={`indicator-${index}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(indicator.severity)}
                        <span className="text-sm font-medium">{indicator.type.replace(/_/g, ' ').toUpperCase()}</span>
                        <Badge variant="outline" className={getSeverityColor(indicator.severity)}>
                          {indicator.severity}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground pl-6">
                        {indicator.description}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold">Recommendations</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{result.recommendations}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
