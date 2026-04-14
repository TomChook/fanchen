(() => {
  const app = window.ShanHai;

  const FACTIONS = [
    {
      id: "qinghe-commons",
      name: "青禾乡社",
      type: "town",
      locationId: "qinghe",
      desc: "由佃户、店家和乡勇构成的乡社，适合从种田和小买卖起步。",
      joinRequirement: { money: 0, reputation: 0, rankIndex: 0 },
      titles: ["帮工", "佃户", "里正助手", "乡社掌事"],
      unlocks: ["farm", "shop"],
    },
    {
      id: "mist-hunt-lodge",
      name: "迷林猎社",
      type: "society",
      locationId: "misty",
      desc: "靠采药、打猎和走险维生的地方行社。",
      joinRequirement: { money: 12, reputation: 2, rankIndex: 0 },
      titles: ["杂役猎手", "见习猎手", "正社猎手", "执事猎官"],
      unlocks: ["farm", "workshop"],
    },
    {
      id: "blackforge-guild",
      name: "玄铁工盟",
      type: "guild",
      locationId: "blackforge",
      desc: "匠人和押镖修士的地盘，工坊与打造体系最完整。",
      joinRequirement: { money: 40, reputation: 4, rankIndex: 1 },
      titles: ["学徒", "匠工", "监造", "工坊主"],
      unlocks: ["workshop", "shop"],
    },
    {
      id: "tide-market",
      name: "听潮商盟",
      type: "guild",
      locationId: "lantern",
      desc: "控制外海货路和拍市消息的商帮，擅长铺面经营。",
      joinRequirement: { money: 60, reputation: 6, rankIndex: 1 },
      titles: ["脚商", "行商", "分号执事", "掌柜"],
      unlocks: ["shop", "warehouse"],
    },
    {
      id: "jadegate-order",
      name: "玉阙山门",
      type: "sect",
      locationId: "jadegate",
      desc: "正统修行宗门，门规森严，但资源和晋升路径最完整。",
      joinRequirement: { money: 20, reputation: 8, rankIndex: 1 },
      titles: ["杂役", "外门", "内门", "真传"],
      unlocks: ["farm", "workshop", "sect"],
    },
  ];

  const PROPERTY_DEFS = [
    {
      id: "village-farm",
      label: "薄田一亩",
      kind: "farm",
      cost: 120,
      locationTags: ["town", "starter"],
      allowedFactionIds: ["qinghe-commons", "mist-hunt-lodge", "jadegate-order"],
      capacity: 1,
      desc: "挂在自己名下的小田地，适合从口粮和药草起步。",
    },
    {
      id: "herb-garden",
      label: "药圃小院",
      kind: "farm",
      cost: 260,
      locationTags: ["town", "sect", "cultivation"],
      allowedFactionIds: ["mist-hunt-lodge", "jadegate-order"],
      capacity: 2,
      desc: "能种植药草和灵谷，需要一定门路才能租买。",
    },
    {
      id: "forge-bench",
      label: "小铁匠棚",
      kind: "workshop",
      cost: 320,
      locationTags: ["forge", "town"],
      allowedFactionIds: ["blackforge-guild", "jadegate-order"],
      capacity: 2,
      desc: "能打造低阶兵器与护具的小工坊。",
    },
    {
      id: "market-stall",
      label: "街边小铺",
      kind: "shop",
      cost: 380,
      locationTags: ["market", "port", "town"],
      allowedFactionIds: ["qinghe-commons", "tide-market", "blackforge-guild"],
      capacity: 1,
      desc: "挂名在自己名下的小铺面，可慢慢滚动赚差价。",
    },
  ];

  const CROPS = [
    {
      id: "grain-crop",
      label: "粗灵米",
      seedItemId: "seed-grain",
      harvestItemId: "spirit-grain",
      growDays: 3,
      yield: 3,
      desc: "最适合凡人起步的稳妥作物。",
    },
    {
      id: "herb-crop",
      label: "雾心草",
      seedItemId: "seed-herb",
      harvestItemId: "mist-herb",
      growDays: 4,
      yield: 2,
      desc: "成长更慢，但比种粮更值钱。",
    },
  ];

  const CRAFT_RECIPES = [
    {
      id: "craft-wood-spear",
      label: "打造木柄短枪",
      outputItemId: "wood-spear",
      outputQuantity: 1,
      cost: 12,
      requiresPropertyKind: "workshop",
      minRankIndex: 0,
      inputs: [
        { itemId: "timber", quantity: 2 },
        { itemId: "scrap-iron", quantity: 1 },
      ],
    },
    {
      id: "craft-hide-jerkin",
      label: "缝制皮护短褂",
      outputItemId: "hide-jerkin",
      outputQuantity: 1,
      cost: 14,
      requiresPropertyKind: "workshop",
      minRankIndex: 0,
      inputs: [
        { itemId: "cloth-roll", quantity: 1 },
        { itemId: "beast-hide", quantity: 1 },
      ],
    },
    {
      id: "craft-iron-sword",
      label: "打造精铁剑",
      outputItemId: "iron-sword",
      outputQuantity: 1,
      cost: 38,
      requiresPropertyKind: "workshop",
      minRankIndex: 1,
      inputs: [
        { itemId: "iron-sand", quantity: 2 },
        { itemId: "scrap-iron", quantity: 2 },
      ],
    },
    {
      id: "craft-guard-armor",
      label: "铆制护院铁甲",
      outputItemId: "guard-armor",
      outputQuantity: 1,
      cost: 42,
      requiresPropertyKind: "workshop",
      minRankIndex: 1,
      inputs: [
        { itemId: "iron-sand", quantity: 2 },
        { itemId: "beast-hide", quantity: 1 },
        { itemId: "cloth-roll", quantity: 1 },
      ],
    },
    {
      id: "craft-herb-paste",
      label: "调制草膏",
      outputItemId: "herb-paste",
      outputQuantity: 1,
      cost: 10,
      requiresPropertyKind: "workshop",
      minRankIndex: 0,
      inputs: [
        { itemId: "mist-herb", quantity: 2 },
        { itemId: "spirit-grain", quantity: 1 },
      ],
    },
  ];

  app.tables = {
    ...app.tables,
    FACTIONS,
    PROPERTY_DEFS,
    CROPS,
    CRAFT_RECIPES,
  };
})();