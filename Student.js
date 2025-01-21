const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: String
});

const StudentModel = mongoose.model("students", StudentSchema);

module.exports = StudentModel;
