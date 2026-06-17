const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

async function test() {
    console.log("Connecting to:", process.env.MONGODB_URI);
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Database connection successful! ✅");
        
        const count = await mongoose.connection.db.collection('users').countDocuments();
        console.log("Total users found in DB:", count);
        
        process.exit(0);
    } catch (e) {
        console.error("Connection failed! ❌", e.message);
        process.exit(1);
    }
}

test();
