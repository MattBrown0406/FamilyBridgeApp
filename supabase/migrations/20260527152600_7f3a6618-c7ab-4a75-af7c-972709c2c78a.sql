
DROP POLICY IF EXISTS "Authenticated users can use realtime" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated users can broadcast" ON realtime.messages;

-- Block all client-side broadcast access. postgres_changes does not depend on
-- these policies; it uses the publication + table RLS instead. If broadcast is
-- needed in the future, add scoped policies that check topic ownership.
CREATE POLICY "Block client broadcast reads"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (false);

CREATE POLICY "Block client broadcast writes"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (false);
