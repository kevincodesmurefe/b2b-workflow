import { pool } from "../db/pool";

export interface Users {
    id: number;
    tenantId: number;
    email: string;
    role: 'super_admin' | 'business_admin' | 'warehouse_manager' | 'sales_rep' | 'delivery_agent';
    passwordHash: string | null;
    createdAt: string;
}

export const getuser = async (email: string): Promise<Users | null> => {
    const result = await pool.query(`SELECT id, email, role, tenant_id as "tenantId", password_hash as "passwordHash", created_at as "createdAt" FROM users WHERE email = $1 AND is_active = true LIMIT 1`, [email]);
    return result.rows[0] ?? null;
}

export const getUserById = async (id: number, tenantId: number): Promise<Users | null> => {
    const result = await pool.query(`SELECT id, email, role, password_hash as "passwordHash", created_at as "createdAt" FROM users WHERE id = $1 AND is_active = true AND tenant_id = $2`, [id, tenantId] );
    return result.rows[0] ?? null;
}