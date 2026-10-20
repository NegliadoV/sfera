/**
 * Check Mobile App API Endpoints Compatibility
 *
 * Extracts all API calls from mobile app and checks if they exist in backend
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface APICall {
  method: string;
  path: string;
  file: string;
  line: number;
}

// Extract API calls from mobile app
function extractAPICalls(dir: string, basePath: string = ''): APICall[] {
  const calls: APICall[] = [];

  try {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const relativePath = join(basePath, entry);

      if (entry === 'node_modules' || entry.startsWith('.')) continue;

      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        calls.push(...extractAPICalls(fullPath, relativePath));
      } else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
        const content = readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          const match = line.match(/api\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/);
          if (match) {
            calls.push({
              method: match[1].toUpperCase(),
              path: match[2],
              file: relativePath,
              line: index + 1,
            });
          }
        });
      }
    }
  } catch (e) {
    // Skip directories we can't read
  }

  return calls;
}

// Check if backend endpoint exists
function checkBackendEndpoint(method: string, path: string): boolean {
  const cleanPath = path.replace(/\?.+$/, '').replace(/\/\{[^}]+\}/g, '/[id]');
  const routePath = cleanPath.replace(/^\//, '').replace(/\//g, '/');
  const expectedPath = join('app/api', routePath);

  try {
    // Check for route.ts file
    const routeFile = join(expectedPath, 'route.ts');
    return statSync(routeFile).isFile();
  } catch {
    // Try with dynamic params
    const parts = cleanPath.split('/').filter(Boolean);
    let checkPath = 'app/api';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      // Check if this part is a dynamic param
      if (part.includes(':') || part.match(/^\d+$/) || part === '[id]') {
        // Look for [param] directories
        try {
          const entries = readdirSync(checkPath);
          const dynamicDir = entries.find(e => e.startsWith('[') && e.endsWith(']'));
          if (dynamicDir) {
            checkPath = join(checkPath, dynamicDir);
            continue;
          }
        } catch {}
      }

      checkPath = join(checkPath, part);
    }

    try {
      const routeFile = join(checkPath, 'route.ts');
      return statSync(routeFile).isFile();
    } catch {
      return false;
    }
  }
}

// Main
console.log('🔍 Checking Mobile App API Endpoints Compatibility...\n');

const mobileAppPath = 'mobile.app/app';
const apiCalls = extractAPICalls(mobileAppPath);

console.log(`Found ${apiCalls.length} API calls in mobile app\n`);

// Group by endpoint
const grouped = new Map<string, APICall[]>();
apiCalls.forEach(call => {
  const key = `${call.method} ${call.path}`;
  if (!grouped.has(key)) {
    grouped.set(key, []);
  }
  grouped.get(key)!.push(call);
});

const missing: string[] = [];
const existing: string[] = [];

grouped.forEach((calls, endpoint) => {
  const [method, path] = endpoint.split(' ');
  const exists = checkBackendEndpoint(method, path);

  if (exists) {
    existing.push(endpoint);
    console.log(`✅ ${endpoint}`);
  } else {
    missing.push(endpoint);
    console.log(`❌ ${endpoint} (used in ${calls[0].file}:${calls[0].line})`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`✅ Existing: ${existing.length}`);
console.log(`❌ Missing: ${missing.length}`);

if (missing.length > 0) {
  console.log(`\n⚠️ Missing Endpoints:`);
  missing.forEach(endpoint => console.log(`  - ${endpoint}`));
}
