# Deployment Guide

Quick reference for deploying the F1 Predictions application to production.

## Pre-Deployment Checklist

### 1. Environment Variables

Set these in your production environment (Vercel, Railway, etc.):

```bash
# Required
DATABASE_URL="postgresql://user:password@host:port/database"
ADMIN_PASSWORD="<generate-strong-random-password>"

# Optional but recommended
ALLOWED_ORIGIN="https://yourdomain.com"

# If using Supabase (currently not required)
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

**Generate a secure admin password:**
```bash
openssl rand -base64 32
```

### 2. Database Setup

1. **Create PostgreSQL database** (Supabase, Neon, Railway, etc.)
2. **Apply migrations:**
   ```bash
   npx prisma migrate deploy
   ```
3. **Verify connection:**
   ```bash
   npx prisma db pull
   ```

### 3. Security Actions

- [ ] Generate and set `ADMIN_PASSWORD` in production
- [ ] Rotate database password (current one in `.env` was exposed)
- [ ] Set `ALLOWED_ORIGIN` to your production domain
- [ ] Verify `.env` is NOT committed to git
- [ ] Review `SECURITY.md` for additional hardening

### 4. Build Test

Test the production build locally:

```bash
npm run build
npm start
```

Visit `http://localhost:3000` and verify:
- [ ] Landing page loads
- [ ] Leaderboard displays (may be empty)
- [ ] Prediction form loads drivers
- [ ] Admin login page appears at `/admin/sync`

## Deployment Platforms

### Vercel (Recommended for Next.js)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Set environment variables:**
   - Go to Project Settings → Environment Variables
   - Add `DATABASE_URL`, `ADMIN_PASSWORD`, `ALLOWED_ORIGIN`

4. **Apply database migrations:**
   - Use Vercel CLI or dashboard to run:
     ```bash
     npx prisma migrate deploy
     ```

### Railway

1. **Create new project** in Railway dashboard
2. **Add PostgreSQL database** plugin
3. **Connect GitHub repo** or use Railway CLI
4. **Set environment variables** in project settings
5. **Deploy** - Railway auto-detects Next.js

### Other Platforms (Render, Fly.io, etc.)

1. Ensure platform supports Next.js standalone builds
2. Set environment variables in platform dashboard
3. Configure build command: `npm run build`
4. Configure start command: `npm start`
5. Apply migrations after first deploy

## Post-Deployment

### Initial Data Sync

After deployment, sync data from OpenF1 API:

1. Navigate to `https://yourdomain.com/admin/sync`
2. Enter your `ADMIN_PASSWORD`
3. Set year to 2025
4. Click "Sync Drivers" (wait for completion)
5. Click "Sync Race Results" (wait for completion)

### Verify Deployment

Test these URLs:
- [ ] `https://yourdomain.com` - Landing page
- [ ] `https://yourdomain.com/predictions/new` - Create prediction
- [ ] `https://yourdomain.com/leaderboard` - View leaderboard
- [ ] `https://yourdomain.com/admin/sync` - Admin login

### Monitor

- Check application logs for errors
- Monitor database connection pool
- Set up error tracking (Sentry, LogRocket, etc.)
- Monitor API rate limits if using third-party services

## Updating Data

To update race results after each race:

1. Go to `/admin/sync`
2. Login with admin password
3. Click "Sync Race Results" for current year
4. Results will update automatically

## Troubleshooting

### Database Connection Issues

```bash
# Test connection locally
npx prisma db pull

# Check connection string format
# Should be: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

### Build Failures

```bash
# Clear Next.js cache
rm -rf .next

# Regenerate Prisma Client
npx prisma generate

# Rebuild
npm run build
```

### Admin Login Not Working

- Verify `ADMIN_PASSWORD` is set in production environment
- Check browser console for errors
- Ensure sessionStorage is enabled in browser

### Rate Limiting Issues

If users report "Too many requests":
- Current limit: 5 predictions per minute per IP
- Adjust in `lib/ratelimit.ts` if needed
- Consider upgrading to Redis-based rate limiting for production scale

## Maintenance

### Regular Tasks

- **After each race:** Sync race results via admin panel
- **Weekly:** Review application logs
- **Monthly:** Update dependencies (`npm update`)
- **Quarterly:** Rotate admin password and database credentials

### Backup Strategy

- Most platforms (Supabase, Railway) provide automatic backups
- Verify backup schedule in database provider settings
- Test restore process periodically

## Scaling Considerations

If you expect high traffic:

1. **Database:**
   - Enable connection pooling
   - Consider read replicas for leaderboard queries
   - Index frequently queried fields

2. **Rate Limiting:**
   - Upgrade from in-memory to Redis-based rate limiting
   - Use services like Upstash or Vercel KV

3. **Caching:**
   - Enable Next.js ISR for leaderboard page
   - Cache OpenF1 API responses
   - Use CDN for static assets

4. **Monitoring:**
   - Set up APM (Application Performance Monitoring)
   - Configure alerts for errors and slow queries
   - Monitor API rate limits

## Support

For issues or questions:
- Review `SECURITY.md` for security concerns
- Check `CLAUDE.md` for development guidance
- Review application logs for errors
