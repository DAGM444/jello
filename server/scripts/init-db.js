import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const initDatabase = async () => {
  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD ?? '';

  console.log(`Connecting to MySQL/MariaDB server at ${host}:${port}...`);

  let connection;
  try {
    // Initial connection without database selected to allow CREATE DATABASE
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true,
    });

    console.log('Connected successfully.');

    const sqlFilePath = path.join(__dirname, 'init-db.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Executing database initialization script (init-db.sql)...');
    await connection.query(sql);

    console.log('Database and tables initialized successfully!');
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

initDatabase();
