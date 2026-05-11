export const NAKSHATRAS = [
  "Ashwini (Aswathy)", "Bharani (Bharani)", "Krittika (Karthika)", "Rohini (Rohini)", 
  "Mrigashira (Makayiram)", "Ardra (Thiruvathira)", "Punarvasu (Punartham)", "Pushya (Pooyam)", 
  "Ashlesha (Ayilyam)", "Magha (Makam)", "Purva Phalguni (Pooram)", "Uttara Phalguni (Uthram)", 
  "Hasta (Atham)", "Chitra (Chithira)", "Swati (Chothi)", "Vishakha (Vishakham)", 
  "Anuradha (Anizham)", "Jyeshtha (Thrikketta)", "Mula (Moolam)", "Purva Ashadha (Pooradam)", 
  "Uttara Ashadha (Uthradam)", "Shravana (Thiruvonam)", "Dhanishta (Avittam)", 
  "Shatabhisha (Chathayam)", "Purva Bhadrapada (Pooruruttathy)", "Uttara Bhadrapada (Uthruttathy)", 
  "Revati (Revathi)"
];

export const RASHIS = [
  "Mesha (Aries)", "Vrishabha (Taurus)", "Mithuna (Gemini)", "Karka (Cancer)",
  "Simha (Leo)", "Kanya (Virgo)", "Tula (Libra)", "Vrischika (Scorpio)",
  "Dhanu (Sagittarius)", "Makara (Capricorn)", "Kumbha (Aquarius)", "Meena (Pisces)"
];

export const getNakshatraInfo = (moonLongitude: number) => {
  // Each Nakshatra is 13 degrees 20 minutes (13.3333 degrees)
  const nakshatraIndex = Math.floor(moonLongitude / (13 + 20/60));
  const remainder = moonLongitude % (13 + 20/60);
  // Each Pada is 3 degrees 20 minutes (3.3333 degrees)
  const pada = Math.floor(remainder / (3 + 20/60)) + 1;
  
  return {
    name: NAKSHATRAS[nakshatraIndex],
    index: nakshatraIndex,
    pada: Math.min(pada, 4)
  };
};
