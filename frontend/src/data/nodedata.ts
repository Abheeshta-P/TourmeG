export type Node = {
  id: number;
  name: string;
  position: [number, number];
  type: string;
  tasks: string[];
  effort: Record<string, number>; // effort per task
};

export const mangaloreNodes: Node[] = [
  {
    id: 1,
    name: "Mangaladevi Temple",
    position: [12.849228, 74.845256],
    type: "Temple",
    tasks: [],
    effort: {},
  },
  {
    id: 2,
    name: "Sharavu Ganapati Temple",
    position: [12.870315, 74.840219],
    type: "Temple",
    tasks: [],
    effort: {},
  },
  {
    id: 3,
    name: "St. Aloysius Chapel / Museum",
    position: [12.873803, 74.845358],
    type: "Museum",
    tasks: [],
    effort: {},
  },
  {
    id: 4,
    name: "Pilikula Nisargadhama",
    position: [12.9268897, 74.9000595],
    type: "Park",
    tasks: [],
    effort: {},
  },
  {
    id: 5,
    name: "Kadri Manjunath Temple",
    position: [12.885697, 74.855523],
    type: "Temple",
    tasks: [],
    effort: {},
  },
  {
    id: 6,
    name: "Tannirbavi Beach",
    position: [12.886916, 74.815949],
    type: "Beach",
    tasks: [],
    effort: {},
  },
  {
    id: 7,
    name: "City Center / Market",
    position: [12.871261, 74.842826],
    type: "Market",
    tasks: [],
    effort: {},
  },
  {
    id: 8,
    name: "Tagore Park",
    position: [12.871544, 74.843942],
    type: "Park",
    tasks: [],
    effort: {},
  },
];
