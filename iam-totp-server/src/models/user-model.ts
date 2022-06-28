import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: { type: String },
  devices_fingerprints: [ {
    fingerprint_hash: {type: String},
    timestamp_utc: { type: Date },
    ip_addr: { type: String }
  }],
  forced_mfa_setting: { type: String, enum: ['on', 'off', 'adaptive', 'global'], default: 'global' },
  ttf_device_setting: { type: Number, default: -1 },
  impossible_travel_distance_setting: { type: Number, default: -1 },
  rapid_api_secret: { type: String }
});

export default mongoose.model("user", userSchema)