import { pool } from '../db/pool';

export interface Tenant {
    id: number;
    name: string;
    createdAt: string;
    isActive: boolean;
}

const TENANT_COLUMNS = 'id, name, created_at as "createdAt", is_active as "isActive"';

export const create = async (name: string): Promise<Tenant> => {
const result = await pool.query(`INSERT INTO tenants (name) VALUES ($1) RETURNING ${TENANT_COLUMNS}`, [name]);
return result.rows[0];
}

export const update = async (name: string | null, id: number): Promise<Tenant> => {
const result = await pool.query(`UPDATE tenants SET name = COALESCE($1, name) WHERE id = $2 RETURNING ${TENANT_COLUMNS}`, [name, id]);
return result.rows[0];
}

export const deactivate = async (id: number): Promise<boolean> => {
const result = await pool.query(`UPDATE tenants SET is_active = false WHERE id = $1`, [id]);
return (result.rowCount ?? 0) > 0;
}

export const reactivate = async (id: number): Promise<boolean> => {
const result = await pool.query(`UPDATE tenants SET is_active = true WHERE id = $1`, [id]);
return (result.rowCount ?? 0) > 0;
}

export const get = async (id?: number, isActive?: boolean): Promise<Tenant[]> => {
    const conditions: string[] = [];
    const params: (number | boolean)[] = [];
    if (id !== undefined) {
        params.push(id);
        conditions.push(`id = $${params.length}`);
    }
    if (isActive !== undefined) {
        params.push(isActive);
        conditions.push(`is_active = $${params.length}`);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(`SELECT ${TENANT_COLUMNS} FROM tenants ${whereClause} ORDER BY created_at DESC`, params);
    return result.rows;
}