#!/usr/bin/env node

/**
 * Pre-build Android validation script.
 *
 * Scans node_modules for Google Play Services dependencies and cross-checks
 * them against android/app/proguard-rules.pro keep rules.
 *
 * Exit 0 = OK, Exit 1 = missing ProGuard rules (would crash at runtime).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const NODE_MODULES = path.join(ROOT, 'node_modules');
const PROGUARD_FILE = path.join(ROOT, 'android', 'app', 'proguard-rules.pro');

// Maps play-services artifact to the Java package ProGuard must keep.
const ARTIFACT_TO_PACKAGE = {
  'play-services-location': 'com.google.android.gms.location',
  'play-services-maps': 'com.google.android.gms.maps',
  'play-services-base': 'com.google.android.gms.common',
  'play-services-basement': 'com.google.android.gms.common',
  'play-services-tasks': 'com.google.android.gms.tasks',
  'play-services-auth': 'com.google.android.gms.auth',
  'play-services-identity': 'com.google.android.gms.auth.api.identity',
  'play-services-places': 'com.google.android.gms.location.places',
};

// ── Colour helpers (no-op when piped) ────────────────────────────────
const isTTY = process.stdout.isTTY;
const red = (s) => (isTTY ? `\x1b[31m${s}\x1b[0m` : s);
const green = (s) => (isTTY ? `\x1b[32m${s}\x1b[0m` : s);
const yellow = (s) => (isTTY ? `\x1b[33m${s}\x1b[0m` : s);
const bold = (s) => (isTTY ? `\x1b[1m${s}\x1b[0m` : s);

// ── 1. Find play-services deps in node_modules ──────────────────────
function findPlayServicesDeps() {
  const deps = []; // { pkg, artifact, version, source }
  let entries;
  try {
    entries = fs.readdirSync(NODE_MODULES, { withFileTypes: true });
  } catch {
    return deps;
  }

  // Handle scoped (@foo/bar) and unscoped packages
  const dirs = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('@')) {
      const scopePath = path.join(NODE_MODULES, entry.name);
      try {
        for (const inner of fs.readdirSync(scopePath, { withFileTypes: true })) {
          if (inner.isDirectory()) {
            dirs.push(path.join(entry.name, inner.name));
          }
        }
      } catch { /* skip */ }
    } else {
      dirs.push(entry.name);
    }
  }

  for (const pkgName of dirs) {
    const gradlePath = path.join(NODE_MODULES, pkgName, 'android', 'build.gradle');
    if (!fs.existsSync(gradlePath)) continue;

    let content;
    try {
      content = fs.readFileSync(gradlePath, 'utf8');
    } catch { continue; }

    // Match both single- and double-quoted dependency declarations.
    // Double-quoted strings may contain ${safeExtGet('prop', 'fallback')},
    // so we need separate patterns to avoid stopping at nested quotes.
    const patterns = [
      /(?:implementation|api)\s+"com\.google\.android\.gms:(play-services-[\w-]+):([^"]+)"/g,
      /(?:implementation|api)\s+'com\.google\.android\.gms:(play-services-[\w-]+):([^']+)'/g,
    ];

    for (const regex of patterns) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        let version = match[2];

        // Resolve safeExtGet('prop', 'fallback') → use the fallback value
        const extGetMatch = version.match(
          /\$\{safeExtGet\(\s*'[^']*'\s*,\s*'([^']*)'\s*\)\}/
        );
        if (extGetMatch) {
          version = extGetMatch[1];
        }

        deps.push({
          pkg: pkgName,
          artifact: match[1],
          version,
          source: gradlePath,
        });
      }
    }
  }
  return deps;
}

// ── 2. Parse ProGuard keep rules ─────────────────────────────────────
function parseProguardKeepRules() {
  if (!fs.existsSync(PROGUARD_FILE)) {
    console.error(red(`ERROR: ProGuard file not found at ${PROGUARD_FILE}`));
    process.exit(1);
  }
  const content = fs.readFileSync(PROGUARD_FILE, 'utf8');

  // Strip comment lines before matching, so commented-out rules are ignored
  const activeLines = content
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('#'))
    .join('\n');

  // Collect all -keep rules that reference com.google.android.gms
  const kept = new Set();
  const keepRegex =
    /-keep\s+(?:class|interface)\s+(com\.google\.android\.gms\.[.\w*]+)/g;
  let m;
  while ((m = keepRegex.exec(activeLines)) !== null) {
    // Normalise wildcard: "com.google.android.gms.location.**" → "com.google.android.gms.location"
    kept.add(m[1].replace(/\.\*\*$/, '').replace(/\.\*$/, ''));
  }
  return kept;
}

