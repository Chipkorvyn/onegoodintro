# Database Migration Required

## Help Card Media Enhancement Feature

The following database changes need to be applied to the `user_problems` table in Supabase:

### New Columns to Add:

1. **attachment_url** (text, nullable)
   - Stores the URL of the attached media (YouTube video or website)

2. **attachment_type** (text, nullable)
   - Stores the type of attachment: 'youtube' or 'website'
   - Could also be implemented as an ENUM if your database supports it

3. **attachment_metadata** (jsonb, nullable)
   - Stores metadata about the attachment including:
     - title
     - description
     - thumbnail
     - favicon (for websites)
     - siteName
     - duration (for YouTube videos)
     - videoId (for YouTube videos)

### SQL Migration Script:

```sql
-- Add media attachment columns to user_problems table
ALTER TABLE user_problems
ADD COLUMN attachment_url TEXT,
ADD COLUMN attachment_type TEXT CHECK (attachment_type IN ('youtube', 'website')),
ADD COLUMN attachment_metadata JSONB;

-- Create index on attachment_type for faster queries (optional)
CREATE INDEX idx_user_problems_attachment_type ON user_problems(attachment_type);
```

### Rollback Script:

```sql
-- Remove media attachment columns from user_problems table
ALTER TABLE user_problems
DROP COLUMN IF EXISTS attachment_url,
DROP COLUMN IF EXISTS attachment_type,
DROP COLUMN IF EXISTS attachment_metadata;

-- Drop index if created
DROP INDEX IF EXISTS idx_user_problems_attachment_type;
```

## How to Apply:

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the migration script above
4. Verify the columns were added by checking the table structure

## Feature Implementation:

The codebase has been updated with:
- Updated `UserProblem` interface in `/lib/supabase.ts`
- New `MediaPreview` component in `/components/MediaPreview.tsx`
- URL processing utilities in `/lib/url-processor.ts`
- API endpoint for processing URLs in `/app/api/process-url/route.ts`
- Updated help card UI in `OneGoodIntroMobile.tsx` with link attachment functionality

Once the database migration is applied, the feature will be fully functional.