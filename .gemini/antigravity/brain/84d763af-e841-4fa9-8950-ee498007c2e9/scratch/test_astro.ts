import SwissEph from "swisseph-wasm";

async function testAstro() {
  const swe = new SwissEph();
  await swe.initSwissEph();
  swe.set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);

  const date = new Date("1995-05-24T10:30:00+05:30");
  const utcYear = date.getUTCFullYear();
  const utcMonth = date.getUTCMonth() + 1;
  const utcDay = date.getUTCDate();
  const utcHour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;

  const julianDay = swe.julday(utcYear, utcMonth, utcDay, utcHour);
  const flags = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL;

  const planets = [
    { name: "Sun", id: swe.SE_SUN },
    { name: "Moon", id: swe.SE_MOON },
    { name: "Mars", id: swe.SE_MARS },
    { name: "Mercury", id: swe.SE_MERCURY },
    { name: "Jupiter", id: swe.SE_JUPITER },
    { name: "Venus", id: swe.SE_VENUS },
    { name: "Saturn", id: swe.SE_SATURN },
    { name: "Rahu", id: swe.SE_MEAN_NODE },
  ];

  const results = planets.map(p => {
    const res = swe.calc_ut(julianDay, p.id, flags);
    return { name: p.name, longitude: res[0] };
  });

  // Ketu is Rahu + 180
  const rahu = results.find(r => r.name === "Rahu")?.longitude || 0;
  results.push({ name: "Ketu", longitude: (rahu + 180) % 360 });

  console.log(JSON.stringify(results, null, 2));

  // Houses/Lagna
  // lat = 12.9716, lng = 77.5946 (Bangalore)
  const lat = 12.9716;
  const lng = 77.5946;
  const houses = swe.houses_ex(julianDay, flags, lat, lng, 'P');
  console.log("Ascendant:", houses.ascendant);

  swe.close();
}

testAstro();
