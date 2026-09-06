import { pool } from "../db/pool";

export interface Warehouse {
    id: number;
    tenantId: number;
    name: string;
    address: string | null;
    isActive: boolean;
    createdAt: string;
}

const WAREHOUSE_COLUMNS = `id, name, address, tenant_id as "tenantId", is_active as "isActive", created_at as "createdAt"`;

export const create = async (tenantId: number, name: string, address: string | null): Promise<Warehouse> => {
    const result = await pool.query( `INSERT INTO warehouses (tenant_id, name, address) VALUES ($1, $2, $3) RETURNING ${WAREHOUSE_COLUMNS}`, [tenantId, name, address] );
    return result.rows[0];
}

export const get = async (tenantId: number, id?: number, isActive?: boolean): Promise<Warehouse[]> => {
    const conditions: string[] = ["tenant_id = $1"];
    const params: (number | boolean)[] = [tenantId];

    if (id !== undefined) { params.push(id); conditions.push(`id = $${params.length}`); }
    if (isActive !== undefined) { params.push(isActive); conditions.push(`is_active = $${params.length}`); }

    const result = await pool.query(`SELECT ${WAREHOUSE_COLUMNS} FROM warehouses WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`, params );
    return result.rows;
}

export const update = async (id: number, tenantId: number, name: string, address: string | null): Promise<Warehouse | null> => {
    const result = await pool.query( `UPDATE warehouses SET name = $1, address = $2 WHERE id = $3 AND tenant_id = $4 RETURNING ${WAREHOUSE_COLUMNS}`, [name, address, id, tenantId] );
    return result.rows[0] ?? null;
}

export const deactivate = async (id: number, tenantId: number): Promise<boolean> => {
    const result = await pool.query( `UPDATE warehouses SET is_active = false WHERE id = $1 AND tenant_id = $2`, [id, tenantId] );
    return (result.rowCount ?? 0) > 0;
}

export const reactivate = async (id: number, tenantId: number): Promise<boolean> => {
    const result = await pool.query( `UPDATE warehouses SET is_active = true WHERE id = $1 AND tenant_id = $2`, [id, tenantId] );
    return (result.rowCount ?? 0) > 0;
}