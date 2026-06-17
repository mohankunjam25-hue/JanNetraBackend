require('dotenv').config({ path: './.env' });
const http = require('http');

const performCommentAuditTest = async () => {
    let sessionCookie = '';
    let postId = '';
    let commentId = '';
    let replyId = '';
    const PORT = process.env.PORT || 5000;

    const makeRequest = (options, postData = null) => {
        if (postData) {
            options.headers = options.headers || {};
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }
        return new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    let parsedData = null;
                    if (data) {
                        try {
                            parsedData = JSON.parse(data);
                        } catch (e) {
                            console.error('Failed to parse response:', data);
                        }
                    }
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: parsedData
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
        console.log('--- Step 1: Logging in ---');
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
            throw new Error(`Login failed: ${JSON.stringify(loginResponse.body)}`);
        }
        sessionCookie = loginResponse.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');

        console.log('--- Step 2: Creating a post ---');
        const postData = JSON.stringify({ content: 'Post for comment audit test', state: 'Jharkhand', district: 'Ranchi', block: 'Ranchi', village: 'Ranchi' });
        const postOptions = {
            hostname: 'localhost', port: PORT, path: '/api/v1/posts', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': postData.length, 'Cookie': sessionCookie }
        };
        const postResponse = await makeRequest(postOptions, postData);
        postId = postResponse.body.data._id;
        console.log(`Post created: ${postId}`);

        console.log('--- Step 3: Adding a comment ---');
        const commentData = JSON.stringify({ content: 'Original Comment' });
        const commentOptions = {
            hostname: 'localhost', port: PORT, path: `/api/v1/comments/${postId}`, method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': commentData.length, 'Cookie': sessionCookie }
        };
        const commentResponse = await makeRequest(commentOptions, commentData);
        commentId = commentResponse.body.data._id;
        console.log(`Comment created: ${commentId}`);

        console.log('--- Step 4: Adding a nested reply ---');
        const replyData = JSON.stringify({ content: 'Nested Reply', parentCommentId: commentId });
        const replyResponse = await makeRequest(commentOptions, replyData);
        replyId = replyResponse.body.data._id;
        console.log(`Reply created: ${replyId}`);

        console.log('--- Step 5: Verifying commentsCount (Should be 2) ---');
        const getPostOptions = { hostname: 'localhost', port: PORT, path: `/api/v1/posts/${postId}`, method: 'GET', headers: { 'Cookie': sessionCookie } };
        const getPostResponse = await makeRequest(getPostOptions);
        if (getPostResponse.body.data.commentsCount !== 2) {
            throw new Error(`Incorrect commentsCount: expected 2, got ${getPostResponse.body.data.commentsCount}`);
        }
        console.log('commentsCount verified: 2');

        console.log('--- Step 6: Editing a comment ---');
        const editData = JSON.stringify({ content: 'Edited Comment' });
        const editOptions = {
            hostname: 'localhost', port: PORT, path: `/api/v1/comments/c/${commentId}`, method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Content-Length': editData.length, 'Cookie': sessionCookie }
        };
        const editResponse = await makeRequest(editOptions, editData);
        if (editResponse.body.data.content !== 'Edited Comment' || !editResponse.body.data.isEdited) {
            throw new Error('Edit failed');
        }
        console.log('Comment edit verified.');

        console.log('--- Step 7: Deleting the reply ---');
        const deleteOptions = {
            hostname: 'localhost', port: PORT, path: `/api/v1/comments/c/${replyId}`, method: 'DELETE',
            headers: { 'Cookie': sessionCookie }
        };
        const deleteResponse = await makeRequest(deleteOptions);
        if (deleteResponse.statusCode !== 200) throw new Error('Delete failed');
        console.log('Reply deleted.');

        console.log('--- Step 8: Verifying commentsCount (Should be 1) ---');
        const getPostResponse2 = await makeRequest(getPostOptions);
        if (getPostResponse2.body.data.commentsCount !== 1) {
            throw new Error(`Incorrect commentsCount after delete: expected 1, got ${getPostResponse2.body.data.commentsCount}`);
        }
        console.log('commentsCount verified: 1');

        console.log('--- Step 9: Running global audit ---');
        const auditOptions = { hostname: 'localhost', port: PORT, path: '/api/v1/comments/audit/global', method: 'POST', headers: { 'Cookie': sessionCookie } };
        const auditResponse = await makeRequest(auditOptions);
        console.log('Audit Result:', JSON.stringify(auditResponse.body.data));

        console.log('--- Step 10: Cleanup (Deleting post) ---');
        const deletePostOptions = { hostname: 'localhost', port: PORT, path: `/api/v1/posts/${postId}`, method: 'DELETE', headers: { 'Cookie': sessionCookie } };
        await makeRequest(deletePostOptions);
        console.log('Post deleted.');

        console.log('\n✅ ALL COMMENT SYSTEM TESTS PASSED ✅');

    } catch (error) {
        console.error('\n❌ TEST FAILED ❌');
        console.error(error);
        process.exit(1);
    }
};

performCommentAuditTest();
