// Simple server connected to MongoDB database
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const redis = require('redis');

const app = express();

app.use(bodyParser.json());

// Redis connection
var client = redis.createClient({
    
})

mongoose.connect('mongodb://localhost:27017/', {
    dbName: 'notes',
    useNewUrlParser: true,
    useUnifiedTopology: true
}, err => err ? console.log(err) : console.log('Connected to database'));


// Redis connection (to upstash)
const redis = require("redis");
var client = redis.createClient({
    host: 'eu2-blessed-bison-30104.upstash.io',
    port: '30104',
    password: 'c79bfb62dd85481282414e0b593c4b1c'
});

client.on("error", function(err) {
    throw err;
});

client.set('foo', 'bar');

// Mongoose Model
const NoteSchema = new mongoose.Schema({
    title: String,
    note: String, 
});

const note = mongoose.model("Note", NoteSchema);

// Create notes and store it in Redis and MongoDB
app.post("/api/notes", (req, res, next) => {
    const { title, note } req.body;
    const _note = new Note({
        title: title,
        note: note, 
    });
    _note.save((err, note) => {
        if (err) {
            return res.status(404).json(err);
        }
        // Store in Redis
        client.setex(note.id, 60, JSON.stringify(note), (err, reply) => {
            if (err) {
                console.log(err);
            }
            console.log(reply);
        });
        return res.status(201).json({
            message: "Note has been saved",
            note: note, 
        })
    })
})

// Middleware
// Check the requested data in Redis
const isCached = (req, res, next) => {
    const { id } = req.params;
    // First check in Redis
    client.get(id, (err, data) => {
        if(err) {
            console.log(err);
        }
        if (data) {
            const response = JSON.parse(data);
            return res.status(200).json(response);
        }
        next();
    });
}

// Use the middleware on get request
app.get("/api/notes/:id", isCached, (req, res, next) => {
    const { id } = req.params;
    Note.findById(id, (err, note) => {
        if (err) {
            return res.status(404).json(err);
        }
        return res.status(200).json({
            note: note,
        })
    });
});