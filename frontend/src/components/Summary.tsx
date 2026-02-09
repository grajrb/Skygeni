import { useEffect, useRef } from 'react';
import { Grid, Card, CardContent, Typography, Box, Chip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import * as d3 from 'd3';
import { SummaryData } from '../services/api';

interface SummaryProps {
  data: SummaryData;
}

export default function Summary({ data }: SummaryProps) {
  const gaugeRef = useRef<SVGSVGElement>(null);
  const { currentQuarterRevenue, target, gapPercent, yoyChange } = data;

  const progress = target > 0 ? Math.min((currentQuarterRevenue / target) * 100, 100) : 0;
  const isAhead = gapPercent >= 0;

  useEffect(() => {
    if (!gaugeRef.current) return;

    // Clear previous chart
    d3.select(gaugeRef.current).selectAll('*').remove();

    const width = 300;
    const height = 200;
    const margin = 20;

    const svg = d3
      .select(gaugeRef.current)
      .attr('width', width)
      .attr('height', height);

    const radius = Math.min(width, height * 2) / 2 - margin;
    const centerX = width / 2;
    const centerY = height - margin;

    // Background arc
    const backgroundArc = d3
      .arc()
      .innerRadius(radius - 30)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(Math.PI / 2);

    svg
      .append('path')
      .attr('d', backgroundArc as any)
      .attr('transform', `translate(${centerX},${centerY})`)
      .attr('fill', '#e0e0e0');

    // Progress arc
    const progressAngle = -Math.PI / 2 + (progress / 100) * Math.PI;
    const progressArc = d3
      .arc()
      .innerRadius(radius - 30)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(progressAngle);

    const progressColor = progress >= 100 ? '#4caf50' : progress >= 80 ? '#ff9800' : '#f44336';

    svg
      .append('path')
      .attr('d', progressArc as any)
      .attr('transform', `translate(${centerX},${centerY})`)
      .attr('fill', progressColor);

    // Center text
    svg
      .append('text')
      .attr('x', centerX)
      .attr('y', centerY - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '32px')
      .style('font-weight', 'bold')
      .style('fill', progressColor)
      .text(`${progress.toFixed(0)}%`);

    svg
      .append('text')
      .attr('x', centerX)
      .attr('y', centerY + 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#666')
      .text('to Target');
  }, [progress]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Grid container spacing={3}>
      {/* Current Quarter Revenue */}
      <Grid item xs={12} md={3}>
        <Card elevation={3}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom variant="body2">
              Q1 2026 Revenue
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              {formatCurrency(currentQuarterRevenue)}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Closed Won (excl. nulls)
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Target */}
      <Grid item xs={12} md={3}>
        <Card elevation={3}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom variant="body2">
              Q1 2026 Target
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {formatCurrency(target)}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Quarterly Goal
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Gap */}
      <Grid item xs={12} md={3}>
        <Card elevation={3}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom variant="body2">
              Gap to Target
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="h4"
                component="div"
                sx={{
                  fontWeight: 'bold',
                  color: isAhead ? '#4caf50' : '#f44336'
                }}
              >
                {isAhead ? '+' : ''}{gapPercent.toFixed(1)}%
              </Typography>
              {isAhead ? (
                <TrendingUpIcon sx={{ color: '#4caf50', fontSize: 32 }} />
              ) : (
                <TrendingDownIcon sx={{ color: '#f44336', fontSize: 32 }} />
              )}
            </Box>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              {isAhead ? 'Ahead of plan' : 'Behind plan'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* YoY Change */}
      <Grid item xs={12} md={3}>
        <Card elevation={3}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom variant="body2">
              YoY Growth
            </Typography>
            {yoyChange !== null ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="h4"
                    component="div"
                    sx={{
                      fontWeight: 'bold',
                      color: yoyChange >= 0 ? '#4caf50' : '#f44336'
                    }}
                  >
                    {yoyChange >= 0 ? '+' : ''}{yoyChange.toFixed(1)}%
                  </Typography>
                  {yoyChange >= 0 ? (
                    <TrendingUpIcon sx={{ color: '#4caf50', fontSize: 32 }} />
                  ) : (
                    <TrendingDownIcon sx={{ color: '#f44336', fontSize: 32 }} />
                  )}
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  vs Q1 2025
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: '#999' }}>
                  N/A
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  No data for Q1 2025
                </Typography>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Gauge Chart */}
      <Grid item xs={12}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
              Progress to Target
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <svg ref={gaugeRef}></svg>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
              <Chip
                label={`Current: ${formatCurrency(currentQuarterRevenue)}`}
                color="primary"
                variant="outlined"
              />
              <Chip
                label={`Remaining: ${formatCurrency(Math.max(0, target - currentQuarterRevenue))}`}
                color={isAhead ? 'success' : 'error'}
                variant="outlined"
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
