---
name: onlyfunds-publish
description: Validate and publish a prepared OnlyFunds research draft and optional video to the user's selected self-hosted lab server through the repository CLI.
---

# OnlyFunds publish

Read `docs/creator-guide.md` and the draft chosen by the user. Use the repository's `creator_toolchains/publish.mjs`, not ad hoc upload code. Server and token come from local `ONLYFUNDS_SERVER` and `ONLYFUNDS_TOKEN`; do not request secret values in chat, copy them into artifacts, or print the environment.

Run with `--dry-run` first. Confirm the target lab origin matches the user's requested destination and that the title, research claims, sources and supplied video correspond to the intended publication. Do not convert a preparation-only request into external publishing.

When the user already authorized publishing this material to that lab, run the same concrete command with `--publish`; no additional confirmation is required. If publication intent or target is unresolved, finish the local draft and validation first, then ask only for the missing decision.

Use `--video` for MP4/WebM and optional `--poster` for PNG/JPEG. Never send credentials to a redirect. The CLI requires HTTPS except for local loopback development and performs no automatic retry of mutations.

If the response is lost or times out, check the lab feed for the expected post before retrying; the API currently has no idempotency key. Report the confirmed post ID and server after success, never the token. If only validation succeeded, state that nothing was uploaded.
