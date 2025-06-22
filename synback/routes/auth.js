import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Find user in database
        const user = await User.findOne({ username });
        
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check password
        if (user.password !== password) {
            return res.status(400).json({
                success: false,
                message: 'Invalid password'
            });
        }

        res.json({
            success: true,
            user: {
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Signup route
router.post('/signup', async (req, res) => {
    try {
        const { username, password, email } = req.body;

        // Check if user already exists by username or email
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            const message = existingUser.username === username 
                ? 'Username already exists' 
                : 'An account with this email already exists.';
            return res.status(400).json({
                success: false,
                message: message
            });
        }

        // Create new user
        const user = new User({
            username,
            password,
            email,
            role: 'student'
        });

        await user.save();

        res.json({
            success: true,
            user: {
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        // A more specific error for duplicate keys, as a fallback
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'An account with this username or email already exists.'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET api/users/:userId/courses
// @desc    Get all courses purchased by a user
// @access  Public (should be protected in a real app)
router.get('/:userId/courses', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).populate('purchasedCourses');

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user.purchasedCourses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

export default router;