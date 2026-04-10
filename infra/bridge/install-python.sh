#!/bin/bash
# Install ALL required Piston runtimes and restore datasets

echo "=== Installing runtimes ==="

# Python 3.10.0 (already installed, will say "Already installed")
docker exec devcapsules_bridge node -e '
const langs = [
  {language: "python", version: "3.10.0"},
  {language: "javascript", version: "18.15.0"},
  {language: "java", version: "15.0.2"},
  {language: "c++", version: "10.2.0"},
  {language: "c", version: "10.2.0"},
  {language: "csharp", version: "6.12.0"},
  {language: "go", version: "1.16.2"},
];
(async () => {
  for (const pkg of langs) {
    try {
      const r = await fetch("http://piston:2000/api/v2/packages", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(pkg)
      });
      const t = await r.text();
      console.log(pkg.language, pkg.version, "=>", t);
    } catch(e) {
      console.error(pkg.language, "FAILED:", e.message);
    }
  }
})();
'

echo "=== Copying CSVs into Piston ==="
docker exec devcapsules_piston mkdir -p /piston/packages/python/3.10.0/datasets
docker cp /opt/devcapsules-repo/apps/dashboard/public/apple_global_sales_dataset.csv devcapsules_piston:/piston/packages/python/3.10.0/datasets/
docker cp /opt/devcapsules-repo/apps/dashboard/public/spotify-tracks-dataset.csv devcapsules_piston:/piston/packages/python/3.10.0/datasets/
docker exec devcapsules_piston chmod 444 /piston/packages/python/3.10.0/datasets/*.csv 2>/dev/null
docker exec devcapsules_piston chmod 555 /piston/packages/python/3.10.0/datasets

echo "=== Verify datasets ==="
docker exec devcapsules_piston ls -la /piston/packages/python/3.10.0/datasets/

echo "=== ALL INSTALLED RUNTIMES ==="
docker exec devcapsules_bridge node -e '
fetch("http://piston:2000/api/v2/runtimes")
.then(r => r.json())
.then(d => {
  d.forEach(r => console.log(r.language, r.version, "aliases:", r.aliases.join(",")));
  console.log("Total runtimes:", d.length);
})
.catch(e => console.error("ERROR:", e))
'
