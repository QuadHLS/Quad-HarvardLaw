-- Create professors table
CREATE TABLE professors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  description TEXT,
  year_level VARCHAR(10) CHECK (year_level IN ('1L', '2L', '3L', 'ALL')),
  is_required BOOLEAN DEFAULT FALSE,
  is_elective BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create junction table for course-professor relationships
CREATE TABLE course_professors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  professor_id UUID REFERENCES professors(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(course_id, professor_id)
);

-- Create indexes for better performance
CREATE INDEX idx_courses_year_level ON courses(year_level);
CREATE INDEX idx_course_professors_course_id ON course_professors(course_id);
CREATE INDEX idx_course_professors_professor_id ON course_professors(professor_id);

-- Enable Row Level Security
ALTER TABLE professors ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_professors ENABLE ROW LEVEL SECURITY;

-- Create policies for read access (all authenticated users can read)
CREATE POLICY "Allow authenticated users to read professors" ON professors
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read courses" ON courses
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read course_professors" ON course_professors
  FOR SELECT USING (auth.role() = 'authenticated');

-- Insert sample data for professors
INSERT INTO professors (name) VALUES
  ('Professor Smith'),
  ('Professor Johnson'),
  ('Professor Williams'),
  ('Professor Brown'),
  ('Professor Wilson'),
  ('Professor Miller'),
  ('Professor Taylor'),
  ('Professor Anderson'),
  ('Professor Thomas'),
  ('Professor Jackson'),
  ('Professor White'),
  ('Professor Harris'),
  ('Professor Martin'),
  ('Professor Garcia'),
  ('Professor Lee'),
  ('Professor Kim'),
  ('Professor Adams'),
  ('Professor Baker'),
  ('Professor Carter'),
  ('Professor Davis'),
  ('Professor Evans'),
  ('Professor Foster'),
  ('Professor Green'),
  ('Professor Hall'),
  ('Professor Jones'),
  ('Professor King'),
  ('Professor Lewis'),
  ('Professor Moore'),
  ('Professor Nelson'),
  ('Professor Parker'),
  ('Professor Quinn'),
  ('Professor Roberts'),
  ('Professor Scott'),
  ('Professor Turner'),
  ('Professor Walker'),
  ('Professor Young'),
  ('Professor Martinez'),
  ('Professor Thompson'),
  ('Professor Rodriguez'),
  ('Professor Clark'),
  ('Professor Robinson'),
  ('Professor Wright'),
  ('Professor Lopez'),
  ('Professor Hill'),
  ('Professor Allen'),
  ('Professor Gonzalez'),
  ('Professor Sanchez'),
  ('Professor Rivera'),
  ('Professor Perez'),
  ('Professor Ramirez'),
  ('Professor Bennett'),
  ('Professor Stewart'),
  ('Professor Morris'),
  ('Professor Murphy'),
  ('Professor Hughes'),
  ('Professor Price'),
  ('Professor Russell'),
  ('Professor Simmons'),
  ('Professor Ward'),
  ('Professor Peterson'),
  ('Professor Jenkins'),
  ('Professor Perry'),
  ('Professor Powell'),
  ('Professor Palmer'),
  ('Professor Richardson'),
  ('Professor Cox'),
  ('Professor Howard'),
  ('Professor Torres'),
  ('Professor Gray'),
  ('Professor Brooks'),
  ('Professor Sanders'),
  ('Professor Price'),
  ('Professor Bennett'),
  ('Professor Wood'),
  ('Professor Watson'),
  ('Professor Barnes'),
  ('Professor Ross'),
  ('Professor Henderson'),
  ('Professor Coleman'),
  ('Professor Jenkins'),
  ('Professor Perry'),
  ('Professor Powell'),
  ('Professor Long'),
  ('Professor Patterson'),
  ('Professor Hughes'),
  ('Professor Flores'),
  ('Professor Washington'),
  ('Professor Butler'),
  ('Professor Simmons'),
  ('Professor Foster'),
  ('Professor Gonzales'),
  ('Professor Bryant'),
  ('Professor Alexander'),
  ('Professor Russell'),
  ('Professor Griffin'),
  ('Professor Diaz'),
  ('Professor Hayes'),
  ('Professor Collins'),
  ('Professor Edwards');

