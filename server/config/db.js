import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// Create MySQL / MariaDB connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME || 'jello_db',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

/**
 * Utility helper to test the database connection
 * @returns {Promise<boolean>}
 */
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`Connected to MySQL/MariaDB database: ${process.env.DB_NAME || 'jello_db'}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.code ? `[${error.code}] ${error.message || 'Cannot reach database'}` : error.message);
    return false;
  }
};

export { pool };
export default pool;
