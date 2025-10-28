import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Mail, Link as LinkIcon, MessageSquare, FileQuestion } from 'lucide-react';
import { usePhishingScanner, PhishingScan } from '@/hooks/usePhishingScanner';
import { formatDistanceToNow } from 'date-fns';

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

const getScanTypeIcon = (scanType: string) => {
  switch (scanType) {
    case 'email':
      return <Mail className="h-4 w-4" />;
    case 'url':
      return <LinkIcon className="h-4 w-4" />;
    case 'message':
      return <MessageSquare className="h-4 w-4" />;
    default:
      return <FileQuestion className="h-4 w-4" />;
  }
};

export default function ScanHistory() {
  const [scans, setScans] = useState<PhishingScan[]>([]);
  const { getScanHistory, deleteScan } = usePhishingScanner();

  const loadHistory = async () => {
    const history = await getScanHistory();
    setScans(history);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (scanId: string) => {
    const success = await deleteScan(scanId);
    if (success) {
      setScans(scans.filter(scan => scan.id !== scanId));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scan History</CardTitle>
        <CardDescription>
          View and manage your previous phishing scans
        </CardDescription>
      </CardHeader>
      <CardContent>
        {scans.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No scans yet. Start scanning to build your history.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Content Preview</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scans.map((scan) => (
                  <TableRow key={scan.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getScanTypeIcon(scan.scan_type)}
                        <span className="text-sm capitalize">{scan.scan_type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="text-sm truncate">{scan.input_content}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRiskColor(scan.risk_level)}>
                        {scan.risk_level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{scan.confidence_score}%</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(scan.created_at), { addSuffix: true })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(scan.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
