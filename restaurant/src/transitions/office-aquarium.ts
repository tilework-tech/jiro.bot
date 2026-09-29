import { office } from "../scenes/office";
import { aquarium, AQ } from "../scenes/aquarium";
import { pan } from "./aquarium-pan";

// office → aquarium: a short side-scrolling pan. The belt leaves the office on
// the right, crosses a sliver of dark wall, and tunnels through the tank's left
// copper column into the glass tube along the gravel.
export const officeAquarium = pan(office, aquarium, {
  hand: { b: (AQ.frameL[0] + AQ.frameL[1]) / 2 },
  fill: "b",
  length: 0.7,
  route: "Out of the office's right wall and through the aquarium's copper frame into a glass tube across the tank.",
});
