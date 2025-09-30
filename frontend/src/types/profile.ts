export interface Profile {
  user_id: string;
  email: string | undefined;
  created_at: string;
  updated_at: string;
  bio: string;
  handle: string;
  display_name: string;
}