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

const getToday = () => new Date().toISOString().split('T')[0];

async function run() {
  try {
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    console.log('MongoDB connected successfully!');

    const db = client.db('socialEventsDB');
    const eventsCollection = db.collection('events');
    const joinsCollection = db.collection('joinedEvents');

    // শুধু upcoming ইভেন্ট (তারিখ অনুযায়ী সাজানো, ?limit=6 দেওয়া যাবে)
    app.get('/events', async (req, res) => {
      const limit = parseInt(req.query.limit) || 0;
      const events = await eventsCollection
        .find({ eventDate: { $gte: getToday() } })
        .sort({ eventDate: 1 })
        .limit(limit)
        .toArray();
      res.send(events);
    });

    // একটা ইভেন্টের বিস্তারিত
    app.get('/events/:id', async (req, res) => {
      const event = await eventsCollection.findOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(event);
    });

    // ইভেন্ট তৈরি
    app.post('/events', async (req, res) => {
      const event = req.body;
      if (!event.title || !event.eventDate || !event.creatorEmail) {
        return res.status(400).send({ message: 'Required fields are missing' });
      }
      if (event.eventDate < getToday()) {
        return res.status(400).send({ message: 'Past dates are not allowed' });
      }
      const result = await eventsCollection.insertOne({
        ...event,
        createdAt: new Date(),
      });
      res.send(result);
    });

    // একজন ইউজারের নিজের তৈরি ইভেন্ট
    app.get('/my-events', async (req, res) => {
      const events = await eventsCollection
        .find({ creatorEmail: req.query.email })
        .sort({ eventDate: 1 })
        .toArray();
      res.send(events);
    });

    // ইভেন্ট আপডেট (শুধু নিজের)
    app.put('/events/:id', async (req, res) => {
      const { creatorEmail, _id, ...updatedData } = req.body;
      if (updatedData.eventDate && updatedData.eventDate < getToday()) {
        return res.status(400).send({ message: 'Past dates are not allowed' });
      }
      const result = await eventsCollection.updateOne(
        { _id: new ObjectId(req.params.id), creatorEmail },
        { $set: updatedData }
      );
      if (result.matchedCount === 0) {
        return res.status(403).send({ message: 'You can only update your own events' });
      }
      res.send(result);
    });

    // ইভেন্ট ডিলিট (শুধু নিজের)
    app.delete('/events/:id', async (req, res) => {
      const result = await eventsCollection.deleteOne({
        _id: new ObjectId(req.params.id),
        creatorEmail: req.query.email,
      });
      if (result.deletedCount === 0) {
        return res.status(403).send({ message: 'You can only delete your own events' });
      }
      res.send(result);
    });

    // ইভেন্টে join করা
    app.post('/joins', async (req, res) => {
      const { eventId, userEmail, userName } = req.body;

      const alreadyJoined = await joinsCollection.findOne({ eventId, userEmail });
      if (alreadyJoined) {
        return res.status(409).send({ message: 'You have already joined this event' });
      }

      const event = await eventsCollection.findOne({ _id: new ObjectId(eventId) });
      if (!event) {
        return res.status(404).send({ message: 'Event not found' });
      }

      const result = await joinsCollection.insertOne({
        eventId,
        userEmail,
        userName,
        title: event.title,
        thumbnail: event.thumbnail,
        location: event.location,
        eventType: event.eventType,
        eventDate: event.eventDate,
        joinedAt: new Date(),
      });
      res.send(result);
    });

    // একজন ইউজারের join করা ইভেন্ট (তারিখ অনুযায়ী সাজানো)
    app.get('/joins', async (req, res) => {
      const joins = await joinsCollection
        .find({ userEmail: req.query.email })
        .sort({ eventDate: 1 })
        .toArray();
      res.send(joins);
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