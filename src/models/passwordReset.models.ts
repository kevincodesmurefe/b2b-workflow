import { pool } from "../db/pool";

export const create = async ( userId: number, tokenHash: string ): Promise<boolean> => {
    const result = await pool.query(`INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL '15 minutes') RETURNING id`, [userId, tokenHash]);
    return (result.rowCount ?? 0) > 0;
}


export const used = async (userId: number, tokenHash: string): Promise<boolean> => {
    const result = await pool.query(`UPDATE password_resets SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL AND expires_at > NOW() AND token_hash = $2`, [userId, tokenHash]);
    return (result.rowCount ?? 0) > 0;
}

export const completeReset = async (userId: number, tenantId: number, tokenHash: string, passwordHash: string): Promise<boolean> => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const token = await client.query(
            `UPDATE password_resets SET used_at = NOW()
             WHERE user_id = $1 AND token_hash = $2
             AND used_at IS NULL AND expires_at > NOW()
             RETURNING id`,
            [userId, tokenHash]
        );

        if (!token.rowCount) {
            await client.query('ROLLBACK');
            return false;
        }

        const user = await client.query(
            `UPDATE users SET password_hash = $1, updated_at = NOW(), must_change_password = false
             WHERE id = $2 AND tenant_id = $3 AND is_active = true
             RETURNING id`,
            [passwordHash, userId, tenantId]
        );

        if (!user.rowCount) {
            await client.query('ROLLBACK');
            return false;
        }

        await client.query(
            `UPDATE sessions SET is_active = false WHERE user_id = $1 AND is_active = true`,
            [userId]
        );

        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}