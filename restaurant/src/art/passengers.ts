import { P, Pixels, canvas } from "./pixels";

/** Original 24 × 24 sprites. Common outline, clustered highlights, no JPEG cutouts. */
export function passengerCanvas(name: string) {
  const c = canvas(24, 24),
    p = new Pixels(c.getContext("2d")!);
  const rice = (top = P.salmon) => {
    p.oval(12, 18, 10, 4, P.ink);
    p.oval(12, 17, 9, 4, P.sand);
    p.oval(11, 16, 8, 3, P.white);
    p.r(6, 17, 2, 1, P.cream);
    p.r(11, 19, 2, 1, P.cream);
    p.r(16, 17, 2, 1, P.cream);
    p.oval(12, 13, 10, 3, P.ink);
    p.oval(12, 12, 9, 3, top);
  };
  const stripe = () => {
    for (let i = 0; i < 4; i++) p.line(5 + i * 4, 11, 7 + i * 4, 14, P.cream);
  };
  const roll = (x = 12, y = 15) => {
    p.oval(x, y + 2, 7, 5, P.ink);
    p.r(x - 6, y - 1, 13, 5, P.moss0);
    p.oval(x, y, 7, 4, P.moss1);
    p.oval(x, y - 1, 6, 3, P.white);
    p.oval(x, y - 1, 3, 2, P.salmon);
    p.dot(x - 2, y - 2, P.moss2);
    p.dot(x + 2, y - 1, P.gold);
  };
  const eyes = (x = 9, y = 12) => {
    p.r(x, y, 2, 2, P.ink);
    p.r(x + 6, y, 2, 2, P.ink);
  };
  const face = (color = P.cream) => {
    p.oval(12, 12, 8, 7, P.ink);
    p.oval(12, 11, 7, 6, color);
    eyes(8, 10);
    p.dot(12, 13, P.red0);
  };
  const ears = (color = P.copper) => {
    p.poly(
      [
        [5, 8],
        [5, 2],
        [10, 7],
      ],
      P.ink,
    );
    p.poly(
      [
        [14, 7],
        [19, 2],
        [20, 9],
      ],
      P.ink,
    );
    p.poly(
      [
        [6, 7],
        [6, 4],
        [9, 7],
      ],
      color,
    );
    p.poly(
      [
        [16, 7],
        [18, 4],
        [19, 8],
      ],
      color,
    );
  };
  if (["tuna", "salmon", "tamago", "ebi", "gold"].includes(name)) {
    rice(
      name === "tuna"
        ? P.red
        : name === "tamago" || name === "gold"
          ? P.gold
          : P.salmon,
    );
    if (name === "salmon" || name === "ebi") stripe();
    if (name === "tuna") {
      p.r(5, 11, 12, 1, P.salmon);
      p.r(8, 10, 8, 1, P.pink);
    }
    if (name === "tamago") {
      p.r(11, 10, 3, 8, P.moss0);
      p.r(4, 11, 5, 1, P.light);
    }
    if (name === "ebi") {
      p.poly(
        [
          [18, 11],
          [23, 5],
          [23, 12],
        ],
        P.red,
      );
      p.r(5, 12, 3, 2, P.cream);
    }
  } else if (name === "maki" || name === "ikura") {
    if (name === "maki") {
      roll(7, 14);
      roll(17, 17);
    } else {
      roll();
      p.oval(12, 13, 6, 3, P.red0);
      for (let i = 0; i < 7; i++) {
        p.oval(7 + (i % 4) * 3, 11 + Math.floor(i / 4) * 3, 1, 1, P.salmon);
        p.dot(7 + (i % 4) * 3, 10 + Math.floor(i / 4) * 3, P.gold);
      }
    }
  } else if (name.startsWith("onigiri") || name === "corgi") {
    p.poly(
      [
        [2, 20],
        [3, 13],
        [10, 4],
        [14, 4],
        [21, 13],
        [22, 20],
      ],
      P.ink,
    );
    p.poly(
      [
        [4, 19],
        [5, 13],
        [11, 6],
        [13, 6],
        [19, 13],
        [20, 19],
      ],
      P.white,
    );
    p.r(9, 15, 7, 6, P.moss0);
    if (name === "corgi") {
      ears();
      p.r(4, 11, 5, 6, P.copper);
      p.r(17, 11, 4, 6, P.copper);
    }
    eyes(7, 12);
    if (name.endsWith("angry")) {
      p.line(6, 10, 9, 11, P.ink);
      p.line(14, 11, 17, 10, P.ink);
    } else if (name.endsWith("sleepy")) {
      p.r(7, 12, 2, 2, P.white);
      p.r(15, 12, 2, 2, P.white);
      p.r(7, 13, 2, 1, P.ink);
      p.r(15, 13, 2, 1, P.ink);
    } else p.r(11, 14, 2, 1, P.red);
  } else if (["cup-tea", "cup-matcha", "bowl-miso", "ramen"].includes(name)) {
    const cup = name.startsWith("cup");
    p.oval(12, 19, cup ? 5 : 9, 3, P.ink);
    p.r(cup ? 7 : 3, 11, cup ? 10 : 18, 8, P.sand);
    p.oval(12, 12, cup ? 5 : 9, 3, P.cream);
    p.oval(12, 12, cup ? 4 : 7, 2, cup ? P.moss2 : P.wood2);
    p.r(cup ? 8 : 4, 14, 2, 4, P.white);
    if (name === "ramen") {
      for (let i = 0; i < 4; i++) p.line(7 + i * 3, 11, 9 + i * 2, 14, P.gold);
      p.oval(16, 11, 2, 2, P.white);
      p.dot(16, 11, P.gold);
    }
    if (name === "bowl-miso") {
      p.r(8, 11, 3, 2, P.cream);
      p.r(14, 12, 2, 1, P.moss1);
    }
    p.r(10, 4, 1, 3, P.mist);
    p.r(12, 2, 1, 2, P.slate);
  } else if (["fortune", "lgtm"].includes(name)) {
    p.oval(12, 15, 9, 6, P.ink);
    p.oval(12, 14, 8, 5, P.gold);
    p.line(5, 12, 12, 17, P.copper);
    p.line(12, 17, 19, 12, P.copper);
    p.r(13, 16, 10, 3, P.cream);
    p.r(16, 17, 5, 1, P.wood2);
  } else if (["scout-nigiri", "wizard-maki", "sleepwalker"].includes(name)) {
    if (name === "wizard-maki") {
      roll();
      p.poly(
        [
          [4, 10],
          [11, 0],
          [17, 10],
        ],
        P.ink,
      );
      p.poly(
        [
          [6, 9],
          [11, 2],
          [15, 9],
        ],
        P.plum,
      );
      p.dot(11, 5, P.gold);
      p.r(3, 10, 15, 2, P.purple);
    } else {
      rice();
      stripe();
      if (name === "scout-nigiri") {
        p.r(7, 6, 11, 2, P.cream);
        p.r(16, 4, 2, 5, P.red);
        p.r(18, 3, 3, 1, P.red);
      } else {
        p.r(7, 5, 11, 3, P.blue);
        p.poly(
          [
            [16, 5],
            [22, 8],
            [16, 8],
          ],
          P.blue,
        );
        p.dot(22, 8, P.white);
      }
    }
    p.r(6, 13, 5, 5, P.white);
    p.r(13, 13, 5, 5, P.white);
    eyes(8, 15);
    p.line(5, 18, 2, 15, P.copper);
    p.line(19, 18, 22, 14, P.copper);
  } else if (name === "mini-jiro") {
    p.r(6, 15, 13, 7, P.navy);
    p.r(5, 16, 3, 4, P.cream);
    p.r(17, 16, 3, 4, P.cream);
    p.oval(12, 9, 9, 8, P.ink);
    p.oval(12, 8, 8, 7, P.copper);
    p.r(5, 8, 14, 6, P.cream);
    p.r(4, 5, 16, 2, P.white);
    p.r(7, 9, 3, 2, P.cyan);
    p.r(14, 9, 3, 2, P.cyan);
    p.r(9, 12, 6, 2, P.wood0);
    p.dot(10, 12, P.mist);
    p.dot(13, 12, P.mist);
  } else if (["duck", "lifeguard", "goose"].includes(name)) {
    rice();
    p.oval(12, 13, 7, 5, name === "goose" ? P.white : P.gold);
    p.oval(15, 7, 4, 4, name === "goose" ? P.white : P.gold);
    p.r(18, 8, 5, 2, P.salmon);
    p.dot(16, 6, P.ink);
    p.line(7, 12, 12, 14, P.copper);
    if (name === "lifeguard") p.r(10, 3, 9, 2, P.red);
  } else if (
    [
      "cat",
      "lucky-cat",
      "cat-maki",
      "cat-nap",
      "raccoon",
      "corgi",
      "sloth",
      "hamster",
      "otter",
      "sumo-penguin",
      "sumo",
    ].includes(name)
  ) {
    roll();
    const color =
      name === "sumo-penguin"
        ? P.deep
        : name === "raccoon"
          ? P.mist
          : name === "sloth"
            ? P.wood2
            : name === "otter"
              ? P.wood3
              : P.copper;
    face(color);
    ears(color);
    if (name === "raccoon") {
      p.r(6, 9, 13, 3, P.ink);
      p.dot(8, 10, P.white);
      p.dot(16, 10, P.white);
    }
    if (name === "sumo-penguin") {
      p.oval(12, 14, 5, 5, P.white);
      p.r(10, 11, 4, 2, P.gold);
    }
    if (name === "cat-nap") {
      p.r(7, 9, 11, 4, P.copper);
      p.r(7, 11, 3, 1, P.ink);
      p.r(15, 11, 3, 1, P.ink);
    }
    if (name === "lucky-cat") p.r(20, 6, 3, 9, P.cream);
    if (name === "cat-maki") {
      p.oval(12, 4, 4, 3, P.sand);
      p.dot(10, 3, P.ink);
      p.dot(14, 3, P.ink);
    }
  } else if (
    ["octopus", "octo-dj", "crab", "hermit", "lobster"].includes(name)
  ) {
    roll();
    for (let i = 0; i < 4; i++) {
      p.line(6 + i * 4, 14, 3 + i * 6, 20, P.red, 2);
      p.dot(3 + i * 6, 21, P.salmon);
    }
    face(P.red);
    if (name === "crab" || name === "lobster") {
      p.oval(2, 7, 2, 3, P.salmon);
      p.oval(21, 7, 2, 3, P.salmon);
    }
    if (name === "octo-dj") {
      p.r(4, 6, 2, 7, P.ink);
      p.r(18, 6, 2, 7, P.ink);
      p.r(5, 4, 14, 2, P.ink);
      p.r(4, 20, 17, 2, P.slate);
      p.oval(8, 20, 3, 1, P.ink);
      p.oval(16, 20, 3, 1, P.ink);
    }
  } else if (["puffer", "puffer-inflate", "narwhal", "seal"].includes(name)) {
    face(name === "seal" ? P.mist : name === "narwhal" ? P.blue : P.gold);
    p.poly(
      [
        [4, 13],
        [0, 8],
        [0, 17],
      ],
      P.slate,
    );
    if (name === "narwhal") p.line(18, 8, 23, 1, P.cream);
    if (name.startsWith("puffer"))
      for (const [x, y] of [
        [4, 5],
        [11, 2],
        [20, 5],
        [21, 14],
        [5, 18],
      ])
        p.r(x, y, 2, 2, P.wood2);
  } else if (["frog", "wasabi", "wasabi-dragon", "cactus"].includes(name)) {
    roll();
    face(P.moss2);
    p.oval(7, 5, 3, 3, P.moss2);
    p.oval(17, 5, 3, 3, P.moss2);
    p.dot(7, 5, P.ink);
    p.dot(17, 5, P.ink);
    if (name === "wasabi-dragon") {
      p.poly(
        [
          [4, 10],
          [0, 3],
          [1, 13],
        ],
        P.moss3,
      );
      p.poly(
        [
          [19, 10],
          [23, 3],
          [22, 13],
        ],
        P.moss3,
      );
      p.r(11, 16, 2, 4, P.salmon);
    }
    if (name === "cactus") {
      p.r(1, 8, 3, 7, P.moss2);
      p.r(19, 7, 3, 8, P.moss2);
      p.dot(12, 3, P.pink);
    }
  } else if (["mochi-ghost", "googly"].includes(name)) {
    rice();
    if (name === "mochi-ghost") {
      p.oval(12, 10, 7, 8, P.white);
      p.r(5, 14, 3, 5, P.white);
      p.r(11, 14, 3, 6, P.white);
      p.r(17, 14, 3, 5, P.white);
    }
    p.oval(8, 10, 4, 4, P.white);
    p.oval(16, 10, 4, 4, P.white);
    eyes(8, 10);
  } else if (name === "ufo") {
    rice();
    p.oval(12, 5, 9, 3, P.ink);
    p.oval(12, 4, 8, 2, P.slate);
    p.oval(12, 2, 4, 2, P.cyan);
    for (let i = 0; i < 3; i++) p.dot(7 + i * 5, 5, P.gold);
    p.line(8, 7, 5, 10, P.moss3);
    p.line(16, 7, 19, 10, P.moss3);
  } else if (
    [
      "hardhat",
      "plank",
      "ginger-boat",
      "tempura-bag",
      "treasure-bento",
    ].includes(name)
  ) {
    rice();
    stripe();
    if (name === "hardhat") {
      p.oval(12, 6, 6, 4, P.gold);
      p.r(4, 8, 16, 2, P.copper);
    } else if (name === "ginger-boat") {
      p.r(11, 1, 1, 12, P.wood3);
      p.poly(
        [
          [12, 2],
          [21, 9],
          [12, 9],
        ],
        P.pink,
      );
    } else if (name === "treasure-bento") {
      crateItem(p);
    } else if (name === "plank") {
      p.r(3, 17, 2, 5, P.cream);
      p.r(20, 17, 2, 5, P.cream);
    } else {
      p.r(3, 14, 18, 6, P.blue);
      p.r(4, 14, 16, 1, P.cyan);
    }
  } else if (["rock", "snail", "uni-hog", "bug"].includes(name)) {
    roll();
    p.oval(12, 11, 8, 6, name === "snail" ? P.copper : P.wood2);
    if (name === "snail") {
      p.ring(12, 10, 5, 4, P.wood0);
      p.ring(12, 10, 2, 2, P.wood0);
    }
    if (name === "uni-hog")
      for (let i = 0; i < 7; i++)
        p.line(6 + i * 2, 9, 5 + i * 2, 3 + (i % 2) * 2, P.ink);
    eyes(7, 12);
  } else if (name === "bomb") {
    p.oval(12, 15, 8, 7, P.ink);
    p.oval(10, 12, 3, 2, P.slate);
    p.line(13, 7, 16, 3, P.wood3);
    p.r(16, 1, 3, 3, P.gold);
    p.dot(17, 0, P.salmon);
  } else if (name === "floppy" || name === "laptop-fire") {
    p.r(3, 5, 18, 16, P.ink);
    p.r(5, 6, 14, 13, P.blue);
    p.r(8, 6, 9, 5, P.mist);
    p.r(7, 14, 11, 5, P.cream);
    if (name === "laptop-fire") {
      p.poly(
        [
          [8, 16],
          [5, 8],
          [10, 10],
          [13, 1],
          [17, 10],
          [20, 7],
          [18, 17],
        ],
        P.salmon,
      );
      p.poly(
        [
          [10, 16],
          [12, 9],
          [15, 16],
        ],
        P.gold,
      );
    }
  } else if (name === "not-found") {
    p.r(4, 8, 17, 12, P.sand);
    p.r(5, 8, 15, 10, P.cream);
    p.r(8, 12, 2, 4, P.wood0);
    p.r(15, 12, 2, 4, P.wood0);
    p.r(10, 16, 5, 1, P.wood0);
  } else if (name === "ant-bridge") {
    rice();
    p.line(2, 7, 22, 13, P.wood3);
    for (let i = 0; i < 3; i++) p.oval(10 + i * 2, 6 + i, 1, 1, P.ink);
    p.r(13, 4, 3, 1, P.white);
  } else {
    rice();
    stripe();
  }
  return c;
}
function crateItem(p: Pixels) {
  p.r(2, 8, 20, 13, P.wood0);
  p.r(3, 9, 18, 10, P.wood3);
  p.r(4, 11, 16, 2, P.gold);
  p.r(11, 9, 3, 10, P.gold);
  p.r(11, 13, 3, 3, P.ink);
}
