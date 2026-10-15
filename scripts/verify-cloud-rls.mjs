/**
 * Milestone 14B1 — RLS verification with real authenticated clients.
 *
 * Requires the migration to be applied and two distinct user accounts.
 *
 * Usage:
 *   EXPO_PUBLIC_SUPABASE_URL=... \
 *   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=... \
 *   RLS_USER_A_EMAIL=... RLS_USER_A_PASSWORD=... \
 *   RLS_USER_B_EMAIL=... RLS_USER_B_PASSWORD=... \
 *   node scripts/verify-cloud-rls.mjs
 *
 * Does not touch local AsyncStorage expense/budget/category keys.
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const emailA = process.env.RLS_USER_A_EMAIL;
const passwordA = process.env.RLS_USER_A_PASSWORD;
const emailB = process.env.RLS_USER_B_EMAIL;
const passwordB = process.env.RLS_USER_B_PASSWORD;

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
}

requireEnv('EXPO_PUBLIC_SUPABASE_URL', url);
requireEnv('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', key);
requireEnv('RLS_USER_A_EMAIL', emailA);
requireEnv('RLS_USER_A_PASSWORD', passwordA);
requireEnv('RLS_USER_B_EMAIL', emailB);
requireEnv('RLS_USER_B_PASSWORD', passwordB);

function client() {
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

async function signIn(email, password) {
  const supabase = client();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`Sign-in failed for ${email}: ${error.message}`);
  }
  return { supabase, userId: data.user.id };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const expenseId = `rls-test-${Date.now()}`;
  const a = await signIn(emailA, passwordA);
  const b = await signIn(emailB, passwordB);

  const { error: insertError } = await a.supabase.from('expenses').insert({
    user_id: a.userId,
    id: expenseId,
    name: 'RLS test',
    category: 'Other',
    amount: 1.23,
    date: '2026-10-15',
  });
  assert(!insertError, `User A insert failed: ${insertError?.message}`);

  const { data: aRows, error: aSelectError } = await a.supabase
    .from('expenses')
    .select('id')
    .eq('id', expenseId);
  assert(!aSelectError, `User A select failed: ${aSelectError?.message}`);
  assert(aRows?.length === 1, 'User A should see their own expense');

  const { data: bRows, error: bSelectError } = await b.supabase
    .from('expenses')
    .select('id')
    .eq('id', expenseId);
  assert(!bSelectError, `User B select failed: ${bSelectError?.message}`);
  assert((bRows ?? []).length === 0, 'User B must not see User A expense');

  const { data: bUpdateRows, error: bUpdateError } = await b.supabase
    .from('expenses')
    .update({ name: 'Hacked' })
    .eq('user_id', a.userId)
    .eq('id', expenseId)
    .select('id');
  assert(!bUpdateError, `User B update should be blocked by RLS without erroring oddly: ${bUpdateError?.message}`);
  assert((bUpdateRows ?? []).length === 0, 'User B must not update User A expense');

  const { data: bDeleteRows, error: bDeleteError } = await b.supabase
    .from('expenses')
    .delete()
    .eq('user_id', a.userId)
    .eq('id', expenseId)
    .select('id');
  assert(!bDeleteError, `User B delete probe failed: ${bDeleteError?.message}`);
  assert((bDeleteRows ?? []).length === 0, 'User B must not delete User A expense');

  const { error: bInsertAsAError } = await b.supabase.from('expenses').insert({
    user_id: a.userId,
    id: `${expenseId}-stolen`,
    name: 'Stolen',
    category: 'Other',
    amount: 9.99,
    date: '2026-10-15',
  });
  assert(!!bInsertAsAError, 'User B must not insert a row owned by User A');

  const anon = client();
  const { data: anonRows, error: anonError } = await anon
    .from('expenses')
    .select('id')
    .eq('id', expenseId);
  assert((anonRows ?? []).length === 0, 'Anon must not read user expenses');
  // Anon may get an empty array or an RLS/permission error depending on grants.
  if (anonError) {
    console.log('Anon select error (expected-ish):', anonError.message);
  }

  await a.supabase.from('expenses').delete().eq('id', expenseId).eq('user_id', a.userId);

  console.log('RLS verification passed for expenses with two authenticated users + anon probe.');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
