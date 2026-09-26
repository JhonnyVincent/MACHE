/*
  LA RÈGLE DE « SUR MACHÉ EN CE MOMENT » : CHAQUE VENDEUR À SON TOUR.

  Le but : mettre en avant TOUS les vendeurs, pas toujours les mêmes, et
  pas toujours les mêmes articles. Trois règles, dans cet ordre :

  1. Un article par boutique, puis un second, puis un troisième… Un
     vendeur qui met en ligne cinquante articles n'occupe pas la section
     à lui seul : il passe une fois par tour, comme celui qui n'en a
     qu'un.
  2. L'ordre des boutiques, et le choix de l'article dans chaque
     boutique, sont tirés au sort — un tirage qui change toutes les
     heures. D'une heure à l'autre, d'autres vendeurs passent en tête.
  3. Le tirage est le même pour tout le monde pendant l'heure : ce n'est
     pas un classement caché ni une préférence, et la page reste
     cachable par le serveur.

  Ce n'est pas un classement : la section ne dit ni « meilleurs » ni
  « populaires ». Elle dit ce qu'elle fait : une sélection qui tourne.
*/

/* Un générateur pseudo-aléatoire déterministe : même graine, même tirage. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }

  return copy;
}

/* La graine de l'heure en cours : le tirage change toutes les heures. */
export function hourSeed(now: Date = new Date()): number {
  return Math.floor(now.getTime() / (60 * 60 * 1000));
}

/*
  Chaque boutique à son tour. `sellerOf` rend la boutique d'un article,
  ou null quand on ne la connaît pas — l'article forme alors sa propre
  file, pour ne jamais disparaître faute de renseignement.
*/
export function rotateFairly<T>(
  items: T[],
  sellerOf: (item: T) => string | null,
  seed: number,
  count: number
): T[] {
  const random = seededRandom(seed);
  const queues = new Map<string, T[]>();

  items.forEach((item, index) => {
    const key = sellerOf(item) ?? `inconnu-${index}`;
    const queue = queues.get(key) ?? [];
    queue.push(item);
    queues.set(key, queue);
  });

  const order = shuffle([...queues.keys()], random).map((key) =>
    shuffle(queues.get(key)!, random)
  );

  const picked: T[] = [];

  for (let round = 0; picked.length < count; round += 1) {
    let added = false;

    for (const queue of order) {
      if (round < queue.length && picked.length < count) {
        picked.push(queue[round]);
        added = true;
      }
    }

    if (!added) break;
  }

  return picked;
}
