# WorkFlow AI

A dark, local-first React + Vite work scheduler for planning work alongside Apple Calendar and Apple Reminders.

## Included

- Dark responsive dashboard
- Task creation, editing, deletion, completion, priorities, categories, notes, and recurring labels
- Search and filtering
- Drag tasks between days in the calendar view
- Apple-compatible `.ics` calendar export
- Apple-compatible reminder/task export through a VTODO `.ics` file
- AI planning assistant with schedule, priority, capacity, and integration suggestions
- Work calculator with keyboard input and calculator keys
- Browser local storage persistence

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Integration note

The current app is intentionally local-first and does not request iCloud credentials in the browser. The export actions create files that can be imported into Apple Calendar and Apple Reminders. A production sync layer should use a secure server-side CalDAV integration or an Apple Shortcuts workflow rather than exposing iCloud credentials to the client.
