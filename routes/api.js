const db = require('../database');

module.exports = function (app) {
  
  // Route to get all books or add a new book
  app.route('/api/books')
    .get(function (req, res) {
      // Get all books
      const books = db.getAllBooks();
      res.json(books);
    })
    
    .post(function (req, res) {
      // Add a new book
      const title = req.body.title;
      
      if (!title) {
        res.send('missing required field title');
        return;
      }
      
      const book = db.addBook(title);
      res.json(book);
    })
    
    .delete(function (req, res) {
      // Delete all books
      db.deleteAll();
      res.send('complete delete successful');
    });

  // Route to get, update, or delete a specific book
  app.route('/api/books/:id')
    .get(function (req, res) {
      // Get a specific book
      const bookid = req.params.id;
      const book = db.getBookById(bookid);
      
      if (!book) {
        res.send('no book exists');
        return;
      }
      
      res.json({
        _id: book._id,
        title: book.title,
        comments: book.comments
      });
    })
    
    .post(function (req, res) {
      // Add a comment to a book
      const bookid = req.params.id;
      const comment = req.body.comment;
      
      if (!comment) {
        res.send('missing required field comment');
        return;
      }
      
      const book = db.addComment(bookid, comment);
      
      if (!book) {
        res.send('no book exists');
        return;
      }
      
      res.json(book);
    })
    
    .delete(function (req, res) {
      // Delete a specific book
      const bookid = req.params.id;
      const deleted = db.deleteBook(bookid);
      
      if (!deleted) {
        res.send('no book exists');
        return;
      }
      
      res.send('delete successful');
    });
};
