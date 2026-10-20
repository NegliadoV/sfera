const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Extract mobile API calls
const mobileCalls = {};
const mobileDir = path.join(__dirname, 'mobile.app');

function extractMobileCalls() {
  const result = execSync(
    `grep -rh "api\\.(get|post|put|patch|delete)" mobile.app/app --include="*.tsx" --include="*.ts" | grep -v node_modules`,
    { cwd: __dirname, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
  );

  const lines = result.split('\n').filter(Boolean);
  lines.forEach(line => {
    const match = line.match(/api\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/);
    if (match) {
      const [, method, endpoint] = match;
      const cleanEndpoint = endpoint.replace(/\$\{[^}]+\}/g, ':param');
      const key = `${method.toUpperCase()} ${cleanEndpoint}`;
      if (!mobileCalls[key]) {
        mobileCalls[key] = { method: method.toUpperCase(), endpoint: cleanEndpoint, rawEndpoint: endpoint };
      }
    }
  });
}

// Extract backend routes
const backendRoutes = {};

function extractBackendRoutes() {
  const result = execSync(
    `find app/api -name "route.ts" | sed 's|app/api/||' | sed 's|/route.ts||'`,
    { cwd: __dirname, encoding: 'utf-8' }
  );

  const routes = result.split('\n').filter(Boolean);

  routes.forEach(route => {
    const routePath = path.join(__dirname, 'app/api', route, 'route.ts');
    if (fs.existsSync(routePath)) {
      const content = fs.readFileSync(routePath, 'utf-8');

      ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].forEach(method => {
        if (content.includes(`export async function ${method}`)) {
          const apiPath = '/' + route.replace(/\[([^\]]+)\]/g, ':$1');
          const key = `${method} ${apiPath}`;
          backendRoutes[key] = { method, endpoint: apiPath, file: routePath };
        }
      });
    }
  });
}

// Compare and generate report
function generateReport() {
  const report = {
    compatible: [],
    missingBackend: [],
    missingMobile: [],
    methodMismatch: []
  };

  // Check mobile calls against backend
  Object.keys(mobileCalls).forEach(callKey => {
    const call = mobileCalls[callKey];
    if (backendRoutes[callKey]) {
      report.compatible.push({ call: callKey, ...call });
    } else {
      // Check if endpoint exists but with different method
      const endpoint = call.endpoint;
      const matchingEndpoint = Object.keys(backendRoutes).find(key =>
        backendRoutes[key].endpoint === endpoint
      );
      if (matchingEndpoint) {
        report.methodMismatch.push({
          mobile: callKey,
          backend: matchingEndpoint,
          endpoint
        });
      } else {
        report.missingBackend.push({ call: callKey, ...call });
      }
    }
  });

  // Check backend routes not called by mobile
  Object.keys(backendRoutes).forEach(routeKey => {
    if (!mobileCalls[routeKey]) {
      report.missingMobile.push({ route: routeKey, ...backendRoutes[routeKey] });
    }
  });

  return report;
}

extractMobileCalls();
extractBackendRoutes();
const report = generateReport();

console.log(JSON.stringify(report, null, 2));