// ── 3. Check ProGuard coverage ───────────────────────────────────────
function checkCoverage(deps, keptPackages) {
  const missing = []; // { artifact, expectedPackage, pkg }

  for (const dep of deps) {
    const expectedPackage = ARTIFACT_TO_PACKAGE[dep.artifact];
    if (!expectedPackage) continue; // unmapped artifact — skip

    if (!keptPackages.has(expectedPackage)) {
      missing.push({
        artifact: dep.artifact,
        expectedPackage,
        pkg: dep.pkg,
      });
    }
  }

  // Deduplicate by artifact
  const seen = new Set();
  return missing.filter((m) => {
    if (seen.has(m.artifact)) return false;
    seen.add(m.artifact);
    return true;
  });
}

// ── 4. Detect version conflicts ──────────────────────────────────────
function checkVersionConflicts(deps) {
  const byArtifact = {};
  for (const dep of deps) {
    if (!byArtifact[dep.artifact]) byArtifact[dep.artifact] = [];
    byArtifact[dep.artifact].push(dep);
  }

  const conflicts = [];
  for (const [artifact, entries] of Object.entries(byArtifact)) {
    const versions = [...new Set(entries.map((e) => e.version))];
    if (versions.length > 1) {
      const majors = versions.map((v) => v.split('.')[0]);
      const hasMajorConflict = new Set(majors).size > 1;
      conflicts.push({ artifact, entries, hasMajorConflict });
    }
  }
  return conflicts;
}

// ── Main ─────────────────────────────────────────────────────────────
function main() {
  console.log(bold('\n🔍 Android Pre-Build Validation\n'));

  // Step 1: find deps
  const deps = findPlayServicesDeps();
  if (deps.length === 0) {
    console.log(green('  No Google Play Services dependencies found — nothing to validate.\n'));
    process.exit(0);
  }

  console.log(`  Found ${deps.length} Play Services dependency reference(s):\n`);
  for (const d of deps) {
    console.log(`    ${d.artifact}:${d.version}  (from ${d.pkg})`);
  }
  console.log();

  // Step 2: parse ProGuard
  const keptPackages = parseProguardKeepRules();

  // Step 3: coverage check
  const missing = checkCoverage(deps, keptPackages);

  // Step 4: version conflicts
  const conflicts = checkVersionConflicts(deps);

  let hasError = false;

  if (missing.length > 0) {
    hasError = true;
    console.log(red(bold('  ✗ Missing ProGuard keep rules (will cause runtime crash):\n')));
    for (const m of missing) {
      console.log(red(`    • ${m.artifact} (required by ${m.pkg})`));
      console.log(
        `      Add to ${path.relative(ROOT, PROGUARD_FILE)}:`
      );
      console.log(yellow(`        -keep class ${m.expectedPackage}.** { *; }`));
      console.log(yellow(`        -keep interface ${m.expectedPackage}.** { *; }\n`));
    }
  }

  if (conflicts.length > 0) {
    console.log(yellow(bold('  ⚠ Version mismatches detected:\n')));
    for (const c of conflicts) {
      const severity = c.hasMajorConflict ? red('MAJOR') : yellow('minor');
      console.log(yellow(`    • ${c.artifact} [${severity}]`));
      for (const e of c.entries) {
        console.log(`        ${e.version}  (from ${e.pkg})`);
      }
      console.log();
    }
  }

  if (!hasError && conflicts.length === 0) {
    console.log(green('  ✓ All Play Services dependencies have matching ProGuard rules.'));
    console.log(green('  ✓ No version conflicts detected.\n'));
  } else if (!hasError) {
    console.log(green('  ✓ All Play Services dependencies have matching ProGuard rules.\n'));
  }

  process.exit(hasError ? 1 : 0);
}

main();
