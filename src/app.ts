import express from 'express';
import { Request, Response } from 'express';

const app = express();

app.use(express.json());

import tenantRoutres from './routes/tenant.routes';

app.use('/tenants', tenantRoutres);

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

export default app;