import { pool } from "../db/pool";

export interface Product {
    id: number;
    tenantId: number;
    sku:  string;
    name: string;
    description: string;
    unitPrice: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

const PRODUCT_COLUMNS = `id, tenant_id as "tenantId", sku, name, description, unit_price as "unitPrice", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"`;

export const create = async (tenantId:number, sku: string, name: string, description: string, unitPrice: number): Promise<Product> => {
    const result = await pool.query(`INSERT INTO products (tenant_id, sku, name, description, unit_price) VALUES ($1, $2, $3, $4, $5) RETURNING ${PRODUCT_COLUMNS}`, [tenantId, sku, name, description, unitPrice]);
    return result.rows[0];
}

export const update = async (id: number, tenantId: number, sku?: string, name?: string, description?: string, unitPrice?: number): Promise<Product | null> => {
    const result = await pool.query(`UPDATE products SET sku = COALESCE($1, sku), name = COALESCE($2, name), description = COALESCE($3, description), unit_price = COALESCE($4, unit_price), updated_at = NOW() WHERE id = $5 AND tenant_id = $6 RETURNING ${PRODUCT_COLUMNS}`, [sku, name, description, unitPrice, id, tenantId]);
    return result.rows[0];
}

export const get = async (tenantId: number, id?: number, isActive?: boolean): Promise<Product[]> => {
    const conditions: string[] = ["tenant_id = $1"];
    const params: (number | boolean)[] = [tenantId];

    if (id !== undefined) { params.push(id); conditions.push(`id = $${params.length}`); }
    if (isActive !== undefined) { params.push(isActive); conditions.push(`is_active = $${params.length}`); }

    const result = await pool.query(`SELECT ${PRODUCT_COLUMNS} FROM products WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`, params );
    return result.rows;
}

export const deactivate = async (id: number, tenantId: number): Promise<boolean> => {
    const result = await pool.query( `UPDATE products SET is_active = false WHERE id = $1 AND tenant_id = $2`, [id, tenantId] );
    return (result.rowCount ?? 0) > 0;
}

export const reactivate = async (id: number, tenantId: number): Promise<boolean> => {
    const result = await pool.query( `UPDATE products SET is_active = true WHERE id = $1 AND tenant_id = $2`, [id, tenantId] );
    return (result.rowCount ?? 0) > 0;
}

export const exists = async (tenantId: number, sku: string, excludeId?: number): Promise<boolean> => {
    const conditions = ["tenant_id = $1", "sku = $2"];
    const params: (number | string)[] = [tenantId, sku];
    if (excludeId !== undefined) {
        params.push(excludeId);
        conditions.push(`id != $${params.length}`);
    }
    const result = await pool.query(`SELECT 1 FROM products WHERE ${conditions.join(' AND ')} LIMIT 1`, params);
    return (result.rowCount ?? 0) > 0;
}