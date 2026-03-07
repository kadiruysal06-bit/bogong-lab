var mode = 'think';
var activeAIs = { claude: true, gemini: true, gpt: true };
var contextFiles = [];
var histories = { claude: [], gemini: [], gpt: [] };
var settings = {
  promptClaude: 'You are an expert system architect. You know Bogong AI projects: Mirrors, bogongai.net, House of CB. Be precise and technical.',
  promptGemini: 'You are a rapid creative problem solver. Think fast, generate alternatives, be bold.',
  promptGpt: 'You are a code reviewer. Find bugs, security issues, and optimizations. Be specific.',
  keyAnthropic: '',
  keyGemini: '',
  keyOpenAI: ''
};

function loadSettings() {
  var saved = localStorage.getItem('bogong-unidash-settings');
  if (saved) {
    try { settings = Object.assign(settings, JSON.parse(saved)); } catch(e) {}
  }
  var pc = document.getElementById('promptClaude');
  var pg = document.getElementById('promptGemini');
  var pp = document.getElementById('promptGpt');
  if (pc) pc.value = settings.promptClaude;
  if (pg) pg.value = settings.promptGemini;
  if (pp) pp.value = settings.promptGpt;
}

function saveSettings() {
  settings.promptClaude = document.getElementById('promptClaude').value;
  settings.promptGemini = document.getElementById('promptGemini').value;
  settings.promptGpt = document.getElementById('promptGpt').value;
  localStorage.setItem('bogong-unidash-settings', JSON.stringify(settings));
  closeSettings();
  showToast('Saved');
}

function openSettings() {
  loadSettings();
  var el = document.getElementById('settingsOverlay');
  if (el) el.classList.add('show');
}

function closeSettings() {
  var el = document.getElementById('settingsOverlay');
  if (el) el.classList.remove('show');
}

