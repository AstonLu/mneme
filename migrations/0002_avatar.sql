-- One of AVATARS in src/domain/avatars.js, or NULL for the letter. The owner's is in settings: 'owner-avatar'.
ALTER TABLE people ADD COLUMN avatar TEXT;
