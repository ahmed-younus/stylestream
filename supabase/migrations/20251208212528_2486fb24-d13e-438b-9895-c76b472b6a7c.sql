-- Add body measurement fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN height_cm INTEGER,
ADD COLUMN trainer_size TEXT,
ADD COLUMN neck_cm DECIMAL(4,1),
ADD COLUMN wrist_cm DECIMAL(4,1),
ADD COLUMN pants_length_cm INTEGER,
ADD COLUMN chest_cm INTEGER,
ADD COLUMN waist_cm INTEGER,
ADD COLUMN hip_cm INTEGER,
ADD COLUMN inseam_cm INTEGER,
ADD COLUMN shoulder_cm INTEGER;