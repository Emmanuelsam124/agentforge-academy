import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const CUSTOM_CSS = `
  :root{
    --bg-page:#F6F8FB;
    --bg:#FFFFFF;
    --surface:#FFFFFF;
    --surface-sunken:#F5F8FB;
    --surface-code:#1B232C;
    --text-code:#EEF2F7;
    --border:#E6ECF3;
    --border-strong:#D3DDEA;
    --text:#17202C;
    --text-body:#48505A;
    --text-muted:#858F9B;
    --accent:#5D8AC2;
    --accent-hover:#4B76AA;
    --accent-soft:#EEF3F9;
    --on-accent:#FFFFFF;
    --success-bg:#E9F8EF;
    --success-text:#1B7A45;
    --success-border:#BFEACD;
    --shadow:rgba(15,26,42,0.08);
    --radius-lg:16px;
    --radius-md:10px;
    --radius-sm:7px;
  }
  @media (prefers-color-scheme: dark){
    :root:not([data-theme="light"]){
      --bg-page:#0C1116;--bg:#161C24;--surface:#171D25;--surface-sunken:#202A36;
      --surface-code:#0C1014;--text-code:#E9EEF5;--border:#2D3A49;--border-strong:#3D4C5F;
      --text:#F2F5F9;--text-body:#C6CFDB;--text-muted:#909EAF;--accent:#ABC2DF;
      --accent-hover:#BCCFE6;--accent-soft:#253140;--on-accent:#121E2C;
      --success-bg:#123625;--success-text:#6EDC9B;--success-border:#1E5B3C;--shadow:rgba(0,0,0,0.45);
    }
  }
  :root[data-theme="dark"]{
    --bg-page:#0C1116;--bg:#161C24;--surface:#171D25;--surface-sunken:#202A36;
    --surface-code:#0C1014;--text-code:#E9EEF5;--border:#2D3A49;--border-strong:#3D4C5F;
    --text:#F2F5F9;--text-body:#C6CFDB;--text-muted:#909EAF;--accent:#ABC2DF;
    --accent-hover:#BCCFE6;--accent-soft:#253140;--on-accent:#121E2C;
    --success-bg:#123625;--success-text:#6EDC9B;--success-border:#1E5B3C;--shadow:rgba(0,0,0,0.45);
  }
  #dns-guide *{box-sizing:border-box;}
  #dns-guide{background:var(--bg-page);color:var(--text);font-family:'Source Sans 3',system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
  #dns-guide h1,#dns-guide h2,#dns-guide h3{font-family:'Lexend',system-ui,sans-serif;text-wrap:balance;color:var(--text);margin:0;}
  #dns-guide p{margin:0;line-height:1.65;color:var(--text-body);}
  #dns-guide ul,#dns-guide ol{margin:0;padding:0;}
  #dns-guide button{font-family:inherit;cursor:pointer;}
  #dns-guide code,#dns-guide pre{font-family:'IBM Plex Mono',ui-monospace,monospace;}
  #dns-guide .shell{max-width:1180px;margin:0 auto;padding:0 20px 64px;}
  #dns-guide .topbar{position:sticky;top:0;z-index:30;background:var(--bg);border-bottom:1px solid var(--border);}
  #dns-guide .topbar-inner{max-width:1180px;margin:0 auto;padding:14px 20px;display:flex;align-items:center;gap:20px;}
  #dns-guide .eyebrow-link{font-size:13px;color:var(--text-muted);white-space:nowrap;font-weight:600;letter-spacing:.02em;}
  #dns-guide .progress-track{flex:1;height:6px;border-radius:99px;background:var(--surface-sunken);overflow:hidden;}
  #dns-guide .progress-fill{height:100%;background:var(--accent);border-radius:99px;transition:width .35s ease;}
  #dns-guide .topbar-right{display:flex;align-items:center;gap:14px;white-space:nowrap;}
  #dns-guide .step-counter{font-size:13px;color:var(--text-muted);font-variant-numeric:tabular-nums;}
  #dns-guide .btn-next,#dns-guide .btn-prev{border-radius:99px;font-weight:600;font-size:14px;padding:9px 18px;border:1px solid transparent;}
  #dns-guide .btn-next{background:var(--accent);color:var(--on-accent);}
  #dns-guide .btn-next:hover{background:var(--accent-hover);}
  #dns-guide .btn-prev{background:transparent;color:var(--text-body);border-color:var(--border-strong);}
  #dns-guide .btn-prev:hover{background:var(--surface-sunken);}
  #dns-guide .btn-prev:disabled{opacity:.4;cursor:default;}
  #dns-guide .btn-prev:disabled:hover{background:transparent;}
  #dns-guide .topbar .btn-next{padding:8px 16px;font-size:13px;}
  #dns-guide .layout{display:grid;grid-template-columns:270px minmax(0,1fr);gap:44px;align-items:start;padding-top:28px;}
  @media (max-width:880px){#dns-guide .layout{grid-template-columns:1fr;}}
  #dns-guide .sidebar{position:sticky;top:84px;}
  @media (max-width:880px){#dns-guide .sidebar{position:static;}}
  #dns-guide .sidebar-head{margin-bottom:18px;}
  #dns-guide .sidebar-head .eyebrow{font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--accent);}
  #dns-guide .sidebar-head h2{font-size:19px;font-weight:700;margin-top:6px;line-height:1.3;}
  #dns-guide .step-nav{list-style:none;display:flex;flex-direction:column;gap:4px;}
  @media (max-width:880px){#dns-guide .step-nav{flex-direction:row;overflow-x:auto;gap:8px;padding-bottom:8px;margin:0 -4px;}}
  #dns-guide .step-nav-item{display:flex;align-items:center;gap:11px;padding:10px 12px;border-radius:var(--radius-md);cursor:pointer;border:1px solid transparent;}
  @media (max-width:880px){#dns-guide .step-nav-item{flex-direction:column;align-items:flex-start;min-width:150px;flex-shrink:0;}}
  #dns-guide .step-nav-item:hover{background:var(--surface-sunken);}
  #dns-guide .step-nav-item.active{background:var(--accent-soft);border-color:var(--border-strong);}
  #dns-guide .nav-dot{flex-shrink:0;width:24px;height:24px;border-radius:50%;background:var(--surface-sunken);border:1px solid var(--border-strong);color:var(--text-muted);font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;font-family:'Lexend',sans-serif;}
  #dns-guide .step-nav-item.active .nav-dot{background:var(--accent);border-color:var(--accent);color:var(--on-accent);}
  #dns-guide .step-nav-item.done .nav-dot{background:var(--success-bg);border-color:var(--success-border);color:var(--success-text);}
  #dns-guide .nav-text .nav-cat{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);}
  #dns-guide .nav-text .nav-title{font-size:14px;font-weight:600;color:var(--text);line-height:1.3;}
  #dns-guide .nav-text .nav-time{font-size:12px;color:var(--text-muted);}
  #dns-guide .sidebar-foot{margin-top:22px;padding-top:18px;border-top:1px solid var(--border);}
  #dns-guide .sidebar-foot .eyebrow{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);}
  #dns-guide .total-time{font-family:'Lexend',sans-serif;font-size:26px;font-weight:700;margin-top:4px;}
  #dns-guide .total-sub{font-size:13px;color:var(--text-muted);margin-top:2px;}
  #dns-guide .content{min-width:0;max-width:720px;}
  #dns-guide .step-cat{font-size:12px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--accent);}
  #dns-guide .step-title{font-size:30px;font-weight:700;margin-top:8px;line-height:1.2;}
  #dns-guide .step-dek{font-size:16px;color:var(--text-body);margin-top:12px;max-width:62ch;}
  #dns-guide .pill-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;}
  #dns-guide .pill{font-size:12.5px;font-weight:600;padding:5px 12px;border-radius:99px;background:var(--surface-sunken);border:1px solid var(--border);color:var(--text-body);}
  #dns-guide .block{margin-top:26px;}
  #dns-guide .card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:22px 24px;box-shadow:0 1px 2px var(--shadow);}
  #dns-guide .card-label{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);margin-bottom:14px;}
  #dns-guide .checklist{display:flex;flex-direction:column;gap:12px;}
  #dns-guide .checklist li{display:flex;align-items:flex-start;gap:11px;font-size:15px;color:var(--text-body);}
  #dns-guide .checklist input[type="checkbox"]{appearance:none;-webkit-appearance:none;width:19px;height:19px;flex-shrink:0;margin-top:1px;border-radius:5px;border:1.5px solid var(--border-strong);background:var(--surface);position:relative;cursor:pointer;}
  #dns-guide .checklist input[type="checkbox"]:checked{background:var(--accent);border-color:var(--accent);}
  #dns-guide .checklist input[type="checkbox"]:checked::after{content:"";position:absolute;left:5px;top:1px;width:5px;height:10px;border:solid var(--on-accent);border-width:0 2px 2px 0;transform:rotate(45deg);}
  #dns-guide .checklist .done-text{color:var(--text-muted);text-decoration:line-through;}
  #dns-guide .checkline{display:flex;align-items:flex-start;gap:11px;font-size:15px;}
  #dns-guide .check-glyph{color:var(--success-text);font-weight:700;flex-shrink:0;}
  #dns-guide h3.h-sub{font-size:18px;font-weight:700;margin-top:34px;margin-bottom:14px;}
  #dns-guide .concept{background:var(--surface-sunken);border:1px solid var(--border);border-radius:var(--radius-lg);padding:22px 24px;}
  #dns-guide .concept-eyebrow{font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--accent);}
  #dns-guide .concept h3{font-size:17px;font-weight:700;margin-top:7px;margin-bottom:11px;}
  #dns-guide .concept p+p{margin-top:11px;}
  #dns-guide .concept-list{margin-top:12px;display:flex;flex-direction:column;gap:8px;}
  #dns-guide .concept-list li{display:flex;gap:9px;font-size:14.5px;color:var(--text-body);}
  #dns-guide .concept-list li::before{content:"·";color:var(--accent);font-weight:700;flex-shrink:0;}
  #dns-guide .table-wrap{overflow-x:auto;border:1px solid var(--border);border-radius:var(--radius-lg);}
  #dns-guide table.compare{width:100%;border-collapse:collapse;font-size:14px;min-width:520px;}
  #dns-guide table.compare th,#dns-guide table.compare td{text-align:left;padding:12px 16px;border-bottom:1px solid var(--border);}
  #dns-guide table.compare th{font-family:'Lexend',sans-serif;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);background:var(--surface-sunken);}
  #dns-guide table.compare td{color:var(--text-body);}
  #dns-guide table.compare tr:last-child td{border-bottom:none;}
  #dns-guide table.compare td.hl,#dns-guide table.compare th.hl{color:var(--accent);font-weight:700;}
  #dns-guide .step-list{display:flex;flex-direction:column;gap:20px;}
  #dns-guide .step-item{display:flex;gap:16px;}
  #dns-guide .step-num{flex-shrink:0;width:30px;height:30px;border-radius:50%;background:var(--text);color:var(--bg);font-family:'Lexend',sans-serif;font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center;}
  @media (prefers-color-scheme:dark){:root:not([data-theme="light"]) #dns-guide .step-num{background:var(--accent);color:var(--on-accent);}}
  :root[data-theme="dark"] #dns-guide .step-num{background:var(--accent);color:var(--on-accent);}
  #dns-guide .step-body{flex:1;min-width:0;padding-top:3px;font-size:15.5px;color:var(--text-body);line-height:1.65;}
  #dns-guide .step-body strong{color:var(--text);}
  #dns-guide .step-body code,#dns-guide .inline-code{background:var(--surface-sunken);border:1px solid var(--border);border-radius:5px;padding:1.5px 6px;font-size:.88em;color:var(--text);}
  #dns-guide .step-body ul{margin-top:8px;padding-left:20px;list-style:disc;}
  #dns-guide .step-body li{margin-top:4px;}
  #dns-guide .prompt-block{margin-top:14px;border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--border-strong);}
  #dns-guide .prompt-head{display:flex;align-items:center;justify-content:space-between;background:#12181F;padding:9px 14px;}
  #dns-guide .prompt-head span{font-size:11px;font-weight:700;letter-spacing:.09em;color:#9CACC0;}
  #dns-guide .copy-btn{background:transparent;border:1px solid #3D4B5C;color:#D9E2ED;font-size:12px;font-weight:600;padding:4px 11px;border-radius:99px;}
  #dns-guide .copy-btn:hover{background:#222D3A;}
  #dns-guide .copy-btn.copied{background:var(--success-text);border-color:var(--success-text);color:#08210F;}
  #dns-guide .prompt-block pre{margin:0;background:var(--surface-code);padding:16px 18px;overflow-x:auto;}
  #dns-guide .prompt-block code{display:block;background:transparent;color:var(--text-code);font-size:13.2px;line-height:1.7;white-space:pre;}
  #dns-guide .ph{color:#CCDAEB;font-style:italic;}
  #dns-guide .note{font-size:14.5px;color:var(--text-muted);margin-top:10px;line-height:1.6;}
  #dns-guide .note strong{color:var(--text-body);}
  #dns-guide .prompt-explain{margin-top:14px;font-size:14.5px;color:var(--text-body);background:var(--surface);border:1px solid var(--border);border-left:3px solid var(--accent);border-radius:0 var(--radius-sm) var(--radius-sm) 0;padding:13px 16px;line-height:1.65;}
  #dns-guide .prompt-explain strong{color:var(--text);}
  #dns-guide .tip{display:flex;gap:12px;background:var(--accent-soft);border-left:3px solid var(--accent);border-radius:0 var(--radius-md) var(--radius-md) 0;padding:14px 16px;margin-top:16px;}
  #dns-guide .tip-icon{font-size:19px;flex-shrink:0;}
  #dns-guide .tip p{font-size:14.5px;color:var(--text-body);}
  #dns-guide .tip strong{color:var(--text);}
  #dns-guide .accordion{margin-top:14px;border:1px solid var(--border);border-radius:var(--radius-md);background:var(--surface);}
  #dns-guide .accordion-trigger{width:100%;background:none;border:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;font-size:14.5px;font-weight:600;color:var(--text);text-align:left;}
  #dns-guide .accordion-chev{transition:transform .2s ease;color:var(--text-muted);flex-shrink:0;}
  #dns-guide .accordion.open .accordion-chev{transform:rotate(180deg);}
  #dns-guide .accordion-panel{max-height:0;overflow:hidden;transition:max-height .25s ease;}
  #dns-guide .accordion.open .accordion-panel{max-height:600px;}
  #dns-guide .accordion-panel-inner{padding:0 16px 16px;font-size:14.5px;color:var(--text-body);line-height:1.65;}
  #dns-guide .accordion-panel-inner code{background:var(--surface-sunken);border:1px solid var(--border);border-radius:5px;padding:1.5px 6px;font-size:.9em;}
  #dns-guide .go-further{margin-top:22px;border:1px dashed var(--border-strong);border-radius:var(--radius-md);background:var(--surface);}
  #dns-guide .go-further .accordion-trigger{font-weight:600;}
  #dns-guide .gf-label{font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);margin-right:9px;}
  #dns-guide .gf-diff{margin-left:9px;font-size:13px;letter-spacing:1px;opacity:.85;}
  #dns-guide .completion{margin-top:30px;display:flex;align-items:center;gap:16px;background:var(--success-bg);border:1px solid var(--success-border);border-radius:var(--radius-lg);padding:18px 22px;}
  #dns-guide .completion-icon{font-size:26px;flex-shrink:0;}
  #dns-guide .completion-title{font-size:15.5px;font-weight:700;color:var(--success-text);font-family:'Lexend',sans-serif;}
  #dns-guide .completion-sub{font-size:13.5px;color:var(--text-muted);margin-top:2px;}
  #dns-guide .step-footer{display:flex;justify-content:space-between;margin-top:40px;padding-top:22px;border-top:1px solid var(--border);}
  #dns-guide .mock-frame{margin-top:16px;border:1px solid var(--border-strong);border-radius:var(--radius-lg);overflow:hidden;background:#fff;}
  #dns-guide .mock-titlebar{background:#EFECEF;padding:8px 14px;font-size:12px;color:#6B677A;border-bottom:1px solid #DFE2E5;font-family:'IBM Plex Mono',monospace;}
  #dns-guide .mock-body{padding:22px;}
  #dns-guide .beat-h{font-family:'Lexend',sans-serif;font-weight:700;margin:0 0 14px;font-size:15.5px;}
  #dns-guide a{color:var(--accent);}
  #dns-guide .back-link{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:var(--text-muted);text-decoration:none;padding:10px 20px;}
  #dns-guide .back-link:hover{color:var(--accent);}
`;

