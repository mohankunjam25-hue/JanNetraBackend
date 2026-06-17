require('dotenv').config({ path: './.env' });
const http = require('http');

const performApiTest = async () => {
    let sessionCookie = '';
    let postId = '';
    const PORT = process.env.PORT || 5000;

    const makeRequest = (options, postData = null) => {
        return new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: data ? JSON.parse(data) : null
                    });
                });
            });

            req.on('error', (e) => {
                reject(e);
            });

            if (postData) {
                req.write(postData);
            }
            req.end();
        });
    };

    try {
        // Step 1: Login User
        console.log('--- Step 1: Logging in testuser ---');
        const loginData = JSON.stringify({
            username: 'testuser',
            password: 'TestPassword123'
        });
        const loginOptions = {
            hostname: 'localhost',
            port: PORT,
            path: '/api/v1/users/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': loginData.length
            }
        };
        const loginResponse = await makeRequest(loginOptions, loginData);
        if (loginResponse.statusCode !== 200) {
            throw new Error(`Login failed with status ${loginResponse.statusCode}: ${JSON.stringify(loginResponse.body)}`);
        }
        sessionCookie = loginResponse.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
        console.log('Login successful. Cookie captured.');

        // Step 2: Create Post
        console.log('
--- Step 2: Creating a new post ---');
        const postContent = 'This is a test post from an automated script.';
        const createData = JSON.stringify({ content: postContent });
        const createOptions = {
            hostname: 'localhost',
            port: PORT,
            path: '/api/v1/posts',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': createData.length,
                'Cookie': sessionCookie
            }
        };
        const createResponse = await makeRequest(createOptions, createData);
        if (createResponse.statusCode !== 201) {
            throw new Error(`Create Post failed with status ${createResponse.statusCode}: ${JSON.stringify(createResponse.body)}`);
        }
        postId = createResponse.body.data._id;
        console.log(`Post created successfully. Post ID: ${postId}`);

        // Step 3: Read Post
        console.log('
--- Step 3: Reading the post ---');
        const readOptions = {
            hostname: 'localhost',
            port: PORT,
            path: `/api/v1/posts/${postId}`,
            method: 'GET',
            headers: { 'Cookie': sessionCookie }
        };
        const readResponse = await makeRequest(readOptions);
        if (readResponse.statusCode !== 200 || readResponse.body.data.content !== postContent) {
            throw new Error(`Read Post failed. Status: ${readResponse.statusCode}, Content: ${readResponse.body.data.content}`);
        }
        console.log('Post read successfully. Content matches.');

        // Step 4: Update Post
        console.log('
--- Step 4: Updating the post ---');
        const updatedContent = 'This is the updated content.';
        const updateData = JSON.stringify({ content: updatedContent });
        const updateOptions = {
            hostname: 'localhost',
            port: PORT,
            path: `/api/v1/posts/${postId}`,
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': updateData.length,
                'Cookie': sessionCookie
            }
        };
        const updateResponse = await makeRequest(updateOptions, updateData);
        if (updateResponse.statusCode !== 200 || updateResponse.body.data.content !== updatedContent) {
            throw new Error(`Update Post failed. Status: ${updateResponse.statusCode}, Content: ${updateResponse.body.data.content}`);
        }
        console.log('Post updated successfully.');

        // Step 5: Delete Post
        console.log('
--- Step 5: Deleting the post ---');
        const deleteOptions = {
            hostname: 'localhost',
            port: PORT,
            path: `/api/v1/posts/${postId}`,
            method: 'DELETE',
            headers: { 'Cookie': sessionCookie }
        };
        const deleteResponse = await makeRequest(deleteOptions);
        if (deleteResponse.statusCode !== 200) {
            throw new Error(`Delete Post failed with status ${deleteResponse.statusCode}`);
        }
        console.log('Post deleted successfully.');

        // Step 6: Verify Deletion
        console.log('
--- Step 6: Verifying post deletion ---');
        const verifyOptions = {
            hostname: 'localhost',
            port: PORT,
            path: `/api/v1/posts/${postId}`,
            method: 'GET',
            headers: { 'Cookie': sessionCookie }
        };
        const verifyResponse = await makeRequest(verifyOptions);
        if (verifyResponse.statusCode !== 404) {
            throw new Error(`Verify Deletion failed. Expected 404 but got ${verifyResponse.statusCode}`);
        }
        console.log('Post deletion verified (404 Not Found).');

        console.log('
✅✅✅ ALL TESTS PASSED ✅✅✅');

    } catch (error) {
        console.error('
❌❌❌ TEST FAILED ❌❌❌');
        console.error(error);
        process.exit(1);
    }
};

performApiTest();
