import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export interface SummaryData {
  currentQuarterRevenue: number;
  target: number;
  gapPercent: number;
  yoyChange: number | null;
}

export interface DriversData {
  pipelineSize: number;
  winRate: number;
  avgDealSize: number;
  salesCycleTime: number;
}

export interface StaleDeal {
  dealId: string;
  accountName: string;
  segment: string;
  repName: string;
  stage: string;
  amount: number | null;
  ageDays: number;
  daysSinceActivity: number;
}

export interface UnderperformingRep {
  repId: string;
  name: string;
  dealsWon: number;
  dealsLost: number;
  winRate: number;
  q1Revenue: number;
}

export interface LowActivityAccount {
  accountId: string;
  name: string;
  segment: string;
  industry: string;
  openDeals: number;
  recentActivityCount: number;
}

export interface RiskFactorsData {
  staleDeals: StaleDeal[];
  underperformingReps: UnderperformingRep[];
  lowActivityAccounts: LowActivityAccount[];
}

export interface Recommendation {
  priority: 'High' | 'Medium' | 'Low';
  action: string;
  metric: string;
  detail: string;
}

export interface RecommendationsData {
  recommendations: Recommendation[];
}

export const api = {
  getSummary: async (): Promise<SummaryData> => {
    const response = await axios.get(`${API_BASE_URL}/summary`);
    return response.data;
  },

  getDrivers: async (): Promise<DriversData> => {
    const response = await axios.get(`${API_BASE_URL}/drivers`);
    return response.data;
  },

  getRiskFactors: async (): Promise<RiskFactorsData> => {
    const response = await axios.get(`${API_BASE_URL}/risk-factors`);
    return response.data;
  },

  getRecommendations: async (): Promise<RecommendationsData> => {
    const response = await axios.get(`${API_BASE_URL}/recommendations`);
    return response.data;
  }
};
