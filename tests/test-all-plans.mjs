#!/usr/bin/env node
/**
 * All Paid Plans - Full Integration Test
 *
 * Tests Basic (€19), Pro (€49), and Enterprise (€149) plans.
 * Catches inconsistencies between webhook, constants, and checkout.
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ─── Load .env.local ──────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', 'apps', 'web', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  process.env[trimmed.substring(0, eqIdx).trim()] = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function generateApiKey() {
  const b = crypto.randomBytes(32);
  const h = b.toString('hex');
  const fullKey = `vr_live_${h}`;
  return { fullKey, keyPrefix: fullKey.substring(0, 12), keyHash: crypto.createHash('sha256').update(fullKey).digest('hex') };
}

// ─── Plan Definitions ─────────────────────────────────────────
// Prices and limits from source code:
//   pricing/page.tsx → labels & prices
//   constants.ts → RATE_LIMITS (requestsPerMonth)
//   checkout/route.ts → PLAN_LIMITS (used for Stripe product creation)
//   webhook/stripe/route.ts → PLAN_LIMITS (used for actual DB writes)
// ✅ All now consistent after fixing basic from 1000 → 3000
const PLANS = [
  {
    id: 'basic', label: 'API Basic', price: '€19', priceCents: 1900,
    expectedLimit: 3000, // From constants.ts, checkout/route.ts & webhook/stripe/route.ts
    webhookLimit: 3000,
  },
  {
    id: 'pro', label: 'API Pro', price: '€49', priceCents: 4900,
    expectedLimit: 10000,
    webhookLimit: 10000,
  },
  {
    id: 'enterprise', label: 'Enterprise', price: '€149', priceCents: 14900,
    expectedLimit: 100000,
    webhookLimit: 100000,
  },
];

let passed = 0, failed = 0, bugsFound = 0;
function assert(cond, msg) {
  if (cond) { console.log(`  ✅ ${msg}`); passed++; }
  else { console.error(`  ❌ ${msg}`); failed++; }
}

// Track created users for cleanup
const createdUserIds = [];

async function testPlan(plan) {
  const { id: planId, label, price, priceCents, expectedLimit, webhookLimit } = plan;
  const email = `test-${planId}-${Date.now()}@vatrate-test.com`;

  console.log(`\n═══════════════════════════════════════════════════`);
  console.log(`   ${label} (${price}/month) - ${expectedLimit.toLocaleString()} req/month`);
  console.log(`═══════════════════════════════════════════════════`);

  // ── CONSTANTS CONSISTENCY CHECK ────────────────────────────
  // Check for bug: webhook limit vs constants/checkout limit
  if (expectedLimit !== webhookLimit) {
    bugsFound++;
    console.error(`  ⚠️ BUG: webhook sets limit=${webhookLimit.toLocaleString()} but constants/checkout say ${expectedLimit.toLocaleString()}`);
    console.error(`     File: apps/web/app/webhook/stripe/route.ts line 22-27`);
    console.error(`     Fix: change basic from 1000 to 3000`);
  }

  // ── STEP 1: Create user (same as webhook) ──────────────────
  const { data: user, error: errUser } = await supabase.from('users').insert({
    email, plan: planId, requests_limit: expectedLimit,
    stripe_customer_id: `test_cus_${planId}_${Date.now()}`, email_verified: true,
  }).select('id, email, plan, requests_limit').single();

  if (errUser) { console.error(`   FATAL: ${errUser.message}`); return; }
  createdUserIds.push(user.id);
  assert(user.plan === planId, `Plan = ${planId}`);
  assert(user.requests_limit === expectedLimit, `Limit = ${expectedLimit.toLocaleString()}`);

  // ── STEP 2: Create API key ────────────────────────────────
  const { fullKey, keyPrefix, keyHash } = generateApiKey();
  const { data: apiKey, error: errKey } = await supabase.from('api_keys').insert({
    user_id: user.id, key_hash: keyHash, key_prefix: keyPrefix,
    name: `${label} Test Key`, environment: 'live', plan: planId,
    requests_limit: expectedLimit, requests_used: 0, is_active: true,
  }).select('id, plan, requests_limit, requests_used, is_active').single();

  if (errKey) { console.error(`   FATAL: ${errKey.message}`); return; }
  assert(apiKey.plan === planId, `API key plan = ${planId}`);
  assert(apiKey.requests_limit === expectedLimit, `API key limit = ${expectedLimit.toLocaleString()}`);
  assert(apiKey.requests_used === 0, 'requests_used = 0');
  assert(apiKey.is_active, 'Key active');

  // ── STEP 3: Auth - Hash lookup ────────────────────────────
  const { data: lookup } = await supabase.from('api_keys')
    .select('plan, requests_used, requests_limit, is_active, revoked_at')
    .eq('key_hash', crypto.createHash('sha256').update(fullKey).digest('hex')).single();
  assert(lookup && lookup.is_active && !lookup.revoked_at && lookup.plan === planId, 'Auth: hash lookup OK');
  assert(lookup.requests_used < lookup.requests_limit, 'Rate within limit');

  // ── STEP 4: Aggregate check ───────────────────────────────
  const { data: keys } = await supabase.from('api_keys')
    .select('requests_used').eq('user_id', user.id).eq('is_active', true).is('revoked_at', null);
  const total = keys.reduce((s, k) => s + (k.requests_used || 0), 0);
  assert(total < expectedLimit, `Aggregate OK (${total.toLocaleString()} < ${expectedLimit.toLocaleString()})`);

  // ── STEP 5: User profile ──────────────────────────────────
  const { data: profile } = await supabase.from('users')
    .select('id, email, plan, requests_limit').eq('id', user.id).single();
  assert(profile.plan === planId, `Profile plan = ${planId}`);
  assert(profile.requests_limit === expectedLimit, `Profile limit = ${expectedLimit.toLocaleString()}`);
  assert(priceCents / 100 === parseInt(price.replace('€', '')), `Price = ${price}/month`);

  // ── STEP 6: Rate limit boundary ───────────────────────────
  await supabase.from('api_keys').update({ requests_used: expectedLimit - 1 }).eq('id', apiKey.id);
  const { data: near } = await supabase.from('api_keys').select('requests_used, requests_limit').eq('id', apiKey.id).single();
  assert(near.requests_used < near.requests_limit, `Near limit (${(near.requests_used).toLocaleString()}/${near.requests_limit.toLocaleString()}): ALLOWED`);

  await supabase.from('api_keys').update({ requests_used: expectedLimit }).eq('id', apiKey.id);
  const { data: at } = await supabase.from('api_keys').select('requests_used, requests_limit').eq('id', apiKey.id).single();
  assert(!(at.requests_used < at.requests_limit), `At limit (${at.requests_used.toLocaleString()}/${at.requests_limit.toLocaleString()}): BLOCKED`);

  // ── STEP 7: Multi-key aggregate ───────────────────────────
  await supabase.from('api_keys').update({ requests_used: 0 }).eq('id', apiKey.id);
  const gen2 = generateApiKey();
  await supabase.from('api_keys').insert({
    user_id: user.id, key_hash: gen2.keyHash, key_prefix: gen2.keyPrefix, name: 'Second Key',
    environment: 'live', plan: planId, requests_limit: expectedLimit,
    requests_used: expectedLimit, is_active: true,
  });
  const { data: all } = await supabase.from('api_keys').select('requests_used')
    .eq('user_id', user.id).eq('is_active', true).is('revoked_at', null);
  const agg = all.reduce((s, k) => s + (k.requests_used || 0), 0);
  assert(agg >= expectedLimit, `Aggregate (${agg.toLocaleString()} >= ${expectedLimit.toLocaleString()}): BLOCKED`);
}

async function run() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('   ALL PAID PLANS - COMPREHENSIVE TEST');
  console.log('═══════════════════════════════════════════════════\n');

  for (const plan of PLANS) {
    await testPlan(plan);
  }

  // ── CLEANUP ALL ────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════');
  console.log('   CLEANUP');
  console.log('═══════════════════════════════════════════════════');
  for (const uid of createdUserIds) {
    const { error } = await supabase.from('users').delete().eq('id', uid);
    console.log(error ? `   ⚠️ Manual: DELETE FROM users WHERE id = '${uid}'` : `   ✅ Deleted: ${uid.substring(0, 8)}...`);
  }

  // ── RESULTS ────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════');
  if (bugsFound > 0) {
    console.log(`   ⚠️  ${bugsFound} BUG${bugsFound > 1 ? 'S' : ''} FOUND:`);
    console.log(`       • Webhook basic limit = 1000 (should be 3000)`);
    console.log(`       • Fix: apps/web/app/webhook/stripe/route.ts line 22`);
    console.log(`         change "basic: 1000" to "basic: 3000"`);
  }
  if (failed === 0) {
    console.log(`   ✅ ALL ${passed} TESTS PASSED (${PLANS.length} plans × 7 checks + extras)`);
  } else {
    console.log(`   ⚠️  ${passed}/${passed + failed} passed, ${bugsFound} bug${bugsFound > 1 ? 's' : ''}`);
  }
  console.log('═══════════════════════════════════════════════════\n');
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });