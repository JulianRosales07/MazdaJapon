-- Make cb nullable in salidas table to allow external sales
ALTER TABLE salidas ALTER COLUMN cb DROP NOT NULL;
