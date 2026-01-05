#!/usr/bin/env node

/**
 * Strict Schema Validator
 *
 * Validates workout data files against the v2.5 JSON schema using Ajv.
 * Additionally, it enforces "no extra fields" by default by transforming
 * object subschemas with `properties` to include `additionalProperties: false`
 * unless the schema explicitly sets `additionalProperties`.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const SCHEMA_PATH = 'data/workout-plan-v2.5.schema.json';

const DEFAULT_FILES = [
  'data/workout-plan-v2.5.json',
];

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function enforceNoExtraFields(schemaNode) {
  if (Array.isArray(schemaNode)) {
    for (const item of schemaNode) enforceNoExtraFields(item);
    return;
  }

  if (!isRecord(schemaNode)) return;

  // Traverse common schema composition keywords
  const compositeKeys = [
    'allOf',
    'anyOf',
    'oneOf',
    'not',
    'if',
    'then',
    'else',
    'items',
    'prefixItems',
    'contains',
    'additionalItems',
    'propertyNames',
    'unevaluatedItems',
    'unevaluatedProperties',
  ];

  for (const key of compositeKeys) {
    if (key in schemaNode) enforceNoExtraFields(schemaNode[key]);
  }

  if ('properties' in schemaNode) {
    enforceNoExtraFields(schemaNode.properties);

    // Enforce no unknown keys by default for object schemas that declare properties.
    // Respect schemas that explicitly set additionalProperties (true or false).
    if (schemaNode.additionalProperties === undefined) {
      schemaNode.additionalProperties = false;
    } else {
      enforceNoExtraFields(schemaNode.additionalProperties);
    }
  }

  if ('patternProperties' in schemaNode) {
    enforceNoExtraFields(schemaNode.patternProperties);
    if (schemaNode.additionalProperties === undefined) {
      schemaNode.additionalProperties = false;
    }
  }

  // Traverse $defs/definitions if present
  if ('definitions' in schemaNode) {
    enforceNoExtraFields(schemaNode.definitions);
  }

  // Traverse nested schemas in additionalProperties when it's a schema object
  if ('additionalProperties' in schemaNode && isRecord(schemaNode.additionalProperties)) {
    enforceNoExtraFields(schemaNode.additionalProperties);
  }

  // Traverse dependencies/dependentSchemas (draft-07 uses dependencies)
  if ('dependencies' in schemaNode) {
    enforceNoExtraFields(schemaNode.dependencies);
  }
}

function formatAjvError(error) {
  const instancePath = error.instancePath || '(root)';
  const message = error.message ?? 'schema validation error';
  return `${instancePath}: ${message}`;
}

async function main() {
  const args = process.argv.slice(2).filter(Boolean);
  const files = args.length > 0 ? args : DEFAULT_FILES;

  const schemaFilePath = join(rootDir, SCHEMA_PATH);
  if (!existsSync(schemaFilePath)) {
    console.error(`❌ Schema not found: ${SCHEMA_PATH}`);
    process.exit(1);
  }

  const rawSchema = JSON.parse(readFileSync(schemaFilePath, 'utf8'));
  const schema = structuredClone(rawSchema);
  enforceNoExtraFields(schema);

  const ajv = new Ajv({
    allErrors: true,
    strict: true,
    strictSchema: true,
    validateSchema: true,
    allowUnionTypes: true,
  });
  addFormats(ajv);

  let validate;
  try {
    validate = ajv.compile(schema);
  } catch (err) {
    console.error('❌ Failed to compile schema:', err);
    process.exit(1);
  }

  console.log('🔍 Strict schema validation...\n');

  let hasErrors = false;

  for (const file of files) {
    const filePath = join(rootDir, file);

    if (file.endsWith('.schema.json')) {
      console.log(`⏭️  Skipping ${file} (schema file)`);
      continue;
    }

    if (!existsSync(filePath)) {
      console.log(`⏭️  Skipping ${file} (file not found)`);
      continue;
    }

    console.log(`📄 Checking ${file}...`);

    try {
      const data = JSON.parse(readFileSync(filePath, 'utf8'));
      const ok = validate(data);

      if (!ok) {
        hasErrors = true;
        const errors = validate.errors ?? [];
        console.error(`   ❌ Schema errors (${errors.length}):`);
        for (const e of errors.slice(0, 25)) {
          console.error(`      - ${formatAjvError(e)}`);
        }
        if (errors.length > 25) {
          console.error(`      ...and ${errors.length - 25} more`);
        }
      } else {
        console.log('   ✅ Valid');
      }
    } catch (err) {
      hasErrors = true;
      console.error(`   ❌ Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log('');

  if (hasErrors) {
    console.error('❌ Strict schema validation failed!\n');
    process.exit(1);
  }

  console.log('✅ Strict schema validation passed!\n');
  process.exit(0);
}

main();
