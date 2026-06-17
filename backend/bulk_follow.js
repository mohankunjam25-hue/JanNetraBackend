const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}

if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

const bulkFollow = async (sourceUsername) => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const Ally = mongoose.model('Ally', new mongoose.Schema({
            follower: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            following: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
        }, { timestamps: true }));

        // 1. Find the user who wants to follow everyone
        const me = await User.findOne({ username: sourceUsername.toLowerCase() });
        if (!me) {
            console.error(`User ${sourceUsername} not found`);
            process.exit(1);
        }

        // 2. Find all other users
        const others = await User.find({ _id: { $ne: me._id } });
        console.log(`Found ${others.length} other users.`);

        let newConnections = 0;
        for (const other of others) {
            // Check if already following
            const existing = await Ally.findOne({ follower: me._id, following: other._id });
            if (!existing) {
                await Ally.create({ follower: me._id, following: other._id });
                
                // Update their Allies Count
                await User.findByIdAndUpdate(other._id, { $inc: { alliesCount: 1 } });
                newConnections++;
            }
        }

        // 3. Update my Champions Count (Following)
        if (newConnections > 0) {
            await User.findByIdAndUpdate(me._id, { $inc: { championsCount: newConnections } });
        }

        console.log(`Successfully made ${sourceUsername} an Ally of ${newConnections} new users.`);
        console.log("Total Champions for this user updated.");
        
        process.exit(0);
    } catch (error) {
        console.error("Bulk Follow Error:", error);
        process.exit(1);
    }
};

// Replace 'subash_kunjam' with the username you are testing with
const target = process.argv[2] || 'subash_kunjam';
bulkFollow(target);
