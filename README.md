# CineBook: Movie Ticket Booking System

Full-stack booking app built with **React (Vite)**, **Node.js + Express**, **MongoDB (Mongoose)**, **Redis**, **JWT + bcrypt** and **Socket.IO**.

## Features
- Register/login with bcrypt-hashed passwords and stateless JWT sessions; role-based access (`user`, `admin`)
- Movie listing cached in Redis (cache-aside, 60 s TTL, invalidated when an admin adds a movie)
- Dynamic seat grid per show with **real-time updates** over WebSockets
- **Double-booking prevention in two layers**
  1. Redis `SET key value NX EX 120`: an atomic temporary seat hold that expires on its own
  2. MongoDB conditional update (`bookedSeats: { $nin: seats }`): the final atomic guard when confirming
- Booking history and cancellation (seats are released)
- Helmet, CORS, rate-limited auth routes, input coercion against NoSQL injection, centralised error handling

## Quick start
Requires Node 18+. MongoDB and Redis can be started with Docker:

```bash
docker compose up -d                 # MongoDB :27017 and Redis :6379

cd backend
npm install
npm run seed                         # demo data + demo accounts
npm run dev                          # API on :5000

cd ../frontend                       # in a second terminal
npm install
npm run dev                          # app on http://localhost:5173
```
No Docker? Install MongoDB locally. Redis is optional: clear `REDIS_URL` in `backend/.env` to use the built-in in-memory store (single process only).

Demo logins: `user@cinebook.dev` / `User@123` and `admin@cinebook.dev` / `Admin@123`

## API
| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | /api/auth/register, /api/auth/login | no | Get a JWT |
| GET | /api/movies | yes* | List movies (cached; `X-Cache` header shows HIT/MISS) |
| GET | /api/movies/:id | no | Movie and upcoming shows |
| POST | /api/movies, /api/movies/:id/shows | admin | Create movie / show |
| GET | /api/shows/:id | yes | Seat map: booked and held seats |
| POST | /api/shows/:id/lock, /unlock, /book | yes | Hold, release, confirm seats (`{ "seats": ["A1","A2"] }`) |
| GET | /api/bookings/mine | yes | Your bookings |
| DELETE | /api/bookings/:id | yes | Cancel a booking |

*The UI requires login; the movie list endpoint itself is public.

## Structure
```
backend/src  server.js, store.js (Redis or memory), models/, routes/, middleware/, seed.js
frontend/src App.jsx, AuthContext.jsx, api.js, pages/, components/SeatPicker.jsx
```

## Notes
- Payment is simulated: "Pay and confirm" books the held seats directly.
- Browser tokens live in `localStorage` for simplicity; for production consider httpOnly cookies and CSRF protection.
