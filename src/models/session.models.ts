import { pool } from "../db/pool";

interface Create { id: number; tokenVersion: number; }
export const create = async (userId: number, refreshToken: string, deviceName?: string): Promise<Create> => {
    const result = await pool.query(`INSERT INTO sessions (user_id, refresh_token_hash, device_name, expires_at) VALUES($1, $2, $3, NOW() + INTERVAL '7 days') RETURNING id, token_version`, [userId, refreshToken, deviceName ?? null]);
    return {id: result.rows[0].id, tokenVersion: result.rows[0].token_version};
}


export const checkById = async (id: number): Promise<{ isActive: boolean; tokenVersion: number } | null> => {
   const result = await pool.query(`SELECT is_active, token_version FROM sessions WHERE id = $1 AND expires_at > NOW()`, [id]);
   const value = {isActive: result.rows[0].is_active, tokenVersion: result.rows[0].token_version};
   return value ?? null;
}

export const revokeSessionById = async (id: number, token: string): Promise<boolean> => {
    const result = await pool.query( `UPDATE sessions SET is_active = false WHERE id = $1 AND refresh_token_hash = $2 AND is_active = true RETURNING id`, [id, token]);
    return (result.rowCount ?? 0) > 0;
}

export const update = async (userId: number, oldToken: string, newToken: string): Promise<Create | null> => {
    const result = await pool.query(`UPDATE sessions SET refresh_token_hash = $1, token_version = token_version + 1 WHERE user_id = $2 AND refresh_token_hash = $3 AND is_active = true AND expires_at > NOW() RETURNING id, token_version`,[newToken, userId, oldToken]);
    if (result.rowCount == 0) { return null; }
    return  {id: result.rows[0].id, tokenVersion: result.rows[0].token_version};
}

export const getTokenVersion = async (id:number): Promise<number | null> => {
    const result = await pool.query(`SELECT token_version FROM sessions WHERE id = $1 AND is active = true`, [id]);
    return result.rows[0]?.token_version ?? null;
}

export const revokeAllSessions = async (user: number): Promise<boolean> => {
    const result = await pool.query(`UPDATE sessions SET is_active = false WHERE user_id = $1`, [user]);
    return (result.rowCount ?? 0) > 0;
}