import { aquarium, AQ } from "../scenes/aquarium";
import { dining } from "../scenes/dining";
import { pan } from "./aquarium-pan";

// aquarium → dining: the belt leaves the tank through the right copper column,
// tunnels through the honey-wood post, and comes out on the dining ledge. The
// camera pans right and pushes in so the (closer) dining belt keeps its size.
export const aquariumDining = pan(aquarium, dining, {
  hand: { a: (AQ.postR[0] + AQ.postR[1]) / 2 },
  fill: "a",
  length: 0.7,
  route: "Out of the tank through the copper frame, through the honey-wood post, onto the dining-room ledge.",
});
