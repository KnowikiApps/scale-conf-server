const { expressjwt: jwt } = require("express-jwt");

/* Load environment */
require('dotenv').config();

const Pool = require('pg').Pool;
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: +process.env.POSTGRES_PORT,
  ssl: true
});
// const pool = new Pool({
//   connectionString: process.env.PG_CONNECTION_STRING
// });

const createLog = (message, res) => {
  pool.query('INSERT INTO logs (message) VALUES ($1) RETURNING *', [message], (error, results) => {
    if (error) {
      throw error;
    }
    
    res.status(201).json({ 'message': 'Log added successfully' });
  });
}

module.exports = {
  createLog
};