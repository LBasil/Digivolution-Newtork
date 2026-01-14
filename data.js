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
  conomon: { name:"Conomon", stage:"Baby", evolvesTo:["kokomon"], method:"Time" },
  yukimiBotamon: { name:"YukimiBotamon", stage:"Baby", evolvesTo:["nyaromon"], method:"Time" },
  pabumon: { name:"Pabumon", stage:"Baby", evolvesTo:["motimon"], method:"Time" },
  jyarimon: { name:"Jyarimon", stage:"Baby", evolvesTo:["gigimon"], method:"Time" },
  zerimon: { name:"Zerimon", stage:"Baby", evolvesTo:["gummymon"], method:"Time" },
  kuramon: { name:"Kuramon", stage:"Baby", evolvesTo:["tsunamon"], method:"Time" },
  pichimon: { name:"Pichimon", stage:"Baby", evolvesTo:["bukamon"], method:"Time" },
  yuramon: { name:"Yuramon", stage:"Baby", evolvesTo:["tanemon"], method:"Time" },
  koromon: { name:"Koromon", stage:"In-Training", evolvesTo:["agumon","toyAgumon", "agumonBlack", "veemon", "shoutmon"], method:"HP + Discipline" },
  tsunomon: { name:"Tsunomon", stage:"In-Training", evolvesTo:["gabumon","gaomon", "psychemon", "gabumonBlack", "gumdramon"], method:"HP + Discipline" },
  tokomon: { name:"Tokomon", stage:"In-Training", evolvesTo:["patamon","biyomon", "tsukaimon", "hackmon", "lucemon"], method:"HP + Discipline" },
  motimon: { name:"Motimon", stage:"In-Training", evolvesTo:["tentomon","wormmon", "gotsumon", "hackmon", "hagurumon"], method:"HP + Discipline" },
  tanemon: { name:"Tanemon", stage:"In-Training", evolvesTo:["palmon","renamon", "aruraumon", "goblimon", "demiDevimon"], method:"HP + Discipline" },
  gigimon: { name:"Gigimon", stage:"In-Training", evolvesTo:["guilmon","goblimon", "solarmon", "gotsumon", "shoutmon"], method:"HP + Discipline" },
  gummymon: { name:"Gummymon", stage:"In-Training", evolvesTo:["terriermon","toyAgumon", "clearAgumon", "hagurumon", "gaomon"], method:"HP + Discipline" },
  kokomon: { name:"Kokomon", stage:"In-Training", evolvesTo:["lopmon","demiDevimon", "shamamon", "toyAgumonBlack", "wormmon"], method:"HP + Discipline" },
  tsunemon: { name:"Tsunemon", stage:"In-Training", evolvesTo:["keramon", "toyAgumonBlack", "agumonBlack", "gabumonBlack", "tsukaimon"], method:"Time" },
  nyaromon: { name:"Nyaromon", stage:"In-Training", evolvesTo:["salamon","snowAgumon", "renamon", "biyomon", "lucemon"], method:"HP + Discipline" },
  bukamon: { name:"Bukamon", stage:"In-Training", evolvesTo:["gomamon","veemon", "snowGoblimon", "clearAgumon", "gumdramon"], method:"HP + Discipline" }
};
