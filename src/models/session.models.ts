import { pool } from "../db/pool";

export const create = async (userId: number, refreshToken: string, deviceName?: string): Promise<number> => {
    const result = await pool.query(`INSERT INTO sessions (user_id, refresh_token_hash, device_name, expires_at) VALUES($1, $2, $3, NOW() + INTERVAL '7 days') RETURNING id`, [userId, refreshToken, deviceName ?? null]);
    return result.rows[0].id;
}


export const checkById = async (id: number): Promise<boolean | null> => {
   const result = await pool.query(`SELECT is_active FROM sessions WHERE id = $1 AND expires_at > NOW()`, [id]);
   return result.rows[0]?.is_active ?? null;
}

export const revokeSessionById = async (id: number, token: string): Promise<boolean> => {
    const result = await pool.query( `UPDATE sessions SET is_active = false WHERE id = $1 AND refresh_token_hash = $2 AND is_active = true RETURNING id`, [id, token]);
    return (result.rowCount ?? 0) > 0;
}


export const update = async (userId: number, oldToken: string, newToken: string): Promise<number | null> => {
    const result = await pool.query(`UPDATE sessions SET refresh_token_hash = $1 WHERE user_id = $2 AND refresh_token_hash = $3 AND is_active = true AND expires_at > NOW() RETURNING id`,[newToken, userId, oldToken]
    );
    return result.rows[0]?.id ?? null;
}

export const revokeAllSessions = async (user: number): Promise<boolean> => {
    const result = await pool.query(`UPDATE sessions SET is_active = false WHERE user_id = $1`, [user]);
    return (result.rowCount ?? 0) > 0;
}