const fs = require('fs');
const path = require('path');

const collectionPath = path.join(__dirname, 'tests', 'full_flow_test.json');
const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

// Find Login (Username) request
const authFolder = collection.item.find(i => i.name.includes('Health & Auth'));
if (authFolder) {
    const loginReq = authFolder.item.find(i => i.name === 'Login (Username)');
    if (loginReq) {
        loginReq.event = [
            {
                listen: "test",
                script: {
                    exec: [
                        "const jsonData = pm.response.json();",
                        "if (jsonData.data && jsonData.data.accessToken) {",
                        "    pm.environment.set(\"accessToken\", jsonData.data.accessToken);",
                        "    console.log(\"Access Token saved to environment\");",
                        "}"
                    ],
                    type: "text/javascript"
                }
            }
        ];
    }
}

fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
console.log("Successfully updated collection with test script.");
