/* Load environment */
require('dotenv').config();

const createLog = (message, res) => {
  console.log(`[LOG]: ${message}`);
  res.status(201).json({ 'message': 'Log added successfully' });
}

module.exports = {
  createLog
};