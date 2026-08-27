import { pool } from "../db/pool";
import { Users } from "./auth.models";

const USER_COLUMNS = `id, email, role, tenant_id as "tenantId", password_hash as "passwordHash", created_at as "createdAt"`;

export const create = async (tenantId: number, email: string, passwordHash: string, role: Users["role"]): Promise<Users> => {
    const result = await pool.query(`INSERT INTO users (tenant_id, email, role, password_hash)  VALUES ($1, $2, $3, $4)  RETURNING ${USER_COLUMNS}`,[tenantId, email, role, passwordHash] );
    return result.rows[0];
}

export const getById = async (id: number, tenantId: number): Promise<Users | null> => {
    const result = await pool.query(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1 AND tenant_id = $2 AND is_active = true`,[id, tenantId] );
    return result.rows[0] ?? null;
}

export const getByEmail = async (email: string, tenantId: number): Promise<Users | null> => {
    const result = await pool.query(`SELECT ${USER_COLUMNS} FROM users WHERE email = $1 AND tenant_id = $2 AND is_active = true LIMIT 1`,[email, tenantId]);
    return result.rows[0] ?? null;
}

export const listByTenant = async (tenantId: number, role?: Users["role"]): Promise<Users[]> => {
    if (role) {
        const result = await pool.query(`SELECT ${USER_COLUMNS} FROM users WHERE tenant_id = $1 AND role = $2 AND is_active = true ORDER BY created_at DESC`,[tenantId, role]);
        return result.rows;
    }
    const result = await pool.query(
        `SELECT ${USER_COLUMNS} FROM users WHERE tenant_id = $1 AND is_active = true ORDER BY created_at DESC`,
        [tenantId]
    );
    return result.rows;
}


export const updateProfile = async (id: number, tenantId: number, email: string): Promise<Users | null> => {
    const result = await pool.query(`UPDATE users SET email = $1, updated_at = NOW()  WHERE id = $2 AND tenant_id = $3  RETURNING ${USER_COLUMNS}`,[email, id, tenantId] );
    return result.rows[0] ?? null;
}

export const updatePassword = async (id: number, tenantId: number, passwordHash: string): Promise<Users | null> => {
    const result = await pool.query(`UPDATE users SET password_hash = $1, updated_at = NOW(), must_change_password = false  WHERE id = $2 AND tenant_id = $3  RETURNING ${USER_COLUMNS}`,[passwordHash, id, tenantId]);
    return result.rows[0] ?? null;
}

export const updateRole = async (id: number, tenantId: number, role: Users["role"]): Promise<Users | null> => {
    const result = await pool.query(`UPDATE users SET role = $1, updated_at = NOW()  WHERE id = $2 AND tenant_id = $3  RETURNING ${USER_COLUMNS}`,[role, id, tenantId] );
    return result.rows[0] ?? null;
}

export const deactivate = async (id: number, tenantId: number): Promise<boolean> => {
    const result = await pool.query( `UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 AND tenant_id = $2`, [id, tenantId] );
    return (result.rowCount ?? 0) > 0;
}

export const reactivate = async (id: number, tenantId: number): Promise<boolean> => {
    const result = await pool.query( `UPDATE users SET is_active = true, updated_at = NOW() WHERE id = $1 AND tenant_id = $2`, [id, tenantId] );
    return (result.rowCount ?? 0) > 0;
}

export const mustChange = async ( email: string ): Promise<boolean> => {
    const result = await pool.query( `UPDATE users SET must_change_Password = true WHERE email = $1 AND is_active = true`, [email] );
    return (result.rowCount ?? 0) > 0;
}