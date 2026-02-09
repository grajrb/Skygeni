import { Router, Request, Response } from 'express';
import {
  getPipelineSize,
  getWinRate,
  getAvgDealSize,
  getSalesCycleTime
} from '../services/metrics';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const pipelineSize = await getPipelineSize();
    const winRate = await getWinRate();
    const avgDealSize = await getAvgDealSize();
    const salesCycleTime = await getSalesCycleTime();

    res.json({
      pipelineSize,
      winRate: Number(winRate.toFixed(2)),
      avgDealSize: Math.round(avgDealSize),
      salesCycleTime: Math.round(salesCycleTime)
    });
  } catch (error) {
    console.error('Error in /api/drivers:', error);
    res.status(500).json({ error: 'Failed to fetch drivers data' });
  }
});

export default router;
