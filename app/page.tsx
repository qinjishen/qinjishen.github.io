"use client";

import { useMemo, useState } from "react";
import {
  ATTACHMENT_GROUPS,
  ATTACHMENT_TYPES,
  TYPE_DIMENSIONS,
  getTypeProfile,
  type AttachmentGroup,
} from "./attachment-types";

const SAMPLE_CHAT = `我：你下班了吗？
对方：还没
我：今天是不是很累
对方：还好
我：那你先忙，忙完记得吃饭
对方：嗯
我：晚点还要打电话吗？
对方：再说吧`;

type Report = {
  score: number;
  title: string;
  subtitle: string;
  tags: string[];
  dimensions: { label: string; value: number; note: string }[];
  evidence: string[];
  suggestion: string;
};

function inspectChat(text: string): Report {
  const lines = text.split(/\n+/).filter((line) => line.trim());
  const shortReplies = lines.filter((line) =>
    /[：:]\s*(嗯|哦|好|行|随便|再说|还好|没事|不知道)[。！!？?…]*$/u.test(line.trim()),
  ).length;
  const questions = (text.match(/[？?]/g) || []).length;
  const careWords = (text.match(/吃饭|早点睡|累不累|到家|注意|没事吧|想你|晚安/g) || []).length;
  const apologyWords = (text.match(/对不起|抱歉|我的错|别生气/g) || []).length;
  const score = Math.max(
    18,
    Math.min(96, 38 + shortReplies * 9 + questions * 3 + careWords * 5 + apologyWords * 8),
  );

  if (score >= 78) {
    return {
      score,
      title: "恋爱耐力赛·全勤选手",
      subtitle: "你在聊天，对方在完成系统最低响应。先别急着加练，看看这场比赛有没有双人项目。",
      tags: ["高投入", "弱回应", "边界告急"],
      dimensions: [
        { label: "主动投入", value: 91, note: "话题、关心和台阶基本由一方承包" },
        { label: "回应热度", value: 24, note: "回复存在，但信息量像地铁到站提示" },
        { label: "情绪承接", value: 32, note: "接住了句号，没有接住情绪" },
        { label: "双向程度", value: 21, note: "目前更像单人球场，不太像双打" },
      ],
      evidence: ["连续提问多于有效回应", "关心表达集中在同一方", "短回复结束话题的次数偏多"],
      suggestion: "今天先少发一条解释，观察对方会不会主动补上那半步。",
    };
  }
  if (score >= 55) {
    return {
      score,
      title: "关系气氛组·长期编制",
      subtitle: "互动不算彻底失联，但热场、递话题和收拾冷场的活，似乎总落在同一个人头上。",
      tags: ["主动偏多", "偶有承接", "建议观察"],
      dimensions: [
        { label: "主动投入", value: 76, note: "总有人在认真维持聊天温度" },
        { label: "回应热度", value: 45, note: "没有消失，只是惜字如金" },
        { label: "情绪承接", value: 52, note: "偶尔能接住，偶尔直接漏球" },
        { label: "双向程度", value: 43, note: "暂时是一人发球，一人捡球" },
      ],
      evidence: ["提问与回应数量不太对称", "出现多次一句话终结话题", "仍然存在少量有效承接"],
      suggestion: "把“你怎么不理我”换成一个具体邀请，然后只问一次。",
    };
  }
  return {
    score,
    title: "暂未发现单方面加班",
    subtitle: "这段聊天还算有来有往。请继续保持，别为了测试结果临时制造矛盾。",
    tags: ["相对均衡", "有效回应", "拒绝内耗"],
    dimensions: [
      { label: "主动投入", value: 58, note: "双方都没有长期垄断主动权" },
      { label: "回应热度", value: 72, note: "回复能推动话题继续向前" },
      { label: "情绪承接", value: 68, note: "不只回答事情，也有照顾感受" },
      { label: "双向程度", value: 77, note: "看起来确实是两个人在聊天" },
    ],
    evidence: ["双方均有主动提问", "回复包含有效信息", "没有明显的单向道歉或追问"],
    suggestion: "正常聊天即可，不要沉迷测评，更不要为了刷高分临时表演。",
  };
}

