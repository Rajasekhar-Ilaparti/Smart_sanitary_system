-- ============================================================
--  Clean Gudlavalleru - start again with fresh sample data
--  Run in Supabase: SQL Editor -> New query -> paste -> Run.
--  The next time anyone opens the website, the demo accounts and
--  sample reports are created again (with fresh 3-hour deadlines).
--  WARNING: this deletes ALL reports, accounts and logins.
-- ============================================================
truncate gw_users, gw_reports, gw_sessions, gw_meta;
alter sequence gw_report_seq restart with 1;
-- Old photos stay in Storage -> photos. You can delete them there if you like.
