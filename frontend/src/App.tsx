import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import { api, SummaryData, DriversData, RiskFactorsData, RecommendationsData } from './services/api';
import Summary from './components/Summary';
import Drivers from './components/Drivers';
import RiskFactors from './components/RiskFactors';
import Recommendations from './components/Recommendations';

function App() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [drivers, setDrivers] = useState<DriversData | null>(null);
  const [riskFactors, setRiskFactors] = useState<RiskFactorsData | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [summaryData, driversData, riskFactorsData, recommendationsData] = await Promise.all([
          api.getSummary(),
          api.getDrivers(),
          api.getRiskFactors(),
          api.getRecommendations()
        ]);

        setSummary(summaryData);
        setDrivers(driversData);
        setRiskFactors(riskFactorsData);
        setRecommendations(recommendationsData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load dashboard data. Please ensure the backend server is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading Revenue Intelligence Console...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
          Revenue Intelligence Console
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
          Q1 2026 Performance Dashboard • {new Date().toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          })}
        </Typography>
      </Paper>

      {/* Summary Section */}
      {summary && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Revenue Summary
          </Typography>
          <Summary data={summary} />
        </Box>
      )}

      {/* Drivers Section */}
      {drivers && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Revenue Drivers
          </Typography>
          <Drivers data={drivers} />
        </Box>
      )}

      {/* Recommendations Section */}
      {recommendations && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Strategic Recommendations
          </Typography>
          <Recommendations data={recommendations} />
        </Box>
      )}

      {/* Risk Factors Section */}
      {riskFactors && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Risk Factors & Alerts
          </Typography>
          <RiskFactors data={riskFactors} />
        </Box>
      )}
    </Container>
  );
}

export default App;
