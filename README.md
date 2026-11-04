# Masar (مسار)

A public demo of a university bus system. Visitors can sign in as an admin, a movement manager, a conductor, a driver, or a student and use the same screens the real roles use: trips, bookings, attendance, subscriptions, reports, and a live map.

The people, payments, phone numbers, and trips in this demo are fictional. The database is wiped back to that fictional set every 6 hours. Records a visitor creates can still be deleted. Seeded records, staff passwords, and the purge action stay locked.

- **Live demo:** [masar-web-flame.vercel.app](https://masar-web-flame.vercel.app/auth/login)
- **API:** [masar-api-ten.vercel.app/api/Demo/status](https://masar-api-ten.vercel.app/api/Demo/status)
- **Source:** [github.com/hazem-e99/masar](https://github.com/hazem-e99/masar)

## Demo accounts

Every account uses the password `Masar-demo-1`.

| Role | Email |
|---|---|
| Admin | admin@demo.example.com |
| Movement manager | manager@demo.example.com |
| Conductor | conductor@demo.example.com |
| Driver | driver@demo.example.com |
| Student | student@demo.example.com |

The login page has a one-click button for each role when `NEXT_PUBLIC_DEMO_MODE=true`.

The first click shows “Waking the demo server” while the API function starts. After that, an open tab keeps the demo reset and the trip clock moving.

## Architecture

```mermaid
flowchart LR
  browser[Browser]
  web[Vercel: Next.js]
  api[Vercel: NestJS]
  atlas[MongoDB Atlas: masar_demo]
  osm[OpenStreetMap tiles]

  browser --> web
  web --> api
  api --> atlas
  browser -->|map poll| api
  browser --> osm
```

| Part | Where it runs | What it does |
|---|---|---|
| Frontend | Vercel project, root `frontend` | Next.js 15, React 19, Arabic and English |
| API | Vercel project, root `backend` | NestJS on one function, demo reset, bus simulator. Vercel functions do not keep WebSocket connections open, so the live map polls `/api/Demo/tick`. The Socket.IO gateway works when the API runs as a normal server |
| Database | MongoDB Atlas M0 | The current Mongoose models, database name `masar_demo` |
| Map | Leaflet and OpenStreetMap | No map API key. Attribution stays on the map |

Import this repository twice. One project uses Root Directory `frontend`. The other uses Root Directory `backend`. Vercel detects the NestJS app from `backend/src/main.ts`.

The free plan does not run a cron more than once a day, so the API does the reset check, the trip clock, and the bus step when a page calls `/api/Demo/status` or `/api/Demo/tick`. The step is saved in the database, so a new function instance continues the same route. Uploaded files live in temporary storage and disappear when the function shuts down. The database name is checked before every reset. If it is not `masar_demo`, the reset writes nothing.

## Stack

- Next.js, React, TypeScript, Tailwind
- NestJS, Mongoose, Socket.IO, Jest
- Leaflet
- JWT auth, per-route roles, ownership checks, Helmet, and request rate limits

## Run it locally

The reset only runs when `DEMO_MODE=true` and the database name is `masar_demo`.

```bash
# backend/.env
DEMO_MODE=true
MONGODB_URI=mongodb+srv://USER:PASSWORD@HOST/masar_demo
JWT_SECRET=a-long-random-string
CORS_ORIGIN=http://localhost:3000
TZ=Africa/Cairo

# frontend/.env.local
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_API_BASE_URL=http://localhost:7126/api
NEXT_PUBLIC_BACKEND_ORIGIN=http://localhost:7126
```

```bash
cd backend && npm install && npm run start:dev
cd frontend && npm install && npm run dev
```

Copy `backend/.env.example` and `frontend/.env.example` if you want the full list of optional mail and upload settings. Do not point this demo at any other database.

## What a visitor can try

- **Admin:** open reports, approve the pending payment on the second student, watch the map move, create a bus and delete it. Deleting a seeded bus is refused. Broadcast reaches the seeded users. Purge is refused.
- **Student:** the dashboard is already filled. Book a trip, open the subscription page (the payment details are labelled as fictional), vote, and request a cancellation.
- **Driver:** today’s trips are listed. Start moves the assigned bus along a fixed route and does not ask for the browser location. Stop ends that movement.
- **Conductor:** attendance shows names. Mark a student present or absent, and send a broadcast.
- **Movement manager:** manage buses, routes, and trips, and watch the map. Admin-only actions are refused.

## CV and LinkedIn

These lines describe only what the project does. They do not include traffic, user, or performance figures.

- Built a role-based university bus system: trip scheduling, seat booking, attendance, subscriptions, payment review, surveys, and live fleet tracking over an authenticated WebSocket.
- Published a separate public demo on free hosting (Next.js and NestJS on Vercel, MongoDB Atlas, Leaflet and OpenStreetMap) that reseeds fictional data every 6 hours and blocks destructive changes to seeded records.
- Added explicit role checks on every API route, record-ownership checks, rate limits, security headers, and a fail-closed guard so a route without an access rule is denied.

## Notes

This repository is the public demo. It is separate from any private deployment. There is no open-source licence. You can read the code. You cannot reuse it under a free licence.
