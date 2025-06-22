import express from 'express';
import Course from '../models/Course.js';

const router = express.Router();

// @route   GET api/courses
// @desc    Get all courses
// @access  Public
router.get('/', async (req, res) => {
    try {
        const courses = await Course.find();
        res.json(courses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/courses
// @desc    Create a course
// @access  Private (should be admin in the future)
router.post('/', async (req, res) => {
    const { title, description, price, instructor } = req.body;

    try {
        const newCourse = new Course({
            title,
            description,
            price,
            instructor
        });

        const course = await newCourse.save();
        res.json(course);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
