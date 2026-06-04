#!/usr/bin/env node

/**
 * Validate vat-rates.json against the JSON Schema.
 * Usage: node validate.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..');

async function validate() {
  console.log('🔍 Validating VAT rates data...\n');

  // Read the data
  const dataPath = resolve(DATA_DIR, 'vat-rates.json');
  const schemaPath = resolve(DATA_DIR, 'vat-rates.schema.json');

  let data;
  try {
    data = JSON.parse(readFileSync(dataPath, 'utf-8'));
    console.log(`✅ vat-rates.json loaded (${Object.keys(data.countries).length} countries)`);
  } catch (e) {
    console.error(`❌ Failed to parse vat-rates.json: ${e.message}`);
    process.exit(1);
  }

  // Validate schema version
  if (data.schema_version !== '1.0.0') {
    console.warn(`⚠️  Schema version mismatch: expected 1.0.0, got ${data.schema_version}`);
  }

  // Validate required fields per country
  const requiredCountryFields = ['name', 'code', 'currency', 'vat', 'digital_services', 'saas', 'valid_from', 'last_change'];
  const requiredVatFields = ['standard', 'reduced', 'super_reduced', 'parking', 'zero'];
  const requiredProductFields = ['classification', 'b2b', 'b2c'];

  let errors = 0;
  let warnings = 0;

  for (const [code, country] of Object.entries(data.countries)) {
    const c = country;

    // Check required fields
    for (const field of requiredCountryFields) {
      if (c[field] === undefined || c[field] === null) {
        console.error(`❌ [${code}] Missing required field: ${field}`);
        errors++;
      }
    }

    // Check VAT fields
    if (c.vat) {
      for (const field of requiredVatFields) {
        if (c.vat[field] === undefined) {
          console.error(`❌ [${code}] vat.${field} is required`);
          errors++;
        }
      }
    }

    // Check product entries
    for (const productType of ['digital_services', 'saas', 'ebooks', 'online_courses']) {
      const entry = c[productType];
      if (entry) {
        for (const field of requiredProductFields) {
          if (entry[field] === undefined) {
            console.error(`❌ [${code}] ${productType}.${field} is required`);
            errors++;
          }
        }
        // Validate B2B/B2C rates
        if (entry.b2b && typeof entry.b2b.rate !== 'number') {
          console.error(`❌ [${code}] ${productType}.b2b.rate must be a number`);
          errors++;
        }
        if (entry.b2c && typeof entry.b2c.rate !== 'number') {
          console.error(`❌ [${code}] ${productType}.b2c.rate must be a number`);
          errors++;
        }
      }
    }

    // Warn about missing optional product types
    if (!c.ebooks) {
      console.warn(`⚠️  [${code}] Missing ebooks entry (optional)`);
      warnings++;
    }
    if (!c.online_courses) {
      console.warn(`⚠️  [${code}] Missing online_courses entry (optional)`);
      warnings++;
    }
  }

  console.log('\n');
  if (errors > 0) {
    console.log(`❌ Validation failed: ${errors} errors, ${warnings} warnings`);
    process.exit(1);
  } else {
    console.log(`✅ Validation passed: 0 errors, ${warnings} warnings`);
  }
}

validate().catch(console.error);
