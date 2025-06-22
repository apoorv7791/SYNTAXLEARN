import express from 'express';
import Stripe from 'stripe';
import { WebSocket } from 'ws';
import { wss } from '../server.js';
import User from '../models/User.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

router.post('/create-payment-intent', async (req, res) => {
    try {
        const { courseId, amount, userId } = req.body;

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Stripe expects amounts in cents
            currency: 'inr',
            metadata: {
                courseId: courseId,
                userId: userId
            }
        });

        res.json({
            clientSecret: paymentIntent.client_secret
        });
    } catch (error) {
        console.error('Payment intent creation error:', error);
        res.status(500).json({ message: 'Error creating payment intent' });
    }
});

// Stripe webhook handler to receive payment status updates
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    // This is your Stripe CLI webhook secret for testing your endpoint locally.
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('PaymentIntent was successful!');

            const { userId, courseId } = paymentIntent.metadata;

            // Add the course to the user's purchasedCourses array
            try {
                const user = await User.findByIdAndUpdate(
                    userId,
                    { $addToSet: { purchasedCourses: courseId } }, // Use $addToSet to avoid duplicates
                    { new: true }
                );

                if (user) {
                    console.log(`Course ${courseId} added to user ${userId}`);
                } else {
                    console.log(`User with ID ${userId} not found.`);
                }
            } catch (err) {
                console.error('Error updating user with purchased course:', err);
            }
            
            // Use WebSocket to send a real-time notification to the client
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'payment_success',
                        data: paymentIntent
                    }));
                }
            });
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.send();
});

export default router;
 