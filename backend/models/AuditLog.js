const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoanApplication',
    required: true
  },
  actionBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actionType: {
    type: String,
    required: true
  },
  previousStage: String,
  newStage: String,
  notes: String,
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

AuditLogSchema.index({ application: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
