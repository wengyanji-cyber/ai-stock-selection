(function () {
  const appData = window.DEMO_DATA;
  const state = {
    candidateSector: "全部板块",
    candidateLevel: "全部优先级",
    candidateRisk: "全部风险等级",
    diagnosisKey: "300001",
    watchStatus: "all"
  };

  const heroTags = document.getElementById("hero-tags");
  const temperatureMetric = document.getElementById("metric-temperature");
  const sectorCountMetric = document.getElementById("metric-sector-count");
  const coreCountMetric = document.getElementById("metric-core-count");

  temperatureMetric.textContent = appData.marketTemperature;
  sectorCountMetric.textContent = `${appData.sectors.length}个`;
  coreCountMetric.textContent = `${appData.candidates.filter((item) => item.level === "重点候选").length}只`;
  heroTags.innerHTML = appData.marketTags.map((tag) => `<span class="tag">${tag}</span>`).join("");

  function switchTab(tabName) {
    document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === tabName));
    document.querySelectorAll(".panel").forEach((panel) => panel.classList.toggle("active", panel.id === `panel-${tabName}`));
  }

  function bindDiagnosisButtons(root) {
    root.querySelectorAll("[data-go-diagnosis]").forEach((button) => {
      button.addEventListener("click", () => {
        if (appData.diagnoses[button.dataset.goDiagnosis]) {
          state.diagnosisKey = button.dataset.goDiagnosis;
          renderDiagnosis();
          switchTab("diagnosis");
        }
      });
    });
  }

  function renderHome() {
    document.getElementById("panel-home").innerHTML = `
      <div class="grid two">
        <div class="card">
          <div class="card-kicker">盘前一句话</div>
          <div class="card-title-row">
            <h2>今日市场观察</h2>
            <span class="badge brand">市场温度：${appData.marketTemperature}</span>
          </div>
          <p class="summary-text">${appData.marketSummary}</p>
          <div class="statline">
            <span class="stat-pill">重点板块 ${appData.sectors.length} 个</span>
            <span class="stat-pill">重点候选 ${appData.candidates.filter((item) => item.level === "重点候选").length} 只</span>
            <span class="stat-pill">主打法：热点追踪 + 风险并列</span>
          </div>
        </div>
        <div class="card">
          <div class="card-kicker">今日风险提醒</div>
          <h2>先避开什么</h2>
          <div class="risk-list">
            ${appData.review.risks.map((item) => `<div class="risk-item"><p>${item}</p></div>`).join("")}
          </div>
        </div>
      </div>
      <div class="grid two" style="margin-top:18px;">
        <div class="card">
          <div class="card-kicker">热点板块</div>
          <h2>今天重点板块</h2>
          <div class="sector-list">
            ${appData.sectors.map((sector) => `
              <div class="sector-item">
                <div class="item-head">
                  <div>
                    <div class="item-title">${sector.name}</div>
                    <p>${sector.reason}</p>
                  </div>
                  <span class="badge ${sector.badge}">${sector.status}</span>
                </div>
                <div class="meta-row"><span class="badge warn">风险：${sector.risk}</span></div>
              </div>
            `).join("")}
          </div>
        </div>
        <div class="card">
          <div class="card-kicker">今日重点候选</div>
          <h2>只看少量高质量机会</h2>
          <div class="candidate-list">
            ${appData.candidates.filter((item) => item.level === "重点候选").map((item) => `
              <div class="candidate-item">
                <div class="item-head">
                  <div>
                    <div class="item-title">${item.name} <span class="tiny">${item.code}</span></div>
                    <p>${item.summary}</p>
                  </div>
                  <span class="badge ${item.style}">${item.level}</span>
                </div>
                <div class="meta-row">
                  <span class="badge brand">观察区间 ${item.observe}</span>
                  ${item.risks.map((risk) => `<span class="badge warn">${risk}</span>`).join("")}
                </div>
                <div class="action-row"><button class="ghost-btn" data-go-diagnosis="${item.code}">查看诊股</button></div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
      <div class="footer-note">本页面仅用于 docs 场景演示，展示的是产品信息结构和文案形式，不构成任何收益承诺或投资建议。</div>
    `;
    bindDiagnosisButtons(document.getElementById("panel-home"));
  }

  function getFilteredCandidates() {
    return appData.candidates.filter((item) => {
      const sectorPass = state.candidateSector === "全部板块" || item.sector === state.candidateSector;
      const levelPass = state.candidateLevel === "全部优先级" || item.level === state.candidateLevel;
      const riskPass = state.candidateRisk === "全部风险等级" || item.riskLevel === state.candidateRisk;
      return sectorPass && levelPass && riskPass;
    });
  }

  function renderCandidates() {
    const candidates = getFilteredCandidates();
    document.getElementById("panel-candidates").innerHTML = `
      <div class="card">
        <div class="card-kicker">候选池</div>
        <div class="card-title-row"><h2>今日候选池</h2><span class="badge accent">${candidates.length} 只结果</span></div>
        <p class="meta" style="margin-top:10px;">你看到的不是全市场股票，而是更值得优先花时间研究的候选对象。</p>
        <div class="filters">
          <select class="filter-select" id="candidate-sector-filter">
            <option ${state.candidateSector === "全部板块" ? "selected" : ""}>全部板块</option>
            <option ${state.candidateSector === "AI算力链" ? "selected" : ""}>AI算力链</option>
            <option ${state.candidateSector === "机器人" ? "selected" : ""}>机器人</option>
          </select>
          <select class="filter-select" id="candidate-level-filter">
            <option ${state.candidateLevel === "全部优先级" ? "selected" : ""}>全部优先级</option>
            <option ${state.candidateLevel === "重点候选" ? "selected" : ""}>重点候选</option>
            <option ${state.candidateLevel === "扩展观察" ? "selected" : ""}>扩展观察</option>
          </select>
          <select class="filter-select" id="candidate-risk-filter">
            <option ${state.candidateRisk === "全部风险等级" ? "selected" : ""}>全部风险等级</option>
            <option ${state.candidateRisk === "中风险" ? "selected" : ""}>中风险</option>
            <option ${state.candidateRisk === "中高风险" ? "selected" : ""}>中高风险</option>
            <option ${state.candidateRisk === "高波动" ? "selected" : ""}>高波动</option>
          </select>
        </div>
        <div class="candidate-list">
          ${candidates.length ? candidates.map((item) => `
            <div class="candidate-item">
              <div class="item-head">
                <div>
                  <div class="item-title">${item.name} <span class="tiny">${item.code}</span></div>
                  <p>${item.summary}</p>
                </div>
                <span class="badge ${item.style}">${item.level}</span>
              </div>
              <div class="meta-row">
                <span class="badge brand">${item.sector}</span>
                <span class="badge accent">${item.riskLevel}</span>
                ${item.risks.map((risk) => `<span class="badge warn">${risk}</span>`).join("")}
              </div>
              <div class="point-grid">
                <div class="point"><div class="point-label">观察区间</div><div class="point-value">${item.observe}</div></div>
                <div class="point"><div class="point-label">支撑位</div><div class="point-value">${item.support}</div></div>
                <div class="point"><div class="point-label">压力位</div><div class="point-value">${item.pressure}</div></div>
                <div class="point"><div class="point-label">止损位</div><div class="point-value">${item.stopLoss}</div></div>
              </div>
              <div class="split">
                <div><h4>关注理由</h4><ul class="list">${item.reasons.map((reason) => `<li>${reason}</li>`).join("")}</ul></div>
                <div><h4>失效条件</h4><p class="meta" style="margin-top:12px;">${item.invalid}</p></div>
              </div>
              <div class="action-row"><button class="ghost-btn" data-go-diagnosis="${item.code}">查看诊股</button></div>
            </div>
          `).join("") : `<div class="empty-state">当前筛选条件下没有候选结果，建议放宽板块或风险条件。</div>`}
        </div>
      </div>
    `;

    document.getElementById("candidate-sector-filter").addEventListener("change", (event) => {
      state.candidateSector = event.target.value;
      renderCandidates();
    });
    document.getElementById("candidate-level-filter").addEventListener("change", (event) => {
      state.candidateLevel = event.target.value;
      renderCandidates();
    });
    document.getElementById("candidate-risk-filter").addEventListener("change", (event) => {
      state.candidateRisk = event.target.value;
      renderCandidates();
    });
    bindDiagnosisButtons(document.getElementById("panel-candidates"));
  }

  function handleDiagnosisSearch() {
    const input = document.getElementById("diagnosis-input");
    const keyword = input.value.trim();
    const hit = Object.values(appData.diagnoses).find((item) => item.code === keyword || item.name.includes(keyword));
    if (hit) {
      state.diagnosisKey = hit.code;
      renderDiagnosis();
    } else {
      input.value = "";
      input.placeholder = "未找到示例股票，请输入 300001 / 300002 / 600003";
    }
  }

  function renderDiagnosis() {
    const d = appData.diagnoses[state.diagnosisKey];
    const quickOptions = Object.values(appData.diagnoses)
      .map((item) => `<span class="toolbar-chip ${item.code === d.code ? "active" : ""}" data-pick-diagnosis="${item.code}">${item.name}</span>`)
      .join("");

    document.getElementById("panel-diagnosis").innerHTML = `
      <div class="grid two">
        <div class="card">
          <div class="card-kicker">个股极简诊断</div>
          <h2>输入股票后给你结构化判断</h2>
          <div class="search-box">
            <input value="${d.code}" aria-label="股票代码" id="diagnosis-input" />
            <button class="btn" id="diagnosis-search-btn">立即诊断</button>
          </div>
          <div class="toolbar">${quickOptions}</div>
          <div class="candidate-item">
            <div class="item-head">
              <div>
                <div class="item-title">${d.name} <span class="tiny">${d.code}</span></div>
                <p>${d.summary}</p>
              </div>
              <span class="badge brand">${d.sector}</span>
            </div>
            <div class="meta-row">
              <span class="badge accent">趋势：${d.trend}</span>
              <span class="badge brand">强弱：${d.strength}</span>
            </div>
            <div class="point-grid">
              <div class="point"><div class="point-label">观察区间</div><div class="point-value">${d.observe}</div></div>
              <div class="point"><div class="point-label">支撑位</div><div class="point-value">${d.support}</div></div>
              <div class="point"><div class="point-label">压力位</div><div class="point-value">${d.pressure}</div></div>
              <div class="point"><div class="point-label">止损位</div><div class="point-value">${d.stopLoss}</div></div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-kicker">理由与风险</div>
          <h2>为什么这样判断</h2>
          <div class="split" style="grid-template-columns:1fr; gap:20px;">
            <div><h4>主要理由</h4><ul class="list">${d.reasons.map((item) => `<li>${item}</li>`).join("")}</ul></div>
            <div><h4>风险提示</h4><ul class="list">${d.risks.map((item) => `<li>${item}</li>`).join("")}</ul></div>
            <div><h4>操作建议</h4><p class="meta" style="margin-top:12px;">${d.action}</p></div>
          </div>
        </div>
      </div>
      <div class="footer-note">诊断结果仅用于辅助理解个股当前状态，不构成收益承诺，也不替代用户独立决策。</div>
    `;

    document.getElementById("diagnosis-search-btn").addEventListener("click", handleDiagnosisSearch);
    document.getElementById("diagnosis-input").addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        handleDiagnosisSearch();
      }
    });
    document.querySelectorAll("[data-pick-diagnosis]").forEach((button) => {
      button.addEventListener("click", () => {
        state.diagnosisKey = button.dataset.pickDiagnosis;
        renderDiagnosis();
      });
    });
  }

  function renderWatch() {
    const tabs = [
      { key: "all", label: "全部" },
      { key: "stronger", label: "转强" },
      { key: "watching", label: "继续观察" },
      { key: "warning", label: "转弱预警" }
    ];
    const watchItems = appData.watchlist.filter((item) => state.watchStatus === "all" || item.statusKey === state.watchStatus);

    document.getElementById("panel-watch").innerHTML = `
      <div class="card">
        <div class="card-kicker">我的观察列表</div>
        <div class="card-title-row"><h2>跟踪你关心的股票状态变化</h2><span class="badge accent">${watchItems.length} 只当前可见</span></div>
        <div class="toolbar">
          ${tabs.map((item) => `<span class="toolbar-chip ${state.watchStatus === item.key ? "active" : ""}" data-watch-filter="${item.key}">${item.label}</span>`).join("")}
        </div>
        <div class="watch-list">
          ${watchItems.length ? watchItems.map((item) => `
            <div class="watch-item">
              <div class="item-head">
                <div>
                  <div class="item-title">${item.name} <span class="tiny">${item.code}</span></div>
                  <p>${item.reason}</p>
                </div>
                <span class="badge ${item.badge}">${item.status}</span>
              </div>
              <div class="meta-row"><span class="badge brand">${item.sector}</span></div>
              <p class="meta" style="margin-top:14px;">最新建议：${item.advice}</p>
              <div class="action-row"><button class="ghost-btn" data-go-diagnosis="${item.code}">查看诊股</button></div>
            </div>
          `).join("") : `<div class="empty-state">当前状态筛选下没有股票，可切换到其他状态查看。</div>`}
        </div>
      </div>
    `;

    document.querySelectorAll("[data-watch-filter]").forEach((chip) => {
      chip.addEventListener("click", () => {
        state.watchStatus = chip.dataset.watchFilter;
        renderWatch();
      });
    });
    bindDiagnosisButtons(document.getElementById("panel-watch"));
  }

  function renderReview() {
    document.getElementById("panel-review").innerHTML = `
      <div class="grid two">
        <div class="card">
          <div class="card-kicker">今日复盘</div>
          <h2>热点演化与候选表现</h2>
          <p class="summary-text">${appData.review.summary}</p>
          <div class="review-list">
            ${appData.review.candidateReview.map((item) => `
              <div class="review-item">
                <div class="item-head">
                  <div>
                    <div class="item-title">${item.name}</div>
                    <p>${item.note}</p>
                  </div>
                  <span class="badge ${item.badge}">${item.result}</span>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
        <div class="card">
          <div class="card-kicker">风险兑现与明日关注</div>
          <h2>今天哪里开始不舒服</h2>
          <div class="risk-list">
            ${appData.review.risks.map((item) => `<div class="risk-item"><p>${item}</p></div>`).join("")}
          </div>
          <div class="candidate-item" style="margin-top:16px;">
            <div class="item-title">明日关注方向</div>
            <p style="margin-top:10px;">${appData.review.nextFocus}</p>
          </div>
        </div>
      </div>
    `;
  }

  renderHome();
  renderCandidates();
  renderDiagnosis();
  renderWatch();
  renderReview();

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });
})();