const http = require('http');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/smarthealth' });

async function testWithStock() {
  const client = await pool.connect();
  const medId = (await client.query('INSERT INTO medicines (name, category, unit) VALUES ($1, $2, $3) RETURNING id', ['StockTest-' + Date.now(), 'Antibiotic', 'strip'])).rows[0].id;
  const batchId = require('crypto').randomUUID();
  const phcId = 'c402e65f-f7cf-421f-aeb5-7c7674faf7e2';
  await client.query('INSERT INTO inventory_batches (id, phc_id, medicine_id, batch_no, remaining_qty, minimum_threshold, expiry_date) VALUES ($1, $2, $3, $4, $5, $6, $7)', [batchId, phcId, medId, 'BATCH-ST-1', 10, 2, '2027-01-01']);
  client.release();
  await pool.end();

  const authData = JSON.stringify({ phcId, staffId: 'Dr. Ramesh Sharma', role: 'Medical Officer', pin: '1234' });
  const authReq = http.request({
    hostname: 'localhost', port: 8000, path: '/api/v1/phc/auth/verify', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(authData) }
  }, res => {
    let b = '';
    res.on('data', d => b += d);
    res.on('end', () => {
      const token = JSON.parse(b).tokens.accessToken;
      const checkoutData = JSON.stringify({
        client_txn_id: 'test-with-stock-' + Date.now(),
        items: [{ medicine_id: medId, quantity: 5, unit_price: 10 }]
      });
      const cReq = http.request({
        hostname: 'localhost', port: 8000, path: '/api/v1/phc/' + phcId + '/billing/checkout', method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(checkoutData),
          'Authorization': 'Bearer ' + token,
          'x-user-role': 'phc_user',
          'x-phc-id': phcId
        }
      }, cRes => {
        let cb = '';
        cRes.on('data', cd => cb += cd);
        cRes.on('end', () => console.log('Checkout Status:', cRes.statusCode, 'Body:', cb));
      });
      cReq.write(checkoutData);
      cReq.end();
    });
  });
  authReq.write(authData);
  authReq.end();
}
testWithStock();
