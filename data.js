/**
 * Simple JSON defining Digivolution.
 * Each Digimon knows only its direct evolutions.
 */
const DIGIMONS = {
  agumon: { name:"Agumon", stage:"Rookie", evolvesTo:["greymon","tyrannomon"], method:"High ATK" },
  gabumon: { name:"Gabumon", stage:"Rookie", evolvesTo:["garurumon"], method:"Speed + Bond" },
  greymon: { name:"Greymon", stage:"Champion", evolvesTo:[], method:"—" },
  tyrannomon: { name:"Tyrannomon", stage:"Champion", evolvesTo:[], method:"Heavy weight" },
  garurumon: { name:"Garurumon", stage:"Champion", evolvesTo:[], method:"High speed" },
  botamon: { name:"Botamon", stage:"Baby", evolvesTo:["koromon"], method:"Time" },
  punimon: { name:"Punimon", stage:"Baby", evolvesTo:["tsunomon"], method:"Time" },
  poyomon: { name:"Poyomon", stage:"Baby", evolvesTo:["tokomon"], method:"Time" },
  pupoyomonnimon: { name:"Poyomon", stage:"Baby", evolvesTo:[], method:"Time" },
  yukimiBotamon: { name:"YukimiBotamon", stage:"Baby", evolvesTo:[], method:"Time" },
  pabumon: { name:"Pabumon", stage:"Baby", evolvesTo:[], method:"Time" },
  jyarimon: { name:"Jyarimon", stage:"Baby", evolvesTo:[], method:"Time" },
  zerimon: { name:"Zerimon", stage:"Baby", evolvesTo:[], method:"Time" },
  kuramon: { name:"Kuramon", stage:"Baby", evolvesTo:[], method:"Time" },
  pichimon: { name:"Pichimon", stage:"Baby", evolvesTo:[], method:"Time" },
  yuramon: { name:"Yuramon", stage:"Baby", evolvesTo:[], method:"Time" },
  koromon: { name:"Koromon", stage:"In-Training", evolvesTo:["agumon","toyAgumon", "agumonBlack", "veemon", "shoutmon"], method:"HP + Discipline" },
  tsunomon: { name:"Tsunomon", stage:"In-Training", evolvesTo:["gabumon","gaomon", "psychemon", "gabumonBlack", "gumdramon"], method:"HP + Discipline" },
  tokomon: { name:"Tokomon", stage:"In-Training", evolvesTo:["patamon","biyomon", "tsukaimon", "hackmon", "lucemon"], method:"HP + Discipline" }
};
