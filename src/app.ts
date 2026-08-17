import express from 'express';
import { Request, Response } from 'express';

const app = express();

app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

export default app;