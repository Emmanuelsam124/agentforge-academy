import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { usePageSeo } from '../hooks/usePageSeo';

// Class walkthrough for AI Agent Mastery students (build an AI chief of staff).
// Same stepper/copy-button mechanics as DailyNewsSessionGuide.jsx; the CSS is
// scoped under #cos-guide so the two guides can't bleed into each other.

const CUSTOM_CSS = `
  :root{
    --bg-page:#FBFAFF;
    --bg:#FFFFFF;
    --surface:#FFFFFF;
    --surface-sunken:#F5F2FE;
    --surface-code:#1A1730;
    --text-code:#EDEBFA;
    --border:#E7E3F6;
    --border-strong:#D5CDF0;
    --text:#161231;
    --text-body:#48435F;
    --text-muted:#847FA1;
    --accent:#6D3FE0;
    --accent-hover:#5A31C4;
    --accent-soft:#EFE9FE;
    --on-accent:#FFFFFF;
    --success-bg:#E9F8EF;
    --success-text:#1B7A45;
    --success-border:#BFEACD;
    --shadow:rgba(30,16,74,0.08);
    --radius-lg:16px;
    --radius-md:10px;
    --radius-sm:7px;
  }
  @media (prefers-color-scheme: dark){
    :root:not([data-theme="light"]){
      --bg-page:#0C0A18;--bg:#161228;--surface:#171329;--surface-sunken:#201A3C;
      --surface-code:#0B0A16;--text-code:#E9E6F8;--border:#2C2650;--border-strong:#3B3468;
      --text:#F2F0FB;--text-body:#C6C1E0;--text-muted:#8E88B7;--accent:#A98BFF;
      --accent-hover:#BCA3FF;--accent-soft:#241D48;--on-accent:#150B33;
      --success-bg:#123625;--success-text:#6EDC9B;--success-border:#1E5B3C;--shadow:rgba(0,0,0,0.45);
    }
  }
  :root[data-theme="dark"]{
    --bg-page:#0C0A18;--bg:#161228;--surface:#171329;--surface-sunken:#201A3C;
    --surface-code:#0B0A16;--text-code:#E9E6F8;--border:#2C2650;--border-strong:#3B3468;
    --text:#F2F0FB;--text-body:#C6C1E0;--text-muted:#8E88B7;--accent:#A98BFF;
    --accent-hover:#BCA3FF;--accent-soft:#241D48;--on-accent:#150B33;
    --success-bg:#123625;--success-text:#6EDC9B;--success-border:#1E5B3C;--shadow:rgba(0,0,0,0.45);
  }
  #cos-guide *{box-sizing:border-box;}
  #cos-guide{background:var(--bg-page);color:var(--text);font-family:'Source Sans 3',system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
  #cos-guide h1,#cos-guide h2,#cos-guide h3{font-family:'Lexend',system-ui,sans-serif;text-wrap:balance;color:var(--text);margin:0;}
  #cos-guide p{margin:0;line-height:1.65;color:var(--text-body);}
  #cos-guide ul,#cos-guide ol{margin:0;padding:0;}
  #cos-guide button{font-family:inherit;cursor:pointer;}
  #cos-guide code,#cos-guide pre{font-family:'IBM Plex Mono',ui-monospace,monospace;}
  #cos-guide .shell{max-width:1180px;margin:0 auto;padding:0 20px 64px;}
  #cos-guide .topbar{position:sticky;top:0;z-index:30;background:var(--bg);border-bottom:1px solid var(--border);}
  #cos-guide .topbar-inner{max-width:1180px;margin:0 auto;padding:14px 20px;display:flex;align-items:center;gap:20px;}
  #cos-guide .eyebrow-link{font-size:13px;color:var(--text-muted);white-space:nowrap;font-weight:600;letter-spacing:.02em;}
  #cos-guide .progress-track{flex:1;height:6px;border-radius:99px;background:var(--surface-sunken);overflow:hidden;}
  #cos-guide .progress-fill{height:100%;background:linear-gradient(90deg,var(--accent),var(--accent-hover));border-radius:99px;transition:width .35s ease;}
  #cos-guide .topbar-right{display:flex;align-items:center;gap:14px;white-space:nowrap;}
  #cos-guide .step-counter{font-size:13px;color:var(--text-muted);font-variant-numeric:tabular-nums;}
  #cos-guide .btn-next,#cos-guide .btn-prev{border-radius:99px;font-weight:600;font-size:14px;padding:9px 18px;border:1px solid transparent;}
  #cos-guide .btn-next{background:var(--accent);color:var(--on-accent);}
  #cos-guide .btn-next:hover{background:var(--accent-hover);}
  #cos-guide .btn-prev{background:transparent;color:var(--text-body);border-color:var(--border-strong);}
  #cos-guide .btn-prev:hover{background:var(--surface-sunken);}
  #cos-guide .btn-prev:disabled{opacity:.4;cursor:default;}
  #cos-guide .btn-prev:disabled:hover{background:transparent;}
  #cos-guide .topbar .btn-next{padding:8px 16px;font-size:13px;}
  #cos-guide .layout{display:grid;grid-template-columns:270px minmax(0,1fr);gap:44px;align-items:start;padding-top:28px;}
  @media (max-width:880px){#cos-guide .layout{grid-template-columns:minmax(0,1fr);}}
  #cos-guide .sidebar{min-width:0;}
  #cos-guide .sidebar{position:sticky;top:84px;}
  @media (max-width:880px){#cos-guide .sidebar{position:static;}}
  #cos-guide .sidebar-head{margin-bottom:18px;}
  #cos-guide .sidebar-head .eyebrow{font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--accent);}
  #cos-guide .sidebar-head h2{font-size:19px;font-weight:700;margin-top:6px;line-height:1.3;}
  #cos-guide .step-nav{list-style:none;display:flex;flex-direction:column;gap:4px;}
  @media (max-width:880px){#cos-guide .step-nav{flex-direction:row;overflow-x:auto;gap:8px;padding-bottom:8px;margin:0 -4px;}}
  #cos-guide .step-nav-item{display:flex;align-items:center;gap:11px;padding:10px 12px;border-radius:var(--radius-md);cursor:pointer;border:1px solid transparent;}
  @media (max-width:880px){#cos-guide .step-nav-item{flex-direction:column;align-items:flex-start;min-width:150px;flex-shrink:0;}}
  #cos-guide .step-nav-item:hover{background:var(--surface-sunken);}
  #cos-guide .step-nav-item.active{background:var(--accent-soft);border-color:var(--border-strong);}
  #cos-guide .nav-dot{flex-shrink:0;width:24px;height:24px;border-radius:50%;background:var(--surface-sunken);border:1px solid var(--border-strong);color:var(--text-muted);font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;font-family:'Lexend',sans-serif;}
  #cos-guide .step-nav-item.active .nav-dot{background:var(--accent);border-color:var(--accent);color:var(--on-accent);}
  #cos-guide .step-nav-item.done .nav-dot{background:var(--success-bg);border-color:var(--success-border);color:var(--success-text);}
  #cos-guide .nav-text .nav-cat{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);}
  #cos-guide .nav-text .nav-title{font-size:14px;font-weight:600;color:var(--text);line-height:1.3;}
  #cos-guide .nav-text .nav-time{font-size:12px;color:var(--text-muted);}
  #cos-guide .sidebar-foot{margin-top:22px;padding-top:18px;border-top:1px solid var(--border);}
  #cos-guide .sidebar-foot .eyebrow{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);}
  #cos-guide .total-time{font-family:'Lexend',sans-serif;font-size:26px;font-weight:700;margin-top:4px;}
  #cos-guide .total-sub{font-size:13px;color:var(--text-muted);margin-top:2px;}
  #cos-guide .content{min-width:0;max-width:720px;}
  #cos-guide .step-cat{font-size:12px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--accent);}
  #cos-guide .step-title{font-size:30px;font-weight:700;margin-top:8px;line-height:1.2;}
  #cos-guide .step-dek{font-size:16px;color:var(--text-body);margin-top:12px;max-width:62ch;}
  #cos-guide .pill-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;}
  #cos-guide .pill{font-size:12.5px;font-weight:600;padding:5px 12px;border-radius:99px;background:var(--surface-sunken);border:1px solid var(--border);color:var(--text-body);}
  #cos-guide .block{margin-top:26px;}
  #cos-guide .card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:22px 24px;box-shadow:0 1px 2px var(--shadow);}
  #cos-guide .card-label{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);margin-bottom:14px;}
  #cos-guide .checklist{display:flex;flex-direction:column;gap:12px;}
  #cos-guide .checklist li{display:flex;align-items:flex-start;gap:11px;font-size:15px;color:var(--text-body);}
  #cos-guide .checklist input[type="checkbox"]{appearance:none;-webkit-appearance:none;width:19px;height:19px;flex-shrink:0;margin-top:1px;border-radius:5px;border:1.5px solid var(--border-strong);background:var(--surface);position:relative;cursor:pointer;}
  #cos-guide .checklist input[type="checkbox"]:checked{background:var(--accent);border-color:var(--accent);}
  #cos-guide .checklist input[type="checkbox"]:checked::after{content:"";position:absolute;left:5px;top:1px;width:5px;height:10px;border:solid var(--on-accent);border-width:0 2px 2px 0;transform:rotate(45deg);}
  #cos-guide .checklist .done-text{color:var(--text-muted);text-decoration:line-through;}
  #cos-guide .checkline{display:flex;align-items:flex-start;gap:11px;font-size:15px;}
  #cos-guide .check-glyph{color:var(--success-text);font-weight:700;flex-shrink:0;}
  #cos-guide h3.h-sub{font-size:18px;font-weight:700;margin-top:34px;margin-bottom:14px;}
  #cos-guide .concept{background:var(--surface-sunken);border:1px solid var(--border);border-radius:var(--radius-lg);padding:22px 24px;}
  #cos-guide .concept-eyebrow{font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--accent);}
  #cos-guide .concept h3{font-size:17px;font-weight:700;margin-top:7px;margin-bottom:11px;}
  #cos-guide .concept p+p{margin-top:11px;}
  #cos-guide .concept-list{margin-top:12px;display:flex;flex-direction:column;gap:8px;}
  #cos-guide .concept-list li{display:flex;gap:9px;font-size:14.5px;color:var(--text-body);}
  #cos-guide .concept-list li::before{content:"·";color:var(--accent);font-weight:700;flex-shrink:0;}
  #cos-guide .table-wrap{overflow-x:auto;border:1px solid var(--border);border-radius:var(--radius-lg);}
  #cos-guide table.compare{width:100%;border-collapse:collapse;font-size:14px;min-width:520px;}
  #cos-guide table.compare th,#cos-guide table.compare td{text-align:left;padding:12px 16px;border-bottom:1px solid var(--border);}
  #cos-guide table.compare th{font-family:'Lexend',sans-serif;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);background:var(--surface-sunken);}
  #cos-guide table.compare td{color:var(--text-body);}
  #cos-guide table.compare tr:last-child td{border-bottom:none;}
  #cos-guide table.compare td.hl,#cos-guide table.compare th.hl{color:var(--accent);font-weight:700;}
  #cos-guide .step-list{display:flex;flex-direction:column;gap:20px;}
  #cos-guide .step-item{display:flex;gap:16px;}
  #cos-guide .step-num{flex-shrink:0;width:30px;height:30px;border-radius:50%;background:var(--text);color:var(--bg);font-family:'Lexend',sans-serif;font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center;}
  @media (prefers-color-scheme:dark){:root:not([data-theme="light"]) #cos-guide .step-num{background:var(--accent);color:var(--on-accent);}}
  :root[data-theme="dark"] #cos-guide .step-num{background:var(--accent);color:var(--on-accent);}
  #cos-guide .step-body{flex:1;min-width:0;padding-top:3px;font-size:15.5px;color:var(--text-body);line-height:1.65;}
  #cos-guide .step-body strong{color:var(--text);}
  #cos-guide .step-body code,#cos-guide .inline-code{background:var(--surface-sunken);border:1px solid var(--border);border-radius:5px;padding:1.5px 6px;font-size:.88em;color:var(--text);}
  #cos-guide .step-body ul{margin-top:8px;padding-left:20px;list-style:disc;}
  #cos-guide .step-body li{margin-top:4px;}
  #cos-guide .prompt-block{margin-top:14px;border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--border-strong);}
  #cos-guide .prompt-head{display:flex;align-items:center;justify-content:space-between;background:#120F22;padding:9px 14px;}
  #cos-guide .prompt-head span{font-size:11px;font-weight:700;letter-spacing:.09em;color:#9C93C9;}
  #cos-guide .copy-btn{background:transparent;border:1px solid #3A3564;color:#D9D4F2;font-size:12px;font-weight:600;padding:4px 11px;border-radius:99px;}
  #cos-guide .copy-btn:hover{background:#211C40;}
  #cos-guide .copy-btn.copied{background:var(--success-text);border-color:var(--success-text);color:#08210F;}
  #cos-guide .prompt-block pre{margin:0;background:var(--surface-code);padding:16px 18px;overflow-x:auto;}
  #cos-guide .prompt-block code{display:block;background:transparent;border:0;padding:0;border-radius:0;color:var(--text-code);font-size:13.2px;line-height:1.7;white-space:pre;}
  #cos-guide .ph{color:#C9B8FF;font-style:italic;}
  #cos-guide .note{font-size:14.5px;color:var(--text-muted);margin-top:10px;line-height:1.6;}
  #cos-guide .note strong{color:var(--text-body);}
  #cos-guide .prompt-explain{margin-top:14px;font-size:14.5px;color:var(--text-body);background:var(--surface);border:1px solid var(--border);border-left:3px solid var(--accent);border-radius:0 var(--radius-sm) var(--radius-sm) 0;padding:13px 16px;line-height:1.65;}
  #cos-guide .prompt-explain strong{color:var(--text);}
  #cos-guide .tip{display:flex;gap:12px;background:var(--accent-soft);border-left:3px solid var(--accent);border-radius:0 var(--radius-md) var(--radius-md) 0;padding:14px 16px;margin-top:16px;}
  #cos-guide .tip-icon{font-size:19px;flex-shrink:0;}
  #cos-guide .tip p{font-size:14.5px;color:var(--text-body);}
  #cos-guide .tip strong{color:var(--text);}
  #cos-guide .accordion{margin-top:14px;border:1px solid var(--border);border-radius:var(--radius-md);background:var(--surface);}
  #cos-guide .accordion-trigger{width:100%;background:none;border:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;font-size:14.5px;font-weight:600;color:var(--text);text-align:left;}
  #cos-guide .accordion-chev{transition:transform .2s ease;color:var(--text-muted);flex-shrink:0;}
  #cos-guide .accordion.open .accordion-chev{transform:rotate(180deg);}
  #cos-guide .accordion-panel{max-height:0;overflow:hidden;transition:max-height .25s ease;}
  #cos-guide .accordion.open .accordion-panel{max-height:1600px;}
  #cos-guide .accordion-panel-inner{padding:0 16px 16px;font-size:14.5px;color:var(--text-body);line-height:1.65;}
  #cos-guide .accordion-panel-inner code{background:var(--surface-sunken);border:1px solid var(--border);border-radius:5px;padding:1.5px 6px;font-size:.9em;}
  #cos-guide .accordion-panel-inner .prompt-block code{background:transparent;border:0;padding:0;border-radius:0;color:var(--text-code);font-size:13.2px;}
  #cos-guide .go-further{margin-top:22px;border:1px dashed var(--border-strong);border-radius:var(--radius-md);background:var(--surface);}
  #cos-guide .go-further .accordion-trigger{font-weight:600;}
  #cos-guide .gf-label{font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);margin-right:9px;}
  #cos-guide .gf-diff{margin-left:9px;font-size:13px;letter-spacing:1px;opacity:.85;}
  #cos-guide .completion{margin-top:30px;display:flex;align-items:center;gap:16px;background:var(--success-bg);border:1px solid var(--success-border);border-radius:var(--radius-lg);padding:18px 22px;}
  #cos-guide .completion-icon{font-size:26px;flex-shrink:0;}
  #cos-guide .completion-title{font-size:15.5px;font-weight:700;color:var(--success-text);font-family:'Lexend',sans-serif;}
  #cos-guide .completion-sub{font-size:13.5px;color:var(--text-muted);margin-top:2px;}
  #cos-guide .step-footer{display:flex;justify-content:space-between;margin-top:40px;padding-top:22px;border-top:1px solid var(--border);}
  #cos-guide .mock-frame{margin-top:16px;border:1px solid var(--border-strong);border-radius:var(--radius-lg);overflow:hidden;background:#fff;}
  #cos-guide .mock-titlebar{background:#EFECEF;padding:8px 14px;font-size:12px;color:#6B677A;border-bottom:1px solid #E2DEE6;font-family:'IBM Plex Mono',monospace;}
  #cos-guide .mock-body{padding:22px;}
  #cos-guide .beat-h{font-family:'Lexend',sans-serif;font-weight:700;margin:0 0 14px;font-size:15.5px;}
  #cos-guide a{color:var(--accent);}
  #cos-guide .back-link{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:var(--text-muted);text-decoration:none;padding:10px 20px;}
  #cos-guide .back-link:hover{color:var(--accent);}
`;

