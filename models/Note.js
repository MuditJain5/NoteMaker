var mongoose = require('mongoose');

var projectSchema = new mongoose.Schema({
    title: String,
    content: String,
    img:
    {
        data: Buffer,
        contentType: String
    },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        username: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Project", projectSchema);