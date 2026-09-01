import express, { NextFunction } from 'express';
import { Request, Response } from 'express';

const app = express();

app.use(express.json());

import tenantRoutres from './routes/tenant.routes';
import userRoutes from './routes/user.routes';
import authRoutes from './routes/auth.routes';
import resetRoutes from './routes/passowrdReset.routes';
import { errorHandler } from './middleware/errorHandler.middleware';

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/tenants', tenantRoutres);
app.use('/password/', resetRoutes);

app.get("/health", (req: Request, res: Response) => { res.status(200).json({ status: "ok" }); });
app.use((req: Request, res: Response, next: NextFunction): void => { res.status(404).json({ message: `route ${req.method} ${req.url} not found` }); });
app.use( errorHandler );

export default app;