function showToast(msg) {
  var t = document.getElementById('copyToast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 2000);
}

function setMode(m) {
  mode = m;
  var bt = document.getElementById('btnThink');
  var bd = document.getElementById('btnDo');
  if (bt) bt.classList.toggle('active', m === 'think');
  if (bd) bd.classList.toggle('active', m === 'do');
}

function setProject(p) {
  contextFiles = [];
  renderContextTags();
}

function addContext(file) {
  if (contextFiles.indexOf(file) === -1) {
    contextFiles.push(file);
    renderContextTags();
  }
  document.querySelectorAll('.file-item').forEach(function(el) {
    el.classList.toggle('active', el.textContent.trim() === file);
  });
}

function removeContext(file) {
  contextFiles = contextFiles.filter(function(f) { return f !== file; });
  renderContextTags();
  document.querySelectorAll('.file-item').forEach(function(el) {
    if (el.textContent.trim() === file) el.classList.remove('active');
  });
}

function renderContextTags() {
  var container = document.getElementById('contextTags');
  if (!container) return;
  container.innerHTML = '';
  if (contextFiles.length === 0) {
    var hint = document.createElement('span');
    hint.style.cssText = 'font-size:10px;letter-spacing:2px;color:rgba(255,255,255,0.3);font-family:monospace';
    hint.textContent = 'No files selected';
    container.appendChild(hint);
    return;
  }
  contextFiles.forEach(function(f) {
    var tag = document.createElement('span');
    tag.className = 'context-tag';
    tag.textContent = f + ' ';
    var btn = document.createElement('span');
    btn.className = 'context-tag-remove';
    btn.textContent = 'x';
    btn.onclick = function() { removeContext(f); };
    tag.appendChild(btn);
    container.appendChild(tag);
  });
}

function toggleAI(ai) {
  activeAIs[ai] = !activeAIs[ai];
  var el = document.getElementById('toggle-' + ai);
  if (el) el.classList.toggle('on', activeAIs[ai]);
}

function quickPrompt(text) {
  var input = document.getElementById('mainInput');
  if (input) { input.value = text; input.focus(); }
}

async function sendMessage() {
  var input = document.getElementById('mainInput');
  var text = input.value.trim();
  if (!text) return;
  input.value = '';
  input.style.height = 'auto';
  var ctx = contextFiles.length > 0 ? '\n\n[Context: ' + contextFiles.join(', ') + ']' : '';
  var full = text + ctx;
  var promises = [];
  if (activeAIs.claude) promises.push(callClaude(full));
  if (activeAIs.gemini) promises.push(callGemini(full));
  if (activeAIs.gpt) promises.push(callGPT(full));
  await Promise.all(promises);
}

function addUserMsg(ai, text) {
  var container = document.getElementById('messages-' + ai);
  var empty = container.querySelector('.empty-state');
  if (empty) empty.remove();
  var msg = document.createElement('div');
  msg.className = 'msg user';
  var role = document.createElement('div');
  role.className = 'msg-role';
  role.textContent = 'You';
  var content = document.createElement('div');
  content.className = 'msg-content';
  content.textContent = text.split('\n\n[Context')[0];
  msg.appendChild(role);
  msg.appendChild(content);
  container.appendChild(msg);
  histories[ai].push({ role: 'user', content: text });
  scrollPanel(ai);
}

function addAIMsg(ai) {
  var container = document.getElementById('messages-' + ai);
  var msg = document.createElement('div');
  msg.className = 'msg';
  var role = document.createElement('div');
  role.className = 'msg-role';
  role.textContent = ai.charAt(0).toUpperCase() + ai.slice(1);
  var content = document.createElement('div');
  content.className = 'msg-content';
  var loader = document.createElement('div');
  loader.className = 'loader';
  for (var i = 0; i < 3; i++) {
    var dot = document.createElement('span');
    loader.appendChild(dot);
  }
  content.appendChild(loader);
  msg.appendChild(role);
  msg.appendChild(content);
  container.appendChild(msg);
  scrollPanel(ai);
  return content;
}

function formatText(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

function scrollPanel(ai) {
  var panels = ai ? [ai] : ['claude', 'gemini', 'gpt'];
  panels.forEach(function(a) {
    var el = document.getElementById('messages-' + a);
    if (el) el.scrollTop = el.scrollHeight;
  });
}

async function callClaude(text) {
  addUserMsg('claude', text);
  var contentEl = addAIMsg('claude');
  try {
    var msgs = histories.claude.map(function(m) { return { role: m.role, content: m.content }; });
    var response = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system: settings.promptClaude, messages: msgs })
    });
    contentEl.innerHTML = '';
    var cursor = document.createElement('span');
    cursor.className = 'streaming-cursor';
    contentEl.appendChild(cursor);
    var reader = response.body.getReader();
    var decoder = new TextDecoder();
    var fullText = '';
    while (true) {
      var result = await reader.read();
      if (result.done) break;
      var chunk = decoder.decode(result.value);
      var lines = chunk.split('\n');
      for (var li = 0; li < lines.length; li++) {
        var line = lines[li];
        if (line.indexOf('data: ') === 0) {
          var data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            var parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta && parsed.delta.text) {
              fullText += parsed.delta.text;
              contentEl.innerHTML = formatText(fullText);
              var cur = document.createElement('span');
              cur.className = 'streaming-cursor';
              contentEl.appendChild(cur);
              scrollPanel('claude');
            }
          } catch(e) {}
        }
      }
    }
    var cur2 = contentEl.querySelector('.streaming-cursor');
    if (cur2) cur2.remove();
    histories.claude.push({ role: 'assistant', content: fullText });
  } catch(e) {
    contentEl.textContent = 'Error: ' + e.message;
  }
}

async function callGemini(text) {
  addUserMsg('gemini', text);
  var contentEl = addAIMsg('gemini');
  try {
    var msgs = histories.gemini.map(function(m) {
      return { role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] };
    });
    var response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system: settings.promptGemini, messages: msgs })
    });
    contentEl.innerHTML = '';
    var reader = response.body.getReader();
    var decoder = new TextDecoder();
    var fullText = '';
    while (true) {
      var result = await reader.read();
      if (result.done) break;
      var chunk = decoder.decode(result.value);
      var lines = chunk.split('\n');
      for (var li = 0; li < lines.length; li++) {
        var line = lines[li];
        if (line.indexOf('data: ') === 0) {
          try {
            var parsed = JSON.parse(line.slice(6));
            var t = parsed.candidates && parsed.candidates[0] && parsed.candidates[0].content && parsed.candidates[0].content.parts && parsed.candidates[0].content.parts[0] && parsed.candidates[0].content.parts[0].text;
            if (t) {
              fullText += t;
              contentEl.innerHTML = formatText(fullText);
              var cur = document.createElement('span');
              cur.className = 'streaming-cursor';
              contentEl.appendChild(cur);
              scrollPanel('gemini');
            }
          } catch(e) {}
        }
      }
    }
    var cur2 = contentEl.querySelector('.streaming-cursor');
    if (cur2) cur2.remove();
    histories.gemini.push({ role: 'assistant', content: fullText });
  } catch(e) {
    contentEl.textContent = 'Error: ' + e.message;
  }
}

