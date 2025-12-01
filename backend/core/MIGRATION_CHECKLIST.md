# Migration Checklist

Before deploying ANY migration to production:

## Development Phase

- [ ] Entity changes are complete
- [ ] Migration generated with `pnpm run migration:generate`
- [ ] Migration file reviewed (SQL looks correct)
- [ ] Local database migrated successfully
- [ ] App starts without errors locally
- [ ] All affected features tested manually
- [ ] Unit tests pass
- [ ] Integration tests pass (if any)

## Pre-Deployment

- [ ] Migration committed to git
- [ ] Reviewed by team member (if applicable)
- [ ] Staging environment tested (if exists)
- [ ] Production backup plan ready
- [ ] Rollback plan documented
- [ ] Deployment time scheduled (low traffic)

## Deployment

- [ ] Production database backed up
- [ ] Code pulled to production
- [ ] Dependencies installed
- [ ] Application built
- [ ] Application stopped
- [ ] Migration ran successfully
- [ ] Application started
- [ ] Health check passed
- [ ] Logs checked (no errors)
- [ ] Critical features tested

## Post-Deployment

- [ ] Monitor logs for 30 minutes
- [ ] Check error tracking (Sentry, etc.)
- [ ] Verify user-facing features work
- [ ] Keep backup for 7 days
- [ ] Document any issues
