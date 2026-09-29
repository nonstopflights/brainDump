# Daybook

A private, mobile-first idea inbox and bullet journal for your macOS server. Built with Next.js, React, shadcn-style Radix primitives, Tiptap, chrono-node, and PostgreSQL or SQLite. No paid UI or editor service is required.

## Try it

Requires **Node.js 22.13 or later** (Node 24 LTS recommended) and npm. Run these commands in this folder:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://127.0.0.1:3000. Six sample cards demonstrate the views; Settings lets you archive them. SQLite is the default until `DAYBOOK_DATABASE=postgres` is configured. Attachments remain in `data/` with either backend.

## What works in this draft

- Natural-language capture with an editable interpretation preview: tasks, notes, events, dates, deadlines, time, recurrence, importance, explicit tags and alias matching.
- Cards, list and boards grouped by chosen tags. Drag on desktop or use “Move to” on touch devices. Multiple tags can place the same card in several columns.
- Rich-text editing with autosave, headings, links, lists, checklists, undo/redo, images and file attachments.
- Tag creation, renaming, colors, aliases, archive, merge, delete and column order. Tag deletion preserves the cards.
- Collections, searching, energy filters, effort estimates and a Today shortlist.
- Daily bullet journal, reflections, future log, deliberate migration, crossing out, completion and archive recovery.
- Daily, weekly and monthly recurring tasks; completing one creates its next occurrence. Reminders are cleared on the next occurrence so an old notification is not reused.
- Calendar event exports (`.ics`), including untimed all-day events. The calendar choice and final import happen in your calendar app. This is **not live calendar synchronization**.
- Optional authenticated iMessage receiver with sender/chat restrictions, message deduplication, capture, “today” and “done CARD_ID” commands.
- Password-protected single-user access, journal export/import, and SQLite or PostgreSQL backups with attachment files.
- Phone bottom navigation, full-screen editing, horizontal tag boards and tap-based card moves. Add to Home Screen works on iOS; use HTTPS for normal remote mobile use.

## macOS server setup

1. Copy this folder to the server, excluding `node_modules`, `.next` and preview `data` unless you want to keep its contents.
2. Run `npm ci`, copy `.env.example` to `.env.local`, and set a strong `APP_PASSWORD`.
3. Set `TZ` **and** `DAYBOOK_TIMEZONE` to your IANA timezone, for example `America/New_York`. Restart after changing these values. Parsing and timed calendar export use the server timezone.
4. Run `npm run build` and `npm start`, or use the PM2 configuration below.
5. For LAN access without PM2, use `npm start -- --hostname 0.0.0.0`. Keep it on your private network, VPN, or behind a trusted HTTPS reverse proxy. The default command binds to loopback, and data requests reject remote hostnames unless a password is configured.
6. Keep your Mac awake. The iMessage bridge and native notifications must run in your signed-in macOS user session. Do not run them as a headless root daemon.

### Run with PM2

The included `ecosystem.config.js` runs one production Next.js process from this project directory. Install PM2 if needed, then build and start Daybook as your normal macOS user:

```sh
npm ci
cp .env.example .env.local # skip if you already configured it
# Edit .env.local: set APP_PASSWORD, TZ, DAYBOOK_TIMEZONE, and any integrations.
npm run build
pm2 start ecosystem.config.js
pm2 logs daybook
```