async function callGPT(text) {
  addUserMsg('gpt', text);
  var contentEl = addAIMsg('gpt');
  try {
    var msgs = [{ role: 'system', content: settings.promptGpt }].concat(
      histories.gpt.map(function(m) { return { role: m.role, content: m.content }; })
    );
    var response = await fetch('/api/gpt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: msgs })
    });
    contentEl.innerHTML = '';
    var reader = response.body.getReader();
    var decoder = new TextDecoder();
    var fullText = '';
    while (true) {
      var result = await reader.read();
      if (result.done) break;
      var chunk = decoder.decode(result.value);
      var lines = chunk.split('\n');
      for (var li = 0; li < lines.length; li++) {
        var line = lines[li];
        if (line.indexOf('data: ') === 0 && line !== 'data: [DONE]') {
          try {
            var parsed = JSON.parse(line.slice(6));
            var t = parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content;
            if (t) {
              fullText += t;
              contentEl.innerHTML = formatText(fullText);
              var cur = document.createElement('span');
              cur.className = 'streaming-cursor';
              contentEl.appendChild(cur);
              scrollPanel('gpt');
            }
          } catch(e) {}
        }
      }
    }
    var cur2 = contentEl.querySelector('.streaming-cursor');
    if (cur2) cur2.remove();
    histories.gpt.push({ role: 'assistant', content: fullText });
  } catch(e) {
    contentEl.textContent = 'Error: ' + e.message;
  }
}

function copyPanel(ai) {
  var container = document.getElementById('messages-' + ai);
  var msgs = container.querySelectorAll('.msg');
  var text = '';
  msgs.forEach(function(m) {
    var role = m.querySelector('.msg-role');
    var content = m.querySelector('.msg-content');
    if (role && content) text += role.textContent + ':\n' + content.innerText + '\n\n';
  });
  navigator.clipboard.writeText(text.trim()).then(function() { showToast('Copied'); });
}

function clearPanel(ai) {
  histories[ai] = [];
  var container = document.getElementById('messages-' + ai);
  container.innerHTML = '';
  var empty = document.createElement('div');
  empty.className = 'empty-state';
  var icon = document.createElement('div');
  icon.className = 'empty-state-icon';
  icon.textContent = '*';
  var txt = document.createElement('div');
  txt.className = 'empty-state-text';
  txt.textContent = 'Waiting';
  empty.appendChild(icon);
  empty.appendChild(txt);
  container.appendChild(empty);
}

var textarea = document.getElementById('mainInput');
if (textarea) {
  textarea.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
  });
  textarea.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}

var bgCanvas = document.getElementById('bgCanvas');
if (bgCanvas) {
  var bgCtx = bgCanvas.getContext('2d');
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
  for (var si = 0; si < 150; si++) {
    var sx = Math.random() * bgCanvas.width;
    var sy = Math.random() * bgCanvas.height;
    var sr = Math.random() * 0.8;
    bgCtx.beginPath();
    bgCtx.arc(sx, sy, sr, 0, Math.PI * 2);
    bgCtx.fillStyle = 'rgba(255,255,255,' + (0.03 + Math.random() * 0.08) + ')';
    bgCtx.fill();
  }
}

