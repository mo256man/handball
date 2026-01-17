const { Client } = require('pg');

const client = new Client({
  host: "mydatabase.cl0s4ksc8lzd.ap-northeast-1.rds.amazonaws.com",
  port: 5432,
  user: "postgres",
  password: "momo1024",
  database: "postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

async function test() {
  try {
    await client.connect();
    const res = await client.query('SELECT NOW()');
    console.log(res.rows[0]);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

test();
