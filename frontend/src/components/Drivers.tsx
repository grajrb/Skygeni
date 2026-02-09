import { useEffect, useRef } from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { DriversData } from '../services/api';
import * as d3 from 'd3';

interface DriversProps {
  data: DriversData;
}

export default function Drivers({ data }: DriversProps) {
  const chartRef = useRef<SVGSVGElement>(null);
  const { pipelineSize, winRate, avgDealSize, salesCycleTime } = data;

  useEffect(() => {
    if (!chartRef.current) return;

    // Clear previous chart
    d3.select(chartRef.current).selectAll('*').remove();

    const chartData = [
      { label: 'Win Rate', value: winRate, suffix: '%', color: '#4caf50', max: 100 },
      { label: 'Avg Deal', value: avgDealSize / 1000, suffix: 'K', color: '#2196f3', max: 100 },
      { label: 'Cycle Time', value: salesCycleTime, suffix: ' days', color: '#ff9800', max: 180 },
      { label: 'Pipeline', value: pipelineSize, suffix: ' deals', color: '#9c27b0', max: 300 }
    ];

    const width = 800;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 60, left: 60 };

    const svg = d3
      .select(chartRef.current)
      .attr('width', width)
      .attr('height', height);

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X scale
    const x = d3
      .scaleBand()
      .domain(chartData.map(d => d.label))
      .range([0, chartWidth])
      .padding(0.3);

    // Y scale
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(chartData, d => d.value) as number * 1.2])
      .range([chartHeight, 0]);

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('font-size', '12px')
      .style('font-weight', '500');

    // Y axis
    g.append('g')
      .call(d3.axisLeft(y))
      .selectAll('text')
      .style('font-size', '11px');

    // Bars
    g.selectAll('.bar')
      .data(chartData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.label) as number)
      .attr('y', d => y(d.value))
      .attr('width', x.bandwidth())
      .attr('height', d => chartHeight - y(d.value))
      .attr('fill', d => d.color)
      .attr('rx', 4);

    // Value labels on bars
    g.selectAll('.label')
      .data(chartData)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', d => (x(d.label) as number) + x.bandwidth() / 2)
      .attr('y', d => y(d.value) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', d => d.color)
      .text(d => `${d.value.toFixed(d.suffix === '%' ? 1 : 0)}${d.suffix}`);
  }, [pipelineSize, winRate, avgDealSize, salesCycleTime]);

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
      {/* Pipeline Size */}
      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={3} sx={{ height: '100%' }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom variant="body2">
              Pipeline Size
            </Typography>
            <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: '#9c27b0' }}>
              {pipelineSize}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Active opportunities
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Win Rate */}
      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={3} sx={{ height: '100%' }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom variant="body2">
              Win Rate
            </Typography>
            <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
              {winRate.toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Closed Won / Total Closed
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Avg Deal Size */}
      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={3} sx={{ height: '100%' }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom variant="body2">
              Avg Deal Size
            </Typography>
            <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
              {formatCurrency(avgDealSize)}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Won deals (excl. nulls)
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Sales Cycle Time */}
      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={3} sx={{ height: '100%' }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom variant="body2">
              Sales Cycle Time
            </Typography>
            <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
              {salesCycleTime}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Days on average
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Bar Chart */}
      <Grid item xs={12}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Revenue Drivers Overview
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <svg ref={chartRef}></svg>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
