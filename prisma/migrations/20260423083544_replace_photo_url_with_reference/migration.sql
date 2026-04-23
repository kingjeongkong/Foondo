-- Replace photo_url (key-embedded URL) with photo_reference (opaque Google photo reference string).
-- Existing photo_url values are all unusable because the originating API key was rotated and deleted.

ALTER TABLE "restaurants" DROP COLUMN "photo_url";
ALTER TABLE "restaurants" ADD COLUMN "photo_reference" TEXT;