-- Insert 1L required courses
INSERT INTO courses (name, code, year_level, is_required) VALUES
  ('Civil Procedure (CivPro)', 'LAW101', '1L', true),
  ('Constitutional Law (ConLaw)', 'LAW102', '1L', true),
  ('Contracts', 'LAW103', '1L', true),
  ('Criminal Law (CrimLaw)', 'LAW104', '1L', true),
  ('Legal Research and Writing (LRW)', 'LAW105', '1L', true),
  ('Property', 'LAW106', '1L', true),
  ('Torts', 'LAW107', '1L', true),
  ('Legislation and Regulation (LegReg)', 'LAW108', '1L', true);

-- Insert 1L elective courses
INSERT INTO courses (name, code, year_level, is_elective) VALUES
  ('Business Organizations', 'LAW131', '1L', true),
  ('Employment Law', 'LAW132', '1L', true),
  ('Family Law', 'LAW133', '1L', true),
  ('Federal Courts', 'LAW134', '1L', true),
  ('Health Law', 'LAW135', '1L', true),
  ('Intellectual Property', 'LAW136', '1L', true),
  ('International Law', 'LAW137', '1L', true),
  ('Introduction to International Law', 'LAW138', '1L', true);

-- Insert 2L/3L courses
INSERT INTO courses (name, code, year_level) VALUES
  ('Administrative Law', 'LAW201', 'ALL'),
  ('Advanced Constitutional Law', 'LAW202', 'ALL'),
  ('Antitrust Law', 'LAW203', 'ALL'),
  ('Bankruptcy', 'LAW204', 'ALL'),
  ('Business Taxation', 'LAW205', 'ALL'),
  ('Civil Rights Law', 'LAW206', 'ALL'),
  ('Commercial Law', 'LAW207', 'ALL'),
  ('Competition Law', 'LAW208', 'ALL'),
  ('Corporate Law', 'LAW209', 'ALL'),
  ('Criminal Procedure', 'LAW210', 'ALL'),
  ('Domestic Relations', 'LAW211', 'ALL'),
  ('Securities Regulation', 'LAW212', 'ALL'),
  ('International Law', 'LAW213', 'ALL'),
  ('Environmental Law', 'LAW214', 'ALL'),
  ('Tax Law', 'LAW215', 'ALL'),
  ('Labor Law', 'LAW216', 'ALL'),
  ('Real Estate Law', 'LAW217', 'ALL'),
  ('Immigration Law', 'LAW218', 'ALL'),
  ('Patent Law', 'LAW219', 'ALL'),
  ('Evidence', 'LAW220', 'ALL'),
  ('Advanced Criminal Law', 'LAW221', 'ALL'),
  ('Advanced Torts', 'LAW222', 'ALL'),
  ('Advanced Property Law', 'LAW223', 'ALL'),
  ('Advanced Contracts', 'LAW224', 'ALL'),
  ('International Trade Law', 'LAW225', 'ALL'),
  ('Mergers and Acquisitions', 'LAW226', 'ALL'),
  ('Private Equity and Venture Capital', 'LAW227', 'ALL'),
  ('Financial Regulation', 'LAW228', 'ALL'),
  ('Employment Law', 'LAW229', 'ALL'),
  ('Energy Law', 'LAW230', 'ALL'),
  ('Estate Planning', 'LAW231', 'ALL'),
  ('Family Law', 'LAW232', 'ALL'),
  ('Health Law', 'LAW233', 'ALL'),
  ('Intellectual Property Law', 'LAW234', 'ALL'),
  ('Medical Malpractice', 'LAW235', 'ALL'),
  ('Personal Injury Law', 'LAW236', 'ALL'),
  ('Trial Advocacy', 'LAW237', 'ALL');

-- Now we need to create the course_professors relationships
-- For simplicity, I'll assign 2-4 professors randomly to each course
-- In a real application, this would be based on actual assignments

-- Function to create course-professor relationships
DO $$
DECLARE
  course_record RECORD;
  professor_record RECORD;
  num_professors INTEGER;
  professor_count INTEGER;
BEGIN
  FOR course_record IN SELECT * FROM courses LOOP
    -- Randomly assign 2-4 professors per course
    num_professors := floor(random() * 3 + 2)::INTEGER;
    professor_count := 0;
    
    FOR professor_record IN SELECT * FROM professors ORDER BY random() LOOP
      INSERT INTO course_professors (course_id, professor_id)
      VALUES (course_record.id, professor_record.id)
      ON CONFLICT DO NOTHING;
      
      professor_count := professor_count + 1;
      EXIT WHEN professor_count >= num_professors;
    END LOOP;
  END LOOP;
END $$;
