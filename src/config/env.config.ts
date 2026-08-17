import dotenv from 'dotenv';

dotenv.config();

interface AppConfig {
    clientUrl: string;
    nodeEnv: string;
    saltRounds: number;
    port?: number;
    db: {
        dbHost: string;
        dbPort: number;
        dbUser: string;
        dbPassword: string;
        dbName: string;
    };
    secrets: {
        jwtSecret: string;
        refreshSecret: string;
        passwordResetSecret: string;
    };
    email: {
        emailUser: string;
        emailPass: string;
    };
};

function loadConfig(): AppConfig {
    const {
        DB_HOST,
        DB_PORT,
        DB_USER,
        DB_PASSWORD,
        DB_NAME,
        NODE_ENV,
        SALT_ROUNDS,
        CLIENT_URL,
        JWT_SECRET,
        REFRESH_SECRET,
        PASSWORD_RESET_SECRET,
        EMAIL_USER,
        EMAIL_PASS
    }  = process.env; 

    const PORT = process.env.PORT;

    if (!CLIENT_URL ||
    !SALT_ROUNDS ||
    !DB_HOST ||
    !DB_PORT ||
    !DB_USER ||
    !DB_PASSWORD ||
    !DB_NAME ||
    !JWT_SECRET ||
    !REFRESH_SECRET ||
    !PASSWORD_RESET_SECRET ||
    !EMAIL_USER ||
    !EMAIL_PASS || 
    !NODE_ENV) {
        throw new Error("Missing required environment variables");
    }

    return {
    clientUrl: CLIENT_URL,
    nodeEnv: NODE_ENV,
    port: Number(PORT),
    saltRounds: Number(SALT_ROUNDS),
    db: {
        dbHost: DB_HOST,
        dbPort: Number(DB_PORT),
        dbUser: DB_USER,
        dbPassword: DB_PASSWORD,
        dbName: DB_NAME
    },
    secrets: {
        jwtSecret: JWT_SECRET,
        refreshSecret: REFRESH_SECRET,
        passwordResetSecret: PASSWORD_RESET_SECRET
    },
    email: {
        emailUser: EMAIL_USER,
        emailPass: EMAIL_PASS
    }
};
}

export const config = loadConfig();