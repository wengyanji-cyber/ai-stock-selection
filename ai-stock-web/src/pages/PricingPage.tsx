function PricingPage() {
  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">订阅方案</span>
          <h1>卖的是效率、清晰判断和持续跟踪，不是收益承诺。</h1>
          <p>订阅方案页重点要让用户知道，付费买到的是节省时间、减少情绪交易和持续结构化观察。</p>
        </div>
      </section>
      <section className="three-col-grid">
        <article className="panel-card">
          <div className="section-kicker">观察版</div>
          <h2>29 元 / 月</h2>
          <p>适合先建立日常查看习惯的轻用户。</p>
        </article>
        <article className="panel-card emphasis-card">
          <div className="section-kicker">标准版</div>
          <h2>99 元 / 月</h2>
          <p>完整候选池、诊股、自选观察和盘后复盘，是 MVP 阶段主推方案。</p>
        </article>
        <article className="panel-card">
          <div className="section-kicker">进阶版</div>
          <h2>199 元 / 月</h2>
          <p>适合高频用户，但依然保持辅助判断定位，不越界到代客操盘。</p>
        </article>
      </section>
    </div>
  )
}

export default PricingPage