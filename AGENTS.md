# OnlyFunds

OnlyFunds is a mobile-first, self-hosted lab research feed. The root `package.json` is the authoritative project version.

- Keep `client/` a static browser application, independently deployable to GitHub Pages. Server selection belongs in Profile → Settings.
- Keep lab data and authentication on the selected lab's server. Never embed real accounts, credentials, or unpublished research in the public client bundle.
- `server/` owns the API, SQLite database, uploaded media, and Docker Compose deployment. Creator automation uses the same API as the browser.
- `creator_toolchains/` owns local note import, factual video storyboards, Remotion rendering, publishing, and reusable AI skills.
- Demo mode is explicitly labeled, device-local, and isolated from connected server state.
- Rewards are pledges fulfilled by lab members, not payments. Do not imply funds or API credits were actually transferred.
- Run `npm run check` for cross-component changes. Verify visible interactions at mobile and desktop sizes when changing the UI.
