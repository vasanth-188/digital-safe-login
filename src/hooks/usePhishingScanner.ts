import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ScanType = 'email' | 'url' | 'message' | 'domain';

export type RiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';

export interface PhishingIndicator {
  type: string;
  severity: 'info' | 'warning' | 'danger';
  description: string;
}

export interface PhishingScanResult {
  risk_level: RiskLevel;
  confidence_score: number;
  indicators: PhishingIndicator[];
  summary: string;
  recommendations: string;
  scan_id?: string;
  created_at?: string;
}

export interface PhishingScan {
  id: string;
  user_id: string;
  scan_type: ScanType;
  input_content: string;
  risk_level: RiskLevel;
  confidence_score: number;
  analysis_details: {
    summary: string;
    recommendations: string;
  };
  indicators: PhishingIndicator[];
  created_at: string;
  updated_at: string;
}

export function usePhishingScanner() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const scanContent = async (content: string, type: ScanType): Promise<PhishingScanResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('phishing-detection', {
        body: { content, scanType: type }
      });

      if (functionError) {
        throw functionError;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Scan Complete",
        description: `Risk Level: ${data.risk_level.toUpperCase()} (${data.confidence_score}% confidence)`,
      });

      return data as PhishingScanResult;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Scan failed. Please try again.";
      setError(errorMsg);
      
      toast({
        title: "Scan Failed",
        description: errorMsg,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getScanHistory = async (): Promise<PhishingScan[]> => {
    try {
      const { data, error } = await supabase
        .from('phishing_scans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(scan => ({
        id: scan.id,
        user_id: scan.user_id,
        scan_type: scan.scan_type as ScanType,
        input_content: scan.input_content,
        risk_level: scan.risk_level as RiskLevel,
        confidence_score: scan.confidence_score,
        analysis_details: scan.analysis_details as { summary: string; recommendations: string },
        indicators: (scan.indicators as unknown) as PhishingIndicator[],
        created_at: scan.created_at,
        updated_at: scan.updated_at
      }));
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Failed to load scan history";
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
      return [];
    }
  };

  const deleteScan = async (scanId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('phishing_scans')
        .delete()
        .eq('id', scanId);

      if (error) throw error;

      toast({
        title: "Scan Deleted",
        description: "Scan has been removed from your history",
      });

      return true;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Failed to delete scan";
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
      return false;
    }
  };

  return { scanContent, getScanHistory, deleteScan, loading, error };
}
