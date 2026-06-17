const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');

// Force use of Google DNS to avoid local DNS issues with MongoDB Atlas SRV records
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
    console.warn("Could not set custom DNS servers:", e.message);
}

// Set DNS result order to favor IPv4
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

dotenv.config();

const checkDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB:", mongoose.connection.name);
        
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("Collections:", collections.map(c => c.name));

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const count = await User.countDocuments();
        console.log("Total Users in DB:", count);

        const lastUser = await User.findOne().sort({ createdAt: -1 });
        console.log("Last User registered:", lastUser ? lastUser.username : "None");

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

checkDB();
