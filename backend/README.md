# Backend (Services)
Back-end services reflect PRD modules. Implement in Python/FastAPI or Node.js.

- auth/           → role-based access, audit logs
- ai/             → LLM assistance, validation & anomaly detection
- connectors/
    - dhis2/      → API auth, metadata fetch, dataset push/sync
    - generic-db/ → connectors for PostgreSQL/MySQL/MSSQL; CSV/Excel export
- validation/     → rule engine (+ human-in-the-loop endpoints)
- files/          → MongoDB-backed storage (audio/images/docs)
- pipelines/      → create/manage data collection pipelines
