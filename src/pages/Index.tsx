import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, TrendingUp, Clock, CheckCircle, BarChart3, History, ScanIcon } from "lucide-react";
import PhishingScanner from "@/components/PhishingScanner";
import ScanHistory from "@/components/ScanHistory";
import { PhishingAnalytics } from "@/components/PhishingAnalytics";
import { usePhishingScanner } from "@/hooks/usePhishingScanner";

export default function Index() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { getScanHistory } = usePhishingScanner();
  const [stats, setStats] = useState({
    totalScans: 0,
    threatsDetected: 0,
    lastScan: null as string | null,
    safetyScore: 0
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      loadStats();
    }
  }, [user, loading, navigate]);

  const loadStats = async () => {
    const scans = await getScanHistory();
    const threats = scans.filter(s => ['medium', 'high', 'critical'].includes(s.risk_level)).length;
    const safe = scans.filter(s => s.risk_level === 'safe').length;
    const safetyScore = scans.length > 0 ? Math.round((safe / scans.length) * 100) : 0;

    setStats({
      totalScans: scans.length,
      threatsDetected: threats,
      lastScan: scans.length > 0 ? scans[0].created_at : null,
      safetyScore
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Phishing Detection Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button variant="outline" onClick={signOut}>Sign Out</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalScans}</div>
              <p className="text-xs text-muted-foreground">All-time scans performed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Threats Detected</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.threatsDetected}</div>
              <p className="text-xs text-muted-foreground">Medium risk or higher</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Safety Score</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.safetyScore}%</div>
              <p className="text-xs text-muted-foreground">Safe content rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Scan</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.lastScan ? new Date(stats.lastScan).toLocaleDateString() : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">Most recent analysis</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="scanner" className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="scanner">
              <ScanIcon className="h-4 w-4 mr-2" />
              Scanner
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scanner">
            <PhishingScanner />
          </TabsContent>

          <TabsContent value="analytics">
            <PhishingAnalytics />
          </TabsContent>

          <TabsContent value="history">
            <ScanHistory />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
