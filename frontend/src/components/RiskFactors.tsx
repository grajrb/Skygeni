import { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningIcon from '@mui/icons-material/Warning';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import { RiskFactorsData } from '../services/api';

interface RiskFactorsProps {
  data: RiskFactorsData;
}

export default function RiskFactors({ data }: RiskFactorsProps) {
  const [expanded, setExpanded] = useState<string | false>('stale-deals');

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'Enterprise':
        return 'error';
      case 'Mid-Market':
        return 'warning';
      case 'SMB':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      {/* Stale Deals */}
      <Accordion expanded={expanded === 'stale-deals'} onChange={handleChange('stale-deals')} elevation={3}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <WarningIcon sx={{ mr: 2, color: '#f44336' }} />
          <Typography sx={{ fontWeight: 600 }}>
            Stale Deals ({data.staleDeals.length})
          </Typography>
          <Chip
            label={`${data.staleDeals.length} deals at risk`}
            color="error"
            size="small"
            sx={{ ml: 2 }}
          />
        </AccordionSummary>
        <AccordionDetails>
          {data.staleDeals.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Deal ID</strong></TableCell>
                    <TableCell><strong>Account</strong></TableCell>
                    <TableCell><strong>Segment</strong></TableCell>
                    <TableCell><strong>Rep</strong></TableCell>
                    <TableCell><strong>Stage</strong></TableCell>
                    <TableCell align="right"><strong>Amount</strong></TableCell>
                    <TableCell align="right"><strong>Age (days)</strong></TableCell>
                    <TableCell align="right"><strong>Days Since Activity</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.staleDeals.map((deal) => (
                    <TableRow key={deal.dealId} hover>
                      <TableCell>{deal.dealId}</TableCell>
                      <TableCell>{deal.accountName}</TableCell>
                      <TableCell>
                        <Chip
                          label={deal.segment}
                          color={getSegmentColor(deal.segment) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{deal.repName}</TableCell>
                      <TableCell>
                        <Chip
                          label={deal.stage}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">{formatCurrency(deal.amount)}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={deal.ageDays}
                          color={deal.ageDays > 60 ? 'error' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={deal.daysSinceActivity}
                          color="error"
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="success">No stale deals found. All deals have recent activity!</Alert>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Underperforming Reps */}
      <Accordion expanded={expanded === 'reps'} onChange={handleChange('reps')} elevation={3} sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <PeopleIcon sx={{ mr: 2, color: '#ff9800' }} />
          <Typography sx={{ fontWeight: 600 }}>
            Underperforming Reps ({data.underperformingReps.length})
          </Typography>
          <Chip
            label={`${data.underperformingReps.length} reps need coaching`}
            color="warning"
            size="small"
            sx={{ ml: 2 }}
          />
        </AccordionSummary>
        <AccordionDetails>
          {data.underperformingReps.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Rep ID</strong></TableCell>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell align="right"><strong>Deals Won</strong></TableCell>
                    <TableCell align="right"><strong>Deals Lost</strong></TableCell>
                    <TableCell align="right"><strong>Win Rate</strong></TableCell>
                    <TableCell align="right"><strong>Q1 Revenue</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.underperformingReps.map((rep) => (
                    <TableRow key={rep.repId} hover>
                      <TableCell>{rep.repId}</TableCell>
                      <TableCell><strong>{rep.name}</strong></TableCell>
                      <TableCell align="right">{rep.dealsWon}</TableCell>
                      <TableCell align="right">{rep.dealsLost}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${rep.winRate.toFixed(1)}%`}
                          color={rep.winRate < 30 ? 'error' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontWeight: 500 }}>
                          {formatCurrency(rep.q1Revenue)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="success">All reps are performing well!</Alert>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Low Activity Accounts */}
      <Accordion expanded={expanded === 'accounts'} onChange={handleChange('accounts')} elevation={3} sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <BusinessIcon sx={{ mr: 2, color: '#2196f3' }} />
          <Typography sx={{ fontWeight: 600 }}>
            Low Activity Accounts ({data.lowActivityAccounts.length})
          </Typography>
          <Chip
            label={`${data.lowActivityAccounts.length} accounts need attention`}
            color="info"
            size="small"
            sx={{ ml: 2 }}
          />
        </AccordionSummary>
        <AccordionDetails>
          {data.lowActivityAccounts.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Account ID</strong></TableCell>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>Segment</strong></TableCell>
                    <TableCell><strong>Industry</strong></TableCell>
                    <TableCell align="right"><strong>Open Deals</strong></TableCell>
                    <TableCell align="right"><strong>Recent Activities</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.lowActivityAccounts.map((account) => (
                    <TableRow key={account.accountId} hover>
                      <TableCell>{account.accountId}</TableCell>
                      <TableCell><strong>{account.name}</strong></TableCell>
                      <TableCell>
                        <Chip
                          label={account.segment}
                          color={getSegmentColor(account.segment) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{account.industry}</TableCell>
                      <TableCell align="right">{account.openDeals}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={account.recentActivityCount}
                          color={account.recentActivityCount === 0 ? 'error' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="success">All accounts have healthy activity levels!</Alert>
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
