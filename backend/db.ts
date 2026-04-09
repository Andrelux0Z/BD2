import sql from 'mssql';


/**
 * Este archivo define la configuración necesaria para establecer
 * conexión con la base de datos usando la librería "mssql"
 */

const config: sql.config = {
    server: process.env.DB_SERVER || '',
    port: Number(process.env.DB_PORT) || 1433,
    database: process.env.DB_DATABASE || '',
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
    authentication: {
        type: 'default',
        options: {
            userName: process.env.DB_USER || '',
            password:  process.env.DB_PASSWORD || '',
        }

    }
};

export default config;