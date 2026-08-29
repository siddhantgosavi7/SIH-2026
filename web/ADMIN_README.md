# GIOP Admin React Module

This frontend is React + Vite (not Next.js). The admin module has been rebuilt as a routed desktop-first console matching the existing GIOP home page's white/electric-blue visual language.

## Routes
- `/admin` — overview dashboard
- `/admin/problems` — AI-grouped core problems
- `/admin/problems/:id` — core problem detail + solution action
- `/admin/complaints` — individual complaints
- `/admin/complaints/:id` — complaint detail
- `/admin/students` — registered students
- `/admin/staff` — staff management + add staff modal
- `/admin/audit-logs` — audit trail
- `/admin/profile` — admin session/profile

## Added files
- `src/admin/AdminLayout.jsx`
- `src/admin/adminApi.js`
- `src/admin/admin.css`
- `src/pages/admin/*.jsx`

## Changed files
- `src/App.jsx` — nested admin routes
- `src/pages/AdminDashboard.jsx` — compatibility export to the new dashboard

## API behavior
The UI uses the existing `useAuth().api()` helper, so JWT handling and `VITE_API_BASE_URL` remain centralized. Where the exact backend route may differ between your current API revisions, the read operations try the known route variants and fall back to empty state instead of crashing the page.

The solution action uses:
`PUT /staff/problems/:problem_id/solution`
with `{ solution, status }`.

If your backend expects a different solution request body, only `AdminProblemDetail.jsx` needs that payload adjusted.

## Run
```bash
npm install
npm run dev
```

The uploaded project did not contain installed dependencies in the archive, so a full production build could not be run in this environment because the package registry was unavailable. The source changes were checked structurally against the existing React/Vite project.
