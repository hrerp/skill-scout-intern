
-- Create a table to store intern data
CREATE TABLE public.interns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  college TEXT NOT NULL,
  photo TEXT,
  languages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.interns ENABLE ROW LEVEL SECURITY;

-- Create policies for data access
CREATE POLICY "Users can view all intern data" 
  ON public.interns 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own intern data" 
  ON public.interns 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own intern data" 
  ON public.interns 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own intern data" 
  ON public.interns 
  FOR DELETE 
  TO authenticated
  USING (auth.uid()::text = user_id::text);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_interns_updated_at BEFORE UPDATE ON public.interns 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
