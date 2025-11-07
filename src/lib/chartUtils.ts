import { PhishingScan, RiskLevel, ScanType } from "@/hooks/usePhishingScanner";
import { format } from "date-fns";

export interface ChartDataPoint {
  date: string;
  confidence: number;
  riskLevel: RiskLevel;
  scanType: ScanType;
  scanId: string;
  timestamp: number;
}

export interface RiskDistribution {
  name: RiskLevel;
  value: number;
  fill: string;
}

export interface ConfidenceDistribution {
  range: string;
  count: number;
  fill: string;
}

export interface AggregatedData {
  riskDistribution: RiskDistribution[];
  confidenceTrend: ChartDataPoint[];
  confidenceDistribution: ConfidenceDistribution[];
}

// Chart colors matching risk levels
export const chartColors = {
  safe: "hsl(142, 76%, 36%)",
  low: "hsl(45, 93%, 47%)",
  medium: "hsl(217, 91%, 60%)",
  high: "hsl(0, 84%, 60%)",
  critical: "hsl(0, 63%, 31%)",
};

export const confidenceRangeColors = [
  "hsl(0, 84%, 60%)", // 0-20%
  "hsl(25, 95%, 53%)", // 21-40%
  "hsl(45, 93%, 47%)", // 41-60%
  "hsl(100, 60%, 45%)", // 61-80%
  "hsl(142, 76%, 36%)", // 81-100%
];

export function processScansForCharts(scans: PhishingScan[]): AggregatedData {
  // Sort scans by date (newest first)
  const sortedScans = [...scans].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Confidence trend data
  const confidenceTrend: ChartDataPoint[] = sortedScans.map((scan) => ({
    date: format(new Date(scan.created_at), "MMM dd"),
    confidence: scan.confidence_score,
    riskLevel: scan.risk_level,
    scanType: scan.scan_type,
    scanId: scan.id,
    timestamp: new Date(scan.created_at).getTime(),
  }));

  // Risk distribution
  const riskCounts: Record<RiskLevel, number> = {
    safe: 0,
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  scans.forEach((scan) => {
    riskCounts[scan.risk_level]++;
  });

  const riskDistribution: RiskDistribution[] = Object.entries(riskCounts)
    .filter(([_, count]) => count > 0)
    .map(([level, count]) => ({
      name: level as RiskLevel,
      value: count,
      fill: chartColors[level as RiskLevel],
    }));

  // Confidence distribution
  const confidenceRanges = {
    "0-20%": 0,
    "21-40%": 0,
    "41-60%": 0,
    "61-80%": 0,
    "81-100%": 0,
  };

  scans.forEach((scan) => {
    const score = scan.confidence_score;
    if (score <= 20) confidenceRanges["0-20%"]++;
    else if (score <= 40) confidenceRanges["21-40%"]++;
    else if (score <= 60) confidenceRanges["41-60%"]++;
    else if (score <= 80) confidenceRanges["61-80%"]++;
    else confidenceRanges["81-100%"]++;
  });

  const confidenceDistribution: ConfidenceDistribution[] = Object.entries(confidenceRanges).map(
    ([range, count], index) => ({
      range,
      count,
      fill: confidenceRangeColors[index],
    })
  );

  return {
    riskDistribution,
    confidenceTrend,
    confidenceDistribution,
  };
}

export function calculateInsights(scans: PhishingScan[]) {
  if (scans.length === 0) {
    return {
      avgConfidence: 0,
      highestConfidence: 0,
      mostCommonRisk: "safe" as RiskLevel,
      totalScans: 0,
    };
  }

  const avgConfidence =
    scans.reduce((sum, scan) => sum + scan.confidence_score, 0) / scans.length;

  const highestConfidence = Math.max(...scans.map((scan) => scan.confidence_score));

  const riskCounts: Record<RiskLevel, number> = {
    safe: 0,
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  scans.forEach((scan) => {
    riskCounts[scan.risk_level]++;
  });

  const mostCommonRisk = (Object.entries(riskCounts).sort((a, b) => b[1] - a[1])[0][0] ||
    "safe") as RiskLevel;

  return {
    avgConfidence: Math.round(avgConfidence),
    highestConfidence,
    mostCommonRisk,
    totalScans: scans.length,
  };
}
