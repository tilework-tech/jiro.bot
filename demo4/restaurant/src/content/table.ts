import { html, place } from "../engine/dom";
import { TABLE } from "./copy";

// Sketch section 4: the comparison table, hung in the kitchen as an order board
// clipped to a steel ticket rail. The Jiro column is a green-edged ticket.

const MARK: Record<string, [string, string]> = {
  y: ["yes", "Yes"],
  m: ["part", "Partly"],
  n: ["no", "No"],
};

function mark(v: string, jiro: boolean) {
  const [cls, label] = MARK[v] ?? MARK.n;
  return `<td class="${jiro ? "jiro" : ""}"><i class="mk ${cls}" role="img" aria-label="${label}"></i></td>`;
}

/** [x, y, width] of the board in stage px. */
export const TABLE_BOX = [150, 150, 870] as const;

export function mountTable(el: HTMLElement, onRow?: (i: number, row: HTMLElement) => void) {
  const [x, y, w] = TABLE_BOX;
  const [jiro, ...rest] = TABLE.cols;
  const board = html(el, `
    <section class="k-board" aria-labelledby="k-board-title">
      <div class="k-rail" aria-hidden="true"><b></b><b></b><b></b><b></b></div>
      <p class="kicker">Kitchen · tonight's orders</p>
      <h2 class="px" id="k-board-title">${TABLE.title}</h2>
      <table>
        <thead><tr>
          <th scope="col" class="lbl"><span class="sr">Capability</span></th>
          <th scope="col" class="jiro"><span>${jiro}</span></th>
          ${rest.map((c) => `<th scope="col"><span>${c}</span></th>`).join("")}
        </tr></thead>
        <tbody>
          ${TABLE.rows.map(([label, ...v]) => `<tr><th scope="row">${label}</th>${v.map((m, i) => mark(m, i === 0)).join("")}</tr>`).join("")}
        </tbody>
      </table>
      <p class="fine">
        <span class="legend"><i class="mk yes"></i> yes <i class="mk part"></i> partly <i class="mk no"></i> no</span>
        <span>${TABLE.fine}</span>
      </p>
    </section>`);
  place(board, x, y, w);
  board.querySelectorAll<HTMLElement>("tbody tr").forEach((tr, i) => {
    tr.addEventListener("mouseenter", () => onRow?.(i, tr));
  });
  return board;
}