var mc = document.getElementById('mothCanvas');
if (mc) {
  var mctx = mc.getContext('2d');
  mc.width = window.innerWidth;
  mc.height = window.innerHeight;
  window.addEventListener('resize', function() {
    mc.width = window.innerWidth;
    mc.height = window.innerHeight;
  });

  var mouse = { x: -999, y: -999 };
  window.addEventListener('mousemove', function(e) { mouse.x = e.clientX; mouse.y = e.clientY; });

  var moth = {
    x: mc.width * 0.85, y: mc.height * 0.2,
    vx: 0.6, vy: 0.4, angle: 0, wingFlap: 0,
    wingSpeed: 0.1, wanderAngle: Math.random() * Math.PI * 2,
    wanderTimer: 0, resting: false, restTimer: 0, restDuration: 0, speed: 0.9
  };

  var mtime = 0;

  function drawMoth(x, y, angle, flap, alpha) {
    mctx.save();
    mctx.translate(x, y);
    mctx.rotate(angle);
    mctx.globalAlpha = alpha * 0.7;
    var f = Math.sin(flap) * 0.45;
    mctx.save();
    mctx.scale(1, 1 - f);
    mctx.beginPath();
    mctx.moveTo(0, -2);
    mctx.bezierCurveTo(-7, -12, -24, -16, -28, -7);
    mctx.bezierCurveTo(-26, 2, -12, 4, 0, 2);
    mctx.closePath();
    mctx.fillStyle = 'rgba(200,169,110,0.12)';
    mctx.fill();
    mctx.strokeStyle = 'rgba(200,169,110,0.7)';
    mctx.lineWidth = 0.7;
    mctx.stroke();
    mctx.beginPath();
    mctx.moveTo(0, -2);
    mctx.bezierCurveTo(7, -12, 24, -16, 28, -7);
    mctx.bezierCurveTo(26, 2, 12, 4, 0, 2);
    mctx.closePath();
    mctx.fill();
    mctx.stroke();
    mctx.restore();
    mctx.beginPath();
    mctx.ellipse(0, 2, 2, 8, 0, 0, Math.PI * 2);
    mctx.fillStyle = 'rgba(200,169,110,0.45)';
    mctx.fill();
    mctx.beginPath();
    mctx.arc(0, -5, 2, 0, Math.PI * 2);
    mctx.fillStyle = 'rgba(200,169,110,0.5)';
    mctx.fill();
    mctx.restore();
  }

  function updateMoth() {
    mtime += 0.016;
    moth.wingFlap += moth.wingSpeed;
    var dx = mouse.x - moth.x;
    var dy = mouse.y - moth.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (moth.resting) {
      moth.wingSpeed = 0.03;
      moth.restTimer++;
      if (dist < 90 || moth.restTimer > moth.restDuration) {
        moth.resting = false;
        moth.wanderAngle = Math.random() * Math.PI * 2;
        moth.wingSpeed = 0.1;
      }
      return;
    }
    if (dist < 130) {
      moth.wanderAngle += (Math.atan2(moth.y - mouse.y, moth.x - mouse.x) - moth.wanderAngle) * 0.18;
      moth.wingSpeed = 0.18;
    } else {
      moth.wanderTimer++;
      if (moth.wanderTimer > 90 + Math.random() * 130) {
        moth.wanderAngle += (Math.random() - 0.5) * 1.1;
        moth.wanderTimer = 0;
      }
    }
    var margin = 100;
    if (moth.x < margin) moth.wanderAngle = 0;
    if (moth.x > mc.width - margin) moth.wanderAngle = Math.PI;
    if (moth.y < margin) moth.wanderAngle = Math.PI / 2;
    if (moth.y > mc.height - margin) moth.wanderAngle = -Math.PI / 2;
    moth.x = Math.max(60, Math.min(mc.width - 60, moth.x));
    moth.y = Math.max(60, Math.min(mc.height - 60, moth.y));
    moth.vx += (Math.cos(moth.wanderAngle) * moth.speed - moth.vx) * 0.035;
    moth.vy += (Math.sin(moth.wanderAngle) * moth.speed - moth.vy) * 0.035;
    moth.x += moth.vx;
    moth.y += moth.vy;
    moth.angle += (Math.atan2(moth.vy, moth.vx) + Math.PI / 2 - moth.angle) * 0.08;
    if (Math.random() < 0.0015 && dist > 160) {
      moth.resting = true;
      moth.restTimer = 0;
      moth.restDuration = 100 + Math.random() * 180;
    }
  }

  function loop() {
    mctx.clearRect(0, 0, mc.width, mc.height);
    updateMoth();
    drawMoth(moth.x, moth.y, moth.angle, moth.wingFlap, 1);
    requestAnimationFrame(loop);
  }
  loop();
}

document.addEventListener('DOMContentLoaded', function() {
  loadSettings();
  renderContextTags();
});
