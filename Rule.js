const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema({
    ruleString: { type: String, required: true },
    ast: { type: Object, required: true }
})

const Rule = mongoose.model('Rule', ruleSchema);
module.exports = Rule;