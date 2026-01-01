const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/hr/employees',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
        // Assuming development mode might skip auth or I can at least see if it's 401
        // If 401, I know server is running.
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));
        } catch (e) {
            console.log(data); // Log raw if not JSON (e.g. 401 html)
        }
    });
});
req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});
req.end();
