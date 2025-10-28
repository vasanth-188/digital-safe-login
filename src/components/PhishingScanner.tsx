import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Link as LinkIcon, MessageSquare } from 'lucide-react';
import { usePhishingScanner, ScanType, PhishingScanResult } from '@/hooks/usePhishingScanner';
import ScanResults from './ScanResults';

export default function PhishingScanner() {
  const [activeTab, setActiveTab] = useState<ScanType>('email');
  const [emailContent, setEmailContent] = useState('');
  const [urlContent, setUrlContent] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [scanResult, setScanResult] = useState<PhishingScanResult | null>(null);
  
  const { scanContent, loading } = usePhishingScanner();

  const handleScan = async () => {
    let content = '';
    
    switch (activeTab) {
      case 'email':
        content = emailContent;
        break;
      case 'url':
        content = urlContent;
        break;
      case 'message':
        content = messageContent;
        break;
    }

    if (!content.trim()) {
      return;
    }

    const result = await scanContent(content, activeTab);
    if (result) {
      setScanResult(result);
    }
  };

  const handleClear = () => {
    setEmailContent('');
    setUrlContent('');
    setMessageContent('');
    setScanResult(null);
  };

  const getContent = () => {
    switch (activeTab) {
      case 'email': return emailContent;
      case 'url': return urlContent;
      case 'message': return messageContent;
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Phishing Detection Scanner</CardTitle>
          <CardDescription>
            Analyze emails, URLs, and messages for potential phishing threats using AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ScanType)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                URL
              </TabsTrigger>
              <TabsTrigger value="message" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Message
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="email" className="space-y-4">
              <Textarea
                placeholder="Paste email content here (including headers if available)..."
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                className="min-h-[200px]"
              />
            </TabsContent>
            
            <TabsContent value="url" className="space-y-4">
              <Input
                type="text"
                placeholder="Enter URL to analyze (e.g., https://suspicious-site.com)"
                value={urlContent}
                onChange={(e) => setUrlContent(e.target.value)}
              />
            </TabsContent>
            
            <TabsContent value="message" className="space-y-4">
              <Textarea
                placeholder="Paste message or text content here..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                className="min-h-[200px]"
              />
            </TabsContent>
          </Tabs>

          <div className="flex gap-2">
            <Button 
              onClick={handleScan} 
              disabled={loading || !getContent().trim()}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Scan for Threats'
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleClear}
              disabled={loading}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {scanResult && <ScanResults result={scanResult} />}
    </div>
  );
}
