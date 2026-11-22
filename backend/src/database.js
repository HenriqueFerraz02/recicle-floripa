/* eslint-disable no-undef, @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL não definida no backend/.env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: connectionString,
  // Confere o certificado do Neon (evita alguém se passar pelo banco).
  // DATABASE_SSL=desligado só para um PostgreSQL local de testes.
  ssl: process.env.DATABASE_SSL === 'desligado' ? false : { rejectUnauthorized: true },
  options: '-c client_encoding=UTF8',
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ ERRO AO CONECTAR NO BANCO:', err.message);
  } else {
    console.log('✅ BANCO DE DADOS NA NUVEM CONECTADO COM SUCESSO!');
  }
});

module.exports = pool;
