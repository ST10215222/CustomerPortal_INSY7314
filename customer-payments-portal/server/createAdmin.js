const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb://localhost:27017/customerPortal';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Connection error:', err));

const UserSchema = new mongoose.Schema({
  fullName: String,
  accountNumber: String,
  password: String,
  role: { type: String, enum: ['admin', 'employee'], default: 'employee' }
});

const User = mongoose.model('User', UserSchema);

(async () => {
  const hashedPassword = await bcrypt.hash('adminTest123', 12);

  const admin = new User({
    fullName: 'Admin User',
    accountNumber: 'admin001',
    password: hashedPassword,
    role: 'admin'
  });

  await admin.save();
  console.log('✅ Admin user created with role: admin');
  mongoose.disconnect();
})();
