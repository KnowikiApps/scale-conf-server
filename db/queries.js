/* Load environment */
require('dotenv').config();

const createLog = (message, res) => {
  console.log(message);
  res.status(201).json({ 'message': 'Log added successfully' });
}

module.exports = {
  createLog
};