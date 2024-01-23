const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Building MySpine with Node.js\n');
});

server.listen(3000, () => {
    console.log('Server running at http://localhost:3000/');
});