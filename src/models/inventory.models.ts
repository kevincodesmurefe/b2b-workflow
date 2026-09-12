import { PoolClient } from 'pg';
import { pool } from '../db/pool';
import { AppError } from '../utils/appError';

type InventoryReason = 'purchase' | 'sale' | 'transfer_in' | 'transfer_out' | 'adjustment' | 'return';

const adjustInventoryOnClient = async ( client: PoolClient, tenantId: number, warehouseId: number, productId: number, changeQuantity: number, reason: InventoryReason ): Promise<void> => {
    const inventoryResult = await client.query( ` SELECT quantity FROM inventory WHERE tenant_id = $1 AND warehouse_id = $2 AND product_id = $3 FOR UPDATE `, [tenantId, warehouseId, productId] );
    const currentQuantity = inventoryResult.rows[0]?.quantity ?? 0;
    if (changeQuantity < 0) {
        const quantityToRemove = Math.abs(changeQuantity);
        if (quantityToRemove > currentQuantity) { throw new AppError('Insufficient inventory', 400); }
    }

    await client.query( ` INSERT INTO inventory ( tenant_id, warehouse_id, product_id, quantity ) VALUES ($1, $2, $3, $4)
        ON CONFLICT (warehouse_id, product_id) DO UPDATE SET quantity = inventory.quantity + EXCLUDED.quantity, updated_at = NOW() `,
        [ tenantId, warehouseId, productId, changeQuantity ] );
    await client.query( ` INSERT INTO stock_movements ( tenant_id, warehouse_id, product_id, change_quantity, reason ) VALUES ($1, $2, $3, $4, $5) `, [ tenantId, warehouseId, productId, changeQuantity, reason ] );
};


export const adjustInventory = async ( tenantId: number, warehouseId: number, productId: number, changeQuantity: number, reason: InventoryReason ): Promise<void> => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await adjustInventoryOnClient( client, tenantId, warehouseId, productId, changeQuantity, reason );
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};


export const transferStock = async (userId: number, tenantId: number, productId: number, fromWarehouseId: number, toWarehouseId: number, quantity: number ): Promise<void> => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`INSERT INTO inventory_transfers ( tenant_id, product_id, from_warehouse_id, to_warehouse_id, quantity, created_by ) VALUES ($1, $2, $3, $4, $5, $6)`, [ tenantId, productId, fromWarehouseId, toWarehouseId, quantity, userId ]);
        await adjustInventoryOnClient( client, tenantId, fromWarehouseId, productId, -quantity, 'transfer_out' );
        await adjustInventoryOnClient( client, tenantId, toWarehouseId, productId, quantity, 'transfer_in' );
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export interface Inventory {
    id: number;
    warehouseId: number;
    productName: string;
    sku: string;
    quantity: number;
    reorderLevel: number;
    updatedAt: string;
}

export const getInventory = async ( tenantId: number, warehouseId?: number, productId?: number ): Promise<Inventory[]> => {
    let query = ` SELECT inventory.id, inventory.warehouse_id AS "warehouseId", products.name AS "productName", products.sku, inventory.quantity, inventory.reorder_level AS "reorderLevel", inventory.updated_at AS "updatedAt"
        FROM inventory JOIN products ON inventory.product_id = products.id AND inventory.tenant_id = products.tenant_id WHERE inventory.tenant_id = $1 `;
    const values: number[] = [tenantId];
    if (warehouseId !== undefined) { values.push(warehouseId); query += ` AND inventory.warehouse_id = $${values.length}`; }
    if (productId !== undefined) { values.push(productId); query += ` AND inventory.product_id = $${values.length}`; }
    query += ` ORDER BY inventory.updated_at DESC`;
    const result = await pool.query(query, values);
    return result.rows;
};