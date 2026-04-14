(() => {
  const app = window.ShanHai;
  const { tables, utils, state } = app;
  const {
    LOCATIONS,
    LOCATION_MAP,
    ACTION_META,
    MODE_OPTIONS,
    WORLD_EVENT_TEMPLATES,
    TRAVEL_EVENT_TEMPLATES,
    REALM_TEMPLATES,
  } = tables;
  const { sample, randomFloat, randomInt, clamp, round } = utils;

  function rerender() {
    if (app.render) app.render();
  }

  function findRoute(startId, endId) {
    if (startId === endId) return [startId];
    const queue = [[startId]];
    const visited = new Set([startId]);
    while (queue.length) {
      const path = queue.shift();
      const last = path[path.length - 1];
      const location = LOCATION_MAP[last];
      for (const neighborId of location.neighbors) {
        if (visited.has(neighborId)) continue;
        const nextPath = [...path, neighborId];
        if (neighborId === endId) return nextPath;
        visited.add(neighborId);
        queue.push(nextPath);
      }
    }
    return null;
  }

  function currentLocationCanReach(targetId) {
    return Boolean(findRoute(app.getCurrentLocation().id, targetId));
  }

  function fillTemplate(text, payload) {
    return Object.entries(payload).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, String(value)), text);
  }

  function triggerTravelEvent(location) {
    const game = app.getGame();
    const event = sample(TRAVEL_EVENT_TEMPLATES);
    if (event.kind === "money") {
      const value = randomInt(12, 28);
      game.player.money += value;
      app.appendLog(fillTemplate(event.text, { location: location.name, value }), "loot");
      return;
    }
    if (event.kind === "item") {
      const item = sample(
        location.marketBias
          ? tables.ITEMS.filter((entry) => entry.tier <= (location.marketTier || 0) + 1 && (entry.type === location.marketBias || Math.random() < 0.25))
          : tables.ITEMS.filter((entry) => entry.tier <= (location.marketTier || 0) + 1),
      );
      app.addItemToInventory(item.id, 1);
      app.appendLog(fillTemplate(event.text, { terrain: location.terrain, item: item.name }), "loot");
      return;
    }
    app.adjustResource("hp", -randomInt(4, 10), "maxHp");
    app.adjustResource("qi", -randomInt(2, 8), "maxQi");
    app.getGame().player.breakthrough += 1.5;
    app.appendLog(event.text, "warn");
  }

  function travelTo(locationId) {
    const game = app.getGame();
    if (locationId === game.player.locationId) return;
    const current = app.getCurrentLocation();
    const target = LOCATION_MAP[locationId];
    if (!target) return;
    const path = findRoute(current.id, locationId);
    if (!path) {
      app.appendLog(`从${current.name}无法直接前往${target.name}。`, "warn");
      return;
    }
    const segments = Math.max(1, path.length - 1);
    const via = path.slice(1, -1).map((id) => LOCATION_MAP[id].short).join("、");
    game.player.locationId = locationId;
    game.player.action = sample(target.actions);
    app.adjustResource("stamina", -6 * segments, "maxStamina");
    app.adjustResource("qi", -3 * segments, "maxQi");
    state.selectedLocationId = locationId;
    app.appendLog(via ? `你踏上旅途，经由${via}抵达${target.name}。` : `你踏上旅途，很快抵达了${target.name}。`, "info");
    for (let index = 0; index < segments; index += 1) {
      if (Math.random() < 0.24 + segments * 0.04) {
        triggerTravelEvent(target);
      }
    }
    rerender();
  }

  function travelAndAct(locationId, action) {
    travelTo(locationId);
    if (app.getGame().player.locationId === locationId) {
      performAction(action);
    }
  }

  function chooseAutoAction() {
    const game = app.getGame();
    const location = app.getCurrentLocation();
    const mode = game.player.mode;

    if (mode === "manual") {
      return null;
    }

    if (game.combat.currentEnemy) {
      return game.combat.autoBattle ? "combat" : null;
    }
    if (game.player.hp < game.player.maxHp * 0.42 || game.player.qi < game.player.maxQi * 0.32) {
      return "meditate";
    }
    if (game.player.breakthrough >= app.getNextBreakthroughNeed() * 0.92 && location.actions.includes("breakthrough")) {
      return "breakthrough";
    }
    if (mode === "cultivation") {
      if (location.aura < 42 && Math.random() < 0.34) {
        const better = location.neighbors.map((id) => LOCATION_MAP[id]).sort((left, right) => right.aura - left.aura)[0];
        if (better && better.aura > location.aura) travelTo(better.id);
      }
      return location.actions.includes("meditate") ? "meditate" : location.actions[0];
    }
    if (mode === "merchant") {
      if (!["lantern", "blackforge", "yunze"].includes(location.id) && Math.random() < 0.42) {
        const target = ["lantern", "blackforge", "yunze"].find((id) => currentLocationCanReach(id));
        if (target) travelTo(target);
      }
      return location.actions.includes("trade") ? "trade" : location.actions[0];
    }
    if (mode === "adventure") {
      if (location.danger < 4 && Math.random() < 0.36) {
        const riskier = location.neighbors.map((id) => LOCATION_MAP[id]).sort((left, right) => right.danger - left.danger)[0];
        if (riskier && riskier.danger > location.danger) travelTo(riskier.id);
      }
      return location.actions.includes("quest") ? "quest" : location.actions.includes("hunt") ? "hunt" : location.actions[0];
    }
    if (mode === "sect" && game.player.sect) {
      if (!location.tags.includes("sect") && currentLocationCanReach("jadegate") && Math.random() < 0.3) {
        travelTo("jadegate");
      }
      return location.actions.includes("sect") ? "sect" : "meditate";
    }
    const sequence = ["meditate", "trade", "hunt", "quest", "train"];
    return sequence.find((action) => location.actions.includes(action)) || location.actions[0];
  }

  function resolvePassiveTrade() {
    const game = app.getGame();
    const market = game.market[game.player.locationId] || [];
    if (!market.length) return;
    const listing = sample(market);
    const item = app.getItem(listing.itemId);
    if (!item) return;
    const margin = Math.max(2, Math.round(listing.price * randomFloat(0.03, 0.08)));
    game.player.money += margin;
    game.player.stats.tradesCompleted += 1;
    app.getGame().player.skills.trading += 0.18;
    app.adjustFactionStanding?.(game.player.affiliationId, 0.8);
    app.appendLog(`你顺手倒卖${item.name}，净赚${margin}灵石。`, "info");
  }

  function buyListing(listingId) {
    const game = app.getGame();
    const market = game.market[game.player.locationId] || [];
    const listing = market.find((entry) => entry.listingId === listingId);
    if (!listing) return;
    if (game.player.money < listing.price) {
      app.appendLog("灵石不足，买不起这件货。", "warn");
      return;
    }
    game.player.money -= listing.price;
    app.addItemToInventory(listing.itemId, listing.quantity);
    game.player.stats.tradesCompleted += 1;
    app.appendLog(`你购入${app.getItem(listing.itemId)?.name || "货物"} x${listing.quantity}。`, "loot");
    game.market[game.player.locationId] = market.filter((entry) => entry !== listing);
    rerender();
  }

  function getReservedAuctionFunds(ignoreListingId = null) {
    return app.getGame().auction.reduce((sum, listing) => {
      if (listing.bidderId !== "player") return sum;
      if (listing.id === ignoreListingId) return sum;
      return sum + listing.currentBid;
    }, 0);
  }

  function placeBid(listingId) {
    const game = app.getGame();
    const listing = game.auction.find((entry) => entry.id === listingId);
    if (!listing) return;
    const nextBid = listing.currentBid + listing.minimumRaise;
    if (game.player.money < getReservedAuctionFunds(listing.id) + nextBid) {
      app.appendLog("你手头灵石不够抬价。", "warn");
      return;
    }
    listing.currentBid = nextBid;
    listing.bidderId = "player";
    listing.interest += 8;
    app.appendLog(`你对${app.getItem(listing.itemId)?.name || "拍品"}出价${nextBid}灵石。`, "info");
    rerender();
  }

  function resolveAuctionVisit() {
    const game = app.getGame();
    if (!game.auction.length) {
      game.auction = app.createAuctionListings(randomInt(3, 5));
      return;
    }
    const listing = sample(game.auction);
    const item = app.getItem(listing.itemId);
    if (!item) return;
    if (Math.random() < 0.28 && game.player.money > listing.currentBid + listing.minimumRaise) {
      placeBid(listing.id);
    } else {
      game.player.reputation += 0.4;
      app.appendLog(`你在拍卖行打探到${item.name}的消息。`, "npc");
    }
  }

  function resolveAuctionTurn() {
    const game = app.getGame();
    const survivors = [];
    game.auction.forEach((listing) => {
      listing.turnsLeft -= 1;
      if (listing.turnsLeft > 0) {
        if (Math.random() < listing.interest / 150) {
          const challenger = sample(game.npcs);
          const nextBid = listing.currentBid + listing.minimumRaise;
          const relation = app.getRelation(challenger.id);
          const rivalPressure = game.player.rivalIds.includes(challenger.id) ? 0.18 : 0;
          if (challenger.wealth > nextBid && challenger.mood.greed / 100 + rivalPressure > 0.42) {
            listing.currentBid = nextBid;
            listing.bidderId = challenger.id;
            challenger.wealth -= Math.round(nextBid * 0.05);
          }
        }
        survivors.push(listing);
        return;
      }

      const item = app.getItem(listing.itemId);
      if (listing.bidderId === "player") {
        if (game.player.money >= listing.currentBid) {
          game.player.money -= listing.currentBid;
          app.addItemToInventory(listing.itemId, listing.quantity);
          game.player.stats.auctionsWon += 1;
          app.appendLog(`拍卖结束，你拍得${item?.name || "奇珍"}。`, "loot");
        } else {
          app.appendLog(`你对${item?.name || "拍品"}的出价因灵石不足作废。`, "warn");
        }
      } else if (listing.bidderId.startsWith("npc-")) {
        const npc = app.getNpc(listing.bidderId);
        if (npc) {
          npc.inventory.push({ itemId: listing.itemId, quantity: listing.quantity });
          npc.lastEvent = `在拍卖行夺得${item?.name || "拍品"}`;
        }
        app.appendLog(`${npc?.name || "某位修士"}拍下了${item?.name || "奇珍"}。`, "npc");
      }
    });
    game.auction = survivors;
    if (game.auction.length < 4) {
      game.auction.push(...app.createAuctionListings(randomInt(1, 2)));
    }
  }

  function refreshMarketIfNeeded() {
    const game = app.getGame();
    if (game.world.hour % 4 !== 0 || game.world.subStep !== 0) return;
    LOCATIONS.forEach((location) => {
      game.market[location.id] = app.createMarketListings(location);
    });
    app.appendLog("各地商铺与黑市货架焕然一新。", "info");
  }

  function maybeActivateRealm() {
    const game = app.getGame();
    if (game.world.realm.cooldown > 0) {
      game.world.realm.cooldown -= 1;
      return;
    }
    if (game.world.realm.activeRealmId) return;
    if (Math.random() < 0.18) {
      const eligible = REALM_TEMPLATES.filter((realm) => game.player.reputation >= Math.max(0, realm.unlockRep - 6));
      if (!eligible.length) return;
      const realm = sample(eligible);
      game.world.realm.activeRealmId = realm.id;
      const location = LOCATION_MAP[realm.locationId];
      app.appendLog(fillTemplate(sample(WORLD_EVENT_TEMPLATES).text, { location: location.name, resource: location.resource }), "npc");
      app.appendLog(`${realm.name}在${location.name}附近出现了波动。`, "npc");
    }
  }

  function appendNpcLifeEvent(npc, text) {
    npc.lifeEvents = npc.lifeEvents || [];
    npc.lifeEvents.push(text);
    if (npc.lifeEvents.length > 6) {
      npc.lifeEvents = npc.lifeEvents.slice(-6);
    }
  }

  function getNpcProfessionPool(npc) {
    const home = LOCATION_MAP[npc.homeId] || LOCATION_MAP[npc.locationId];
    const tags = home?.tags || [];

    if (tags.includes("sect")) {
      return npc.lifeStage === "少年"
        ? ["杂役弟子", "抄经童子", "听差弟子"]
        : npc.lifeStage === "壮年"
          ? ["外门弟子", "内门行走", "丹房执役", "护山弟子"]
          : npc.lifeStage === "中年"
            ? ["执事", "丹房教习", "护法", "司库"]
            : ["守阁老人", "山门宿老", "外门教习"];
    }

    if (tags.includes("forge")) {
      return npc.lifeStage === "少年"
        ? ["打杂学徒", "矿场童工", "送炭小厮"]
        : npc.lifeStage === "壮年"
          ? ["学徒铁匠", "匠工", "押镖好手", "矿场工头"]
          : npc.lifeStage === "中年"
            ? ["监造", "工坊主事", "老镖头"]
            : ["老匠", "炉前师傅", "退役镖师"];
    }

    if (tags.includes("port") || tags.includes("market")) {
      return npc.lifeStage === "少年"
        ? ["脚夫", "船行杂役", "跑街小厮"]
        : npc.lifeStage === "壮年"
          ? ["脚商", "船工", "分号伙计", "掮客"]
          : npc.lifeStage === "中年"
            ? ["掌柜", "行会执事", "船队老大"]
            : ["老账房", "退居掌柜", "市井说书人"];
    }

    if (tags.includes("town") || tags.includes("starter")) {
      return npc.lifeStage === "少年"
        ? ["佃户子弟", "跑堂杂工", "药圃学徒"]
        : npc.lifeStage === "壮年"
          ? ["农户", "货郎", "药农", "店伙"]
          : npc.lifeStage === "中年"
            ? ["里正助手", "小店东家", "药铺主事"]
            : ["乡里老人", "田契看守", "退居掌柜"];
    }

    return npc.lifeStage === "少年"
      ? ["野路学徒", "走山少年"]
      : npc.lifeStage === "壮年"
        ? ["游侠", "散户", "猎手", "采药人"]
        : npc.lifeStage === "中年"
          ? ["老猎手", "山路向导", "散修执事"]
          : ["隐居老人", "看山人", "退隐游侠"];
  }

  function getNpcGoalPool(npc) {
    if (npc.lifeStage === "少年") {
      return ["找门路入宗", "攒学徒钱", "学一门手艺", "替家里挣口粮"];
    }
    if (npc.lifeStage === "壮年") {
      return ["攒钱买田", "跑货翻身", "争取晋升", "替自己置办铺面"];
    }
    if (npc.lifeStage === "中年") {
      return ["坐稳门内位置", "攒下家底", "收徒传手艺", "替晚辈铺路"];
    }
    return ["回乡养老", "守着家业", "留下门路给后人", "安稳度日"];
  }

  function refreshNpcLifeProfile(npc, force = false) {
    const professionPool = getNpcProfessionPool(npc);
    if (force || !professionPool.includes(npc.profession) || Math.random() < 0.28) {
      npc.profession = sample(professionPool);
    }

    const goalPool = getNpcGoalPool(npc);
    if (force || Math.random() < 0.32) {
      npc.goal = sample(goalPool);
    }

    if (npc.lifeStage === "老年") {
      npc.action = sample(["meditate", "trade", "sect"]);
    } else if (npc.lifeStage === "少年") {
      npc.action = sample(["train", "trade", "quest"]);
    }
  }

  function processNpcLifeTick() {
    const game = app.getGame();
    game.npcs = game.npcs.map((npc, index) => {
      if (!npc.alive) return npc;
      npc.ageProgress = (npc.ageProgress || 0) + 1;
      if (npc.ageProgress >= 12) {
        npc.ageProgress = 0;
        const previousStage = npc.lifeStage;
        npc.age += 1;
        npc.lifeStage = app.deriveLifeStage(npc.age);
        if (npc.lifeStage !== previousStage) {
          refreshNpcLifeProfile(npc, true);
          appendNpcLifeEvent(npc, `${npc.age}岁步入${npc.lifeStage}`);
          npc.lastEvent = `人生进入${npc.lifeStage}阶段`;
        }
        if (!npc.factionId && LOCATION_MAP[npc.homeId]?.factionIds?.length && Math.random() < 0.22) {
          npc.factionId = sample(LOCATION_MAP[npc.homeId].factionIds);
          npc.factionRank = 0;
          refreshNpcLifeProfile(npc, true);
          appendNpcLifeEvent(npc, `投身${app.getFaction(npc.factionId)?.name || "一方势力"}`);
          npc.lastEvent = `投身${app.getFaction(npc.factionId)?.name || "一方势力"}`;
        }
        if (npc.factionId && npc.factionRank < 3 && (npc.cultivation > 140 + npc.factionRank * 180 || npc.wealth > 180 + npc.factionRank * 120) && Math.random() < 0.18) {
          npc.factionRank += 1;
          const faction = app.getFaction(npc.factionId);
          const title = faction?.titles[Math.min(npc.factionRank, (faction?.titles.length || 1) - 1)] || "更进一步";
          appendNpcLifeEvent(npc, `在${faction?.name || "门内"}升为${title}`);
          npc.lastEvent = `在${faction?.name || "门内"}升为${title}`;
        }
        if (npc.lifeStage === "老年" && Math.random() < 0.24) {
          npc.locationId = npc.homeId;
          refreshNpcLifeProfile(npc, true);
          appendNpcLifeEvent(npc, `回到${LOCATION_MAP[npc.homeId]?.name || "故地"}安顿余生`);
          npc.lastEvent = `回到${LOCATION_MAP[npc.homeId]?.name || "故地"}安顿余生`;
        }
      }
      if (npc.age >= npc.lifespan && Math.random() < 0.34) {
        if (app.getRelation(npc.id).role !== "none") {
          app.appendLog(`${npc.name}走完了一生，旧事也随风而去。`, "npc");
        }
        const successor = app.createNPC(index + 1);
        successor.id = npc.id;
        successor.lastEvent = "新近来到此地谋生";
        successor.lifeEvents = ["新近来到此地谋生"];
        return successor;
      }
      if (Math.random() < 0.1) {
        refreshNpcLifeProfile(npc, false);
      }
      return npc;
    });
  }

  function runNpcAI() {
    const game = app.getGame();
    game.npcs.forEach((npc) => {
      npc.cooldown -= 1;
      if (npc.cooldown > 0) return;
      const current = LOCATION_MAP[npc.locationId];
      let chosenAction = npc.action;

      if (npc.masterId === "player" && game.player.sect && Math.random() < 0.3) {
        npc.locationId = game.player.locationId;
        npc.lastEvent = `赶来山门听候安排`;
      } else if (Math.random() < (npc.lifeStage === "老年" ? 0.12 : npc.lifeStage === "少年" ? 0.32 : 0.26)) {
        npc.locationId = sample(current.neighbors);
        npc.lastEvent = `动身前往${LOCATION_MAP[npc.locationId].name}`;
      }

      if (npc.mood.greed > 70 && LOCATION_MAP[npc.locationId].actions.includes("trade")) chosenAction = "trade";
      if (npc.mood.curiosity > 68 && LOCATION_MAP[npc.locationId].actions.includes("quest")) chosenAction = "quest";
      if (npc.mood.patience > 72 && LOCATION_MAP[npc.locationId].actions.includes("meditate")) chosenAction = "meditate";
      if (npc.lifeStage === "老年" && LOCATION_MAP[npc.locationId].actions.includes("meditate")) chosenAction = sample(["meditate", "trade"]);
      if (npc.sectId === "player-sect" && Math.random() < 0.3) chosenAction = "sect";

      npc.action = chosenAction;
      processNpcAction(npc, chosenAction);
      npc.cooldown = randomInt(1, 3);
    });
  }

  function processNpcAction(npc, action) {
    const game = app.getGame();
    const location = LOCATION_MAP[npc.locationId];
    switch (action) {
      case "meditate":
        npc.cultivation += (2 + location.aura * 0.08) * (npc.skillBias.meditate || 1);
        npc.lastEvent = `在${location.name}闭关修炼`;
        break;
      case "trade": {
        const profit = Math.round((4 + location.marketTier * 6) * (npc.skillBias.trade || 1));
        npc.wealth += profit;
        npc.lastEvent = `在${location.name}行商获利${profit}`;
        if (Math.random() < 0.18) {
          app.adjustRelation(npc.id, { affinity: npc.mood.kindness > 60 ? 1 : -1, trust: npc.mood.kindness > 60 ? 1 : 0 });
        }
        break;
      }
      case "hunt":
      case "quest": {
        const challenge = location.danger * 18;
        const score = npc.cultivation * 0.18 + npc.ambition + randomFloat(-16, 18);
        if (score > challenge) {
          const reward = Math.round((8 + location.danger * 6) * (npc.skillBias.combat || 1));
          npc.wealth += reward;
          npc.cultivation += reward * 0.05;
          npc.lastEvent = `在${location.name}${action === "quest" ? "夺得机缘" : "历练得手"}`;
          if (Math.random() < 0.16) {
            npc.inventory.push({ itemId: sample(["mist-herb", "timber", "scrap-iron", "iron-sand", "beast-hide"]), quantity: 1 });
          }
        } else {
          npc.lastEvent = `在${location.name}受挫而回`;
          app.adjustRelation(npc.id, { affinity: -1, rivalry: 1 });
        }
        break;
      }
      case "sect":
        npc.lastEvent = npc.sectId === "player-sect" ? "在宗门内值守听令" : `在${location.name}处理门内事务`;
        if (npc.sectId === "player-sect" && game.player.sect) {
          game.player.sect.treasury += 4;
        }
        break;
      default:
        npc.lastEvent = `在${location.name}观望局势`;
    }

    if (Math.random() < 0.12) {
      app.appendLog(`${npc.name}又有动作：${npc.lastEvent}。`, "npc");
    }
  }

  function processActionActionKey(actionKey) {
    if (!actionKey) return;
    if (actionKey === "combat") {
      app.autoCombatTick();
      return;
    }
    if (actionKey === "breakthrough") {
      app.attemptBreakthrough();
      return;
    }
    if (actionKey === "sect") {
      app.applyPassiveAction("sect");
      if (app.getGame().player.sect) {
        app.getGame().player.sect.treasury += 8 + app.getGame().player.sect.buildings.market * 4;
        app.getGame().player.sect.prestige += 0.6;
      }
      return;
    }

    app.applyPassiveAction(actionKey);
    if (actionKey === "trade") {
      resolvePassiveTrade();
      app.adjustFactionStanding?.(app.getGame().player.affiliationId, 1);
    }
    if (actionKey === "auction") resolveAuctionVisit();
    if (["hunt", "quest"].includes(actionKey)) {
      if (actionKey === "quest") {
        app.getGame().player.stats.questsFinished += 1;
      }
      app.adjustFactionStanding?.(app.getGame().player.affiliationId, actionKey === "quest" ? 1.2 : 0.8);
      const started = app.maybeStartEncounter(actionKey);
      if (!started) {
        const item = sample(tables.ITEMS.filter((entry) => entry.tier <= (app.getCurrentLocation().marketTier || 0) + 1 && (entry.type === app.getCurrentLocation().marketBias || Math.random() < 0.2)));
        if (Math.random() < 0.42) {
          app.addItemToInventory(item.id, 1);
          app.appendLog(`你在${app.getCurrentLocation().name}一带收获了${item.name}。`, "loot");
        }
      } else {
        app.autoCombatTick();
      }
    }
  }

  function performAction(actionKey) {
    processActionActionKey(actionKey);
    tickWorld();
    rerender();
  }

  function tickWorld() {
    const game = app.getGame();
    game.world.subStep += 1;
    if (game.world.subStep >= 2) {
      game.world.subStep = 0;
      game.world.hour = (game.world.hour + 1) % tables.TIME_LABELS.length;
      if (game.world.hour === 0) {
        game.world.day += 1;
        game.world.weather = sample(["晴", "微雨", "大风", "寒霜", "雾起", "雷暴"]);
        game.world.omen = sample(["星辉平稳", "灵潮暗涌", "海雾倒卷", "山门钟鸣", "赤霞流火", "北斗失位"]);
      }
      resolveAuctionTurn();
      refreshMarketIfNeeded();
      maybeActivateRealm();
      app.processRelationshipTick();
      app.processSectTick();
      app.processIndustryTick?.();
      if (game.world.hour === 0) {
        processNpcLifeTick();
      }
    }

    runNpcAI();
  }

  function gameStep() {
    const game = app.getGame();
    const action = chooseAutoAction();
    if (!action) {
      if (game.player.mode === "manual") {
        tickWorld();
        if (game.player.hp <= 0) {
          app.revivePlayer();
        }
      }
      rerender();
      return;
    }
    performAction(action);
    if (game.player.hp <= 0) {
      app.revivePlayer();
    }
  }

  Object.assign(app, {
    findRoute,
    currentLocationCanReach,
    travelTo,
    travelAndAct,
    chooseAutoAction,
    buyListing,
    placeBid,
    processNpcLifeTick,
    performAction,
    tickWorld,
    gameStep,
  });
})();