const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";

async function verifyEndpoint(name, path) {
  process.stdout.write(`⏳ Checking ${name} at ${SITE_URL}${path}... `);
  
  try {
    const res = await fetch(`${SITE_URL}${path}`);
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      console.log(`✅ PASS (${res.status})`);
      return true;
    } else {
      console.log(`❌ FAIL (${res.status})`);
      return false;
    }
  } catch (err) {
    console.log(`❌ FAIL (Connection refused)`);
    return false;
  }
}

async function run() {
  console.log("\n🚀 Starting MetroFlow AI Verification\n");
  
  const healthOk = await verifyEndpoint("API Health", "/api/health");
  const readyOk = await verifyEndpoint("Database Readiness", "/api/ready");
  
  console.log("");
  if (healthOk && readyOk) {
    console.log("🟢 All systems operational!");
    process.exit(0);
  } else {
    console.log("🔴 System check failed. Ensure the dev server is running on port 3001.");
    process.exit(1);
  }
}

run();