export default function Home() {
  const [chat, setChat] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [typeFilter, setTypeFilter] = useState<AttachmentGroup | "all">("all");
  const [selectedTypeCode, setSelectedTypeCode] = useState("CTDR");
  const count = useMemo(() => chat.length, [chat]);
  const visibleTypes = useMemo(
    () => typeFilter === "all"
      ? ATTACHMENT_TYPES
      : ATTACHMENT_TYPES.filter((item) => item.group === typeFilter),
    [typeFilter],
  );
  const selectedType = ATTACHMENT_TYPES.find((item) => item.code === selectedTypeCode)
    ?? ATTACHMENT_TYPES[0];
  const selectedGroup = ATTACHMENT_GROUPS.find((item) => item.id === selectedType.group)!;

  const analyze = () => {
    if (chat.trim().length < 12) return;
    setLoading(true);
    setReport(null);
    window.setTimeout(() => {
      setReport(inspectChat(chat));
      setLoading(false);
      window.setTimeout(() => {
        document.querySelector("#report")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);
    }, 850);
  };

  const shareReport = async () => {
    if (!report) return;
    const text = `我在「舔了吗」的娱乐鉴定中获得 ${report.score} 分：${report.title}。${report.suggestion}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const helper = document.createElement("textarea");
        helper.value = text;
        helper.style.position = "fixed";
        helper.style.opacity = "0";
        document.body.appendChild(helper);
        helper.select();
        document.execCommand("copy");
        helper.remove();
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      const helper = document.createElement("textarea");
      helper.value = text;
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.select();
      const succeeded = document.execCommand("copy");
      helper.remove();
      setCopied(succeeded);
      if (succeeded) window.setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="舔了吗首页">
          舔了吗<span>✦</span>
        </a>
        <nav aria-label="主导航">
          <a href="#top" className="active">首页</a>
          <a href="#atlas">关系图鉴</a>
          <a href="#how">鉴定原理</a>
          <a href="#report">样例报告</a>
          <a href="#about">关于</a>
        </nav>
        <span className="not-diagnosis">非心理诊断</span>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">ISSUE 01 / 情感耐力测试</p>
          <h1>这段关系，<br />到底谁在硬撑？</h1>
          <p className="lead">粘贴一段聊天，看看你们是在谈恋爱，还是在参加耐力赛。</p>
          <div className="micro-tags" aria-label="产品特点">
            <span>本地分析</span>
            <span>拒绝上价值</span>
            <span>笑完就散</span>
          </div>
          <div className="orbital" aria-hidden="true"><span>情感耐力测试</span></div>
        </div>

        <div className="tester">
          <div className="tester-title">
            <span>把聊天扔进来</span>
            <i>✦</i>
          </div>
          <textarea
            value={chat}
            onChange={(event) => setChat(event.target.value.slice(0, 3000))}
            placeholder={SAMPLE_CHAT}
            aria-label="情侣聊天内容"
          />
          <div className="textarea-meta">
            <button type="button" onClick={() => setChat(SAMPLE_CHAT)}>填入示例</button>
            <span>{count}/3000</span>
          </div>
          <button
            className="analyze-button"
            type="button"
            onClick={analyze}
            disabled={chat.trim().length < 12 || loading}
          >
            <span>{loading ? "正在翻聊天记录…" : "开始鉴定"}</span>
            <span aria-hidden="true">→</span>
          </button>
          <p className="privacy">◉ 内容仅在当前浏览器内分析 · 默认不保存 · 请先隐去真实姓名</p>
        </div>
        <aside className="issue-rail" aria-hidden="true">
          <b>01</b><span>ISSUE 01 / 情感耐力测试</span>
        </aside>
      </section>

      {report && (
        <section className="quick-report" id="report" aria-live="polite">
          <div className="report-heading">
            <div className="report-score">
              <span>舔度指数</span>
              <strong>{report.score}</strong>
              <small>/ 100</small>
            </div>
            <div>
              <p className="report-kicker">本次娱乐鉴定结果 / NO. {String(report.score * 37).padStart(4, "0")}</p>
              <h2>{report.title}</h2>
              <p>{report.subtitle}</p>
              <div className="result-tags">
                {report.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
            </div>
          </div>

          <div className="report-grid">
            <div className="dimensions">
              <h3>互动切片</h3>
              {report.dimensions.map((item) => (
                <div className="dimension" key={item.label}>
                  <div><strong>{item.label}</strong><span>{item.value}</span></div>
                  <div className="bar"><i style={{ width: `${item.value}%` }} /></div>
                  <small>{item.note}</small>
                </div>
              ))}
            </div>
            <div className="report-notes">
              <div>
                <h3>系统为什么这么说</h3>
                <ul>{report.evidence.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <blockquote>
                <span>一句人话</span>
                {report.suggestion}
              </blockquote>
              <button type="button" className="share-button" onClick={shareReport}>
                {copied ? "已复制，去群里发癫吧" : "复制鉴定结果"} <span>↗</span>
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="atlas" id="atlas">
        <div className="atlas-intro">
          <div>
            <p className="eyebrow">RELATIONSHIP ATLAS / 关系互动图鉴</p>
            <h2>四个动作维度，<br />十六种关系姿势。</h2>
          </div>
          <div className="atlas-note">
            <strong>这是互动观察框架，不是临床依恋诊断。</strong>
            <p>类型描述的是人在一段关系里的当下策略，可能随对象、阶段和压力变化。目前聊天鉴定不会自动给你判型。</p>
          </div>
        </div>

        <div className="dimension-key" aria-label="类型代号说明">
          {TYPE_DIMENSIONS.map((dimension, index) => (
            <article key={dimension.key}>
              <span>0{index + 1}</span>
              <h3>{dimension.label}</h3>
              <div><b>{dimension.left}</b><i>/</i><b>{dimension.right}</b></div>
              <p>{dimension.description}</p>
            </article>
          ))}
        </div>

        <div className="atlas-toolbar">
          <div className="atlas-heading">
            <span>16 TYPES</span>
            <strong>选择一种，查看它正在关系里做什么</strong>
          </div>
          <div className="type-filters" aria-label="按互动底色筛选">
            <button
              type="button"
              className={typeFilter === "all" ? "selected" : ""}
              onClick={() => setTypeFilter("all")}
            >
              全部
            </button>
            {ATTACHMENT_GROUPS.map((group) => (
              <button
                type="button"
                className={typeFilter === group.id ? "selected" : ""}
                onClick={() => {
                  setTypeFilter(group.id);
                  const firstType = ATTACHMENT_TYPES.find((item) => item.group === group.id);
                  if (firstType) setSelectedTypeCode(firstType.code);
                }}
                key={group.id}
              >
                {group.label}
              </button>
            ))}
          </div>
        </div>

        <div className="type-grid">
          {visibleTypes.map((item) => {
            const group = ATTACHMENT_GROUPS.find((candidate) => candidate.id === item.group)!;
            return (
              <button
                type="button"
                className={`type-card type-${item.group} ${selectedType.code === item.code ? "selected" : ""}`}
                onClick={() => {
                  setSelectedTypeCode(item.code);
                  window.setTimeout(() => {
                    document.querySelector("#type-profile")?.scrollIntoView({
                      behavior: "smooth",
                      block: "nearest",
                    });
                  }, 0);
                }}
                aria-pressed={selectedType.code === item.code}
                key={item.code}
              >
                <span className="type-code">{item.code}</span>
                <span className="type-group">{group.label}</span>
                <strong>{item.name}</strong>
                <small>{item.tagline}</small>
                <i aria-hidden="true">↘</i>
              </button>
            );
          })}
        </div>

        <article className={`type-profile type-${selectedType.group}`} id="type-profile">
          <div className="profile-identity">
            <div className="profile-code">{selectedType.code}</div>
            <p>{selectedGroup.label} / {selectedType.tendency}</p>
            <h2>{selectedType.name}</h2>
            <blockquote>{selectedType.tagline}</blockquote>
            <p className="profile-summary">{selectedType.summary}</p>
          </div>

          <div className="profile-body">
            <div className="profile-dimensions">
              <h3>四维画像</h3>
              {getTypeProfile(selectedType.code).map((item) => (
                <div key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>

            <div className="profile-observation">
              <span className="profile-label">正在干什么</span>
              <h3>{selectedType.action}</h3>
              <dl>
                <div>
                  <dt>真正需要</dt>
                  <dd>{selectedType.need}</dd>
                </div>
                <div>
                  <dt>压力之下</dt>
                  <dd>{selectedType.stress}</dd>
                </div>
              </dl>
            </div>

            <div className="strategy-column">
              <h3>和 TA 相处</h3>
              <ul>{selectedType.partnerMoves.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
            <div className="strategy-column self">
              <h3>给自己的提醒</h3>
              <ul>{selectedType.selfMoves.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>

            <div className="similar-types">
              <span>相邻类型</span>
              <div>
                {selectedType.similar.map((code) => {
                  const item = ATTACHMENT_TYPES.find((candidate) => candidate.code === code)!;
                  return (
                    <button
                      type="button"
                      onClick={() => setSelectedTypeCode(code)}
                      key={code}
                    >
                      <b>{code}</b>{item.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="how" id="how">
        <div className="section-heading">
          <p className="eyebrow">HOW IT “WORKS” / 不保证工作</p>
          <h2>我们分析模式，<br />顺便分析一下笑点。</h2>
        </div>
        <div className="steps">
          <article>
            <span>01</span>
            <h3>数一数谁在热场</h3>
            <p>观察提问、关心和主动延续话题的次数，不把“秒回”直接等同于爱情。</p>
          </article>
          <article>
            <span>02</span>
            <h3>看看回应有没有内容</h3>
            <p>“嗯”“哦”“再说吧”都算回复，但未必算一次完整的人类交流。</p>
          </article>
          <article>
            <span>03</span>
            <h3>把内耗翻译成段子</h3>
            <p>结果只负责提供一个观察角度。恋爱不是标准化考试，也没有官方分数线。</p>
          </article>
        </div>
      </section>

      <section className="manifesto">
        <p>不劝分。不劝和。不预测出轨。</p>
        <h2>本网页最大的专业能力，<br />是让你先笑一下再做决定。</h2>
        <div className="ticker" aria-hidden="true">
          <span>仅供娱乐 · 不要截图只截对自己有利的部分 · 先隐去姓名 · 别拿测试结果吵架 · </span>
        </div>
      </section>

      <footer id="about">
        <strong>舔了吗</strong>
        <span>一个负责把恋爱内耗翻译成人话的娱乐网页。</span>
        <small>结果不代表心理学、医学或关系事实。</small>
      </footer>
    </main>
  );
}
