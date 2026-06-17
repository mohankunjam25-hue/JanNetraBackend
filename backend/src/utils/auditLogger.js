const auditLogger = {
    log: (event, req, details = {}) => {
        const ip = req.ip || req.connection?.remoteAddress || 'unknown';
        const userId = req.user ? req.user._id : (details.userId || 'anonymous');
        const timestamp = new Date().toISOString();
        
        // Log to console in a structured way (in a real app, write to a file or log management system)
        console.log(`[AUDIT] [${timestamp}] Event: ${event} | IP: ${ip} | UserID: ${userId} | Details: ${JSON.stringify(details)}`);
    }
};

module.exports = auditLogger;