-- Qualification scores: stop showing an unearned perfect score. Run once in the Supabase SQL editor for the PRODUCTION project.
-- Until now every new student row started with the placeholder score "25/25 (100%)". This removes that placeholder, and clears it ONLY on rows that have no score sheet recorded.
-- A score typed or saved by the instructor is never touched. (Today that is 2 rows: one student still in the classroom step, and the internal guest-checkout record.)
alter table public.students alter column qualification_score drop default;

update public.students
   set qualification_score = null
 where qualification_score = '25/25 (100%)'
   and not exists (select 1 from public.student_scoresheets ss where ss.student_id = students.student_id);
