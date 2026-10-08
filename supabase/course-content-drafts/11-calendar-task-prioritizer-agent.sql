insert into public.course_content_draft (course_id, what_you_build, what_you_learn, session, starter_code, test_it_out, troubleshooting, resources, tier, change_note)
values (
  11,
  $wyb$A morning planner that runs for free on Google's servers, with nothing to install. Every morning it reads today's Google Calendar and your open Google Tasks, asks Gemini (free API key) to fit the tasks into the gaps between meetings, checks the AI's answer with ordinary code (dropped, repeated or invented tasks, and tasks placed on top of a meeting), retries once if it finds a problem, and emails you a clean, color-coded plan. Your real meetings never pass through the AI, so it can't lose or invent one.$wyb$,
  $wyl$[
  "Write and run a Google Apps Script from your browser, with nothing to install",
  "Read your real Google Calendar and Google Tasks with Google's built-in services",
  "Call the Gemini API with a free key stored safely in Script Properties",
  "Give every task an ID so the AI answers with IDs only, not free text",
  "Check an AI's answer in plain code: dropped, double-booked, invented and overlapping tasks",
  "Retry once automatically and tell the AI exactly what it got wrong",
  "Schedule the script with a time-based trigger so it runs while your computer is off"
]$wyl$::jsonb,
  $sess${
  "model": "Gemini (free API key) in Google Apps Script",
  "totalTime": "60 min",
  "buildCount": 6,
  "whatYouNeed": [
    "A Google account with Google Calendar and Google Tasks (the account whose calendar you want planned)",
    "A free Gemini API key from aistudio.google.com/apikey (no credit card needed)",
    "A computer with a browser. Nothing to install, and your computer can be off once it is set up",
    "A few events in your calendar and 4 to 5 open tasks at tasks.google.com to test with"
  ],
  "outcomes": [
    "Read today's meetings from Google Calendar and your open tasks from Google Tasks, with nothing installed",
    "Have Gemini fit your tasks into the free gaps between meetings",
    "Catch the AI when it drops, repeats or invents a task, or schedules over a meeting, before you trust the plan",
    "Receive a clean plan by email every morning, plus an optional refresh at 1pm",
    "Know how a canceled or moved meeting affects the plan, and how to get a fresh one"
  ],
  "builds": [
    {
      "number": 1,
      "title": "Get your free Gemini key and create the project",
      "time": "10 min",
      "description": "Everything runs in Google Apps Script, a free tool that lives in your browser and runs your code on Google's servers, so your computer can be off. First you need a key so the script can talk to Gemini, and a project to hold the code.",
      "steps": [
        {
          "instruction": "Read this first. Every morning your agent will (1) read today's events from Google Calendar, (2) read your open tasks from Google Tasks, (3) ask Gemini, Google's free AI, to fit the tasks into the gaps between meetings, (4) check the AI's work with ordinary code, and (5) email you a styled plan.",
          "callout": {
            "variant": "tip",
            "title": "Why the safety check matters.",
            "text": "AI can drop, repeat or invent tasks. So each task gets an ID (T1, T2 and so on), the AI must answer using IDs only, and the code counts them. It also catches tasks placed on top of meetings, and retries once automatically. Your real meetings never pass through the AI, so it can't lose or invent one."
          }
        },
        {
          "instruction": "Go to aistudio.google.com/apikey and sign in with a Google account. Click Create API key, then copy it. No credit card is needed. Paste it into a private note for Build 2.",
          "callout": {
            "variant": "warning",
            "text": "Free-tier limits can change, so check them in your AI Studio account. One or two requests a day is very light. On the free tier, Google may use requests to improve its products, so keep sensitive details out of event and task titles."
          },
          "verify": "Your key is copied into a private note. Never share it."
        },
        {
          "instruction": "Go to script.google.com on a computer, signed in to the Google account whose calendar you want. Click New project, then rename \"Untitled project\" to Morning Planner.",
          "verify": "Your project is named Morning Planner and you can see an empty code editor."
        },
        {
          "instruction": "Know the screen before you continue. In the left sidebar, <> is the Editor (your code), the clock is Triggers, the gear is Project Settings, and Services has a + beside it. Above the code are Run, Debug and a function dropdown. The dropdown only shows names after you paste code and save. If it is hidden, zoom out with Ctrl and minus, or widen the window. These words are used throughout the guide:",
          "table": {
            "header": [
              "Word",
              "Meaning"
            ],
            "rows": [
              [
                "Function",
                "One named job in the code, for example function testCalendar() { ... }"
              ],
              [
                "Run",
                "The button that runs **only the function selected in the dropdown** beside it"
              ],
              [
                "Execution log",
                "The panel at the bottom that shows results and errors"
              ],
              [
                "API key",
                "A password that lets your script use Gemini. Never share it."
              ],
              [
                "Trigger",
                "A rule like \"run this every morning\""
              ]
            ]
          }
        }
      ]
    },
    {
      "number": 2,
      "title": "Turn on Google Tasks and save your settings",
      "time": "10 min",
      "description": "The script reads your tasks through Google's Tasks service, and it reads your Gemini key from Script Properties, a private settings box that is never part of the code.",
      "steps": [
        {
          "instruction": "In the left sidebar of the Apps Script editor, click the + next to Services. Choose Google Tasks API, then click Add.",
          "verify": "You see Tasks listed under Services. Skip this step and you will get the error Tasks is not defined."
        },
        {
          "instruction": "Click the gear icon (Project Settings). Under Script Properties, click Add script property."
        },
        {
          "instruction": "Set the property name to GEMINI_API_KEY (exactly, in capitals), paste your key as the value, and click Save script properties.",
          "verify": "GEMINI_API_KEY now appears in the Script Properties list."
        },
        {
          "instruction": "On the same page, check that the time zone is yours. A wrong time zone shifts every time in your plan.",
          "verify": "The time zone shown is the one you live in."
        }
      ]
    },
    {
      "number": 3,
      "title": "Paste the full code",
      "time": "10 min",
      "description": "One file holds the whole agent: your settings, the calendar and task readers, the AI call, the safety check, the email and the daily trigger.",
      "steps": [
        {
          "instruction": "Click the <> Editor icon. Click inside the code area, press Ctrl+A (Cmd+A on Mac), then press Delete so the editor is empty."
        },
        {
          "instruction": "Copy the code below and paste it into the empty editor. Press Ctrl+S to save. Always save before every Run.",
          "prompt": "// ===== SETTINGS: the only part you will normally change =====\nconst CONFIG = {\n  MODEL: 'gemini-flash-latest',\n  WORK_START: '09:00',\n  WORK_END: '17:30',\n  SEND_HOUR: 6,            // email arrives between 6:00 and 7:00\n  SKIP_WEEKENDS: true,     // set false if you test on a Saturday or Sunday\n  ALL_CALENDARS: true,     // false = only your main calendar\n  EXTRA_REFRESH_HOURS: [13]  // extra updated plans during the day (13 = 1pm). Use [] for none\n};\n\n// ===== 1. CALENDAR =====\nfunction getEvents_(tz) {\n  const cals = CONFIG.ALL_CALENDARS\n    ? CalendarApp.getAllCalendars().filter(c => c.isSelected())\n    : [CalendarApp.getDefaultCalendar()];\n  const seen = {};\n  const out = [];\n  cals.forEach(cal => {\n    cal.getEventsForDay(new Date()).forEach(e => {\n      if (e.getMyStatus() === CalendarApp.GuestStatus.NO) return;  // skip declined\n      if (seen[e.getId()]) return;                                 // skip duplicates\n      seen[e.getId()] = true;\n      const ad = e.isAllDayEvent();\n      out.push({\n        title: e.getTitle() || '(no title)',\n        allDay: ad,\n        start: ad ? 'all day' : Utilities.formatDate(e.getStartTime(), tz, 'HH:mm'),\n        end: ad ? '' : Utilities.formatDate(e.getEndTime(), tz, 'HH:mm')\n      });\n    });\n  });\n  return out.sort((a, b) => a.start.localeCompare(b.start));\n}\n\nfunction testCalendar() {\n  const events = getEvents_(Session.getScriptTimeZone());\n  Logger.log('Found ' + events.length + ' events today');\n  events.forEach(e => Logger.log(e.start + '-' + e.end + '  ' + e.title));\n}\n\n// ===== 2. TASKS =====\nfunction getTasks_() {\n  const out = [];\n  (Tasks.Tasklists.list().items || []).forEach(list => {\n    const res = Tasks.Tasks.list(list.id, { showCompleted: false, maxResults: 100 });\n    (res.items || []).forEach(t => {\n      if (t.title) out.push({ title: t.title, due: t.due ? t.due.slice(0, 10) : null });\n    });\n  });\n  return out.map((t, i) => ({ id: 'T' + (i + 1), title: t.title, due: t.due }));\n}\n\nfunction testTasks() {\n  const tasks = getTasks_();\n  Logger.log('Found ' + tasks.length + ' open tasks');\n  tasks.forEach(t => Logger.log(t.id + ': ' + t.title + (t.due ? ' (due ' + t.due + ')' : '')));\n}\n\n// ===== 3. THE AI =====\nfunction buildPrompt_(events, tasks, tz) {\n  const today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');\n  const ev = events.length\n    ? events.map(e => '- ' + e.start + (e.end ? '-' + e.end : '') + ' ' + e.title).join('\\n')\n    : '(none)';\n  const tk = tasks.map(t => '- ' + t.id + ': ' + t.title + (t.due ? ' (due ' + t.due + ')' : '')).join('\\n');\n\n  return `You are a daily planning assistant. Today is ${today}.\nWorking hours: ${CONFIG.WORK_START}-${CONFIG.WORK_END}.\n\nFIXED CALENDAR EVENTS (do not move or repeat these):\n${ev}\n\nTASKS (refer to them ONLY by their ID):\n${tk}\n\nSchedule the tasks into free gaps between events, most urgent and important first\n(overdue and due-today tasks come first). Never overlap an event.\nTask titles may end with a duration like [60m]; use it as the block length. If there is none, assume 30 minutes.\nTasks starting with [High] must be scheduled first.\nEvery task ID must appear exactly once: either in \"plan\" or in \"unscheduled\".\nDo not invent IDs.\n\nReply with JSON only, in this shape:\n{\"plan\":[{\"time\":\"HH:MM-HH:MM\",\"task_id\":\"T1\",\"note\":\"short reason\"}],\n \"unscheduled\":[{\"task_id\":\"T2\",\"reason\":\"short reason\"}],\n \"tip\":\"one sentence of advice for the day\"}`;\n}\n\nfunction askGemini_(prompt) {\n  const key = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');\n  if (!key) throw new Error('GEMINI_API_KEY is missing in Script Properties');\n\n  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + CONFIG.MODEL + ':generateContent';\n  const options = {\n    method: 'post',\n    contentType: 'application/json',\n    headers: { 'x-goog-api-key': key },\n    muteHttpExceptions: true,\n    payload: JSON.stringify({\n      contents: [{ parts: [{ text: prompt }] }],\n      generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 4000 }\n    })\n  };\n\n  let res;\n  for (let attempt = 0; attempt < 3; attempt++) {   // retry if Gemini is busy\n    res = UrlFetchApp.fetch(url, options);\n    if (![500, 503].includes(res.getResponseCode())) break;\n    Utilities.sleep(3000);\n  }\n  if (res.getResponseCode() !== 200) {\n    throw new Error('Gemini ' + res.getResponseCode() + ': ' + res.getContentText().slice(0, 150));\n  }\n  const parts = JSON.parse(res.getContentText()).candidates[0].content.parts;\n  const text = parts.filter(p => !p.thought).map(p => p.text).join('');\n  return JSON.parse(text);\n}\n\nfunction testAI() {\n  const tz = Session.getScriptTimeZone();\n  const events = [{ title: 'Team standup', allDay: false, start: '09:00', end: '09:15' }];\n  const tasks = [\n    { id: 'T1', title: 'Finish budget review', due: null },\n    { id: 'T2', title: 'Book dentist appointment', due: null }\n  ];\n  Logger.log(JSON.stringify(askGemini_(buildPrompt_(events, tasks, tz)), null, 2));\n}\n\n// ===== 4. THE SAFETY CHECK =====\nfunction toMin_(hhmm) {\n  const p = String(hhmm).trim().split(':').map(Number);\n  return p[0] * 60 + p[1];\n}\n\nfunction checkPlan_(result, tasks, events = []) {\n  const problems = [];\n  const count = {};\n  const seen = (result.plan || []).map(p => p.task_id)\n    .concat((result.unscheduled || []).map(u => u.task_id));\n  seen.forEach(id => count[id] = (count[id] || 0) + 1);\n\n  const known = tasks.map(t => t.id);\n  tasks.forEach(t => {\n    if (!count[t.id]) problems.push('DROPPED: \"' + t.title + '\" was left out of the plan.');\n    else if (count[t.id] > 1) problems.push('DOUBLE-BOOKED: \"' + t.title + '\" appears ' + count[t.id] + ' times.');\n  });\n  Object.keys(count).forEach(id => {\n    if (!known.includes(id)) problems.push('INVENTED: the AI added a task \"' + id + '\" you never gave it (ignored).');\n  });\n\n  // Does any scheduled task overlap a real meeting?\n  (result.plan || []).forEach(p => {\n    const parts = (p.time || '').split('-');\n    if (parts.length !== 2) return;\n    const s = toMin_(parts[0]), e = toMin_(parts[1]);\n    events.filter(ev => !ev.allDay).forEach(ev => {\n      if (s < toMin_(ev.end) && e > toMin_(ev.start)) {\n        problems.push('OVERLAP: task ' + p.task_id + ' (' + p.time + ') clashes with \"' + ev.title + '\".');\n      }\n    });\n  });\n  return problems;\n}\n\nfunction testCheck() {\n  const tasks = [\n    { id: 'T1', title: 'Budget' },\n    { id: 'T2', title: 'Dentist' },\n    { id: 'T3', title: 'Slides' }\n  ];\n  const broken = { plan: [{ task_id: 'T1' }, { task_id: 'T1' }, { task_id: 'T9' }], unscheduled: [] };\n  const problems = checkPlan_(broken, tasks);\n  problems.forEach(p => Logger.log(p));\n  if (problems.length !== 4) throw new Error('Expected 4 problems, got ' + problems.length);\n  Logger.log('All checks passed.');\n}\n\n// ===== 5. THE EMAIL =====\nfunction esc_(s) {\n  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');\n}\n\nfunction render_(events, tasks, result, problems) {\n  const tz = Session.getScriptTimeZone();\n  const dateText = Utilities.formatDate(new Date(), tz, 'EEEE, MMMM d');\n  const byId = {};\n  tasks.forEach(t => byId[t.id] = t);\n\n  // Colors: change these to restyle the email\n  const C = {\n    brand: '#264D73',\n    event: '#264D73', eventBg: '#E8EDF3',\n    task: '#15803D', taskBg: '#EAFAF1',\n    warn: '#D98F1F', warnBg: '#FEF9E7',\n    bad: '#B3261E', badBg: '#FDECEA',\n    text: '#0F1A2A', muted: '#4A5B6C', page: '#F6F8FB'\n  };\n\n  const sectionTitle = (title, color) =>\n    '<div style=\"font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:' +\n    color + ';margin:26px 0 10px\">' + esc_(title) + '</div>';\n\n  const row = (label, text, note, color, bg) =>\n    '<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin-bottom:8px\"><tr>' +\n      '<td width=\"100\" valign=\"top\" style=\"padding:12px 10px 0 0;font-size:12px;font-weight:bold;color:' +\n        C.muted + ';white-space:nowrap\">' + esc_(label) + '</td>' +\n      '<td style=\"background:' + bg + ';border-left:4px solid ' + color + ';border-radius:6px;padding:10px 14px\">' +\n        '<div style=\"font-size:15px;font-weight:bold;color:' + C.text + '\">' + esc_(text) + '</div>' +\n        (note ? '<div style=\"font-size:13px;color:' + C.muted + ';margin-top:3px\">' + esc_(note) + '</div>' : '') +\n      '</td></tr></table>';\n\n  const statBox = (number, label, color) =>\n    '<td align=\"center\" style=\"background:#ffffff;border-radius:8px;padding:12px 6px\">' +\n      '<div style=\"font-size:26px;font-weight:bold;color:' + color + '\">' + number + '</div>' +\n      '<div style=\"font-size:12px;color:' + C.muted + '\">' + label + '</div></td>';\n\n  const allDay = events.filter(e => e.allDay);\n  const timed = events.filter(e => !e.allDay);\n  const scheduled = result ? (result.plan || []).filter(p => byId[p.task_id]) : [];\n  const notToday = result ? (result.unscheduled || []).filter(u => byId[u.task_id]) : [];\n  let body = '';\n\n  if (allDay.length) {\n    body += sectionTitle('All day', C.event);\n    allDay.forEach(e => {\n      body += '<div style=\"background:' + C.eventBg + ';border-radius:20px;display:inline-block;padding:6px 14px;' +\n        'margin:0 6px 6px 0;font-size:14px;color:' + C.event + '\">' + esc_(e.title) + '</div>';\n    });\n  }\n\n  if (result) {\n    const rows = timed.map(e => ({\n      sort: e.start, label: e.start + ' - ' + e.end, text: e.title, note: '', color: C.event, bg: C.eventBg\n    }));\n    scheduled.forEach(p => rows.push({\n      sort: (p.time || '99:99').split('-')[0].trim(),\n      label: (p.time || '').replace('-', ' - '),\n      text: byId[p.task_id].title, note: p.note || '', color: C.task, bg: C.taskBg\n    }));\n    rows.sort((a, b) => a.sort.localeCompare(b.sort));\n\n    body += sectionTitle('Your day', C.brand);\n    if (!rows.length) body += '<div style=\"color:' + C.muted + ';font-size:14px\">Nothing scheduled for today.</div>';\n    rows.forEach(r => { body += row(r.label, r.text, r.note, r.color, r.bg); });\n\n    if (notToday.length) {\n      body += sectionTitle('Not today', C.warn);\n      notToday.forEach(u => { body += row('Later', byId[u.task_id].title, u.reason || '', C.warn, C.warnBg); });\n    }\n    if (result.tip) {\n      body += '<div style=\"background:' + C.eventBg + ';border-radius:8px;padding:14px 16px;margin-top:24px;font-size:14px;color:' +\n        C.brand + '\"><b>Tip for today:</b> ' + esc_(result.tip) + '</div>';\n    }\n  } else {\n    body += sectionTitle('Calendar', C.event);\n    if (!timed.length) body += '<div style=\"color:' + C.muted + ';font-size:14px\">No timed events today.</div>';\n    timed.forEach(e => { body += row(e.start + ' - ' + e.end, e.title, '', C.event, C.eventBg); });\n    body += sectionTitle('Tasks', C.task);\n    tasks.forEach(t => { body += row('To do', t.title, t.due ? 'Due ' + t.due : '', C.task, C.taskBg); });\n  }\n\n  if (problems.length) {\n    body += '<div style=\"background:' + C.badBg + ';border-left:4px solid ' + C.bad + ';border-radius:6px;' +\n      'padding:12px 16px;margin-top:24px;font-size:13px;color:' + C.bad + '\"><b>Double-check:</b><br>' +\n      problems.map(esc_).join('<br>') + '</div>';\n  }\n\n  const stats =\n    '<table width=\"100%\" cellpadding=\"0\" cellspacing=\"8\" style=\"margin:16px -8px 0\"><tr>' +\n      statBox(events.length, 'Meetings', C.event) +\n      statBox(result ? scheduled.length : tasks.length, result ? 'Tasks scheduled' : 'Open tasks', C.task) +\n      (result ? statBox(notToday.length, 'For later', C.warn) : '') +\n    '</tr></table>';\n\n  return '<div style=\"background:' + C.page + ';padding:20px 10px;font-family:Arial,Helvetica,sans-serif\">' +\n    '<div style=\"max-width:600px;margin:0 auto\">' +\n      '<div style=\"background:' + C.brand + ';border-radius:12px 12px 0 0;padding:26px 24px;color:#ffffff\">' +\n        '<div style=\"font-size:13px;opacity:0.85\">Good morning</div>' +\n        '<div style=\"font-size:24px;font-weight:bold;margin-top:4px\">' + esc_(dateText) + '</div></div>' +\n      '<div style=\"background:#ffffff;border-radius:0 0 12px 12px;padding:8px 24px 28px\">' +\n        '<div style=\"background:' + C.page + ';border-radius:10px;padding:0 8px 8px;margin-top:18px\">' + stats + '</div>' +\n        body + '</div>' +\n      '<div style=\"text-align:center;font-size:12px;color:' + C.muted + ';margin-top:14px\">Made by your Morning Planner</div>' +\n    '</div></div>';\n}\n\n// ===== 6. MAIN: runs every morning =====\nfunction sendMorningPlan() {\n  if (CONFIG.SKIP_WEEKENDS && [0, 6].includes(new Date().getDay())) return;\n\n  const tz = Session.getScriptTimeZone();\n  const events = getEvents_(tz);\n  const tasks = getTasks_();\n  if (!events.length && !tasks.length) return;\n\n  let result = null;\n  let problems = [];\n  if (tasks.length) {\n    try {\n      const prompt = buildPrompt_(events, tasks, tz);\n      result = askGemini_(prompt);\n      problems = checkPlan_(result, tasks, events);\n      if (problems.length) {   // ask once more, telling the AI what it got wrong\n        result = askGemini_(prompt + '\\n\\nYour previous answer had these problems. Fix them:\\n' + problems.join('\\n'));\n        problems = checkPlan_(result, tasks, events);\n      }\n    } catch (err) {\n      problems.push('The AI step failed (' + err.message + '). Showing what is available.');\n    }\n  }\n\n  MailApp.sendEmail({\n    to: Session.getEffectiveUser().getEmail(),\n    subject: 'Your plan for ' + Utilities.formatDate(new Date(), tz, 'EEEE, MMMM d'),\n    htmlBody: render_(events, tasks, result, problems)\n  });\n}\n\n// ===== RUN ONCE to schedule the morning email and the refreshes =====\nfunction setupDailyTrigger() {\n  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));\n  ScriptApp.newTrigger('sendMorningPlan').timeBased().everyDays(1).atHour(CONFIG.SEND_HOUR).create();\n  // Midday refresh(es): picks up meetings that were canceled or moved after the morning email\n  CONFIG.EXTRA_REFRESH_HOURS.forEach(h => {\n    ScriptApp.newTrigger('sendMorningPlan').timeBased().everyDays(1).atHour(h).create();\n  });\n}\n",
          "promptKind": "code",
          "verify": "After saving, the toolbar's function dropdown lists your functions, and the code shows no red marks."
        },
        {
          "instruction": "Know the settings at the top of the code. The CONFIG block is the only part you will normally change.",
          "table": {
            "header": [
              "Setting",
              "What it does"
            ],
            "rows": [
              [
                "WORK_START / WORK_END",
                "Your working day. Tasks are only planned inside these hours."
              ],
              [
                "SEND_HOUR",
                "The hour the morning email is sent. 6 means between 6:00 and 7:00."
              ],
              [
                "SKIP_WEEKENDS",
                "true sends nothing on Saturday and Sunday. Set it to false if you test on a weekend."
              ],
              [
                "ALL_CALENDARS",
                "true reads every ticked calendar. false reads only your main calendar."
              ],
              [
                "EXTRA_REFRESH_HOURS",
                "Hours for extra updated plans. [13, 16] means 1pm and 4pm. [] means none."
              ]
            ]
          }
        },
        {
          "instruction": "Optional: add hints to your task titles in Google Tasks.",
          "callout": {
            "variant": "tip",
            "text": "**[High] Reply to vendor [15m]** means top priority and a 15-minute block. A task with no duration is given 30 minutes."
          }
        }
      ]
    },
    {
      "number": 4,
      "title": "Test one function at a time",
      "time": "15 min",
      "description": "For each test: pick the function in the dropdown, click Run, and read the Execution log. Run only runs the function selected in the dropdown beside it.",
      "steps": [
        {
          "instruction": "Run your first function and approve permissions. Choose testCalendar in the dropdown and click Run. The first run asks for permission: click Review permissions, choose your account, and if you see \"Google hasn't verified this app\" click Advanced, then Go to Morning Planner (unsafe), then Allow. That is normal for your own script."
        },
        {
          "instruction": "Now run each function below, in this order.",
          "table": {
            "header": [
              "Run this",
              "Before",
              "You should see"
            ],
            "rows": [
              [
                "testCalendar",
                "Add an event for later today in Google Calendar",
                "Found 1 events today, then its time and title"
              ],
              [
                "testTasks",
                "Add 4 to 5 tasks at tasks.google.com",
                "Found 5 open tasks, then T1: ..., T2: ..."
              ],
              [
                "testAI",
                "Your key saved (Build 2)",
                "A JSON block with plan, unscheduled and tip"
              ],
              [
                "testCheck",
                "Nothing",
                "Four warnings (expected, it uses fake broken data), then All checks passed."
              ],
              [
                "sendMorningPlan",
                "Everything above done",
                "An email \"Your plan for ...\" in your inbox (check Spam)"
              ]
            ]
          },
          "callout": {
            "variant": "warning",
            "text": "Only function names without a trailing underscore (_) are meant to be run by you."
          },
          "verify": "The email arrived and the Execution log showed no errors."
        }
      ]
    },
    {
      "number": 5,
      "title": "Make it automatic",
      "time": "5 min",
      "description": "A trigger runs your script on a schedule, even when your computer is off.",
      "steps": [
        {
          "instruction": "Choose setupDailyTrigger in the dropdown and click Run once."
        },
        {
          "instruction": "Click the clock icon (Triggers).",
          "verify": "You see one trigger for sendMorningPlan at your morning hour, plus one more for each hour in EXTRA_REFRESH_HOURS (by default 1pm)."
        },
        {
          "instruction": "Changed SEND_HOUR or EXTRA_REFRESH_HOURS later? Run setupDailyTrigger again.",
          "callout": {
            "variant": "tip",
            "text": "It deletes the old triggers first, so you never get duplicates."
          }
        }
      ]
    },
    {
      "number": 6,
      "title": "When plans change, and how it all works",
      "time": "10 min",
      "description": "The agent has no memory. Every run reads your calendar fresh and builds a new plan, so what happens when a meeting changes depends on when the change is made.",
      "steps": [
        {
          "instruction": "See what the agent does when a meeting is canceled or moved.",
          "table": {
            "header": [
              "What happened",
              "What the agent does"
            ],
            "rows": [
              [
                "Canceled or deleted **before** a run",
                "The meeting is gone, its slot is free, and tasks can use it"
              ],
              [
                "Moved to another day",
                "It leaves today's plan and appears on its new day's plan"
              ],
              [
                "Moved to another time today",
                "The new time is used and tasks are planned around it"
              ],
              [
                "You declined it",
                "Treated like a cancellation (declined events are skipped)"
              ],
              [
                "Only \"CANCELED\" typed in the title",
                "Still counts as a real meeting. Delete or decline it instead."
              ],
              [
                "Changed **after** the morning email",
                "The earlier email does not update. A later run does."
              ]
            ]
          }
        },
        {
          "instruction": "Get an updated plan after a change in one of two ways. Automatic: EXTRA_REFRESH_HOURS: [13] sends a fresh plan at about 1pm. Add more hours, such as [13, 16], then run setupDailyTrigger again. Manual: in the editor choose sendMorningPlan and click Run, and a new email arrives with your current calendar.",
          "callout": {
            "variant": "warning",
            "text": "Each refresh is one more AI request (two if the safety check triggers a retry), so more refreshes use more of your free limit. The agent never edits your calendar or your Google Tasks. It only reads them and emails you a plan."
          }
        },
        {
          "instruction": "Learn what each part of the code does.",
          "table": {
            "header": [
              "Part",
              "Job"
            ],
            "rows": [
              [
                "CONFIG",
                "Your settings in one place"
              ],
              [
                "getEvents_",
                "Reads today's events (all ticked calendars), skips declined ones, handles all-day events"
              ],
              [
                "getTasks_",
                "Reads open Google Tasks and gives each an ID"
              ],
              [
                "buildPrompt_",
                "Writes the instructions for the AI"
              ],
              [
                "askGemini_",
                "Calls Gemini, retries if it is busy, returns the answer as data"
              ],
              [
                "checkPlan_",
                "Flags DROPPED, DOUBLE-BOOKED, INVENTED and OVERLAP problems"
              ],
              [
                "render_",
                "Builds the email: blue meetings, green tasks, amber for tasks left for later"
              ],
              [
                "sendMorningPlan",
                "Runs everything, retries once if the check fails, sends the email"
              ]
            ]
          }
        }
      ],
      "goFurther": "Restyle the email by editing the colors in the C list inside render_. Try changing WORK_END, then run sendMorningPlan and watch the plan change."
    }
  ],
  "portfolio": "You built an agent that plans your day for free: it reads your calendar and tasks, has Gemini fit them together, checks the AI's work in code, and emails you a clean plan every morning. Take a screenshot of one of your plan emails (hide anything private) and add \"Calendar & Task Prioritizer Agent\" to your build portfolio.",
  "portfolioPrompt": "I just built a Calendar & Task Prioritizer Agent in Google Apps Script. Every morning it reads my Google Calendar and Google Tasks, asks Gemini (free API key) to fit my tasks around my meetings, checks the AI's plan with code for dropped, duplicated or invented tasks and tasks scheduled on top of meetings, retries once if it finds a problem, and emails me a styled daily plan. It needs no installs and runs on Google's servers.\n\nHelp me write:\n1. A 2-3 sentence project description for my portfolio site\n2. A short LinkedIn post announcing it\n3. Three resume-style bullet points describing what I built and the skills it shows"
}$sess$::jsonb,
  null, null,
  $tsh$[
  {
    "issue": "No function dropdown",
    "fix": "Paste the code, save with Ctrl+S, refresh the page, zoom out with Ctrl and minus, or use a computer."
  },
  {
    "issue": "Tasks is not defined",
    "fix": "Redo Build 2 and add the Google Tasks API under Services."
  },
  {
    "issue": "GEMINI_API_KEY is missing",
    "fix": "Redo the Script Properties steps in Build 2. The property name must match exactly."
  },
  {
    "issue": "Gemini 400 or 403",
    "fix": "Wrong key or extra spaces. Make a new key at aistudio.google.com/apikey and save it again."
  },
  {
    "issue": "Gemini 404",
    "fix": "Change MODEL in the CONFIG block to 'gemini-flash-lite-latest' and save."
  },
  {
    "issue": "Gemini 429",
    "fix": "You reached the free limit. Wait a while, then try again."
  },
  {
    "issue": "Found 0 events but you have some",
    "fix": "Wrong Google account, wrong time zone, or the events are not today."
  },
  {
    "issue": "No email arrived",
    "fix": "Check Spam. On a weekend with SKIP_WEEKENDS set to true, nothing is sent."
  },
  {
    "issue": "Identifier already declared",
    "fix": "You pasted the code twice. Select all, delete, and paste it once."
  },
  {
    "issue": "Two emails a day",
    "fix": "Expected: the second is the 1pm refresh. Set EXTRA_REFRESH_HOURS to [] and run setupDailyTrigger again to stop it."
  },
  {
    "issue": "The email shows a Double-check box",
    "fix": "The safety check caught an AI slip. Run sendMorningPlan again."
  }
]$tsh$::jsonb,
  $res$[
  {
    "title": "Google Apps Script overview",
    "url": "https://developers.google.com/apps-script/overview"
  },
  {
    "title": "Apps Script CalendarApp reference",
    "url": "https://developers.google.com/apps-script/reference/calendar/calendar-app"
  },
  {
    "title": "Apps Script advanced Tasks service",
    "url": "https://developers.google.com/apps-script/advanced/tasks"
  },
  {
    "title": "Gemini API documentation",
    "url": "https://ai.google.dev/gemini-api/docs"
  }
]$res$::jsonb,
  'builder1',
  $note$Replace the Python/OAuth guide with the Google Apps Script + Gemini Free AI Morning Planner (nothing to install; email restyled to Social Dev blue). Content from morning-planner-guide-v2.html; uses step.table / step.callout / step.promptKind (SessionGuide).$note$
)
on conflict (course_id) do update set
  what_you_build = excluded.what_you_build,
  what_you_learn = excluded.what_you_learn,
  session = excluded.session,
  starter_code = excluded.starter_code,
  test_it_out = excluded.test_it_out,
  troubleshooting = excluded.troubleshooting,
  resources = excluded.resources,
  tier = excluded.tier,
  change_note = excluded.change_note, updated_at = now();
