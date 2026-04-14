(() => {
  const app = window.ShanHai;
  const { tables, utils, dom } = app;
  const { MODE_OPTIONS } = tables;
  const { round, clamp } = utils;

  function renderSpeedButtons() {
    if (!dom.speedSwitch) return;
    Array.from(dom.speedSwitch.querySelectorAll(".speed-button")).forEach((button) => {
      button.classList.toggle("active", Number(button.dataset.speed) === app.state.speed);
    });
  }

  function getModeLabel(modeId) {
    return MODE_OPTIONS.find((mode) => mode.id === modeId)?.label || modeId;
  }

  function getRoleLabel(role) {
    return {
      none: "路人",
      apprentice: "弟子",
      master: "师尊",
      partner: "道侣",
      rival: "仇敌",
    }[role || "none"];
  }

  function describeItemEffect(item) {
    if (!item || !item.effect) return "";
    const labels = {
      hp: "气血",
      qi: "真气",
      stamina: "体力",
      power: "战力",
      insight: "悟性",
      charisma: "魅力",
      breakthrough: "突破火候",
      breakthroughRate: "突破率",
      cultivation: "修炼加成",
      realmSense: "秘境感应",
      sectTeaching: "传功效率",
      sectPrestige: "宗门威望",
      romance: "情缘",
      reputation: "声望",
    };

    return Object.entries(item.effect)
      .filter(([, value]) => value)
      .map(([key, value]) => `${labels[key] || key} ${typeof value === "number" && value < 1 ? `${Math.round(value * 100)}%` : value > 0 ? `+${round(value, 2)}` : round(value, 2)}`)
      .join("，");
  }

  function renderMeter(label, value, max, className = "") {
    const percent = max > 0 ? clamp((value / max) * 100, 0, 100) : 0;
    return `
      <div>
        <div class="meter-label"><span>${label}</span><span>${Math.round(value)} / ${Math.round(max)}</span></div>
        <div class="meter-track"><div class="meter-fill ${className}" style="width:${percent}%"></div></div>
      </div>
    `;
  }

  Object.assign(app, {
    renderSpeedButtons,
    getModeLabel,
    getRoleLabel,
    describeItemEffect,
    renderMeter,
  });
})();
