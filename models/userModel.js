import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['patient', 'admin'], default: 'patient' },
  patientId: { type: String, unique: true, sparse: true }
}, { timestamps: true });

UserSchema.statics.addDefaultAdmin = async function() {
  const adminExists = await this.findOne({ role: 'admin' });
  if (!adminExists) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    await this.create({
      name: 'Dr. Admin',
      email: 'admin@dental.com',
      password: hashedPassword,
      patientId: `ADMIN${Math.floor(100 + Math.random() * 900)}`,
      role: 'admin',
    });
    console.log('Default admin created: admin@dental.com / admin123');
  }
};

const User = mongoose.model('User', UserSchema);
User.addDefaultAdmin();
export default User;
