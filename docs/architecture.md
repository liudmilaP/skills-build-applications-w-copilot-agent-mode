# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep route-level rendering and user interaction in React; use the shared API client for relative `/api` requests. Each capability should show an accessible loading state, a useful empty state, and an announced error when the API fails.
- Logic tier decision: Keep HTTP validation, status codes, response shapes, and capability behavior in Express routes/services. Validate request data and referenced records before writes, returning deliberate 4xx responses rather than leaking database cast or validation errors as 500s.
- Data tier decision: Use Mongoose models for persisted users, teams, activities, and workouts. Require the contract fields, model team membership and activity references explicitly, and keep seed operations repeatable without deleting unrelated records.
- Activity tracking approach: Accept `userId`, `teamId`, `type`, and `minutes`; validate both IDs and confirm both records exist. Store them as `user` and `team`, compute points and `occurredAt` on creation, and return consistent list/create representations.
- Team management approach: Require a non-empty name, preserve submitted `name` and `mascot`, and store members as user references with an empty-array default. Keep user/team membership links consistent where team creation or membership updates require them.
- Leaderboard approach: Aggregate activity points by team, include teams with no activity at zero if applicable, sort totals highest first, and assign ranks starting at 1.
- Workout suggestions approach: Find the requested user by email; derive a relevant focus from their fitness goal and recent activities; return matching workout suggestions with a concise explanatory reason. Return a deliberate 4xx when no user matches.

## Test plan

Run focused contract tests after changes in their corresponding tier, then run both builds to catch type-checking or bundling regressions. The baseline below was run before implementation changes.

- Data tier — `npm run test:data --prefix octofit-tracker/backend`: **4 failed, 1 passed**. Failures indicate model validation is missing required user, team, activity, and workout fields. The seed/idempotence test passed.
- API tier — `npm run test:api --prefix octofit-tracker/backend`: **4 failed**. Invalid activity/team requests returned `501` instead of `400`, leaderboard aggregation returned no entries, and workout suggestions omitted the expected reason.
- Presentation tier — `npm test --prefix octofit-tracker/frontend`: **15 failed**. Rendering the API data, requesting user-specific workout suggestions, and route loading, empty, and accessible error states did not meet the contracts.
- Backend build — `npm run build --prefix octofit-tracker/backend`: **not run**. Run after changes; a failure indicates backend TypeScript type-checking errors.
- Frontend build — `npm run build --prefix octofit-tracker/frontend`: **not run**. Run after changes; a failure indicates frontend type-checking or Vite build errors.
