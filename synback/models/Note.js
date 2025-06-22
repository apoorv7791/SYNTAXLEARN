import { Schema, model } from 'mongoose';

const noteSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Programming', 'Data Structures', 'Algorithms', 'Web Development', 'Other']
    },
    fileName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    contentType: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
noteSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export default model('Note', noteSchema);
