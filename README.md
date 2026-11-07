# UnityHands Server

Express and MongoDB API for the UnityHands social events platform.

## Public endpoints
- GET /events : upcoming events sorted by date (use ?limit=6 for the latest few)
- GET /events/:id : details of a single event

## Protected endpoints (JWT required)
- POST /events : create an event
- GET /my-events : events created by the logged-in user
- PUT /events/:id : update your own event
- DELETE /events/:id : delete your own event
- POST /joins : join an event
- GET /joins : events joined by the logged-in user

## Setup
1. Copy .env.example to .env and fill in the values
2. npm install
3. node index.js

Tokens are issued by the client app (BetterAuth) and verified here using its JWKS endpoint.