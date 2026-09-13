import 'express';

declare global {
    namespace Express {
        interface Request {
            user: {
                userId: number;
                sessionId?: number;
                role?: 'super_admin' | 'business_admin' | 'warehouse_manager' | 'sales_rep' | 'delivery_agent';
                tenantId: number;
            }
        }
    }
}