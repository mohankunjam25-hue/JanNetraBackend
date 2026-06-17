require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('./models/user.model');
const connectDB = require('./config/db');

const seedUser = async () => {
    console.log("Connecting to database...");
    await connectDB();
    console.log("Database connected.");

    try {
        const username = 'testuser';
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            console.log(`User "${username}" already exists.`);
            return;
        }

        console.log("Creating new test user...");
        const user = new User({
            username: 'testuser',
            email: 'testuser@example.com',
            fullName: 'Test User',
            mobile: '1234567890',
            password: 'TestPassword123', // The pre-save hook will hash this
            state: 'Test State',
            district: 'Test District',
            block: 'Test Block',
            village: 'Test Village',
            isVerified: true
        });

        await user.save();
        console.log(`Successfully created user: ${user.username}`);

    } catch (error) {
        console.error("Error seeding user:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Database connection closed.");
    }
};

seedUser();