It listens on `127.0.0.1:3000` by default. To use a different port or bind to your LAN, set `PORT` and `DAYBOOK_HOST` when starting PM2, for example `PORT=3000 DAYBOOK_HOST=0.0.0.0 pm2 start ecosystem.config.js`. Set `APP_PASSWORD` before LAN access. `.env.local` is loaded by Next.js from this project directory; `PORT` and `DAYBOOK_HOST` are read by PM2 when it loads the configuration, so put those two in the command or your shell environment. Keep `DAYBOOK_DATA_DIR` on persistent storage (the default is this project's `data/` folder).

After confirming it runs, use `pm2 save` and follow the command printed by `pm2 startup` if you want PM2 to restore it after a reboot. Run PM2 under the same user that owns the project and data. On deployments, run `npm ci`, `npm run build`, then `pm2 restart daybook`; rebuild before restarting because PM2 serves the production build, not the development server. PM2 only supervises Daybook here; BlueBubbles and the optional native reminder worker have their own macOS session requirements.

### PostgreSQL

Set `DAYBOOK_DATABASE=postgres` in the ignored `.env.local` to use PostgreSQL for journal state, attachment metadata, iMessage deduplication, and delivered-reminder records. Create a dedicated PostgreSQL database owned by the app's database user first. Daybook then creates its own `daybook` schema and tables inside it. Attachment binaries remain under `DAYBOOK_DATA_DIR/attachments` (default `data/attachments`), so keep that directory when moving the app. PostgreSQL client tools are also needed for backups (`pg_dump`) and restores (`pg_restore`).

For PostgreSQL on the same Mac as Daybook, use values like these in the server's `.env.local`:

```dotenv
DAYBOOK_DATABASE=postgres
PGHOST=127.0.0.1
PGPORT=5432
PGUSER=your-database-user
PGDATABASE=daybook
PGPASSWORD=your-password
```

If PostgreSQL is on another Mac, use its TLS-enabled connection or an SSH tunnel. For example, forward a local port to PostgreSQL's loopback listener on the server:

```sh
ssh -p YOUR_SSH_PORT -N -L 54319:127.0.0.1:5432 USER@SERVER
```

Keep that tunnel open, then use `PGHOST=127.0.0.1` and `PGPORT=54319` in the local `.env.local`. On the server itself, use its local PostgreSQL port and no tunnel.

To migrate an existing SQLite journal, stop Daybook and the reminder worker, back up the source, keep `DAYBOOK_DATABASE=sqlite` during import, and run:

```sh
node --env-file=.env.local scripts/backup.mjs
npm run migrate:postgres
```

The migration command uses the `PG*` or `DATABASE_URL` connection values even while `DAYBOOK_DATABASE=sqlite`. It copies cards, tags, settings, iMessage deduplication records, attachment metadata, and delivered-reminder records. It refuses to overwrite a populated Daybook PostgreSQL schema and leaves SQLite unchanged. If the SQLite file is elsewhere, set `DAYBOOK_SQLITE_SOURCE` to its absolute path. When importing on another machine, copy its `attachments/` directory too. After migration, set `DAYBOOK_DATABASE=postgres`, run `npm run build`, and restart Daybook with PM2. Take a new PostgreSQL backup after verifying the migrated journal.

This is a single-user draft. It has no multi-user permissions, offline editing/sync, collaborative editor, or calendar conflict detection. Save failures are shown and the editor stays open. Separate browser editors use optimistic update timestamps to reject stale saves.

## Natural language

Try:

- `Go to the grocery store on Tuesday #shopping`
- `Dentist Tuesday at 2pm`
- `Finish the proposal by Friday`
- `Remind me to call Sam tomorrow morning`
- `Idea: a tiny greenhouse dashboard`

The built-in parser runs locally. It understands common English dates and intent patterns, rather than unrestricted human intent. It shows actual dates before saving, and flags fuzzy times for review. Tags inferred from context are suggestions; explicit existing tags/aliases are assigned. Unknown tags can be created in the tag manager.

For broader interpretation, configure an **OpenAI-compatible** chat endpoint using `LLM_BASE_URL`, `LLM_MODEL`, and optionally `LLM_API_KEY`. A local model service can use `http://127.0.0.1:11434/v1`. Responses are schema-validated and fall back to local rules if unavailable. The model interprets text; it cannot execute tools. If you choose an external endpoint, your captured text and tag vocabulary are sent there.

## iMessage on your Mac

Messages being installed does not itself connect the app. This draft includes a receiver; it has **not been tested against your live Messages account**, and does not automatically send replies or import message attachments.

Use [BlueBubbles Server](https://github.com/BlueBubblesApp/bluebubbles-server), which runs in your macOS user session. Its [webhook documentation](https://docs.bluebubbles.app/server/developer-guides/rest-api-and-webhooks) explains new-message subscriptions. No private API features are needed for the basic receiver.

1. Sign the server’s Messages app into its intended iMessage identity. Prefer a dedicated identity: send incoming messages to that identity from your phone. Outgoing messages are ignored to prevent loops.
2. Configure these values in `.env.local`, then restart Daybook:

```dotenv
IMESSAGE_TOKEN=your-long-random-secret
IMESSAGE_CHAT_GUID=the-exact-approved-chat-guid
IMESSAGE_ALLOWED_SENDERS=your-approved-phone-or-apple-id-address
```

3. Subscribe BlueBubbles to **new-message** webhooks at `http://127.0.0.1:3000/api/imessage?token=YOUR_SECRET` when both run on the Mac. Keep the token private and avoid logging full webhook URLs.
4. Supported BlueBubbles shape: `{type:"new-message", data:{guid,text,isFromMe,handle:{address},chats:[{guid}]}}`. The receiver also accepts the normalized payload below, useful if your bridge version requires an adapter.

```json
{
  "guid": "unique-message-guid",
  "text": "Go to grocery store Tuesday #errands",
  "chatGuid": "the-exact-approved-chat-guid",
  "sender": "your-approved-address",
  "isFromMe": false
}
```

For normalized requests, use `Authorization: Bearer YOUR_SECRET`. The receiver returns `{cardId, duplicate, reply}`. A bridge can display the reply; **sending it to iMessage is not wired in this draft**. “today” returns the day’s tasks and short IDs. “done SHORT_ID” completes a non-repeating card. Capture always preserves the original text. The receiver never books an external calendar event.

The sender address must exactly match the value supplied by your bridge. Verify one real payload before enabling ongoing capture. Phone/server account setup determines whether your capture arrives as incoming; this draft intentionally rejects `isFromMe`.

## Reminders

Reminders are saved on each card. To deliver native notifications on your Mac, keep this optional worker running in the signed-in user session:

```sh
node --env-file=.env.local scripts/reminders.mjs
```

Run the app once before starting the worker so the database exists. Notifications appear on the server Mac, not automatically on your phone. The worker checks every 30 seconds and records successful deliveries to prevent duplicates. Browser/push and iMessage notification delivery are not connected in this draft.

## Backup and restore

```sh
node --env-file=.env.local scripts/backup.mjs
```

With SQLite, this creates a consistent SQLite snapshot. With PostgreSQL, it uses `pg_dump` to archive only the `daybook` schema. Both modes include attachment files in a dated `backups/` folder. Store backups on another disk or system. To restore, stop the app and reminder worker; use the bundled `RESTORE.txt` for the chosen backend and restore attachments to the same data directory. Keep `.env.local` backed up separately. JSON export is useful for inspection and portability but contains attachment references rather than the files themselves. Import replaces the current journal after an explicit warning.

## Validation

```sh
npm test
npm run build
```

The interface was checked at 375px phone and 1440px desktop widths. Browser checks covered capture, autosaved rich text, tag-column movement and the calendar preview. Optional page-scoped assistant tools were checked for valid capture previews and invalid input.

Tests cover date/deadline interpretation, aliases, calendar output, tag merging, stale saves, migration, recurrence and receiver deduplication/sender checks. A real BlueBubbles connection and Apple Calendar import still require verification on your server.
