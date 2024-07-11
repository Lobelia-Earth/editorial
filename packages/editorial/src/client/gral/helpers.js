const fixRanks = (schema, items) => {
  const itemTypes = Object.keys(schema);
  itemTypes.forEach((itemType) => {
    const schemaForType = schema[itemType];
    if (!schemaForType.allowManualSorting) return;
    const itemsForType = items[itemType] || {};
    const ids = Object.keys(itemsForType);
    let maxRank = -Infinity;
    for (let i = 0; i < ids.length; i++) {
      const item = itemsForType[ids[i]];
      let { rank } = item;
      if (rank != null) {
        if (typeof rank === 'string') {
          rank = Number(rank);
          item.rank = rank;
        }
        if (rank > maxRank) maxRank = rank;
      }
    }
    if (maxRank === -Infinity) maxRank = 0;
    for (let i = 0; i < ids.length; i++) {
      const item = itemsForType[ids[i]];
      if (item.rank != null) continue;
      maxRank += 10;
      item.rank = maxRank;
    }
  });
};

const getNewRank = (items, itemType) => {
  const itemsForType = items[itemType];
  if (!itemsForType) return null;
  const ids = Object.keys(itemsForType);
  let maxRank = -Infinity;
  for (let i = 0; i < ids.length; i++) {
    const { rank } = itemsForType[ids[i]];
    if (rank > maxRank) maxRank = rank;
  }
  return maxRank !== -Infinity ? maxRank + 10 : 10;
};

// ================================================
// Public
// ================================================
export { fixRanks, getNewRank };
