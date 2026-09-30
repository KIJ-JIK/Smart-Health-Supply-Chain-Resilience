const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'postgres',
  port: 5432,
});

client.connect()
  .then(() => {
    console.log("Connected to PostgreSQL successfully!");
    return client.query('SELECT 1');
  })
  .then(() => {
    client.end();
  })
  .catch(err => {
    console.error("Connection error", err.stack);
    client.end();
  });