const HTML_BODY = `
<div class="topbar">
  <div class="topbar-inner">
    <span class="eyebrow-link">AI AGENT MASTERY</span>
    <div class="progress-track"><div class="progress-fill" id="cos-progressFill"></div></div>
    <div class="topbar-right">
      <span class="step-counter" id="cos-stepCounter">1/10</span>
      <button class="btn-next" data-nav="next">Next →</button>
    </div>
  </div>
</div>

<div class="shell">
  <div class="layout">
    <nav class="sidebar">
      <div class="sidebar-head">
        <div class="eyebrow">Class Walkthrough</div>
        <h2>Build Your AI Chief of Staff</h2>
      </div>
      <ol class="step-nav">
        <li class="step-nav-item" data-target="intro"><span class="nav-dot">1</span><span class="nav-text"><span class="nav-cat">Intro</span><br><span class="nav-title">Before You Start</span></span></li>
        <li class="step-nav-item" data-target="install"><span class="nav-dot">2</span><span class="nav-text"><span class="nav-cat">Build 1</span><br><span class="nav-title">Install Your Agent</span></span></li>
        <li class="step-nav-item" data-target="brain"><span class="nav-dot">3</span><span class="nav-text"><span class="nav-cat">Build 2</span><br><span class="nav-title">Give It a Brain</span></span></li>
        <li class="step-nav-item" data-target="hands"><span class="nav-dot">4</span><span class="nav-text"><span class="nav-cat">Build 3</span><br><span class="nav-title">Give It Hands</span></span></li>
        <li class="step-nav-item" data-target="telegram"><span class="nav-dot">5</span><span class="nav-text"><span class="nav-cat">Build 4</span><br><span class="nav-title">Connect Telegram</span></span></li>
        <li class="step-nav-item" data-target="board"><span class="nav-dot">6</span><span class="nav-text"><span class="nav-cat">Build 5</span><br><span class="nav-title">Project Board</span></span></li>
        <li class="step-nav-item" data-target="squad"><span class="nav-dot">7</span><span class="nav-text"><span class="nav-cat">Build 6</span><br><span class="nav-title">Build Your Squad</span></span></li>
        <li class="step-nav-item" data-target="apps"><span class="nav-dot">8</span><span class="nav-text"><span class="nav-cat">Build 7</span><br><span class="nav-title">Connect Your Apps</span></span></li>
        <li class="step-nav-item" data-target="autopilot"><span class="nav-dot">9</span><span class="nav-text"><span class="nav-cat">Build 8</span><br><span class="nav-title">Put It on Autopilot</span></span></li>
        <li class="step-nav-item" data-target="finish"><span class="nav-dot">10</span><span class="nav-text"><span class="nav-cat">Wrap-up</span><br><span class="nav-title">Fix It &amp; Share It</span></span></li>
      </ol>
      <div class="sidebar-foot">
        <div class="eyebrow">Class build</div>
        <div class="total-time">8 builds</div>
        <div class="total-sub">One assistant that works while you're away</div>
      </div>
    </nav>

    <main class="content">

      <!-- INTRO -->
      <section class="step" data-step="intro">
        <div class="step-cat">Intro · Step 1 of 10</div>
        <h1 class="step-title">Build Your AI Chief of Staff</h1>
        <p class="step-dek">One message from your phone kicks off a whole team of agents — research, writing, review — all delegated by an assistant that lives on your own computer and gets better the longer it runs. This is the full walkthrough of what we build together in AI Agent Mastery.</p>

        <div class="block card">
          <div class="card-label">By the end of this walkthrough</div>
          <ul class="checklist">
            <li class="checkline"><span class="check-glyph">✓</span> An agent installed on your own computer and connected to a model of your choice</li>
            <li class="checkline"><span class="check-glyph">✓</span> A Telegram bot, so you can message your assistant from anywhere</li>
            <li class="checkline"><span class="check-glyph">✓</span> A project board that shows everything your assistant is working on</li>
            <li class="checkline"><span class="check-glyph">✓</span> A squad of specialist agents led by your chief of staff</li>
            <li class="checkline"><span class="check-glyph">✓</span> Gmail, Calendar and more connected through one secure door</li>
            <li class="checkline"><span class="check-glyph">✓</span> A morning briefing that lands on your phone at 8am, on its own</li>
          </ul>
        </div>

        <h3 class="h-sub">What you need before you start</h3>
        <div class="block card">
          <ul class="checklist">
            <li><input type="checkbox" data-key="need-computer"> <span>A Windows, Mac or Linux computer. Your assistant runs on it, so it needs to stay on for the scheduled jobs to run.</span></li>
            <li><input type="checkbox" data-key="need-model"> <span><strong>A model to power it.</strong> This is the one part of the build that can cost money: a ChatGPT Plus plan (what we use in class), or a Hermes subscription ($20, $100 or $200 plans — the $20 plan includes access to 200+ models). Claude also works but needs extra credits on top of your Claude plan.</span></li>
            <li><input type="checkbox" data-key="need-telegram"> <span>A Telegram account on your phone. It's free.</span></li>
            <li><input type="checkbox" data-key="need-apps"> <span>The accounts you want your assistant to reach — Gmail and Google Calendar to start. Notion, Obsidian and GitHub are optional extras.</span></li>
          </ul>
        </div>
        <p class="note"><strong>Context window:</strong> pick a model with at least 64,000 tokens of context. Every model on the plans above clears that comfortably.</p>

        <h3 class="h-sub">Opening concepts</h3>
        <div class="block concept">
          <div class="concept-eyebrow">Concept</div>
          <h3>What is Hermes Agent?</h3>
          <p>A model like ChatGPT or Claude is an engine — powerful, but on its own it just sits there. <strong>Hermes Agent</strong> is the rest of the car. It wraps around the model so it can actually do things for you: it runs on your own machine, uses your apps, and you message it like a real person.</p>
          <ul class="concept-list">
            <li>Every finished job is saved as a <strong>skill</strong> — a Markdown file in a folder on your computer. Next time, it reads that file instead of starting from scratch.</li>
            <li>That's why it behaves like an employee, not a tool: it gets more useful the longer it runs.</li>
            <li>It's model-agnostic, so you're never locked into one AI company.</li>
            <li>It can run fully local on your own Mac or PC, or hosted in the cloud.</li>
          </ul>
        </div>

        <div class="block concept">
          <div class="concept-eyebrow">Ground rule</div>
          <h3>You are still in charge</h3>
          <p>This is not a robot you hand your life to and walk away from. Throughout the build, we follow four habits:</p>
          <ul class="concept-list">
            <li>Give it access slowly — one thing at a time</li>
            <li>Check its work at every stage</li>
            <li>Never let it near anything that costs money or sends messages until you trust it</li>
            <li>Give access to one thing, watch it for a week, then give it more</li>
          </ul>
          <p>We'll point out the safety switches as we build.</p>
        </div>

        <div class="block concept">
          <div class="concept-eyebrow">The plan</div>
          <h3>The full build, in one look</h3>
          <div class="table-wrap" style="margin-top:14px;">
            <table class="compare">
              <tr><th>Build</th><th class="hl">What you set up</th></tr>
              <tr><td>1</td><td class="hl">Install your agent on your machine</td></tr>
              <tr><td>2</td><td class="hl">Connect a brain (primary + fallback) — keys in .env only</td></tr>
              <tr><td>3</td><td class="hl">Grant computer control slowly, keep /rollback in mind</td></tr>
              <tr><td>4</td><td class="hl">Connect Telegram so it reaches you anywhere</td></tr>
              <tr><td>5</td><td class="hl">Track everything on a project board</td></tr>
              <tr><td>6</td><td class="hl">Build a squad led by your chief of staff</td></tr>
              <tr><td>7</td><td class="hl">Plug in your apps through Composio</td></tr>
              <tr><td>8</td><td class="hl">Schedule the 8am briefing — then let it learn</td></tr>
            </table>
          </div>
        </div>

        <div class="step-footer">
          <button class="btn-prev" data-nav="prev" disabled>← Previous</button>
          <button class="btn-next" data-nav="next">Next →</button>
        </div>
      </section>

      <!-- BUILD 1 -->
      <section class="step" data-step="install" hidden>
        <div class="step-cat">Build 1 · Step 2 of 10</div>
        <h1 class="step-title">Build 1 — Install your agent</h1>
        <p class="step-dek">Download Hermes Agent and open it on your computer. Everything it does — skills, sessions, settings and keys — lives in a <span class="inline-code">.hermes</span> folder in your home directory.</p>
        <div class="pill-row"><span class="pill">Tool · Hermes Agent</span><span class="pill">Windows · Mac · Linux</span></div>

        <div class="block step-list">
          <div class="step-item"><div class="step-num">1</div><div class="step-body">Go to <span class="inline-code">hermes-agent.nousresearch.com</span> — the official site.</div></div>
          <div class="step-item"><div class="step-num">2</div><div class="step-body">Download the <strong>desktop app</strong> for your system. On Windows, run the installer. On Mac, open the installer and drag Hermes into Applications.</div></div>
          <div class="step-item"><div class="step-num">3</div><div class="step-body">Open Hermes. You should land on an empty chat, ready for a first session.</div></div>
        </div>

        <h3 class="h-sub">Prefer the terminal? (Mac / Linux)</h3>
        <p>The site also offers a one-line install. If you use it, paste this into your terminal:</p>
        <div class="prompt-block">
          <div class="prompt-head"><span>TERMINAL</span><button class="copy-btn">Copy</button></div>
          <pre><code>curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash</code></pre>
        </div>

        <div class="accordion">
          <button class="accordion-trigger">FYI — Hermes also has a web app<span class="accordion-chev">⌄</span></button>
          <div class="accordion-panel"><div class="accordion-panel-inner">In any session, ask Hermes to <span class="inline-code">Launch the web server for Hermes.</span> It starts a local server on your computer and gives you an address to open in a browser. You get the same things as the desktop app: chats, sessions, files, models, logs, cron jobs, skills, plugins and MCP.</div></div>
        </div>

        <div class="completion">
          <div class="completion-icon">💻</div>
          <div><div class="completion-title">Build 1 complete</div><div class="completion-sub">Hermes is installed and opens on your computer</div></div>
        </div>

        <div class="step-footer">
          <button class="btn-prev" data-nav="prev">← Previous</button>
          <button class="btn-next" data-nav="next">Next →</button>
        </div>
      </section>

      <!-- BUILD 2 -->
      <section class="step" data-step="brain" hidden>
        <div class="step-cat">Build 2 · Step 3 of 10</div>
        <h1 class="step-title">Build 2 — Give it a brain</h1>
        <p class="step-dek">Connect a model, add a second one as a safety net, and learn the one rule that protects every key you'll ever give your assistant.</p>
        <div class="pill-row"><span class="pill">Tool · Terminal</span><span class="pill">Model · ChatGPT / Grok</span></div>

        <div class="block concept">
          <div class="concept-eyebrow">Concept</div>
          <h3>Why a fallback model?</h3>
          <p>Every AI provider has outages and usage limits. If your assistant has only one model and it runs out, your whole system stops. With a second model set as the fallback, work continues automatically.</p>
        </div>

        <h3 class="h-sub">Connect your main model</h3>
        <div class="block step-list">
          <div class="step-item"><div class="step-num">1</div><div class="step-body">Open a terminal and run the model picker:
            <div class="prompt-block">
              <div class="prompt-head"><span>TERMINAL</span><button class="copy-btn">Copy</button></div>
              <pre><code>hermes model</code></pre>
            </div>
          </div></div>
          <div class="step-item"><div class="step-num">2</div><div class="step-body">Choose your provider. Using ChatGPT Plus? Select <strong>OpenAI Codex</strong> — <em>not</em> "OpenAI API."</div></div>
          <div class="step-item"><div class="step-num">3</div><div class="step-body">Pick the login option. Your browser opens — sign in with your ChatGPT account, then return to the terminal.</div></div>
          <div class="step-item"><div class="step-num">4</div><div class="step-body">Pick the model you want (in class we use GPT 5.6), start a new session, and say <span class="inline-code">hi</span>. If it answers, your brain is connected.</div></div>
        </div>

        <h3 class="h-sub">Add a second model and set the fallback</h3>
        <div class="block step-list">
          <div class="step-item"><div class="step-num">1</div><div class="step-body">Run <span class="inline-code">hermes model</span> again and select <strong>xAI Grok</strong>. Authorize it in the browser. Grok needs API credits or a SuperGrok / X Premium+ plan.</div></div>
          <div class="step-item"><div class="step-num">2</div><div class="step-body">Pick a Grok model (we use Grok 4.5).</div></div>
          <div class="step-item"><div class="step-num">3</div><div class="step-body">In Hermes, go to <strong>Settings → Model → Fallback Model</strong> and choose your Grok model. Recommended setup: <strong>GPT as primary, Grok as fallback.</strong></div></div>
        </div>
        <div class="tip"><span class="tip-icon">💡</span><p><strong>No second subscription?</strong> That's fine. The fallback is optional — you can complete the entire walkthrough with a single model and add the safety net later.</p></div>

        <h3 class="h-sub">The key-safety rule</h3>
        <div class="block concept">
          <div class="concept-eyebrow">Critical</div>
          <h3>Never paste an API key into the chat</h3>
          <p>Anything you type in chat is sent to the model <em>and</em> saved as plain text in your session history. A leaked chat or a shared screen means your keys are exposed. Instead, store every key with this terminal command — it writes the key into the <span class="inline-code">.env</span> file in your Hermes folder, where your agent can use it without it ever appearing in a message:</p>
          <div class="prompt-block" style="margin-top:12px;">
            <div class="prompt-head"><span>TERMINAL — STORE A KEY SAFELY</span><button class="copy-btn">Copy</button></div>
            <pre><code>hermes config set <span class="ph">SOME_API_KEY</span> <span class="ph">your_key_here</span></code></pre>
          </div>
          <p>You'll use this exact pattern again in Build 5.</p>
        </div>

        <div class="completion">
          <div class="completion-icon">🧠</div>
          <div><div class="completion-title">Build 2 complete</div><div class="completion-sub">Your agent has a brain, a backup, and a safe way to hold keys</div></div>
        </div>

        <div class="step-footer">
          <button class="btn-prev" data-nav="prev">← Previous</button>
          <button class="btn-next" data-nav="next">Next →</button>
        </div>
      </section>

      <!-- BUILD 3 -->
      <section class="step" data-step="hands" hidden>
        <div class="step-cat">Build 3 · Step 4 of 10</div>
        <h1 class="step-title">Build 3 — Give it hands</h1>
        <p class="step-dek">Let your agent control your computer — one permission at a time, with each one explained before you approve it.</p>
        <div class="pill-row"><span class="pill">Tool · Hermes computer use</span></div>

        <div class="block step-list">
          <div class="step-item"><div class="step-num">1</div><div class="step-body">Start a new session in Hermes and paste this prompt:
            <div class="prompt-block">
              <div class="prompt-head"><span>PROMPT — PASTE IN HERMES</span><button class="copy-btn">Copy</button></div>
              <pre><code>Help me set up Hermes computer use so you can control this computer.

Walk me through any permissions I need to grant, one at a time, and tell me
what each one lets you do before I approve it.</code></pre>
            </div>
          </div></div>
          <div class="step-item"><div class="step-num">2</div><div class="step-body">Your operating system will ask for permissions — on Mac, things like screen recording and accessibility. Let Hermes explain each one, then approve them one by one.</div></div>
        </div>

        <div class="prompt-explain"><strong>Why ask it to explain each permission?</strong> Not because it's too dangerous — because you should always know exactly what you just handed over. Use the same habit for everything you build from here on.</div>

        <h3 class="h-sub">Three safety switches</h3>
        <div class="block card">
          <ul class="checklist">
            <li class="checkline"><span class="check-glyph">1</span> <span><strong>Checkpoints.</strong> Hermes snapshots your files before changing them. If it makes a mess, type <span class="inline-code">/rollback</span> in the chat to undo it.</span></li>
            <li class="checkline"><span class="check-glyph">2</span> <span><strong>Sandbox.</strong> Run Hermes inside Docker if you want it fully contained.</span></li>
            <li class="checkline"><span class="check-glyph">3</span> <span><strong>Common sense.</strong> Don't connect your bank, and don't let it send emails on day one.</span></li>
          </ul>
        </div>
        <div class="tip"><span class="tip-icon">🛡️</span><p><strong>The rule of one.</strong> Give access to ONE thing, watch it for a week, then give it more.</p></div>

        <div class="completion">
          <div class="completion-icon">🖐️</div>
          <div><div class="completion-title">Build 3 complete</div><div class="completion-sub">Computer control is set up, with safety switches in your back pocket</div></div>
        </div>

        <div class="step-footer">
          <button class="btn-prev" data-nav="prev">← Previous</button>
          <button class="btn-next" data-nav="next">Next →</button>
        </div>
      </section>

      <!-- BUILD 4 -->
      <section class="step" data-step="telegram" hidden>
        <div class="step-cat">Build 4 · Step 5 of 10</div>
        <h1 class="step-title">Build 4 — Connect Telegram</h1>
        <p class="step-dek">Talk to your assistant from your phone, from anywhere. Without this, you've built a very expensive chat window.</p>
        <div class="pill-row"><span class="pill">Tool · Telegram (Free)</span></div>

        <div class="block concept">
          <div class="concept-eyebrow">Concept</div>
          <h3>Why Telegram?</h3>
          <p>The whole point of an assistant is that it works while you're away from your desk. Telegram lets you message it like a person — and lets it message you first, which is how your morning briefing will arrive in Build 8.</p>
        </div>

        <div class="block step-list">
          <div class="step-item"><div class="step-num">1</div><div class="step-body">Open Telegram and search for <strong>BotFather</strong> — Telegram's official bot-management bot. Press <strong>Start</strong>.</div></div>
          <div class="step-item"><div class="step-num">2</div><div class="step-body">Send this command to BotFather:
            <div class="prompt-block">
              <div class="prompt-head"><span>TELEGRAM — IN THE BOTFATHER CHAT</span><button class="copy-btn">Copy</button></div>
              <pre><code>/newbot</code></pre>
            </div>
          </div></div>
          <div class="step-item"><div class="step-num">3</div><div class="step-body">Give your bot a name and a username. The username must end in <strong>"bot."</strong> BotFather replies with an <strong>HTTP API token</strong> — copy it. Treat it like a password.</div></div>
          <div class="step-item"><div class="step-num">4</div><div class="step-body">In Hermes, go to <strong>Messaging → Telegram</strong>, paste the bot token and save. Or do it from the terminal:
            <div class="prompt-block">
              <div class="prompt-head"><span>TERMINAL</span><button class="copy-btn">Copy</button></div>
              <pre><code>hermes gateway setup</code></pre>
            </div>
          </div></div>
          <div class="step-item"><div class="step-num">5</div><div class="step-body">Open your new bot in Telegram and press <strong>Start</strong>. It gives you a <strong>pairing code</strong>. Send this to Hermes, with your code in place:
            <div class="prompt-block">
              <div class="prompt-head"><span>PROMPT — PASTE IN HERMES</span><button class="copy-btn">Copy</button></div>
              <pre><code>I'm connecting my Telegram bot and I got this pairing code: <span class="ph">[PASTE CODE]</span>
Can you finish the connection?</code></pre>
            </div>
          </div></div>
          <div class="step-item"><div class="step-num">6</div><div class="step-body">Test it from your <strong>phone</strong>, not your laptop. Send your bot a <span class="inline-code">hi</span> — it should reply.</div></div>
        </div>

        <div class="accordion">
          <button class="accordion-trigger">Gateway stuck restarting after you added the token?<span class="accordion-chev">⌄</span></button>
          <div class="accordion-panel"><div class="accordion-panel-inner">Let Hermes diagnose itself. Paste: <span class="inline-code">My Hermes gateway is stuck restarting after I added my Telegram bot token. Check the logs in ~/.hermes/logs/ and tell me what's failing, then fix it.</span></div></div>
        </div>

        <div class="completion">
          <div class="completion-icon">📱</div>
          <div><div class="completion-title">Build 4 complete</div><div class="completion-sub">You can now reach your assistant from anywhere</div></div>
        </div>

        <div class="step-footer">
          <button class="btn-prev" data-nav="prev">← Previous</button>
          <button class="btn-next" data-nav="next">Next →</button>
        </div>
      </section>

      <!-- BUILD 5 -->
      <section class="step" data-step="board" hidden>
        <div class="step-cat">Build 5 · Step 6 of 10</div>
        <h1 class="step-title">Build 5 — Give it a project board</h1>
        <p class="step-dek">Connect Multica so every request you make becomes a card on a board — a paper trail instead of a chat log — and turn Hermes into your chief of staff.</p>
        <div class="pill-row"><span class="pill">Tool · Multica (Free, open source)</span></div>

        <div class="block concept">
          <div class="concept-eyebrow">A working method from here on</div>
          <h3>Let your agent do the setup</h3>
          <p>Stop clicking through settings one by one. Your agent has computer access, a browser, and can read documentation. From here, hand it the setup task and let it do the work — and you stay in charge by checking each result.</p>
        </div>

        <div class="block concept">
          <div class="concept-eyebrow">Concept</div>
          <h3>What is Multica?</h3>
          <p>An open-source board where AI agents are treated like teammates — tickets, comments and cards. It works with Hermes, Claude Code and Codex. Normally your agent works invisibly in a chat window; with Multica, every action fires a hook and updates the board, so you can always see what it's doing.</p>
        </div>

        <div class="block step-list">
          <div class="step-item"><div class="step-num">1</div><div class="step-body">Go to <span class="inline-code">multica.ai</span> and download the desktop app for your system. Install it and sign in.</div></div>
          <div class="step-item"><div class="step-num">2</div><div class="step-body">In Multica, go to <strong>Settings → API Tokens</strong> and create a new token. Set it to no expiry, then copy it.</div></div>
          <div class="step-item"><div class="step-num">3</div><div class="step-body">Store it using the same safe rule from Build 2. Do this in the <strong>terminal, not the chat</strong>:
            <div class="prompt-block">
              <div class="prompt-head"><span>TERMINAL</span><button class="copy-btn">Copy</button></div>
              <pre><code>hermes config set MULTICA_API_KEY <span class="ph">your_key_here</span></code></pre>
            </div>
            <div class="note">Tip: type the command in a text editor first, with your key filled in, then paste it into the terminal. The key goes into your <span class="inline-code">.env</span> file and never appears in a message.</div>
          </div></div>
          <div class="step-item"><div class="step-num">4</div><div class="step-body">Start a new Hermes session and paste this prompt to make it your chief of staff:
            <div class="prompt-block">
              <div class="prompt-head"><span>PROMPT — PASTE IN HERMES</span><button class="copy-btn">Copy</button></div>
              <pre><code>I've saved my Multica API key in my environment as MULTICA_API_KEY.

I want you to be my AI project manager and my chief of staff.

Set up a hook so that every time I ask you to do something, you update my
Multica project board and create an issue for what I'm trying to do. If it
relates to a new project, create that project.

Everything I ask you should be tracked in Multica. Read the key from the
environment to set all of that up. Do not print the key, echo it back, or
write it into any file, issue or comment.

Create one test issue and move it across the board to done so I can see it
working.

I also want to be able to talk to you through Multica, so set up whatever
hooks are needed for that.</code></pre>
            </div>
          </div></div>
        </div>

        <div class="prompt-explain"><strong>What you should see:</strong> every request you make becomes a card. It sits in <strong>To Do</strong>, moves to <strong>In Progress</strong> while Hermes works, then to <strong>In Review</strong> for you to check. You move it to <strong>Done</strong>. Notice the line telling it never to print or store the key — you're building the safe habit into the prompt itself.</div>

        <div class="completion">
          <div class="completion-icon">📋</div>
          <div><div class="completion-title">Build 5 complete</div><div class="completion-sub">Every request you make is now tracked on a board</div></div>
        </div>

        <div class="step-footer">
          <button class="btn-prev" data-nav="prev">← Previous</button>
          <button class="btn-next" data-nav="next">Next →</button>
        </div>
      </section>

      <!-- BUILD 6 -->
      <section class="step" data-step="squad" hidden>
        <div class="step-cat">Build 6 · Step 7 of 10</div>
        <h1 class="step-title">Build 6 — Build your squad</h1>
        <p class="step-dek">Turn one assistant into a team: a leader who takes your request, works out who should do what, and reports back when it's done.</p>
        <div class="pill-row"><span class="pill">Tool · Multica squads</span></div>

        <div class="block concept">
          <div class="concept-eyebrow">Concept</div>
          <h3>What is a squad?</h3>
          <p>A squad is a group of agents with a leader. You assign work to the squad; the leader decides which member does what. Your chief of staff is the leader — and each member is set up for one kind of work.</p>
        </div>

        <div class="block step-list">
          <div class="step-item"><div class="step-num">1</div><div class="step-body">Open a new Hermes session and paste this prompt:
            <div class="prompt-block">
              <div class="prompt-head"><span>PROMPT — PASTE IN HERMES</span><button class="copy-btn">Copy</button></div>
              <pre><code>Create a squad in Multica called "Core Team" with you as the leader agent.

Add my other agents as members, and set each one up for a specific kind of
work:

- Research and planning: Claude Opus. Use this for deep research, competitor
  analysis, and anything that needs a plan before work starts.
- Design: Claude Opus.
- Image generation: Codex with GPT Image 2.
- Coding and video editing: Claude Code. Use Opus for complex work and Sonnet
  for simple or repetitive work.

When I assign work to the squad, decide which member should do it based on
these rules, delegate it to them, and report back to me when it's done.

If a task spans more than one member, break it into sub-tasks, route each one,
and tell me the order you're running them in before you start.

If a task doesn't clearly fit any member, ask me rather than guessing.</code></pre>
            </div>
          </div></div>
          <div class="step-item"><div class="step-num">2</div><div class="step-body">Open Multica. You should see a board with your chief of staff as the leader and one member per specialty — research, design, images, coding and video.</div></div>
        </div>

        <div class="prompt-explain"><strong>How this prompt works:</strong> it gives the leader <em>routing rules</em> — which member handles which kind of work. The last two paragraphs matter most: the leader must tell you its plan <em>before</em> it starts a multi-part job, and must ask you instead of guessing when a task doesn't fit. Those two lines are your guardrails.</div>

        <div class="accordion">
          <button class="accordion-trigger">Don't have Claude, Codex or Claude Code?<span class="accordion-chev">⌄</span></button>
          <div class="accordion-panel"><div class="accordion-panel-inner">Adapt the member list to the models and tools you actually have access to. The squad pattern works the same with any combination — the point is one leader plus specialists with clear rules, not these specific model names.</div></div>
        </div>

        <div class="completion">
          <div class="completion-icon">👥</div>
          <div><div class="completion-title">Build 6 complete</div><div class="completion-sub">You have a squad with a chief of staff as its leader</div></div>
        </div>

        <div class="step-footer">
          <button class="btn-prev" data-nav="prev">← Previous</button>
          <button class="btn-next" data-nav="next">Next →</button>
        </div>
      </section>

      <!-- BUILD 7 -->
      <section class="step" data-step="apps" hidden>
        <div class="step-cat">Build 7 · Step 8 of 10</div>
        <h1 class="step-title">Build 7 — Connect your apps with Composio</h1>
        <p class="step-dek">One secure door to Gmail, Google Calendar, Notion, Obsidian, GitHub and over a thousand other apps — instead of wiring each one in separately.</p>
        <div class="pill-row"><span class="pill">Tool · Composio (Free, open source)</span><span class="pill">1000+ integrations</span></div>

        <div class="block concept">
          <div class="concept-eyebrow">Concept</div>
          <h3>Why Composio instead of connecting apps one by one?</h3>
          <p>Logging into Gmail, Notion and GitHub one at a time is slow to set up, and the connections break often — then you babysit the fixes. Composio lets you connect once and tick the apps you want.</p>
          <p><strong>The hidden benefit is cost.</strong> Every connected tool's description is sent with <em>every</em> message and eats your context window. Fifty directly connected tools means paying for fifty descriptions every time you say "hello" — slower, costlier, and more likely to pick the wrong tool. Composio sits in front of everything and pulls in only the tool that's actually needed: one door instead of a thousand.</p>
        </div>

        <h3 class="h-sub">Step 1 — Create a temporary Composio API key</h3>
        <div class="block step-list">
          <div class="step-item"><div class="step-num">1</div><div class="step-body">Create a free account at <span class="inline-code">composio.dev</span> and sign in to the dashboard.</div></div>
          <div class="step-item"><div class="step-num">2</div><div class="step-body">Go to <strong>Settings → API Keys</strong> (<span class="inline-code">dashboard.composio.dev/~/project/settings/api-keys</span>) and create a new key. Copy it.</div></div>
          <div class="step-item"><div class="step-num">3</div><div class="step-body">Treat this key as <strong>short-lived</strong>: it's only for this class build. When you're done, come back to the same page and delete it (or regenerate it) so the copy in your chat history stops working.</div></div>
        </div>

        <div class="block concept">
          <div class="concept-eyebrow">The one exception to the key rule</div>
          <h3>Why it's okay to give this key straight to Hermes</h3>
          <p>In Build 2 you learned to never paste an API key into the chat, because chat text is saved in your session history. That rule is for keys that stay valid. Here, the key is created for this build and thrown away afterwards, so a copy left in your history is worth nothing once you delete it. Never do this with a key you plan to keep using — keep those in <span class="inline-code">.env</span> with <span class="inline-code">hermes config set</span>.</p>
        </div>

        <h3 class="h-sub">Step 2 — Give Hermes the key and let it connect your apps</h3>
        <div class="block step-list">
          <div class="step-item"><div class="step-num">1</div><div class="step-body">Open a Hermes session and paste this prompt, with your temporary key in place:
            <div class="prompt-block">
              <div class="prompt-head"><span>PROMPT — PASTE IN HERMES</span><button class="copy-btn">Copy</button></div>
              <pre><code>Help me connect Composio so you can access my other apps.

Here is a short-lived Composio API key I created just for this setup:
<span class="ph">[PASTE KEY]</span>

Use it to install and connect Composio, then walk me through authorising
these one at a time: Gmail, Google Calendar, Notion, Obsidian, and GitHub.

After each one, run a small read only test and show me the result so I know it
worked. Do not send, delete or modify anything.</code></pre>
            </div>
          </div></div>
          <div class="step-item"><div class="step-num">2</div><div class="step-body">Authorize each app as Hermes asks — usually by clicking <strong>Approve</strong> on a Google or GitHub sign-in page.</div></div>
          <div class="step-item"><div class="step-num">3</div><div class="step-body">After each app, Hermes runs a small <strong>read-only test</strong> and shows you the result — for example, today's calendar or your latest emails. That's how you know it really worked.</div></div>
          <div class="step-item"><div class="step-num">4</div><div class="step-body">Once all your apps pass, go back to the Composio API Keys page and delete the temporary key.</div></div>
        </div>
        <p class="note">Prefer to keep the key out of the chat entirely? Store it from the terminal instead — <span class="inline-code">hermes config set COMPOSIO_API_KEY your_key_here</span> — and change the prompt to say the key is saved as <span class="inline-code">COMPOSIO_API_KEY</span>.</p>

        <div class="accordion go-further">
          <button class="accordion-trigger"><span><span class="gf-label">Go further</span>Install the Composio CLI on Windows<span class="gf-diff">🛠️🛠️</span></span><span class="accordion-chev">⌄</span></button>
          <div class="accordion-panel"><div class="accordion-panel-inner">
            <p>Optional — you don't need this for the class build. Composio's CLI doesn't run natively on Windows; it runs inside <strong>WSL</strong> (Windows Subsystem for Linux), which is a Linux terminal built into Windows.</p>
            <p style="margin-top:12px;"><strong>1. Install WSL.</strong> Open PowerShell as Administrator (right-click PowerShell → Run as administrator), run this, and restart your computer when it asks:</p>
            <div class="prompt-block">
              <div class="prompt-head"><span>POWERSHELL (ADMINISTRATOR)</span><button class="copy-btn">Copy</button></div>
              <pre><code>wsl --install</code></pre>
            </div>
            <p style="margin-top:12px;"><strong>2. Open the Ubuntu app</strong> from the Start menu (the first launch asks you to pick a username and password), then install Composio:</p>
            <div class="prompt-block">
              <div class="prompt-head"><span>UBUNTU (WSL)</span><button class="copy-btn">Copy</button></div>
              <pre><code>curl -fsSL https://composio.dev/install | sh</code></pre>
            </div>
            <p style="margin-top:12px;"><strong>3. Open a new Ubuntu window</strong> so the install takes effect, and check it worked:</p>
            <div class="prompt-block">
              <div class="prompt-head"><span>UBUNTU (WSL)</span><button class="copy-btn">Copy</button></div>
              <pre><code>composio --version</code></pre>
            </div>
            <p style="margin-top:12px;"><strong>4. Log in</strong> — this opens your browser to sign in:</p>
            <div class="prompt-block">
              <div class="prompt-head"><span>UBUNTU (WSL)</span><button class="copy-btn">Copy</button></div>
              <pre><code>composio login</code></pre>
            </div>
            <p style="margin-top:12px;">Mac and Linux users can skip step 1 and run the install command from step 2 in their normal terminal.</p>
          </div></div>
        </div>

        <div class="prompt-explain"><strong>Why "read only"?</strong> It's the rule of one in action. Your assistant can look at your calendar and inbox before it's allowed to change anything. The prompt ends with <em>"Do not send, delete or modify anything"</em> on purpose — you widen access later, once you trust the results.</div>

        <div class="tip"><span class="tip-icon">💡</span><p><strong>Start with just Gmail and Calendar.</strong> Notion, Obsidian and GitHub are optional. Connect only the apps you'll actually use this week — you can always add more later.</p></div>

        <div class="completion">
          <div class="completion-icon">🔌</div>
          <div><div class="completion-title">Build 7 complete</div><div class="completion-sub">Your assistant can now see (and, once you allow it, act in) your apps</div></div>
        </div>

        <div class="step-footer">
          <button class="btn-prev" data-nav="prev">← Previous</button>
          <button class="btn-next" data-nav="next">Next →</button>
        </div>
      </section>

      <!-- BUILD 8 -->
      <section class="step" data-step="autopilot" hidden>
        <div class="step-cat">Build 8 · Step 9 of 10</div>
        <h1 class="step-title">Build 8 — Put it on autopilot</h1>
        <p class="step-dek">Set up a job that runs on a schedule without you. Your assistant sends a morning briefing to your phone at 8am — and learns from it.</p>
        <div class="pill-row"><span class="pill">Tool · Hermes cron jobs</span></div>

        <div class="block concept">
          <div class="concept-eyebrow">Concept</div>
          <h3>What is a cron job?</h3>
          <p>A cron job is a task that runs on a schedule, on its own. You don't set it up in a settings screen — you just text it to your assistant in plain English.</p>
        </div>

        <div class="block step-list">
          <div class="step-item"><div class="step-num">1</div><div class="step-body">From your phone in Telegram (or in a Hermes session), send this:
            <div class="prompt-block">
              <div class="prompt-head"><span>PROMPT — SEND TO HERMES</span><button class="copy-btn">Copy</button></div>
              <pre><code>Every morning at 8am, send me a morning briefing here.

Include:
- My calendar for today, with anything I should prepare before each meeting
- Any urgent or important emails from the last 24 hours, with links
- A short summary of what I should be focusing on today
- Two trending AI topics from X that I could make content about

Keep it short and practical. If there's nothing important in a section, skip
that section. If there's nothing important at all, just say so.

Send me an example now so I can see the format, then set up the schedule.</code></pre>
            </div>
          </div></div>
          <div class="step-item"><div class="step-num">2</div><div class="step-body">Hermes sends you a sample briefing straight away. Check the format. Want changes — tone, weather, extra tasks? Just reply in the Telegram chat.</div></div>
          <div class="step-item"><div class="step-num">3</div><div class="step-body">Open Multica and watch the task move: created → <strong>To Do</strong> → <strong>In Progress</strong> → <strong>Done</strong>, with a comment saying the job is scheduled.</div></div>
          <div class="step-item"><div class="step-num">4</div><div class="step-body">Confirm the job exists by listing your scheduled jobs in the terminal:
            <div class="prompt-block">
              <div class="prompt-head"><span>TERMINAL</span><button class="copy-btn">Copy</button></div>
              <pre><code>hermes cron list</code></pre>
            </div>
          </div></div>
        </div>

        <div class="prompt-explain"><strong>Notice the shape of the prompt:</strong> a schedule, a list of what to include, a length rule ("short and practical"), a rule for empty sections, and a request for a sample <em>before</em> it schedules anything. Asking for the example first is a safe way to catch a bad format before it repeats for a month.</div>

        <h3 class="h-sub">It learns — skills compound</h3>
        <div class="block concept">
          <div class="concept-eyebrow">Why this matters</div>
          <h3>The version you build today is the worst it will ever be</h3>
          <p>After the first briefing, Hermes automatically saves an "email briefing and triage" <strong>skill</strong> — a file describing how it did the job. The next time you ask for anything similar, it reads that file instead of starting from scratch. It researches, plans, does the thing, reviews it, and what it learns feeds the next run.</p>
        </div>

        <div class="accordion">
          <button class="accordion-trigger">The 8am briefing didn't arrive?<span class="accordion-chev">⌄</span></button>
          <div class="accordion-panel"><div class="accordion-panel-inner">Your computer needs to be on, and the Hermes gateway needs to be running — it's what triggers scheduled jobs. Run <span class="inline-code">hermes gateway status</span> first. See the troubleshooting section in the last step.</div></div>
        </div>

        <div class="completion">
          <div class="completion-icon">🚀</div>
          <div><div class="completion-title">Build 8 complete</div><div class="completion-sub">Your chief of staff is working on a schedule — and getting better each run</div></div>
        </div>

        <div class="step-footer">
          <button class="btn-prev" data-nav="prev">← Previous</button>
          <button class="btn-next" data-nav="next">Next →</button>
        </div>
      </section>

      <!-- FINISH -->
      <section class="step" data-step="finish" hidden>
        <div class="step-cat">Wrap-up · Step 10 of 10</div>
        <h1 class="step-title">Fix it &amp; share it</h1>
        <p class="step-dek">Know what to run when something breaks, then show the cohort what you built.</p>

        <h3 class="h-sub" style="margin-top:26px;">When something breaks</h3>
        <div class="block step-list">
          <div class="step-item"><div class="step-num">1</div><div class="step-body"><strong>Start with the doctor.</strong> It runs automated checks across every pipeline, workflow and process, and says "all checks passed" when things are healthy:
            <div class="prompt-block">
              <div class="prompt-head"><span>TERMINAL</span><button class="copy-btn">Copy</button></div>
              <pre><code>hermes doctor</code></pre>
            </div>
          </div></div>
          <div class="step-item"><div class="step-num">2</div><div class="step-body"><strong>Cron jobs not firing, or apps not responding?</strong> Check the gateway — it's what triggers scheduled jobs and talks to your apps:
            <div class="prompt-block">
              <div class="prompt-head"><span>TERMINAL</span><button class="copy-btn">Copy</button></div>
              <pre><code>hermes gateway status</code></pre>
            </div>
          </div></div>
          <div class="step-item"><div class="step-num">3</div><div class="step-body"><strong>Made a mess?</strong> Type <span class="inline-code">/rollback</span> in the chat to restore your files to the last checkpoint.</div></div>
        </div>
        <p class="note">Those checks take you from "it's broken and I don't know why" back to "it's working," most of the time.</p>

        <h3 class="h-sub">All the commands in one place</h3>
        <div class="prompt-block">
          <div class="prompt-head"><span>CHEAT SHEET</span><button class="copy-btn">Copy</button></div>
          <pre><code># connect or switch a model
hermes model

# store a key safely (never paste keys in chat)
hermes config set SOME_API_KEY your_key_here
hermes config set MULTICA_API_KEY your_key_here

# set up the messaging channel (Telegram)
hermes gateway setup

# see your scheduled jobs
hermes cron list

# when it breaks
hermes doctor
hermes gateway status</code></pre>
        </div>

        <h3 class="h-sub">Share what you built</h3>
        <div class="block card">
          <div class="card-label">Your finish line</div>
          <ul class="checklist">
            <li><input type="checkbox" data-key="share-msg"> <span>Messaged my assistant from my phone and got a reply</span></li>
            <li><input type="checkbox" data-key="share-board"> <span>Seen a request turn into a card on my Multica board</span></li>
            <li><input type="checkbox" data-key="share-apps"> <span>Connected at least Gmail or Calendar and passed the read-only test</span></li>
            <li><input type="checkbox" data-key="share-brief"> <span>Received a real morning briefing in Telegram</span></li>
            <li><input type="checkbox" data-key="share-community"> <span>Posted a screenshot in the AI Agent Mastery room of the community</span></li>
          </ul>
        </div>

        <div class="tip"><span class="tip-icon">💬</span><p><strong>Stuck, or want to show off?</strong> Post in the <strong>AI Agent Mastery</strong> room in your <a href="/dashboard/community">Student Community</a> — screenshots of a working assistant are how the rest of the cohort learns what's possible. For anything else, message us on <a href="https://wa.me/2349066006963" target="_blank" rel="noopener noreferrer">WhatsApp</a> (replies 10am–5pm WAT, Monday–Saturday).</p></div>

        <div class="completion" style="margin-top:30px;">
          <div class="completion-icon">🎉</div>
          <div><div class="completion-title">Walkthrough complete — nice work.</div><div class="completion-sub">You now own an assistant that keeps working after you close the laptop. Remember: give it access to one thing, watch it for a week, then give it more.</div></div>
        </div>

        <div class="step-footer">
          <button class="btn-prev" data-nav="prev">← Previous</button>
          <div></div>
        </div>
      </section>

    </main>
  </div>
</div>
`;

