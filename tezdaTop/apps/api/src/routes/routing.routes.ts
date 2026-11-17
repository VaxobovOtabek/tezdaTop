import { Router } from 'express';
import { RouteRequestSchema } from '@yaqintop/contracts';
import { routingService } from '../services/routing.service.js';

export const routingRouter = Router();

routingRouter.post('/', async (req, res) => {
  const parsed = RouteRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Boshlanish va yakuniy nuqtalar kiritilishi shart' });
    return;
  }

  try {
    const route = await routingService.calculateRoute(parsed.data);
    res.json(route);
  } catch (err: any) {
    res.status(503).json({ code: 'PROVIDER_UNAVAILABLE', message: 'Marshrut xizmati vaqtincha ishlamayapti' });
  }
});
