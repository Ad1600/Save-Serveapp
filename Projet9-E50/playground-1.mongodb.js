/* global use, db */
// MongoDB Playground
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

// The current database to use.
use('foodapp');

// Search for documents in the current collection.
db.getCollection('commandes').find({
  codeRetrait: "3c5a04"
})
