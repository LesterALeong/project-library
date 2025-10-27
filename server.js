const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');

// Load environment variables from .env file
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const PORT = process.env.PORT || 3000;

// Simple Express-like app
class App {
  constructor() {
    this.routes = {
      GET: new Map(),
      POST: new Map(),
      DELETE: new Map()
    };
  }

  route(path) {
    const self = this;
    return {
      get(handler) {
        self.routes.GET.set(path, handler);
        return this;
      },
      post(handler) {
        self.routes.POST.set(path, handler);
        return this;
      },
      delete(handler) {
        self.routes.DELETE.set(path, handler);
        return this;
      }
    };
  }

  get(path, handler) {
    this.routes.GET.set(path, handler);
  }

  post(path, handler) {
    this.routes.POST.set(path, handler);
  }

  delete(path, handler) {
    this.routes.DELETE.set(path, handler);
  }

  matchRoute(method, pathname) {
    const routes = this.routes[method];
    
    // Exact match
    if (routes.has(pathname)) {
      return { handler: routes.get(pathname), params: {} };
    }

    // Pattern match for :id
    for (let [route, handler] of routes) {
      if (route.includes(':')) {
        const routeParts = route.split('/');
        const pathParts = pathname.split('/');
        
        if (routeParts.length === pathParts.length) {
          const params = {};
          let match = true;
          
          for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':')) {
              params[routeParts[i].substring(1)] = pathParts[i];
            } else if (routeParts[i] !== pathParts[i]) {
              match = false;
              break;
            }
          }
          
          if (match) {
            return { handler, params };
          }
        }
      }
    }
    
    return null;
  }

  listen(port, callback) {
    const server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    server.listen(port, callback);
    return server;
  }

  handleRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Serve static files
    if (pathname === '/' || pathname === '/index.html') {
      fs.readFile(path.join(__dirname, 'views', 'index.html'), 'utf8', (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
        }
      });
      return;
    }

    // Parse body for POST requests
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          // Try to parse as JSON first
          if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
            req.body = JSON.parse(body);
          } else {
            // Parse as form data
            req.body = querystring.parse(body);
          }
        } catch (e) {
          req.body = querystring.parse(body);
        }
        this.routeRequest(req, res, pathname);
      });
    } else {
      req.body = {};
      this.routeRequest(req, res, pathname);
    }
  }

  routeRequest(req, res, pathname) {
    const parsedUrl = url.parse(req.url, true);
    req.query = parsedUrl.query;
    req.params = {};

    // Add helper methods to response
    res.json = (data) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    };

    res.send = (data) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(data);
    };

    const match = this.matchRoute(req.method, pathname);
    
    if (match) {
      req.params = match.params;
      try {
        match.handler(req, res);
      } catch (err) {
        res.writeHead(500);
        res.end('Internal server error');
      }
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  }
}

const app = new App();

// Load API routes
require('./routes/api.js')(app);

// Start server only if not in test mode or if explicitly told to start
if (process.env.NODE_ENV !== 'test' || process.argv.includes('--start')) {
  const server = app.listen(PORT, function () {
    console.log('Listening on port ' + PORT);
  });
}

module.exports = app;
