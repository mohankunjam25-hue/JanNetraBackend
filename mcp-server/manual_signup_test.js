const http = require('http');

const data = JSON.stringify({
    fullName: "AI Demo User",
    username: "ai_demo_user_" + Date.now(),
    mobile: "12345" + Math.floor(Math.random() * 100000),
    password: "password123",
    state: "Jharkhand",
    district: "Ranchi",
    block: "Kanke",
    village: "AI Village",
    interests: ["Technology", "Education"]
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/users/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('STATUS:', res.statusCode);
        console.log('BODY:', body);
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
