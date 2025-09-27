-- Sample data for professors and courses
-- You can modify this list based on your actual law school data

-- Insert professors
INSERT INTO professors (name) VALUES
('Rodriguez'),
('Chen'),
('Thompson'),
('Moore'),
('Taylor'),
('Foster'),
('Collins'),
('Anderson'),
('Davis'),
('Miller'),
('Abel'),
('Baker'),
('Barnes'),
('Brown'),
('Campbell'),
('Carter'),
('Clark'),
('Edwards'),
('Evans'),
('Garcia'),
('Green'),
('Hall'),
('Harris'),
('Jackson'),
('Johnson'),
('Kim'),
('King'),
('Lee'),
('Lopez'),
('Martinez'),
('Mitchell'),
('Morris'),
('Nelson'),
('Parker'),
('Perez'),
('Phillips'),
('Sanchez'),
('Scott'),
('Stewart'),
('Turner'),
('White'),
('Williams'),
('Wilson'),
('Wright'),
('Young'),
('Zachariah');

-- Insert courses
INSERT INTO courses (name) VALUES
('Administrative Law'),
('Advanced Constitutional Law'),
('Antitrust Law'),
('Bankruptcy'),
('Business Taxation'),
('Civil Rights Law'),
('Commercial Law'),
('Competition Law'),
('Constitutional Law'),
('Contract Law'),
('Corporate Law'),
('Criminal Law'),
('Criminal Procedure'),
('Domestic Relations'),
('Employment Law'),
('Energy Law'),
('Environmental Law'),
('Estate Planning'),
('Evidence'),
('Family Law'),
('Financial Regulation'),
('Health Law'),
('Immigration Law'),
('Intellectual Property Law'),
('International Law'),
('Labor Law'),
('Medical Malpractice'),
('Patent Law'),
('Personal Injury Law'),
('Property Law'),
('Real Estate Law'),
('Securities Law'),
('Tax Law'),
('Torts'),
('Trial Advocacy');

-- Insert professor-course assignments (sample data - modify based on your actual data)
-- Rodriguez teaches Constitutional Law and Civil Rights Law
INSERT INTO professor_courses (professor_id, course_id) 
SELECT p.id, c.id 
FROM professors p, courses c 
WHERE p.name = 'Rodriguez' AND c.name IN ('Constitutional Law', 'Civil Rights Law');

-- Chen teaches Contract Law and Commercial Law
INSERT INTO professor_courses (professor_id, course_id) 
SELECT p.id, c.id 
FROM professors p, courses c 
WHERE p.name = 'Chen' AND c.name IN ('Contract Law', 'Commercial Law');

-- Thompson teaches Criminal Law and Criminal Procedure
INSERT INTO professor_courses (professor_id, course_id) 
SELECT p.id, c.id 
FROM professors p, courses c 
WHERE p.name = 'Thompson' AND c.name IN ('Criminal Law', 'Criminal Procedure');

-- Moore teaches Torts and Personal Injury Law
INSERT INTO professor_courses (professor_id, course_id) 
SELECT p.id, c.id 
FROM professors p, courses c 
WHERE p.name = 'Moore' AND c.name IN ('Torts', 'Personal Injury Law');

-- Taylor teaches Evidence and Trial Advocacy
INSERT INTO professor_courses (professor_id, course_id) 
SELECT p.id, c.id 
FROM professors p, courses c 
WHERE p.name = 'Taylor' AND c.name IN ('Evidence', 'Trial Advocacy');

-- Foster teaches Advanced Constitutional Law and Civil Rights Law
INSERT INTO professor_courses (professor_id, course_id) 
SELECT p.id, c.id 
FROM professors p, courses c 
WHERE p.name = 'Foster' AND c.name IN ('Advanced Constitutional Law', 'Civil Rights Law');

-- Collins teaches Corporate Law and Securities Law
INSERT INTO professor_courses (professor_id, course_id) 
SELECT p.id, c.id 
FROM professors p, courses c 
WHERE p.name = 'Collins' AND c.name IN ('Corporate Law', 'Securities Law');

-- Anderson teaches Property Law and Real Estate Law
INSERT INTO professor_courses (professor_id, course_id) 
SELECT p.id, c.id 
FROM professors p, courses c 
WHERE p.name = 'Anderson' AND c.name IN ('Property Law', 'Real Estate Law');

-- Davis teaches Intellectual Property Law and Patent Law
INSERT INTO professor_courses (professor_id, course_id) 
SELECT p.id, c.id 
FROM professors p, courses c 
WHERE p.name = 'Davis' AND c.name IN ('Intellectual Property Law', 'Patent Law');

-- Miller teaches Labor Law and Employment Law
INSERT INTO professor_courses (professor_id, course_id) 
SELECT p.id, c.id 
FROM professors p, courses c 
WHERE p.name = 'Miller' AND c.name IN ('Labor Law', 'Employment Law');

-- Add more professor-course assignments as needed...
-- You can add more combinations by following the same pattern above

