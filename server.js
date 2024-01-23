const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('My Spine: Powered by Node.js\n');
});

server.listen(3000, () => {
    console.log('Server running at http://localhost:3000/');
});