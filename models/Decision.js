const mongoose = require('mongoose');

const DecisionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    decisionNumber: { type: String, required: true },
    decisionDate: { type: Date, required: true },
    subject: { type: String, required: true },
    recipient: { type: String, required: true },
    receivedDate: { type: Date, required: true },
    notes: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model('Decision', DecisionSchema);