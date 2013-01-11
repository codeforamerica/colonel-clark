ALTER TABLE crimes
ADD CONSTRAINT uk_case_number_crime UNIQUE(case_number, crime);
