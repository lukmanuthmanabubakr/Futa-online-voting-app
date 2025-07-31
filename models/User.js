const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  role: { type: String, default: 'student' },
});

module.exports = mongoose.model('User', userSchema);
