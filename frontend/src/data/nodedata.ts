export type Node = {
  id: number;
  name: string;
  position: [number, number];
  type: string;
  tasks: string[];
  nodeDifficulty: number;
  effort: Record<string, number>; // effort per task
};


export const mangaloreNodes: Node[] = [
  {
    id: 1,
    name: "Mangaladevi Temple",
    position: [12.849436144027004, 74.8454846297991],
    type: "Temple",
    tasks: [],
    nodeDifficulty: 0,
    effort: {},
  },
  {
    id: 2,
    name: "Sharavu Ganapati Temple",
    position: [12.870676310217375, 74.84090241045409],
    type: "Temple",
    tasks: [],
    nodeDifficulty: 0,
    effort: {},
  },
  {
    id: 3,
    name: "St. Aloysius Chapel / Museum",
    position: [12.873873510598308, 74.84484162421218],
    type: "Museum",
    tasks: [],
    nodeDifficulty: 0,
    effort: {},
  },
  {
    id: 4,
    name: "Pilikula Nisargadhama",
    position: [12.927664565161715, 74.89951726627557],
    type: "Park",
    tasks: [],
    nodeDifficulty: 0,
    effort: {},
  },
  {
    id: 5,
    name: "Kadri Manjunath Temple",
    position: [12.885963236241937, 74.85569386812627],
    type: "Temple",
    tasks: [],
    nodeDifficulty: 0,
    effort: {},
  },
  {
    id: 6,
    name: "Tannirbavi Beach",
    position: [12.887369353235473, 74.8130157152398],
    type: "Beach",
    tasks: [],
    nodeDifficulty: 0,
    effort: {},
  },
  {
    id: 7,
    name: "City Center / Market",
    position: [12.872105104628101, 74.84299596416035],
    type: "Market",
    tasks: [],
    nodeDifficulty: 0,
    effort: {},
  },
  {
    id: 8,
    name: "Tagore Park",
    position: [12.87188424976982, 74.84425362791521],
    type: "Park",
    tasks: [],
    nodeDifficulty: 0,
    effort: {},
  },
  {
    id: 9,
    name: "Sultan Battery",
    position: [12.890702112387688, 74.8208207512087],
    type: "Historic",
    tasks: [],
    nodeDifficulty: 0,
    effort: {},
  },
  {
    id: 10,
    name: "Kudroli Gokarnath Temple",
    position: [12.876278548787308, 74.83133376172098],
    type: "Temple",
    tasks: [],
    nodeDifficulty: 0,
    effort: {},
  },
];