// Wired from the effect below as a plain function — NOT injected as an inline
// <script>: production's CSP (vercel.json) has script-src 'self' with no
// 'unsafe-inline', so an injected inline script is blocked and the stepper dies.
function initGuide() {
  const ROOT = document.getElementById('cos-guide');
  if (!ROOT) return () => {};
  const ORDER = ['intro', 'install', 'brain', 'hands', 'telegram', 'board', 'squad', 'apps', 'autopilot', 'finish'];
  const STORAGE_KEY = 'ai-chief-of-staff-guide-v1';
  const state = { current: 0, completed: {} };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p && p.completed) state.completed = p.completed;
      }
    } catch { /* storage unavailable (private mode) — progress just isn't remembered */ }
  }
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed: state.completed })); } catch { /* see loadState */ }
  }

  function render() {
    ORDER.forEach((id, i) => {
      const sec = ROOT.querySelector('.step[data-step="' + id + '"]');
      if (sec) sec.hidden = i !== state.current;
      const navItem = ROOT.querySelector('.step-nav-item[data-target="' + id + '"]');
      if (navItem) {
        navItem.classList.toggle('active', i === state.current);
        navItem.classList.toggle('done', !!state.completed[id] && i !== state.current);
        const dot = navItem.querySelector('.nav-dot');
        if (dot) dot.textContent = state.completed[id] && i !== state.current ? '✓' : String(i + 1);
      }
    });
    const pct = Math.round((state.current / (ORDER.length - 1)) * 100);
    const fill = document.getElementById('cos-progressFill');
    if (fill) fill.style.width = pct + '%';
    const isLast = state.current === ORDER.length - 1;
    const counter = document.getElementById('cos-stepCounter');
    if (counter) counter.textContent = isLast ? 'Done · ' + ORDER.length + '/' + ORDER.length : state.current + 1 + '/' + ORDER.length;
    ROOT.querySelectorAll('[data-nav="next"]').forEach((b) => { b.textContent = isLast ? 'Complete ✓' : 'Next →'; });
    ROOT.querySelectorAll('[data-nav="prev"]').forEach((b) => { b.disabled = state.current === 0; });
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function goTo(i) {
    if (i < 0 || i >= ORDER.length) return;
    if (i > state.current) {
      state.completed[ORDER[state.current]] = true;
      saveState();
    }
    state.current = i;
    render();
  }

  function legacyCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    let ok;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function copyFrom(btn) {
    const block = btn.closest('.prompt-block');
    const codeEl = block ? block.querySelector('code') : null;
    const text = codeEl ? codeEl.textContent : '';
    const original = btn.textContent;
    const flash = (msg, ok) => {
      btn.textContent = msg;
      btn.classList.toggle('copied', !!ok);
      setTimeout(() => { btn.textContent = original; btn.classList.remove('copied'); }, 1600);
    };
    if (legacyCopy(text)) flash('Copied!', true);
    else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => flash('Copied!', true), () => flash('Select & Ctrl+C', false));
    } else flash('Select & Ctrl+C', false);
  }

  // One delegated listener instead of one per element: the markup is static,
  // so this covers every button, nav item, accordion and copy button.
  function onClick(e) {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const nav = t.closest('[data-nav]');
    if (nav && ROOT.contains(nav)) {
      if (!nav.disabled) goTo(state.current + (nav.getAttribute('data-nav') === 'next' ? 1 : -1));
      return;
    }
    const item = t.closest('.step-nav-item');
    if (item && ROOT.contains(item)) {
      goTo(ORDER.indexOf(item.getAttribute('data-target')));
      return;
    }
    const trig = t.closest('.accordion-trigger');
    if (trig && ROOT.contains(trig)) {
      trig.closest('.accordion').classList.toggle('open');
      return;
    }
    const copy = t.closest('.copy-btn');
    if (copy && ROOT.contains(copy)) copyFrom(copy);
  }

  function onChange(e) {
    const cb = e.target;
    if (!(cb instanceof HTMLInputElement) || cb.type !== 'checkbox' || !cb.dataset.key) return;
    try { localStorage.setItem(STORAGE_KEY + ':chk:' + cb.dataset.key, cb.checked ? '1' : '0'); } catch { /* see loadState */ }
  }

  ROOT.querySelectorAll('.checklist input[type="checkbox"][data-key]').forEach((cb) => {
    try { cb.checked = localStorage.getItem(STORAGE_KEY + ':chk:' + cb.dataset.key) === '1'; } catch { /* see loadState */ }
  });

  ROOT.addEventListener('click', onClick);
  ROOT.addEventListener('change', onChange);
  loadState();
  render();
  return () => {
    ROOT.removeEventListener('click', onClick);
    ROOT.removeEventListener('change', onChange);
  };
}

