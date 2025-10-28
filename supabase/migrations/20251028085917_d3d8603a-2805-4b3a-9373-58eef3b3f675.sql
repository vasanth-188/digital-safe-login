-- Create phishing_scans table for storing all phishing detection analyses
CREATE TABLE public.phishing_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  scan_type TEXT NOT NULL CHECK (scan_type IN ('email', 'url', 'message', 'domain')),
  input_content TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('safe', 'low', 'medium', 'high', 'critical')),
  confidence_score NUMERIC(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
  analysis_details JSONB NOT NULL DEFAULT '{}',
  indicators JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_phishing_scans_user_id ON public.phishing_scans(user_id);
CREATE INDEX idx_phishing_scans_created_at ON public.phishing_scans(created_at DESC);
CREATE INDEX idx_phishing_scans_risk_level ON public.phishing_scans(risk_level);

-- Enable Row Level Security
ALTER TABLE public.phishing_scans ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own scans
CREATE POLICY "Users can view own scans"
  ON public.phishing_scans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scans"
  ON public.phishing_scans
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scans"
  ON public.phishing_scans
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_phishing_scans_updated_at
  BEFORE UPDATE ON public.phishing_scans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();