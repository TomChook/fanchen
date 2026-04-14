(() => {
  const app = window.ShanHai;
  const { tables, dom, runtime } = app;
  const { LOCATIONS, LOCATION_MAP } = tables;

  function drawMapTexture(context) {
    if (!runtime.mapTexture) {
      runtime.mapTexture = app.utils.buildMapTexture();
    }

    context.save();
    context.globalAlpha = 0.16;
    runtime.mapTexture.glows.forEach((spot) => {
      const gradient = context.createRadialGradient(spot.x, spot.y, spot.radius * 0.1, spot.x, spot.y, spot.radius);
      gradient.addColorStop(0, "rgba(242,214,162,0.35)");
      gradient.addColorStop(1, "rgba(242,214,162,0)");
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(spot.x, spot.y, spot.radius, 0, Math.PI * 2);
      context.fill();
    });

    context.globalAlpha = 0.1;
    runtime.mapTexture.strokes.forEach((stroke) => {
      context.beginPath();
      context.moveTo(stroke.x, stroke.y);
      context.quadraticCurveTo(stroke.x + stroke.cpX, stroke.y + stroke.cpY, stroke.x + stroke.endX, stroke.y + stroke.endY);
      context.strokeStyle = "rgba(255,255,255,0.2)";
      context.lineWidth = stroke.width;
      context.stroke();
    });
    context.restore();
  }

  function drawRoutes(context) {
    context.save();
    LOCATIONS.forEach((location) => {
      location.neighbors.forEach((neighborId) => {
        if (location.id > neighborId) return;
        const target = LOCATION_MAP[neighborId];
        context.beginPath();
        context.moveTo(location.x, location.y);
        const midX = (location.x + target.x) / 2 + (target.y - location.y) * 0.08;
        const midY = (location.y + target.y) / 2 - (target.x - location.x) * 0.05;
        context.quadraticCurveTo(midX, midY, target.x, target.y);
        context.strokeStyle = "rgba(242, 214, 162, 0.26)";
        context.lineWidth = 2;
        context.stroke();
      });
    });
    context.restore();
  }

  function drawLocationNodes(context, selected, current, activeRealmId) {
    LOCATIONS.forEach((location) => {
      const isSelected = selected.id === location.id;
      const isCurrent = current.id === location.id;
      const isRealmHot = location.realmId && location.realmId === activeRealmId;
      const radius = isCurrent ? 18 : isSelected ? 15 : 12;

      context.save();
      const glow = context.createRadialGradient(location.x, location.y, 0, location.x, location.y, radius * 2.8);
      glow.addColorStop(0, isRealmHot ? "rgba(180,92,71,0.58)" : isCurrent ? "rgba(127,178,148,0.65)" : isSelected ? "rgba(242,214,162,0.55)" : "rgba(125,178,200,0.34)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = glow;
      context.beginPath();
      context.arc(location.x, location.y, radius * 2.8, 0, Math.PI * 2);
      context.fill();

      context.beginPath();
      context.fillStyle = isRealmHot ? "#b45c47" : isCurrent ? "#7fb294" : isSelected ? "#f2d6a2" : "#7db2c8";
      context.arc(location.x, location.y, radius, 0, Math.PI * 2);
      context.fill();
      context.lineWidth = 2.5;
      context.strokeStyle = "rgba(255,255,255,0.6)";
      context.stroke();

      context.fillStyle = "rgba(250, 243, 228, 0.9)";
      context.font = isCurrent ? "700 20px STKaiti" : "600 16px STKaiti";
      context.textAlign = "center";
      context.fillText(location.short, location.x, location.y - radius - 12);
      context.restore();
    });
  }

  function drawPlayerTrail(context, current) {
    context.save();
    context.strokeStyle = "rgba(127,178,148,0.7)";
    context.setLineDash([8, 8]);
    context.lineWidth = 2;
    context.beginPath();
    context.arc(current.x, current.y, 34, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }

  function renderMap() {
    const canvas = dom.mapCanvas;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    const selected = app.getSelectedLocation();
    const current = app.getCurrentLocation();

    context.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#35504a");
    gradient.addColorStop(0.4, "#203a34");
    gradient.addColorStop(1, "#0d1714");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMapTexture(context);
    drawRoutes(context);
    drawLocationNodes(context, selected, current, app.getGame().world.realm.activeRealmId);
    drawPlayerTrail(context, current);
  }

  Object.assign(app, {
    renderMap,
    drawMapTexture,
    drawRoutes,
    drawLocationNodes,
    drawPlayerTrail,
  });
})();
