const http = require('http');

// callback function that will be executed when a request is received
const server = http.createServer((request, response) => {
    console.log(`${request.method} ${request.url}`);
    
    
    if (request.url === '/') {
        response.statusCode = 200;
        response.setHeader('Content-Type', 'text/plain; charset=utf-8');
        response.end('Support server. Available routes: /health, /api/info');
        return;
    } 
    // /api/info 
    if (request.url === '/api/info') {
      response.statusCode = 200;
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      response.end(JSON.stringify({
        name: 'support-server',
        version: '1.0.0',
        routes: ['/', '/health', '/api/info']
      }));
      return;
  
  // /health   
  if (request.url === '/health') {
    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/plain; charset=utf-8');
    response.end('Server is healthy');
    return;
  }

  }


  response.statusCode = 404;
  response.setHeader('Content-Type', 'text/plain; charset=utf-8');
  response.end('Not found');
});

// start the server and listen on port 3000
server.listen(3000, () => {
  console.log('Server listening on http://localhost:3000');
});
