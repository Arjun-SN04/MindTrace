import mongoose, { Schema } from 'mongoose';

const DiscoveredSchema = new Schema(
  {
    id: { type: String, required: true },
    discoveredAt: { type: Number, required: true },
    interpreted: { type: Boolean, required: true },
  },
  { _id: false },
);

const SaveSchema = new Schema(
  {
    playerId: { type: String, required: true, unique: true, index: true },
    version: { type: Number, required: true },
    savedAt: { type: Number, required: true },
    district: { type: String, required: true },
    position: { type: [Number], required: true },
    yaw: { type: Number, required: true },
    discovered: { type: [DiscoveredSchema], default: [] },
    flags: { type: [String], default: [] },
    completedObjectives: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const SaveModel = mongoose.models.Save ?? mongoose.model('Save', SaveSchema);