const HTML_BODY = `
<div class="topbar">
  <div class="topbar-inner">
    <span class="eyebrow-link">AI BUILDER PROGRAM</span>
    <div class="progress-track"><div class="progress-fill" id="dns-progressFill"></div></div>
    <div class="topbar-right">
      <span class="step-counter" id="dns-stepCounter">10 min · 1/7</span>
      <button class="btn-next" data-nav="next">Next →</button>
    </div>
  </div>
</div>

<div class="shell">
  <div class="layout">
    <nav class="sidebar">
      <div class="sidebar-head">
        <div class="eyebrow">Session Guide</div>
        <h2>Daily News &amp; Industry Summary Agent</h2>
      </div>
      <ol class="step-nav">
        <li class="step-nav-item" data-target="intro"><span class="nav-dot">1</span><span class="nav-text"><span class="nav-cat">Intro</span><br><span class="nav-title">Session Intro</span><br><span class="nav-time">10 min</span></span></li>
        <li class="step-nav-item" data-target="build1"><span class="nav-dot">2</span><span class="nav-text"><span class="nav-cat">Build 1</span><br><span class="nav-title">Workspace &amp; Gmail</span><br><span class="nav-time">10 min</span></span></li>
        <li class="step-nav-item" data-target="build2"><span class="nav-dot">3</span><span class="nav-text"><span class="nav-cat">Build 2</span><br><span class="nav-title">Free Gemini Key</span><br><span class="nav-time">10 min</span></span></li>
        <li class="step-nav-item" data-target="build3"><span class="nav-dot">4</span><span class="nav-text"><span class="nav-cat">Build 3</span><br><span class="nav-title">News Pipeline</span><br><span class="nav-time">15 min</span></span></li>
        <li class="step-nav-item" data-target="build4"><span class="nav-dot">5</span><span class="nav-text"><span class="nav-cat">Build 4</span><br><span class="nav-title">Briefing Writer</span><br><span class="nav-time">20 min</span></span></li>
        <li class="step-nav-item" data-target="build5"><span class="nav-dot">6</span><span class="nav-text"><span class="nav-cat">Build 5</span><br><span class="nav-title">Schedule &amp; Go Live</span><br><span class="nav-time">10 min</span></span></li>
        <li class="step-nav-item" data-target="share"><span class="nav-dot">7</span><span class="nav-text"><span class="nav-cat">Share</span><br><span class="nav-title">Share What You Built</span><br><span class="nav-time">5 min</span></span></li>
      </ol>
      <div class="sidebar-foot">
        <div class="eyebrow">Session total</div>
        <div class="total-time">80 min</div>
        <div class="total-sub">5 builds · $0 in tools</div>
      </div>
    </nav>

    <main class="content">

      <!-- INTRO -->
      <section class="step" data-step="intro">
        <div class="step-cat">Intro · Step 1 of 7</div>
        <h1 class="step-title">Build a Daily News &amp; Industry Summary Agent</h1>
        <p class="step-dek">An agent that reads real news in your industry every day and emails you a decision-ready briefing — colors, "read more" buttons, and all. Built entirely on free tools. No coding, no Claude, no subscriptions.</p>

        <div class="block card">
          <div class="card-label">By the end of this session</div>
          <ul class="checklist">
            <li class="checkline"><span class="check-glyph">✓</span> A free Make.com account connected to your Gmail</li>
            <li class="checkline"><span class="check-glyph">✓</span> A free Gemini AI connection that writes your summaries</li>
            <li class="checkline"><span class="check-glyph">✓</span> A working news pipeline covering the beats that matter to your business</li>
            <li class="checkline"><span class="check-glyph">✓</span> A daily agent that emails you automatically, every day, for $0 — forever</li>
          </ul>
        </div>

        <h3 class="h-sub">What you need for this session</h3>
        <p>This whole build runs in the browser. Nothing to install, no credit card anywhere in the chain.</p>
        <div class="block card">
          <ul class="checklist">
            <li><input type="checkbox" data-key="need-google"> <span>A Google account, for Gmail and your free Gemini API key. Create one free at <span class="inline-code">accounts.google.com</span> if you don't have one.</span></li>
            <li><input type="checkbox" data-key="need-time"> <span>About 80 minutes and a laptop or desktop browser. This one is fiddly on a phone — save it for a bigger screen.</span></li>
            <li><input type="checkbox" data-key="need-beats"> <span>Know the 2-3 news beats that matter to your business. This guide's running example is a jewelry retailer tracking jewelry industry news, precious metals pricing, and fashion trends — swap in whatever fits your industry.</span></li>
          </ul>
        </div>

        <h3 class="h-sub">Why build this</h3>
        <p>Most people either doomscroll industry news at random moments or don't keep up with it at all. Neither gets you an edge. A builder's move is different: turn "staying informed" into a system that runs itself, so the information shows up already filtered, already organized, and already pointed at what it means for your business — before you've had your coffee.</p>

        <h3 class="h-sub">Opening concepts</h3>
        <div class="block concept">
          <div class="concept-eyebrow">Concept</div>
          <h3>What is a no-code automation agent?</h3>
          <p>An agent is something that runs a job for you, without you doing it by hand each time. A <strong>no-code</strong> agent does that job by connecting existing apps together on a visual canvas — no programming language, no server to manage. You describe the steps ("get this, then do this, then send that") by dragging blocks, not writing code.</p>
          <p>Every business has some repetitive task hiding in plain sight: read the news, chase a follow-up, check a price, file a report. If you can describe that task as a fixed sequence of steps, you can automate it — for free, in an afternoon.</p>
          <ul class="concept-list">
            <li>The task follows roughly the same steps every time — that's what makes it automatable</li>
            <li>Each step's output can be described in plain language — that's the part an AI can fill in</li>
            <li>You start with one narrow win, then expand it once it's actually running</li>
          </ul>
        </div>

        <div class="block concept">
          <div class="concept-eyebrow">Concept</div>
          <h3>Every agent is a trigger, a brain, and a delivery</h3>
          <p>Strip any automation down and you'll find three parts, and today you're building all three for free:</p>
          <ul class="concept-list">
            <li><strong>Trigger/source</strong> — the real-world thing that feeds it fresh material. Today: RSS, the oldest "give me what's new" format on the internet, and still how most news actually gets distributed.</li>
            <li><strong>Brain</strong> — something that reads the raw material and turns it into something useful. Today: Google's Gemini, which gives away a genuinely free tier with no credit card required.</li>
            <li><strong>Delivery</strong> — where the finished result lands. Today: your Gmail inbox, arriving on its own like a note from a very well-read employee.</li>
          </ul>
        </div>

        <div class="block concept">
          <div class="concept-eyebrow">Concept</div>
          <h3>Comparing no-code platforms</h3>
          <p>Several tools can build what we're building today. Here's why this session uses Make.</p>
          <div class="table-wrap" style="margin-top:14px;">
            <table class="compare">
              <tr><th></th><th class="hl">Make.com</th><th>Zapier</th><th>n8n</th></tr>
              <tr><td>Free tier</td><td class="hl">1,000 ops/month, full multi-step scenarios</td><td>~100 tasks/month, limited steps free</td><td>Free only if you self-host</td></tr>
              <tr><td>Best for</td><td class="hl">Visual, multi-step automations</td><td>Quick 2-app connections</td><td>Developers who want full control</td></tr>
              <tr><td>Used today</td><td class="hl">✓</td><td>—</td><td>—</td></tr>
            </table>
          </div>
        </div>

        <div class="block concept">
          <div class="concept-eyebrow">Concept</div>
          <h3>API keys, free tiers, and rate limits — in plain English</h3>
          <p><strong>API key</strong> — a personal password that lets one app (Make) use another app's AI (Gemini) on your behalf. A free API key is still a real credential: don't post it publicly or paste it somewhere public.</p>
          <p><strong>Free tier</strong> — the slice of usage a company gives away before it starts charging. Gemini's free tier is generous enough that a once-a-day summary will likely never come close to the ceiling.</p>
          <p><strong>Rate limit</strong> — the free tier's speed bump: how much you can ask for per minute or per day before it asks you to slow down. Worth knowing up front so a "high demand" message later feels like normal weather, not a sign something's broken.</p>
        </div>

        <div class="step-footer">
          <button class="btn-prev" data-nav="prev" disabled>← Previous</button>
          <button class="btn-next" data-nav="next">Next →</button>
        </div>
      </section>

      <!-- BUILD 1 -->
      <section class="step" data-step="build1" hidden>
        <div class="step-cat">Build 1 · Step 2 of 7</div>
        <h1 class="step-title">Build 1 — Set up your automation workspace</h1>
        <p class="step-dek">Create your free Make.com account and connect the Gmail address your agent will send from.</p>
        <div class="pill-row"><span class="pill">10 min</span><span class="pill">Tool · Make.com (Free)</span></div>

        <div class="block concept">
          <div class="concept-eyebrow">Concept</div>
          <h3>What is Make.com?</h3>
          <p>Make is a visual automation platform: you build a flow ("scenario") by connecting blocks ("modules") on a canvas, and Make runs it on its own servers, on whatever schedule you choose — even while your laptop is closed. The free plan never asks for a card and comfortably covers a once-a-day agent like this one.</p>
        </div>

        <div class="block step-list">
          <div class="step-item"><div class="step-num">1</div><div class="step-body">Go to <span class="inline-code">make.com</span> and click <strong>"Get started free."</strong> Sign up with your Google account (fastest) or an email and password.</div></div>
          <div class="step-item"><div class="step-num">2</div><div class="step-body">Verify your email if it asks, then you'll land on the Make dashboard — an empty space waiting for your first scenario.</div></div>
          <div class="step-item"><div class="step-num">3</div><div class="step-body">Click <strong>Create a new scenario</strong> (the big + button). You'll land on an empty canvas — this is where the whole agent gets built today.</div></div>
          <div class="step-item"><div class="step-num">4</div><div class="step-body">We'll wire Gmail up now so it's ready when we need it later. Click the big + on the canvas, search the module panel for <strong>"Gmail,"</strong> and choose <strong>"Send an email."</strong></div></div>
          <div class="step-item"><div class="step-num">5</div><div class="step-body">Click <strong>Add</strong> next to Connection, then <strong>Sign in with Google</strong> and allow Make to send email on your behalf. Close the module for now — you'll come back to it in Build 4.</div></div>
        </div>

        <div class="tip"><span class="tip-icon">💡</span><p><strong>Which inbox should this be?</strong> Any Gmail address works — your own, or a separate one you set up just for this agent. Whichever you connect here is the address the briefing will be sent <em>from</em>.</p></div>

        <div class="accordion go-further">
          <button class="accordion-trigger"><span><span class="gf-label">Go further</span>Rename your scenario now<span class="gf-diff">🛠️</span></span><span class="accordion-chev">⌄</span></button>
          <div class="accordion-panel"><div class="accordion-panel-inner">Click the scenario's default name at the top of the builder and rename it to something you'll recognize later, e.g. <span class="inline-code">Daily Jewelry Briefing</span>. Small habit — saves real confusion once you have more than one scenario running.</div></div>
        </div>

        <div class="completion">
          <div class="completion-icon">📬</div>
          <div><div class="completion-title">Build 1 complete</div><div class="completion-sub">Make.com account created and Gmail connected</div></div>
        </div>

        <div class="step-footer">
          <button class="btn-prev" data-nav="prev">← Previous</button>
          <button class="btn-next" data-nav="next">Next →</button>
        </div>
      </section>

      <!-- BUILD 2 -->
      <section class="step" data-step="build2" hidden>
        <div class="step-cat">Build 2 · Step 3 of 7</div>
        <h1 class="step-title">Build 2 — Get your free AI writer connected</h1>
        <p class="step-dek">Grab a free Gemini API key from Google and connect it inside Make. This is the "brain" that will turn raw headlines into a real briefing in Build 4.</p>
        <div class="pill-row"><span class="pill">10 min</span><span class="pill">Tool · Google AI Studio (Free)</span></div>

        <div class="block concept">
          <div class="concept-eyebrow">Concept</div>
          <h3>Why is Gemini's API key free?</h3>
          <p>Google gives every AI Studio account a genuinely free tier for Gemini — no card on file, a real daily allowance, plenty for one summary a day. It's the same reason app stores give away a free tier of storage: get you building on their platform first.</p>
        </div>

        <div class="block step-list">
          <div class="step-item"><div class="step-num">1</div><div class="step-body">Go to <span class="inline-code">aistudio.google.com</span> and sign in with the same Google account you used in Build 1.</div></div>
          <div class="step-item"><div class="step-num">2</div><div class="step-body">Click <strong>"Get API key" → "Create API key."</strong> Copy the key it generates — a long string starting with something like <span class="inline-code">AIza...</span>. Treat it like a password.</div></div>
          <div class="step-item"><div class="step-num">3</div><div class="step-body">Back in your Make scenario, click the canvas, search the module panel for <strong>"Google Gemini,"</strong> and drag any Gemini module on — we'll pick the exact one it needs to be in Build 4.</div></div>
          <div class="step-item"><div class="step-num">4</div><div class="step-body">Click <strong>Add</strong> next to Connection, paste your API key, and click <strong>Save.</strong> Make confirms the connection instantly — no waiting, no approval step.</div></div>
        </div>

        <div class="accordion">
          <button class="accordion-trigger">Getting an error when you save the connection?<span class="accordion-chev">⌄</span></button>
          <div class="accordion-panel"><div class="accordion-panel-inner">Double-check you copied the <em>whole</em> key with no leading or trailing space, and that you're pasting it into a Gemini connection field, not a different Google product's key box. Re-copying the key from AI Studio and pasting fresh usually fixes it.</div></div>
        </div>

        <div class="accordion go-further">
          <button class="accordion-trigger"><span><span class="gf-label">Go further</span>Know your fallback models<span class="gf-diff">🛠️</span></span><span class="accordion-chev">⌄</span></button>
          <div class="accordion-panel"><div class="accordion-panel-inner">Google ships several free-tier Gemini Flash models and adds newer ones as they're released. If one is ever slow or briefly unavailable, you can switch models from the same dropdown later, in Build 4, without reconnecting anything.</div></div>
        </div>

        <div class="completion">
          <div class="completion-icon">🧠</div>
          <div><div class="completion-title">Build 2 complete</div><div class="completion-sub">Free Gemini connection ready inside Make</div></div>
        </div>

        <div class="step-footer">
          <button class="btn-prev" data-nav="prev">← Previous</button>
          <button class="btn-next" data-nav="next">Next →</button>
        </div>
      </section>

      <!-- BUILD 3 -->
      <section class="step" data-step="build3" hidden>
        <div class="step-cat">Build 3 · Step 4 of 7</div>
        <h1 class="step-title">Build 3 — Build your news pipeline</h1>
        <p class="step-dek">Wire up free, no-signup news sources for the beats that matter to your business. This works for any industry, not only the jewelry example used here.</p>
        <div class="pill-row"><span class="pill">15 min</span><span class="pill">Tool · Make.com + Google News RSS (Free)</span></div>

        <div class="block concept">
          <div class="concept-eyebrow">Concept</div>
          <h3>What is RSS, and why it's the perfect free news source</h3>
          <p>RSS is a decades-old format websites use to publish "here's everything new" as a simple feed any tool can read — no login, no API key, no scraping. Google News runs a public RSS search endpoint that turns almost any search phrase into a live, always-current feed:</p>
          <div class="prompt-block" style="margin-top:12px;">
            <div class="prompt-head"><span>URL PATTERN</span><button class="copy-btn">Copy</button></div>
            <pre><code>https://news.google.com/rss/search?q=<span class="ph">YOUR+SEARCH+TERMS</span>&amp;hl=en-US&amp;gl=US&amp;ceid=US:en</code></pre>
          </div>
          <p style="margin-top:12px;">Replace <span class="inline-code">YOUR+SEARCH+TERMS</span> (words separated by <span class="inline-code">+</span>) with anything — "restaurant industry news," "SaaS pricing trends," "construction material costs" — and you have a free, always-current feed for your exact niche.</p>
        </div>

        <div class="block step-list">
          <div class="step-item"><div class="step-num">1</div><div class="step-body">On your canvas, click the canvas again to add a new module, search for <strong>"RSS,"</strong> and add <strong>"Retrieve RSS feed items."</strong></div></div>
          <div class="step-item"><div class="step-num">2</div><div class="step-body">Decide the 2-3 beats that matter to your business. This example uses a jewelry retailer tracking three: jewelry industry news, precious metals pricing, and fashion trends. Yours might be just one beat to start — that's a completely fine place to launch from.</div></div>
          <div class="step-item"><div class="step-num">3</div><div class="step-body">For your first beat, build a URL from the pattern above and paste it into the module's <strong>URL</strong> field. Worked example:
            <div class="prompt-block">
              <div class="prompt-head"><span>EXAMPLE — BEAT 1</span><button class="copy-btn">Copy</button></div>
              <pre><code>https://news.google.com/rss/search?q=jewelry+industry+news&amp;hl=en-US&amp;gl=US&amp;ceid=US:en</code></pre>
            </div>
          </div></div>
          <div class="step-item"><div class="step-num">4</div><div class="step-body">Set <strong>"Maximum number of returned items"</strong> to <span class="inline-code">15</span>. Then click into <strong>"Date from,"</strong> switch it to a formula, and enter:
            <div class="prompt-block">
              <div class="prompt-head"><span>FORMULA — DATE FROM</span><button class="copy-btn">Copy</button></div>
              <pre><code>{{addDays(now; -1)}}</code></pre>
            </div>
            <div class="note">This one setting is what stops your agent from reporting the same story two days in a row — it only ever looks at the last 24 hours.</div>
          </div></div>
          <div class="step-item"><div class="step-num">5</div><div class="step-body">Add a <strong>"Text aggregator"</strong> module (search "Text aggregator") right after it. Set its <strong>Text</strong> field to:
            <div class="prompt-block">
              <div class="prompt-head"><span>AGGREGATOR TEMPLATE</span><button class="copy-btn">Copy</button></div>
              <pre><code>Title: {{2.title}}
Link: {{2.rssFields.link}}
Summary: {{2.rssFields.description}}</code></pre>
            </div>
            <div class="note">The <span class="inline-code">2</span> refers to your RSS module's position number, shown in its top-left corner — match it to whatever number Make actually gave that module. Set <strong>Row separator</strong> to "Other" and enter a blank line, so each article stays visually separated from the next.</div>
          </div></div>
          <div class="step-item"><div class="step-num">6</div><div class="step-body">Repeat steps 3-5 for each additional beat — one RSS module plus one Text aggregator, side by side on the canvas, per beat.</div></div>
        </div>

        <div class="accordion">
          <button class="accordion-trigger">RSS module coming back empty?<span class="accordion-chev">⌄</span></button>
          <div class="accordion-panel"><div class="accordion-panel-inner">Click <strong>"Run once"</strong> at the bottom-left of the builder to test just this module. An empty result almost always means the search phrase is too narrow for the last 24 hours — try a broader phrase, or temporarily remove the date filter to confirm the URL itself works before adding it back.</div></div>
        </div>

        <div class="accordion go-further">
          <button class="accordion-trigger"><span><span class="gf-label">Go further</span>Add a fourth beat<span class="gf-diff">🛠️🛠️</span></span><span class="accordion-chev">⌄</span></button>
          <div class="accordion-panel"><div class="accordion-panel-inner">Right-click your RSS + Text aggregator pair and choose <strong>Clone</strong>, then point the new pair at a different query — a named competitor, a specific product category, even a city for local news. More beats simply means more raw material for Build 4 to work with.</div></div>
        </div>

        <div class="completion">
          <div class="completion-icon">📡</div>
          <div><div class="completion-title">Build 3 complete</div><div class="completion-sub">A free, always-current news pipeline, wired up for your beats</div></div>
        </div>

        <div class="step-footer">
          <button class="btn-prev" data-nav="prev">← Previous</button>
          <button class="btn-next" data-nav="next">Next →</button>
        </div>
      </section>

      <!-- BUILD 4 -->
      <section class="step" data-step="build4" hidden>
        <div class="step-cat">Build 4 · Step 5 of 7</div>
        <h1 class="step-title">Build 4 — Turn headlines into a decision-ready briefing</h1>
        <p class="step-dek">One carefully structured prompt, and Gemini will dedupe, filter, and design a colorful HTML email — not just repeat the news back at you.</p>
        <div class="pill-row"><span class="pill">20 min</span><span class="pill">AI · Gemini Flash (Free)</span></div>

        <div class="block concept">
          <div class="concept-eyebrow">Concept</div>
          <h3>Why one long, structured prompt beats ten short ones</h3>
          <p>The instinct is to ask an AI something short, like "summarize this news." You'll get something short back — generic, and different-looking every single day. A prompt that hands over exactly what the reader needs to decide, the exact HTML structure to follow, and explicit rules for what to skip gets a genuinely usable result on the first try, every day, without you rewriting it tomorrow.</p>
        </div>

        <p style="margin-top:20px;">Here's the actual target — a real card from this exact prompt, rendered:</p>
        <div class="mock-frame">
          <div class="mock-titlebar">Preview — Your Daily Jewelry, Metals &amp; Fashion Briefing</div>
          <div class="mock-body">
            <div style="border-left:4px solid #4A6FA5;background:#fafafa;padding:16px 20px;border-radius:6px;">
              <div style="display:inline-block;background:#4A6FA5;color:#fff;font-size:11px;font-weight:bold;padding:2px 10px;border-radius:10px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Metals &amp; Pricing</div>
              <h3 style="margin:8px 0 6px;color:#222;font-size:17px;font-family:inherit;">Platinum climbs on tightening industrial supply</h3>
              <p style="margin:0 0 10px;color:#444;line-height:1.6;font-size:14px;">Platinum prices rose for a third straight session as industrial demand outpaces mine output, analysts say.</p>
              <p style="margin:0 0 12px;color:#555;font-size:13px;font-style:italic;">What this means for you: alternative-metal bands may look more attractively priced to buyers this month — worth featuring in-store.</p>
              <a href="#" style="display:inline-block;background:#4A6FA5;color:#ffffff;text-decoration:none;padding:8px 16px;border-radius:5px;font-size:13px;font-weight:bold;">Read full article →</a>
            </div>
          </div>
        </div>

        <div class="block step-list" style="margin-top:26px;">
          <div class="step-item"><div class="step-num">1</div><div class="step-body">Open the Gemini module from Build 2. Under <strong>AI Model</strong>, choose <strong>the newest Gemini Flash model in the list</strong> (the highest version number with "Flash" in its name). Flash models are the free-tier-friendly ones — skip anything labeled "Pro," which usually needs billing enabled, and skip Gemini 1.5 and 2.x models, which Google has retired or closed to new API keys.</div></div>
          <div class="step-item"><div class="step-num">2</div><div class="step-body">Scroll to <strong>System Instructions</strong> and paste this, filling in the bracketed parts for your own business and beats:
            <div class="prompt-block">
              <div class="prompt-head"><span>SYSTEM INSTRUCTIONS</span><button class="copy-btn">Copy</button></div>
              <pre><code>You are writing a daily industry briefing email for <span class="ph">[describe your business in one sentence]</span>. The reader wants this email to help them make informed business decisions, not just list headlines.

You will receive raw headlines, links, and snippets from these beats: <span class="ph">[Beat 1]</span>, <span class="ph">[Beat 2]</span>, <span class="ph">[Beat 3]</span>.

STEP 1 - DEDUPE FIRST: Before writing anything, scan every raw item across all beats together and merge any that describe the same underlying story or event, even if worded differently or pulled under a different beat. Each real story appears in your output exactly once, filed under whichever single section fits it best. Never write the same story twice under two headers.

STEP 2 - FILTER: Drop anything not genuinely relevant to <span class="ph">[your business type]</span> (stock-ticker noise, unrelated local business items, pure filler).

STEP 3 - WRITE: Output ONLY a single HTML email body - no markdown, no code fences, no commentary outside the HTML - using exactly this structure and inline styling.

A) Open with a Key Takeaways box: 2 to 4 short, action-oriented bullets distilled from today's stories (what to watch, what might affect pricing or stocking decisions). Use exactly this pattern:
&lt;div style='background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:16px 20px;margin-bottom:24px;'&gt;
&lt;h2 style='margin:0 0 10px;color:#8a6d00;font-size:16px;'&gt;Key Takeaways&lt;/h2&gt;
&lt;ul style='margin:0;padding-left:20px;color:#5c4b00;font-size:14px;line-height:1.7;'&gt;
&lt;li&gt;...&lt;/li&gt;
&lt;/ul&gt;
&lt;/div&gt;

B) Then one section per beat that has real content, in this order, each with its own accent color: <span class="ph">[Beat 1] = [#hex1], [Beat 2] = [#hex2], [Beat 3] = [#hex3]</span>. Skip a section entirely if nothing relevant survived Steps 1-2 - never pad. Section header pattern:
&lt;h2 style='color:{COLOR};border-bottom:2px solid {COLOR};padding-bottom:6px;margin:28px 0 16px;'&gt;Section Name&lt;/h2&gt;

C) Under each section header, one card per story using exactly this pattern:
&lt;div style='border-left:4px solid {COLOR};background:#fafafa;padding:16px 20px;margin-bottom:16px;border-radius:6px;'&gt;
&lt;div style='display:inline-block;background:{COLOR};color:#fff;font-size:11px;font-weight:bold;padding:2px 10px;border-radius:10px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;'&gt;Section Name&lt;/div&gt;
&lt;h3 style='margin:8px 0 6px;color:#222;font-size:17px;'&gt;Punchy specific headline&lt;/h3&gt;
&lt;p style='margin:0 0 10px;color:#444;line-height:1.6;font-size:14px;'&gt;3-4 sentences: what happened and why it matters.&lt;/p&gt;
&lt;p style='margin:0 0 12px;color:#555;font-size:13px;font-style:italic;'&gt;What this means for you: one concrete, honest line. Only include this paragraph where there is a real angle - if there truly isn't one, omit this whole p tag rather than forcing it.&lt;/p&gt;
&lt;a href='exact Link value given for this story' style='display:inline-block;background:{COLOR};color:#ffffff;text-decoration:none;padding:8px 16px;border-radius:5px;font-size:13px;font-weight:bold;'&gt;Read full article -&gt;&lt;/a&gt;
&lt;/div&gt;

Button rule: always use the exact Link value provided with that story's raw item as the href. Never invent or guess a URL. If a story genuinely has no link, drop the a tag but keep the rest of the card.

Quality bar: a shorter briefing with 4-6 stories that are genuinely worth the reader's time beats a padded one with filler.</code></pre>
            </div>
          </div></div>
          <div class="step-item"><div class="step-num">3</div><div class="step-body">Scroll to <strong>Messages</strong>, add one message with role <strong>User</strong>, and paste this — matching the numbers to your own Text Aggregator modules:
            <div class="prompt-block">
              <div class="prompt-head"><span>USER MESSAGE</span><button class="copy-btn">Copy</button></div>
              <pre><code>Here are today's raw items, grouped by beat.

<span class="ph">[BEAT 1]</span>:
{{3.text}}

<span class="ph">[BEAT 2]</span>:
{{5.text}}

<span class="ph">[BEAT 3]</span>:
{{7.text}}

Write today's briefing following the system instructions.</code></pre>
            </div>
            <div class="note"><strong>The numbers 3, 5, 7</strong> are your Text Aggregator modules' position numbers on the canvas, shown in each module's corner — not a fixed rule. Match them to your own scenario, and delete a whole block if you only built two beats.</div>
          </div></div>
          <div class="step-item"><div class="step-num">4</div><div class="step-body">Scroll to <strong>Generation Configurations</strong> and set <strong>Max Output Tokens</strong> to <span class="inline-code">6000</span>. This briefing runs longer than a one-line answer, and a low limit will cut it off mid-sentence.</div></div>
          <div class="step-item"><div class="step-num">5</div><div class="step-body">Open the Gmail module from Build 1 and drag it to the end of the flow. Set <strong>To</strong> to whichever inbox should receive it, <strong>Subject</strong> to something like <span class="inline-code">Your Daily [Your Industry] Briefing</span>, <strong>Body type</strong> to <strong>Raw HTML</strong>, and <strong>Content</strong> to the Gemini module's text output — click the field, then map it from <span class="inline-code">Candidates → Content → Parts → Text</span> in the list Make shows you, rather than typing it by hand.</div></div>
        </div>

        <div class="prompt-explain"><strong>How this prompt works:</strong> Step 1 forces the AI to merge duplicate stories <em>before</em> writing anything — the single biggest cause of a digest that feels repetitive. The exact HTML patterns in Step 3, with real hex colors written in, keep your email looking identically polished every day instead of "creative" in a slightly different way each run. Consistency is what makes an email read like a real product instead of an experiment. The button rule stops the AI from ever inventing a source link — it can only use real URLs your RSS feed actually gave it.</div>

        <div class="accordion">
          <button class="accordion-trigger">Email arrives blank or broken?<span class="accordion-chev">⌄</span></button>
          <div class="accordion-panel"><div class="accordion-panel-inner">Almost always the <strong>Content</strong> field pointing at the wrong output, or <strong>Body type</strong> left on the default instead of "Raw HTML." Reopen the field and re-map it from the Gemini module's actual output list rather than typing a path by hand.</div></div>
        </div>

        <div class="accordion go-further">
          <button class="accordion-trigger"><span><span class="gf-label">Go further</span>Make it match your brand<span class="gf-diff">🛠️🛠️</span></span><span class="accordion-chev">⌄</span></button>
          <div class="accordion-panel"><div class="accordion-panel-inner">Swap the example accent colors for your own brand's hex codes, and add a line to the system instructions asking it to open by name-dropping your business instead of a generic greeting. If you don't know your brand's exact hex codes, a free tool like <span class="inline-code">coolors.co</span> can pull them from your logo.</div></div>
        </div>

        <div class="completion">
          <div class="completion-icon">✍️</div>
          <div><div class="completion-title">Build 4 complete</div><div class="completion-sub">Your AI writes a colorful, decision-ready briefing — not just a news recap</div></div>
        </div>

        <div class="step-footer">
          <button class="btn-prev" data-nav="prev">← Previous</button>
          <button class="btn-next" data-nav="next">Next →</button>
        </div>
      </section>

      <!-- BUILD 5 -->
      <section class="step" data-step="build5" hidden>
        <div class="step-cat">Build 5 · Step 6 of 7</div>
        <h1 class="step-title">Build 5 — Schedule it and go live</h1>
        <p class="step-dek">Set your agent to run automatically every day, test it once for real, and know exactly what to do the first time a free AI model hiccups.</p>
        <div class="pill-row"><span class="pill">10 min</span><span class="pill">Tool · Make.com Scheduler (Free)</span></div>

        <div class="block step-list">
          <div class="step-item"><div class="step-num">1</div><div class="step-body">Click the clock icon on the <em>first</em> module in your flow (bottom-left corner of the module). Choose <strong>"Run once a day,"</strong> pick the time you want the briefing to land, and confirm your account's timezone under Make's profile settings — an agent scheduled in the wrong timezone still runs, just at the wrong hour.</div></div>
          <div class="step-item"><div class="step-num">2</div><div class="step-body">Toggle the scenario <strong>ON</strong> using the switch in the bottom-left of the builder. It's a small, easy-to-miss switch — a scenario left "off" silently never runs, even on schedule.</div></div>
          <div class="step-item"><div class="step-num">3</div><div class="step-body">Click <strong>"Run once"</strong> (bottom-left) to fire the whole scenario immediately, so you can check real output today instead of waiting until tomorrow's scheduled time.</div></div>
          <div class="step-item"><div class="step-num">4</div><div class="step-body">Check the inbox you set as the recipient. If nothing arrived, open the scenario's execution history (the clock icon in the top bar) and click into the run that failed — Make shows you exactly which module broke, and why.</div></div>
        </div>

        <div class="accordion">
          <button class="accordion-trigger">Getting a "503 / high demand" error from Gemini?<span class="accordion-chev">⌄</span></button>
          <div class="accordion-panel"><div class="accordion-panel-inner">This means Google's servers are temporarily overloaded on that specific model — not that anything in your setup is wrong. Open the Gemini module, change the <strong>AI Model</strong> dropdown to a different recent Flash version (not 1.5 or 2.x — new API keys can't use those), and click <strong>Run once</strong> again.</div></div>
        </div>

        <div class="accordion">
          <button class="accordion-trigger">Getting the same news two days running?<span class="accordion-chev">⌄</span></button>
          <div class="accordion-panel"><div class="accordion-panel-inner">Reopen each RSS module and confirm <strong>"Date from"</strong> is still set to <code>{{addDays(now; -1)}}</code> — that's the one setting keeping every day's news actually new. If it looks right and it's still repeating, your search phrase may just be quiet that day — a real gap in coverage, not a bug.</div></div>
        </div>

        <div class="accordion go-further">
          <button class="accordion-trigger"><span><span class="gf-label">Go further</span>Add a second delivery channel<span class="gf-diff">🛠️🛠️</span></span><span class="accordion-chev">⌄</span></button>
          <div class="accordion-panel"><div class="accordion-panel-inner">Clone the Gmail module and route the same briefing to a Slack channel or a second inbox, so more than one person on your team sees it — search the module panel for "Slack" and repeat the same connection steps from Build 1.</div></div>
        </div>

        <div class="completion">
          <div class="completion-icon">🚀</div>
          <div><div class="completion-title">Build 5 complete</div><div class="completion-sub">Your agent is live, scheduled, and running for free — every single day</div></div>
        </div>

        <div class="step-footer">
          <button class="btn-prev" data-nav="prev">← Previous</button>
          <button class="btn-next" data-nav="next">Next →</button>
        </div>
      </section>

      <!-- SHARE -->
      <section class="step" data-step="share" hidden>
        <div class="step-cat">Share · Step 7 of 7</div>
        <h1 class="step-title">Share what you built</h1>
        <p class="step-dek">Drop your first real briefing email in the cohort channel — screenshots of a working agent are how the rest of the group learns what's possible.</p>

        <div class="block card">
          <div class="card-label">Share what you built</div>
          <ul class="checklist">
            <li><input type="checkbox" data-key="share-on"> <span>Scenario turned ON and confirmed running on its own schedule</span></li>
            <li><input type="checkbox" data-key="share-email"> <span>Received a real briefing email, not just a test run</span></li>
            <li><input type="checkbox" data-key="share-cohort"> <span>Shared a screenshot with the cohort, noting which beats you chose and why</span></li>
          </ul>
        </div>

        <h3 class="h-sub">What you built today</h3>
        <div class="block card">
          <ul class="checklist">
            <li class="checkline"><span class="check-glyph">✓</span> A free Make.com account connected to your Gmail</li>
            <li class="checkline"><span class="check-glyph">✓</span> A free Gemini AI connection writing real summaries</li>
            <li class="checkline"><span class="check-glyph">✓</span> A news pipeline covering the beats that matter to your business</li>
            <li class="checkline"><span class="check-glyph">✓</span> A daily agent, live and scheduled, running for $0</li>
          </ul>
        </div>

        <div class="completion" style="margin-top:30px;">
          <div class="completion-icon">🎉</div>
          <div><div class="completion-title">Session complete — nice work.</div><div class="completion-sub">You now own a real system that keeps working after you close the laptop. Next: try pointing this same pattern at a completely different job — a competitor-price watch, a lead follow-up nudge, anything that repeats.</div></div>
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

const GUIDE_SCRIPT = `
(function(){
  var ROOT = document.getElementById('dns-guide');
  if (!ROOT) return;
  var ORDER = ['intro','build1','build2','build3','build4','build5','share'];
  var TIMES = {intro:'10 min', build1:'10 min', build2:'10 min', build3:'15 min', build4:'20 min', build5:'10 min', share:'5 min'};
  var STORAGE_KEY = 'daily-briefing-agent-guide-v1';
  var state = { current: 0, completed: {} };

  function loadState(){
    try { var raw = localStorage.getItem(STORAGE_KEY); if (raw) { var p = JSON.parse(raw); if (p && p.completed) state.completed = p.completed; } } catch(e){}
  }
  function saveState(){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({completed: state.completed})); } catch(e){}
  }

  function render(){
    ORDER.forEach(function(id, i){
      var sec = ROOT.querySelector('.step[data-step="'+id+'"]');
      if (sec) sec.hidden = (i !== state.current);
      var navItem = ROOT.querySelector('.step-nav-item[data-target="'+id+'"]');
      if (navItem) {
        navItem.classList.toggle('active', i === state.current);
        navItem.classList.toggle('done', !!state.completed[id] && i !== state.current);
        var dot = navItem.querySelector('.nav-dot');
        if (dot) dot.textContent = (state.completed[id] && i !== state.current) ? '✓' : String(i+1);
      }
    });
    var pct = Math.round((state.current) / (ORDER.length - 1) * 100);
    var fill = document.getElementById('dns-progressFill');
    if (fill) fill.style.width = pct + '%';
    var isLast = state.current === ORDER.length - 1;
    var counter = document.getElementById('dns-stepCounter');
    if (counter) counter.textContent = isLast ? ('Done · ' + ORDER.length + '/' + ORDER.length) : (TIMES[ORDER[state.current]] + ' · ' + (state.current+1) + '/' + ORDER.length);
    ROOT.querySelectorAll('[data-nav="next"]').forEach(function(b){ b.textContent = isLast ? 'Complete ✓' : 'Next →'; });
    ROOT.querySelectorAll('[data-nav="prev"]').forEach(function(b){ b.disabled = state.current === 0; });
    window.scrollTo({top:0, behavior:'auto'});
  }

  function goTo(i){
    if (i < 0 || i >= ORDER.length) return;
    if (i > state.current) { state.completed[ORDER[state.current]] = true; saveState(); }
    state.current = i;
    render();
  }

  ROOT.querySelectorAll('[data-nav="next"]').forEach(function(b){ b.addEventListener('click', function(){ goTo(state.current + 1); }); });
  ROOT.querySelectorAll('[data-nav="prev"]').forEach(function(b){ b.addEventListener('click', function(){ goTo(state.current - 1); }); });
  ROOT.querySelectorAll('.step-nav-item').forEach(function(item){
    item.addEventListener('click', function(){
      var idx = ORDER.indexOf(item.getAttribute('data-target'));
      if (idx > -1) goTo(idx);
    });
  });

  ROOT.querySelectorAll('.accordion-trigger').forEach(function(trig){
    trig.addEventListener('click', function(){ trig.closest('.accordion').classList.toggle('open'); });
  });

  function legacyCopy(text){
    var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly',''); ta.style.position='fixed'; ta.style.top='-1000px'; ta.style.left='-1000px';
    document.body.appendChild(ta); ta.focus(); ta.select(); ta.setSelectionRange(0, text.length);
    var ok=false; try { ok=document.execCommand('copy'); } catch(e){ ok=false; } document.body.removeChild(ta); return ok;
  }

  ROOT.querySelectorAll('.copy-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var block = btn.closest('.prompt-block'); var codeEl = block ? block.querySelector('code') : null; var text = codeEl ? codeEl.textContent : '';
      var original = btn.textContent;
      function flash(msg,ok){ btn.textContent=msg; btn.classList.toggle('copied',!!ok); setTimeout(function(){ btn.textContent=original; btn.classList.remove('copied'); },1600); }
      if (legacyCopy(text)) { flash('Copied!',true); }
      else if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(function(){ flash('Copied!',true); },function(){ flash('Select & Ctrl+C',false); }); }
      else { flash('Select & Ctrl+C',false); }
    });
  });

  ROOT.querySelectorAll('.checklist input[type="checkbox"][data-key]').forEach(function(cb){
    var key = STORAGE_KEY+':chk:'+cb.getAttribute('data-key');
    try { cb.checked = localStorage.getItem(key)==='1'; } catch(e){}
    cb.addEventListener('change', function(){ try { localStorage.setItem(key, cb.checked?'1':'0'); } catch(e){} });
  });

  loadState(); render();
})();
`;

export default function DailyNewsSessionGuide() {
  const styleRef = useRef(null);
  const fontRef = useRef(null);

  useEffect(() => {
    // Inject Google Fonts
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Lexend:wght@500;600;700&family=Source+Sans+3:ital,wght@0,400;0,500;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap';
    document.head.appendChild(link);
    fontRef.current = link;

    // Inject custom styles
    const style = document.createElement('style');
    style.textContent = CUSTOM_CSS;
    document.head.appendChild(style);
    styleRef.current = style;

    // Run the guide script after DOM is ready
    const script = document.createElement('script');
    script.textContent = GUIDE_SCRIPT;
    document.body.appendChild(script);
    document.body.removeChild(script);

    return () => {
      if (fontRef.current) document.head.removeChild(fontRef.current);
      if (styleRef.current) document.head.removeChild(styleRef.current);
    };
  }, []);

  return (
    <div id="dns-guide">
      <Link to="/builder-1-guide" className="back-link">← Getting Started</Link>
      <div dangerouslySetInnerHTML={{ __html: HTML_BODY }} />
    </div>
  );
}
