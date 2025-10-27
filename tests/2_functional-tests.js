const http = require('http');
const assert = require('assert');

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk.toString();
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: body,
          headers: res.headers
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

// Test suite
const tests = [
  {
    name: 'Test 1: Create a book with title',
    async run() {
      const response = await makeRequest('POST', '/api/books', 'title=Test Book 1');
      const book = JSON.parse(response.body);
      
      assert(book.title === 'Test Book 1', 'Book title should match');
      assert(book._id, 'Book should have an _id');
      
      // Save for later tests
      global.testBookId = book._id;
      
      console.log('✓ Test 1 passed: Book created successfully');
      return true;
    }
  },
  
  {
    name: 'Test 2: Create a book without title (should fail)',
    async run() {
      const response = await makeRequest('POST', '/api/books', '');
      
      assert(response.body === 'missing required field title', 
        'Should return "missing required field title"');
      
      console.log('✓ Test 2 passed: Missing title validation works');
      return true;
    }
  },
  
  {
    name: 'Test 3: Get all books',
    async run() {
      const response = await makeRequest('GET', '/api/books');
      const books = JSON.parse(response.body);
      
      assert(Array.isArray(books), 'Response should be an array');
      assert(books.length > 0, 'Should have at least one book');
      assert(books[0].title, 'Book should have title');
      assert(books[0]._id, 'Book should have _id');
      assert(books[0].hasOwnProperty('commentcount'), 'Book should have commentcount');
      
      console.log('✓ Test 3 passed: Get all books works');
      return true;
    }
  },
  
  {
    name: 'Test 4: Get a single book with valid id',
    async run() {
      const response = await makeRequest('GET', `/api/books/${global.testBookId}`);
      const book = JSON.parse(response.body);
      
      assert(book.title, 'Book should have title');
      assert(book._id === global.testBookId, 'Book _id should match');
      assert(Array.isArray(book.comments), 'Book should have comments array');
      
      console.log('✓ Test 4 passed: Get single book works');
      return true;
    }
  },
  
  {
    name: 'Test 5: Get a single book with invalid id',
    async run() {
      const response = await makeRequest('GET', '/api/books/invalid_id_12345');
      
      assert(response.body === 'no book exists', 
        'Should return "no book exists"');
      
      console.log('✓ Test 5 passed: Invalid book id handled correctly');
      return true;
    }
  },
  
  {
    name: 'Test 6: Add a comment to a book',
    async run() {
      const response = await makeRequest('POST', 
        `/api/books/${global.testBookId}`, 
        'comment=This is a test comment');
      const book = JSON.parse(response.body);
      
      assert(book.title, 'Book should have title');
      assert(book._id === global.testBookId, 'Book _id should match');
      assert(Array.isArray(book.comments), 'Book should have comments array');
      assert(book.comments.length > 0, 'Book should have at least one comment');
      assert(book.comments.includes('This is a test comment'), 
        'Comment should be in the comments array');
      
      console.log('✓ Test 6 passed: Add comment works');
      return true;
    }
  },
  
  {
    name: 'Test 7: Add a comment without comment field',
    async run() {
      const response = await makeRequest('POST', 
        `/api/books/${global.testBookId}`, 
        '');
      
      assert(response.body === 'missing required field comment', 
        'Should return "missing required field comment"');
      
      console.log('✓ Test 7 passed: Missing comment validation works');
      return true;
    }
  },
  
  {
    name: 'Test 8: Add a comment to a book with invalid id',
    async run() {
      const response = await makeRequest('POST', 
        '/api/books/invalid_id_12345', 
        'comment=Test comment');
      
      assert(response.body === 'no book exists', 
        'Should return "no book exists"');
      
      console.log('✓ Test 8 passed: Comment on invalid book handled correctly');
      return true;
    }
  },
  
  {
    name: 'Test 9: Delete a book',
    async run() {
      // Create a book to delete
      const createResponse = await makeRequest('POST', '/api/books', 
        'title=Book to Delete');
      const bookToDelete = JSON.parse(createResponse.body);
      
      // Delete the book
      const deleteResponse = await makeRequest('DELETE', 
        `/api/books/${bookToDelete._id}`);
      
      assert(deleteResponse.body === 'delete successful', 
        'Should return "delete successful"');
      
      // Verify book is deleted
      const getResponse = await makeRequest('GET', 
        `/api/books/${bookToDelete._id}`);
      assert(getResponse.body === 'no book exists', 
        'Deleted book should not exist');
      
      console.log('✓ Test 9 passed: Delete book works');
      return true;
    }
  },
  
  {
    name: 'Test 10: Delete all books',
    async run() {
      // Add a couple of books
      await makeRequest('POST', '/api/books', 'title=Book A');
      await makeRequest('POST', '/api/books', 'title=Book B');
      
      // Delete all books
      const deleteResponse = await makeRequest('DELETE', '/api/books');
      
      assert(deleteResponse.body === 'complete delete successful', 
        'Should return "complete delete successful"');
      
      // Verify all books are deleted
      const getAllResponse = await makeRequest('GET', '/api/books');
      const books = JSON.parse(getAllResponse.body);
      assert(books.length === 0, 'Should have no books');
      
      console.log('✓ Test 10 passed: Delete all books works');
      return true;
    }
  }
];

// Run all tests
async function runTests() {
  console.log('\n=================================');
  console.log('Running Functional Tests');
  console.log('=================================\n');
  
  let passed = 0;
  let failed = 0;
  
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    try {
      console.log(`Running ${test.name}...`);
      await test.run();
      passed++;
    } catch (error) {
      console.log(`✗ ${test.name} failed:`);
      console.log(`  Error: ${error.message}`);
      failed++;
    }
    console.log('');
  }
  
  console.log('=================================');
  console.log(`Tests Passed: ${passed}/${tests.length}`);
  console.log(`Tests Failed: ${failed}/${tests.length}`);
  console.log('=================================\n');
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Wait for server to be ready, then run tests
function waitForServer(callback, maxAttempts = 10) {
  let attempts = 0;
  
  const checkServer = () => {
    attempts++;
    
    http.get('http://localhost:3000/', (res) => {
      console.log('Server is ready!\n');
      callback();
    }).on('error', (err) => {
      if (attempts >= maxAttempts) {
        console.error('Server failed to start after', maxAttempts, 'attempts');
        process.exit(1);
      } else {
        console.log(`Waiting for server... (attempt ${attempts}/${maxAttempts})`);
        setTimeout(checkServer, 1000);
      }
    });
  };
  
  checkServer();
}

// Export for use in test runner
module.exports = { runTests, waitForServer };
