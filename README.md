## Before using
* Set the values in .env.dist and rename it to .env
* Ensure yt-dlp 2025.05.22 is installed; This app uses it via subprocesses
* (optionally) create and save a cookies.txt file containing a twitter session in the root folder since yt-dlp requires it for some posts

## Project structure
* `public`: Directory containing svg icons used in the app
* `app`: Nextjs directory containing main project files and using the app router
* `api`: Directory containing api routes accessible via the /api endpoint
* `app/[page route]`: Directory containing components (usually client side), css, and page.tsx files (usually server side) used when rendering each page.
* `lib`: Organized server and client side functionalities often used in multiple files
* `middleware.ts`: Ensures the page routes have access to the cookies that are attempted to be set on the client.

> `prisma db pull` and `prisma generate` should be used to update schema.prisma and generated code based on the connected database's schema

## Page Routes
[home]
- The main voting form

/playlist?list
- Leads to either an editable or view only playlist depending on if the user is the owner
- list is the playlist id. Omitting this allows the creation of a new playlist

/playlists
- Let's the user create, view, or edit, all of the playlists they own

/control-panel
- Page where the operator can adjust and test labels, or manually label videos from the video pool
