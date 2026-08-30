# GIOP Web Frontend

A Vite + React frontend for the GIOP grievance platform. The same visual system is used for the Admin Console and Student Portal.

## Public
- `/` landing page
- `/login` login and role detection
- `/signup` student registration

## Student
- `/student` overview
- `/student/complaints` complaint history
- `/student/complaints/:id` detail, timeline, solution, feedback and reopen
- `/student/new` intelligent complaint intake and similarity discovery
- `/student/profile` academic profile
- `/student/notifications` notifications

## Admin
- `/admin` overview
- `/admin/problems` core problems
- `/admin/problems/:id` problem detail
- `/admin/complaints` complaints
- `/admin/complaints/:id` complaint detail
- `/admin/students` students
- `/admin/staff` staff
- `/admin/audit-logs` audit logs
- `/admin/profile` admin profile

## Authentication
The browser stores the JWT returned by `/auth/login`, calls protected endpoints with `Authorization: Bearer <token>`, and routes users by role. Students go to `/student`; admins go to `/admin`.

## Docker
The Dockerfile builds the Vite app and serves `dist` through Nginx. Set `VITE_API_BASE_URL` at build time through the compose build arg.

```bash
npm install
npm run dev

# Docker
docker compose build web
docker compose up -d web
```
