
const mongoose = require('mongoose');

const MedicalStoreSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  contact: { type: String, required: true },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  deliveryAvailable: { type: Boolean, default: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  certificateNumber: {type: String, required:true, unique: true },
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    // ... other days
  },
  medicines: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});

MedicalStoreSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('MedicalStore', MedicalStoreSchema);