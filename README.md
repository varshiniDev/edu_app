# Academy ERP – Admin Portal (web + mobile + backend)

## Run: backend (Command Prompt, folder `backend`)
    python -m venv venv            (first time only)
    venv\Scripts\activate
    pip install -r requirements.txt
    python manage.py migrate
    python manage.py createsuperuser   (first time only)
    python manage.py runserver 0.0.0.0:8000
Tests: `python manage.py test` (10 tests).

## Run: web (folder `web-admin`)
    npm install        (first time only)
    npm run dev        -> http://localhost:5173

## Run: mobile (Expo SDK 58) - folder `mobile-admin` already has package.json
    cd mobile-admin
    npm install
    (edit src\\config.js: put your PC IPv4 from `ipconfig`, e.g. http://192.168.1.10:8000/api)
    npx expo start
Scan the QR code with Expo Go (update Expo Go from the Play Store if it says the SDK is unsupported). Phone and PC must be on the same Wi-Fi and port 8000 allowed in the firewall.
If the QR code will not connect: `npx expo start --tunnel`.

## Change the look in ONE place
- Web: `web-admin/src/index.css` (top `:root` block: colours, radius, animation speed + button/table/card classes) and `web-admin/src/components/ui.jsx` (Modal, DataTable, action buttons, form fields).
- Mobile: `mobile-admin/src/theme.js` (colours) and `mobile-admin/src/ui.js` (shared components).

## Features
Staff/Student CRUD (photo, view/edit/delete modals), Courses, nested Syllabus + PDF material per topic, Batches (staff, schedule, Google Meet link, online/offline students, daily recordings),
Enrollment (course -> batch -> assign), Attendance by staff/batch/date with audit + CSV, admin profile photo, company logo.

## API for the future Staff / Student portals (login required, data limited to the user's own batches)
- GET /api/portal/live-classes/   today's classes; `meet_link` is returned only from 10 min before start until end time, and only for staff and ONLINE students
- GET /api/portal/recordings/?batch=ID   daily recordings
- GET /api/portal/materials/?batch=ID    syllabus tree with PDF links
Join window length: `JOIN_EARLY_MINUTES` in `backend/config/settings.py`. Time zone: `TIME_ZONE` (default Asia/Kolkata).

## Staff & Student portals (same web app and same mobile app)
Staff log in with their Staff ID, students with their Student ID, and the password the admin set. The apps pick the admin or portal screens from `/api/auth/me/` (`is_admin`).
- Home: today's classes with a **Join** button that appears 10 minutes before class and disappears when it ends (staff and ONLINE students only), plus the 7-day schedule
- My Batches -> attendance (staff mark their own batches, last 7 days; students see their own %), recordings, PDF study material
- Profile and change password. Photos are changed by the admin only.

## Not built yet
Reports page, Excel syllabus import, syllabus versions, announcements, audit-log viewer, daily progress monitoring.
