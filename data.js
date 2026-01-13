/**
 * Simple JSON defining Digivolution.
 * Each Digimon knows only its direct evolutions.
 */
const DIGIMONS = {
  botamon: { name:"Botamon", stage:"Baby", evolvesTo:["koromon"], method:"Time" },
  koromon: { name:"Koromon", stage:"In-Training", evolvesTo:["agumon","gabumon"], method:"HP + Discipline" },
  agumon: { name:"Agumon", stage:"Rookie", evolvesTo:["greymon","tyrannomon"], method:"High ATK" },
  gabumon: { name:"Gabumon", stage:"Rookie", evolvesTo:["garurumon"], method:"Speed + Bond" },
  greymon: { name:"Greymon", stage:"Champion", evolvesTo:[], method:"—" },
  tyrannomon: { name:"Tyrannomon", stage:"Champion", evolvesTo:[], method:"Heavy weight" },
  garurumon: { name:"Garurumon", stage:"Champion", evolvesTo:[], method:"High speed" }
};
