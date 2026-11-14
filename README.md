# FluentBridge - A Language Exchange Platform

FluentBridge is a full-stack language exchange platform that helps users connect with people from different backgrounds 
to practice and improve their language skills through **chat and video calls**.

## Features

* User authentication and authorization
* User profiles
* Language exchange between users
* Real-time chat
* Video calls
* Responsive user interface
* Secure authentication using JWT

## Tech Stack

### Frontend

* React
* HTML
* CSS
* JavaScript
* Zustand — State management
* Lucide React — Icons

### Backend

* Node.js
* Express.js

### Database

* MongoDB

### Other Technologies

* JWT Authentication
* Stream — Real-time chat and video calls

## Project Structure

```text
FluentBridge/
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── server.js
│   └── package.json
│
└── README.md
```

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd FluentBridge
```

### 2. Setup Backend

Navigate to the backend directory:
- cd backend
- npm i
- npm run dev


### 3. Setup Frontend

Open a new terminal and navigate to the frontend directory:
- cd frontend
- npm install
- npm run dev


## Environment Variables

Create a `.env` file in the backend directory and add the required environment variables.

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET_KEY=your_jwt_secret
STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret
```

> **Note:** Do not upload your `.env` file or API secrets to GitHub.

If startup fails with `querySrv ECONNREFUSED` or `querySrv ETIMEOUT` and your network's DNS cannot resolve MongoDB records, add this optional setting to `backend/.env`:

```env
DNS_SERVERS=1.1.1.1,8.8.8.8
```

Restart the backend after changing this setting. It overrides DNS resolution for the backend process; omit it to use your system's DNS.

## LIVE DEMO
https://fluentbridge-pifd.onrender.com

## Matching, dashboard and learning progression

Open `/dashboard` from your avatar, desktop sidebar or mobile navigation to edit your profile, native languages, interests, availability and timezone. Add, edit or remove learning languages with separate A1–C2 levels and goals. Removing a language keeps its verified practice history, which is restored when it is added again.

Existing single-language users are migrated in memory when loaded and persisted on their next profile/language save. Legacy language fields continue to mirror the first native and learning languages. Existing passwords are preserved; only newly supplied passwords are hashed.

Recommendations exclude you, your friends and incomplete profiles, and return the top 30 partners. Reciprocal exchanges receive 45 points; a shared learning language receives 20 instead. Shared interests add up to 20, proficiency fit adds 10, and matching availability (including Flexible) adds 5. The maximum achievable raw score is **80**, because the two language branches are exclusive; displayed match percentages normalize against 80. Schedule tags are compared as declared, without converting timezones. Filters select a candidate's learning language and CEFR level together.

### Enable verified practice tracking

Configure Stream **Chat** and **Video** webhooks to send events to your public HTTPS backend URL:

```text
https://YOUR_HOST/api/webhooks/stream
```

Subscribe to Chat `message.new` and Video `call.session_participant_left`. The endpoint verifies `X-Signature` with `STREAM_API_SECRET` against the raw request body. Use the same Stream application for chat and video. Local development needs a public tunnel for webhook delivery; localhost alone cannot receive events from Stream. See [Stream webhook configuration](https://getstream.io/docs/platform/webhooks/) and [Video event definitions](https://getstream.io/video/docs/api/webhooks/events/).

Practice tracking requires MongoDB transactions (Atlas or another replica set) and the unique indexes initialized at startup. Retried webhooks and repeated completion requests do not duplicate credit.

- Messages count when sent with the selected practice language to a friend who speaks it natively. Attachments without text and call invitation messages do not count.
- Calls use signed participant attendance. Only overlapping time between both friends counts, rounded down to whole minutes; reconnects and multiple tabs are merged. Each learner receives credit for their first learning language that their partner speaks natively. Both participants receive eligible credit automatically, even after leaving the feedback screen. Counts update once both attendance events arrive; they are not live timers.
- `POST /api/calls/complete` checks confirmed attendance and returns `202` while waiting; it never trusts client duration values.
- A native friend can endorse a learning language after a verified call in that language. Each speaker can endorse a recipient only once per language. Duplicate endorsements return `409`.
- **Native Verified** requires at least **60 verified call minutes and 3 distinct native endorsements** for that language. This is a platform practice milestone, not an official CEFR certification. CEFR levels remain self-assessed; the dashboard suggests the next level without changing it automatically.

Keep `DNS_SERVERS` unset in production unless your hosting environment needs an override. Use `JWT_SECRET_KEY` for the backend JWT signing secret (the name used by the authentication code).

### API and verification

All profile and practice APIs require the existing JWT cookie, except the signature-authenticated Stream webhook:

```text
PUT    /api/users/profile
POST   /api/users/languages
PUT    /api/users/languages/:language
DELETE /api/users/languages/:language
GET    /api/users?language=spanish&level=B1
GET    /api/users/endorsements
POST   /api/users/:id/endorse
POST   /api/calls/complete
POST   /api/webhooks/stream
```

Run `npm test --prefix backend`, `npm run lint --prefix frontend`, and `npm run build --prefix frontend`. Backend tests start a temporary isolated MongoDB replica set and never use `MONGO_URI`. The first test run may download a MongoDB binary. They cover legacy migration, password preservation, language CRUD, matching/filtering, authenticated access, signed/replayed webhooks, overlapping attendance, and native endorsement milestones.

