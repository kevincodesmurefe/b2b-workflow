import { pool } from "../db/pool";

export const create = async ( userId: number, tokenHash: string ): Promise<boolean> => {
    const result = await pool.query(`INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL '15 minutes') RETURNING id`, [userId, tokenHash]);
    return (result.rowCount ?? 0) > 0;
}


export const used = async ( userId: number, token: string ): Promise<boolean> => {
    const result = await pool.query(`UPDATE password_resets SET used_at = NOW() WHERE user_id = $1 AND used_at = null AND expires_at > NOW() AND token_hash = $2`, [userId, token]);
    return (result.rowCount ?? 0) > 0; 
}

