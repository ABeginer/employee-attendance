const { MongoClient } = require('mongodb');

// Connection URI
const uri = 'mongodb+srv://boprosieuga:Boprodeptrai2@debugfailed.ezl2hjm.mongodb.net/attendance';

// Database Name
const dbName = 'attendance';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Create a new MongoClient
const connect = async () =>{
    await client.connect();
    
        
}
// Select the database
const db = client.db(dbName);
    
// Specify the collection you want to update
const collection = db.collection('users');
const userCollection = async () =>{
    return collection;
    
        
}
    module.exports = collection
