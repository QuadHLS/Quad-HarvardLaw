# Reset Quadle Daily Edge Function

This Edge Function truncates the `quadle_plays` table daily at midnight EST to reset the game.

## Setup Instructions

### Option 1: Using pg_cron (Recommended if available)

If your Supabase instance has the `pg_cron` extension enabled, the migration file will automatically schedule the reset. No additional setup needed.

### Option 2: Using External Cron Service

If `pg_cron` is not available, use this Edge Function with an external cron service.

#### Step 1: Deploy the Edge Function

```bash
supabase functions deploy reset-quadle-daily
```

#### Step 2: Set Environment Variable (Optional but Recommended)

Set a secret token for security:

```bash
supabase secrets set CRON_SECRET_TOKEN=your-secret-token-here
```

#### Step 3: Set Up External Cron

Use one of these services to call the function daily at midnight EST:

**GitHub Actions (Free):**

Create `.github/workflows/reset-quadle.yml`:

```yaml
name: Reset Quadle Daily

on:
  schedule:
    # Runs daily at 05:00 UTC (midnight EST standard time)
    # Adjust for daylight saving time: 04:00 UTC (Mar-Nov)
    - cron: '0 5 * * *'
  workflow_dispatch: # Allows manual trigger

jobs:
  reset:
    runs-on: ubuntu-latest
    steps:
      - name: Call Reset Function
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json" \
            https://YOUR_PROJECT_REF.supabase.co/functions/v1/reset-quadle-daily
```

**Vercel Cron (if using Vercel):**

Add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/reset-quadle",
    "schedule": "0 5 * * *"
  }]
}
```

Then create `api/reset-quadle.ts`:

```typescript
export default async function handler(req: any, res: any) {
  const response = await fetch(
    'https://YOUR_PROJECT_REF.supabase.co/functions/v1/reset-quadle-daily',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  const data = await response.json();
  res.status(200).json(data);
}
```

**Other Options:**
- AWS EventBridge
- Google Cloud Scheduler
- Cron-job.org (free tier available)

## Time Zone Notes

- **EST (Standard Time)**: UTC-5 → Midnight EST = 05:00 UTC
- **EDT (Daylight Saving)**: UTC-4 → Midnight EDT = 04:00 UTC

The cron schedule `0 5 * * *` runs at 05:00 UTC, which is midnight EST during standard time (November-March).

For daylight saving time (March-November), you may want to:
1. Use two separate cron jobs (one for EST, one for EDT)
2. Or use a service that handles timezone conversion automatically

## Manual Testing

You can manually trigger the reset:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/reset-quadle-daily
```

## What It Does

1. Calls the `reset_quadle_plays()` database function
2. Truncates the entire `quadle_plays` table
3. Resets the identity sequence
4. Allows all users to play again the next day


