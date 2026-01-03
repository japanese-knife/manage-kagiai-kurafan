/*
  # Enable Realtime for Tasks Table

  1. Changes
    - Enable realtime replication for tasks table
    - Grant SELECT permission to authenticated and anon users for realtime functionality
  
  2. Security
    - Realtime subscriptions respect existing RLS policies
    - No changes to existing security model
*/

-- Enable realtime for the tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;