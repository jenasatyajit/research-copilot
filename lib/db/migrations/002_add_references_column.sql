-- Add references column to papers table for on-demand citation lookups in chat
ALTER TABLE papers ADD COLUMN references_text TEXT;
