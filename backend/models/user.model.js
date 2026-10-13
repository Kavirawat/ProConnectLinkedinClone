import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  profilePicture: {
    type: String,
    default: 'default.jpg',
  },
  coverPicture: {
    type: String,
    default: 'nature.jpg',
  },
  createAt: {
    type: Date,
    default: Date.now,
  },
  updateAt: {
    type: Date,
    default: Date.now,
  },
  token: {
    type: String,
    default: '',
  },
});

const User = mongoose.model('User', UserSchema);

export default User;
