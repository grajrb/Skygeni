import { Router, Request, Response } from 'express';
import { generateRecommendations } from '../services/metrics';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const recommendations = await generateRecommendations();

    res.json({
      recommendations
    });
  } catch (error) {
    console.error('Error in /api/recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations data' });
  }
});

export default router;
