// Builds data/countries-50m.json: world-atlas 2.0.2 (Natural Earth) with Western Sahara drawn as the
// UN/ISO 3166 territory (EH, 732): all of Morocco's polygon south of 27°40′N (Natural Earth places that
// line at the Algeria tripoint, 27.657°N) is moved into Western Sahara.
// Usage (one-off; the output is committed as map/countries-50m.json):
//   npm pack world-atlas@2.0.2 && tar xzf world-atlas-2.0.2.tgz
//   npm i topojson-client topojson-server polygon-clipping
//   node scripts/fix-wsahara.js package/countries-50m.json map/countries-50m.json
const fs = require("fs"), tc = require("topojson-client"), ts = require("topojson-server"), pc = require("polygon-clipping");
const [src, out] = process.argv.slice(2);
const topo = JSON.parse(fs.readFileSync(src, "utf8"));
const feats = tc.feature(topo, topo.objects.countries).features;
const ma = feats.find(f => f.id === "504"), ws = feats.find(f => f.id === "732");
// Cut latitude = Natural Earth's own tripoint vertex, so the new border meets the old ones exactly.
const tri = ws.geometry.coordinates[0].filter(p => Math.abs(p[0] + 8.685) < 0.01).reduce((a, p) => p[1] > a[1] ? p : a);
const LAT = tri[1];
const south = [[[-30, 10], [10, 10], [10, LAT], [-30, LAT], [-30, 10]]];
const north = [[[-30, LAT], [10, LAT], [10, 45], [-30, 45], [-30, LAT]]];
const coords = g => g.type === "Polygon" ? [g.coordinates] : g.coordinates;
// polygon-clipping returns counter-clockwise outer rings (RFC 7946); d3/world-atlas use clockwise.
const cw = mp => mp.map(poly => poly.map(ring => densify(ring).reverse()));
// d3 draws edges as great circles; add a point every 0.1° on the cut so it follows the parallel.
const densify = ring => ring.flatMap((p, i) => {
  const q = ring[i + 1];
  if (!q || p[1] !== LAT || q[1] !== LAT) return [p];
  const n = Math.ceil(Math.abs(q[0] - p[0]) / 0.1);
  return Array.from({ length: n }, (_, k) => [p[0] + (q[0] - p[0]) * k / n, LAT]);
});
const geom = m => { const mp = cw(m); return mp.length === 1 ? { type: "Polygon", coordinates: mp[0] } : { type: "MultiPolygon", coordinates: mp }; };
const maN = pc.intersection(coords(ma.geometry), north), maS = pc.intersection(coords(ma.geometry), south);
ma.geometry = geom(maN);
ws.geometry = geom(pc.union(coords(ws.geometry), maS));
ws.properties.name = "Western Sahara";
const fixed = ts.topology({ countries: { type: "FeatureCollection", features: feats } }, 1e5);
fs.writeFileSync(out, JSON.stringify(fixed));
console.log("cut at", LAT, "| Morocco parts", maN.length, "| Western Sahara parts", pc.union(coords(ws.geometry)).length);
