-- Remove legacy modules: Marketing + Aufgaben (Tasks)
-- IMPORTANT: Export tables before applying this migration (see spec 2.17).

DROP TABLE IF EXISTS "marketing";
DROP TABLE IF EXISTS "tasks";