export default function AIAgentMasterySessionGuide() {
  const styleRef = useRef(null);
  const fontRef = useRef(null);

  // Class material for enrolled students: keep it out of search results and
  // off the sitemap/prerender list (the AI Agent Mastery sales page doesn't
  // name the underlying framework either — this page does, so it isn't
  // something to rank for).
  usePageSeo({
    title: 'Build Your AI Chief of Staff | AI Agent Mastery Walkthrough | Social Dev Technologies',
    description: 'The step-by-step class walkthrough for AI Agent Mastery students.',
  });

  useEffect(() => {
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    document.head.appendChild(robots);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Lexend:wght@500;600;700&family=Source+Sans+3:ital,wght@0,400;0,500;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap';
    document.head.appendChild(link);
    fontRef.current = link;

    const style = document.createElement('style');
    style.textContent = CUSTOM_CSS;
    document.head.appendChild(style);
    styleRef.current = style;

    const disposeGuide = initGuide();

    return () => {
      disposeGuide();
      document.head.removeChild(robots);
      if (fontRef.current) document.head.removeChild(fontRef.current);
      if (styleRef.current) document.head.removeChild(styleRef.current);
    };
  }, []);

  return (
    <div id="cos-guide">
      <Link to="/ai-agent-mastery" className="back-link">← AI Agent Mastery</Link>
      <div dangerouslySetInnerHTML={{ __html: HTML_BODY }} />
    </div>
  );
}
