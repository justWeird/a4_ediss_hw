
// sync-service/sync-logic.js
async function performSync(rdsConnection, mongoClient) {
    // 1. Extract: Get all books from RDS
    const books = await extractBooksFromRDS(rdsConnection);
    console.log(`Extracted ${books.length} books from RDS`);

    // 2. Transform: No complex transformation needed as per the assignment
    const bookDocuments = transformBooks(books);

    // 3. Load: Update MongoDB with the book documents
    await loadBooksToMongoDB(mongoClient, bookDocuments);
}

async function extractBooksFromRDS(connection) {
    //talk to RDS and query the db to get all books data
    const [rows] = await connection.execute(
        'SELECT ISBN, title, Author, description, genre, price, quantity FROM Books'
    );
    return rows;
}

function transformBooks(books) {
    // Simple transformation - ensure field names match the expected MongoDB format
    return books.map(book => ({
        ISBN: book.ISBN,
        title: book.title,
        Author: book.Author,
        description: book.description,
        genre: book.genre,
        price: book.price,
        quantity: book.quantity
    }));
}

async function loadBooksToMongoDB(client, books) {
    const database = client.db(process.env.MONGODB_DATABASE);
    const collection = database.collection(process.env.MONGODB_COLLECTION);

    console.log('Starting upsert operations to MongoDB...');

    // Use bulkWrite for better performance
    const operations = books.map(book => ({
        updateOne: {
            filter: { ISBN: book.ISBN },
            update: { $set: book },
            upsert: true
        }
    }));

    if (operations.length > 0) {
        const result = await collection.bulkWrite(operations);
        console.log(`MongoDB sync results: ${JSON.stringify({
            matched: result.matchedCount,
            modified: result.modifiedCount,
            upserted: result.upsertedCount
        })}`);
    } else {
        console.log('No books to synchronize');
    }
}

module.exports = { performSync };