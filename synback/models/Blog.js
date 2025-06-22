import { Schema, model } from 'mongoose';

const blogSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: [
            'Web Development',
            'Backend Development',
            'Frontend Development',
            'Mobile Development',
            'Data Science',
            'Machine Learning',
            'DevOps',
            'Cloud Computing',
            'Cybersecurity',
            'Blockchain'
        ]
    },
    date: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default model('Blog', blogSchema);
