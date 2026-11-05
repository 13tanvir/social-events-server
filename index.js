const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    console.log('MongoDB connected successfully!');

    const db = client.db('socialEventsDB');
    const eventsCollection = db.collection('events');

    // সব ইভেন্ট দেখা
    app.get('/events', async (req, res) => {
      const events = await eventsCollection.find().toArray();
      res.send(events);
    });

    // একটা ইভেন্ট দেখা
    app.get('/events/:id', async (req, res) => {
      const event = await eventsCollection.findOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(event);
    });

    // নতুন ইভেন্ট যোগ করা
    app.post('/events', async (req, res) => {
      const newEvent = { ...req.body, createdAt: new Date() };
      const result = await eventsCollection.insertOne(newEvent);
      res.send(result);
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
  }
}
run();

app.get('/', (req, res) => {
  res.send('Social Events Platform server is running!');
});

app.listen(port, () => {
  console.log(`Server listening on port: ${port}`);
});