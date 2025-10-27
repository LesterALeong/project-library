// In-memory database for books
class BooksDatabase {
  constructor() {
    this.books = new Map();
    this.nextId = 1;
  }

  // Add a new book
  addBook(title) {
    const id = this.nextId.toString();
    this.nextId++;
    
    const book = {
      _id: id,
      title: title,
      comments: []
    };
    
    this.books.set(id, book);
    return { _id: id, title: title };
  }

  // Get all books
  getAllBooks() {
    return Array.from(this.books.values()).map(book => ({
      _id: book._id,
      title: book.title,
      commentcount: book.comments.length
    }));
  }

  // Get book by ID
  getBookById(id) {
    return this.books.get(id);
  }

  // Add comment to book
  addComment(id, comment) {
    const book = this.books.get(id);
    if (!book) {
      return null;
    }
    
    book.comments.push(comment);
    return {
      _id: book._id,
      title: book.title,
      comments: book.comments
    };
  }

  // Delete book by ID
  deleteBook(id) {
    return this.books.delete(id);
  }

  // Delete all books
  deleteAll() {
    this.books.clear();
    this.nextId = 1;
  }

  // Check if book exists
  exists(id) {
    return this.books.has(id);
  }
}

module.exports = new BooksDatabase();
