-- Removes everything added by `npm run seed:demo` (server/src/scripts/seed-demo-data.ts).
-- SQL equivalent of `npm run seed:demo -w server -- --reset`.
--
-- Seeded rows are identified through public.seed_demo_row, so rows that existed
-- before seeding are left alone. Rows later added in the app to a demo case,
-- or by a demo staff account, are removed too (otherwise they would block the
-- delete).
--
-- NOTE: this does not delete the placeholder PDFs in the storage bucket.
-- Run step 0 first and keep the list if you want to remove those files
-- (or use `--reset`, which deletes them too).

-- 0. (Optional) Uploaded files that will be orphaned.
-- SELECT filename FROM public.document
-- WHERE filename IS NOT NULL
--   AND caseid IN (SELECT pk::int FROM public.seed_demo_row WHERE tablename = 'deceasedrecord');

BEGIN;

CREATE TEMP TABLE seed_ids ON COMMIT DROP AS
SELECT tablename, pk FROM public.seed_demo_row;

CREATE TEMP TABLE seed_cases ON COMMIT DROP AS
SELECT pk::int AS id FROM seed_ids WHERE tablename = 'deceasedrecord';
CREATE TEMP TABLE seed_staff ON COMMIT DROP AS
SELECT pk AS id FROM seed_ids WHERE tablename = 'staff';
CREATE TEMP TABLE seed_ledger ON COMMIT DROP AS
SELECT pk::int AS id FROM seed_ids WHERE tablename = 'formalininventory';
CREATE TEMP TABLE seed_caskets ON COMMIT DROP AS
SELECT pk::int AS id FROM seed_ids WHERE tablename = 'casketinventory';

-- 1. Rows recorded in the app after seeding point at the seeded closing
--    formalin ledger row; move them to the newest non-seeded ledger row.
WITH target AS (
  SELECT formalinid FROM public.formalininventory
  WHERE formalinid NOT IN (SELECT id FROM seed_ledger)
  ORDER BY date DESC, formalinid DESC
  LIMIT 1
)
UPDATE public.formalinusage u SET formalinid = (SELECT formalinid FROM target)
WHERE EXISTS (SELECT 1 FROM target)
  AND u.formalinid IN (SELECT id FROM seed_ledger)
  AND u.caseid NOT IN (SELECT id FROM seed_cases);

WITH target AS (
  SELECT formalinid FROM public.formalininventory
  WHERE formalinid NOT IN (SELECT id FROM seed_ledger)
  ORDER BY date DESC, formalinid DESC
  LIMIT 1
)
UPDATE public.formalindelivery d SET formalinid = (SELECT formalinid FROM target)
WHERE EXISTS (SELECT 1 FROM target)
  AND d.formalinid IN (SELECT id FROM seed_ledger)
  AND d.deliveryid::text NOT IN (SELECT pk FROM seed_ids WHERE tablename = 'formalindelivery');

WITH target AS (
  SELECT formalinid FROM public.formalininventory
  WHERE formalinid NOT IN (SELECT id FROM seed_ledger)
  ORDER BY date DESC, formalinid DESC
  LIMIT 1
)
UPDATE public.inventoryaudit a SET formalinid = (SELECT formalinid FROM target)
WHERE EXISTS (SELECT 1 FROM target)
  AND a.formalinid IN (SELECT id FROM seed_ledger)
  AND a.auditid::text NOT IN (SELECT pk FROM seed_ids WHERE tablename = 'inventoryaudit');

-- 2. Audit log and deletion snapshots.
DELETE FROM public.auditlog
WHERE auditlogid::text IN (SELECT pk FROM seed_ids WHERE tablename = 'auditlog')
   OR staffid IN (SELECT id FROM seed_staff);

DELETE FROM public.deletion WHERE deletedby IN (SELECT id FROM seed_staff);

-- 3. Everything attached to a seeded case (official receipts cascade with
--    their transaction; notifications would cascade with the case anyway).
DELETE FROM public."transaction" WHERE caseid IN (SELECT id FROM seed_cases);
DELETE FROM public.document      WHERE caseid IN (SELECT id FROM seed_cases);
DELETE FROM public.burialrecord  WHERE caseid IN (SELECT id FROM seed_cases);
DELETE FROM public.formalinusage WHERE caseid IN (SELECT id FROM seed_cases);
DELETE FROM public.contract      WHERE caseid IN (SELECT id FROM seed_cases);
DELETE FROM public.lifeplan      WHERE caseid IN (SELECT id FROM seed_cases);
DELETE FROM public.lgucase       WHERE caseid IN (SELECT id FROM seed_cases);
DELETE FROM public.notification  WHERE caseid IN (SELECT id FROM seed_cases);

-- 4. Inventory.
DELETE FROM public.formalindelivery
WHERE deliveryid::text IN (SELECT pk FROM seed_ids WHERE tablename = 'formalindelivery');

DELETE FROM public.inventoryaudit
WHERE auditid::text IN (SELECT pk FROM seed_ids WHERE tablename = 'inventoryaudit')
   OR casketid IN (SELECT id FROM seed_caskets);

DELETE FROM public.formalininventory WHERE formalinid IN (SELECT id FROM seed_ledger);

DELETE FROM public.casketdelivery
WHERE deliveryid::text IN (SELECT pk FROM seed_ids WHERE tablename = 'casketdelivery')
   OR casketid IN (SELECT id FROM seed_caskets);

-- 5. Cases, representatives, packages, caskets.
DELETE FROM public.deceasedrecord WHERE caseid IN (SELECT id FROM seed_cases);

DELETE FROM public.representative
WHERE representativeid::text IN (SELECT pk FROM seed_ids WHERE tablename = 'representative');

DELETE FROM public.package
WHERE packageid::text IN (SELECT pk FROM seed_ids WHERE tablename = 'package');

DELETE FROM public.casketinventory WHERE casketid IN (SELECT id FROM seed_caskets);

-- 6. Expenses.
DELETE FROM public.expense
WHERE expenseid::text IN (SELECT pk FROM seed_ids WHERE tablename = 'expense')
   OR recordedby IN (SELECT id FROM seed_staff);

-- 7. Demo staff (account, session, notification reads cascade).
DELETE FROM public.access         WHERE staffid IN (SELECT id FROM seed_staff);
DELETE FROM public.lifeplan_agent WHERE staffid IN (SELECT id FROM seed_staff);
DELETE FROM public.staff          WHERE id IN (SELECT id FROM seed_staff);

-- 8. LGUs and life plan companies.
DELETE FROM public.lgu
WHERE lguid::text IN (SELECT pk FROM seed_ids WHERE tablename = 'lgu');

DELETE FROM public.lifeplancompany
WHERE companyid::text IN (SELECT pk FROM seed_ids WHERE tablename = 'lifeplancompany');

-- 9. The manifest itself.
DROP TABLE public.seed_demo_row;

COMMIT;
