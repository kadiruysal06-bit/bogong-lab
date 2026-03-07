// STATE
var mode = 'think';
var activeAIs = { claude: true, gemini: true, gpt: true };
var contextFiles = [];
var histories = { claude: [], gemini: [], gpt: [] };
var settings = {
promptClaude: 'You are an expert system architect. You know the Bogong AI projects deeply: Mirrors (bogongai.com), bogongai.net, and House of CB. Be precise, direct, and technical. No fluff.',
promptGemini: 'You are a rapid creative problem solver and prototyper. Think fast, generate alternatives, be bold with ideas.',
promptGpt: 'You are a code reviewer and debugging specialist. Find bugs, security issues, and optimization opportunities. Be specific.',
keyAnthropic: '',
keyGemini: '',
keyOpenAI: ''
};
// LOAD SETTINGS
function loadSettings() {
 var saved = localStorage.getItem('bogong-unidash-settings');
 if (saved) {
 try { settings = Object.assign(settings, JSON.parse(saved)); } catch(e) {}
 }
 document.getElementById('promptClaude').value = settings.promptClaude;
 document.getElementById('promptGemini').value = settings.promptGemini;
 document.getElementById('promptGpt').value = settings.promptGpt;
 document.getElementById('keyAnthropic').value = settings.keyAnthropic || '';
 document.getElementById('keyGemini').value = settings.keyGemini || '';
 document.getElementById('keyOpenAI').value = settings.keyOpenAI || '';
}
function saveSettings() {
 settings.promptClaude = document.getElementById('promptClaude').value;
 settings.promptGemini = document.getElementById('promptGemini').value;
 settings.promptGpt = document.getElementById('promptGpt').value;
 settings.keyAnthropic = document.getElementById('keyAnthropic').value;
 settings.keyGemini = document.getElementById('keyGemini').value;
 settings.keyOpenAI = document.getElementById('keyOpenAI').value;
 localStorage.setItem('bogong-unidash-settings', JSON.stringify(settings));
 closeSettings();
 showToast('Settings saved');
}
// MODE
function setMode(m) {
 mode = m;
 document.getElementById('btnThink').classList.toggle('active', m === 'think');
 document.getElementById('btnDo').classList.toggle('active', m === 'do');
}
function setProject(p) {
 contextFiles = [];
 renderContextTags();
}
// CONTEXT
function addContext(file) {
 if (!contextFiles.includes(file)) {
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
  contextFiles.forEach(function(f) {
    var span = document.createElement('span');
    span.className = 'context-tag';
    span.textContent = f;
    var btn = document.createElement('span');
    btn.className = 'context-tag-remove';
    btn.textContent = 'x';
    btn.onclick = function() { removeContext(f); };
    span.appendChild(btn);
    container.appendChild(span);
  });
}
// AI TOGGLE
function toggleAI(ai) {
 activeAIs[ai] = !activeAIs[ai];
 document.getElementById('toggle-' + ai).classList.toggle('on', activeAIs[ai]);
}
// QUICK PROMPT
function quickPrompt(text) {
 document.getElementById('mainInput').value = text;
 document.getElementById('mainInput').focus();
}
// SEND
async function sendMessage() {
 var input = document.getElementById('mainInput');
 var text = input.value.trim();
 if (!text) return;
 input.value = '';
 input.style.height = 'auto';
 var contextNote = contextFiles.length > 0 ? '\n\n[Context files: ' + contextFiles.join(', ' var fullText = text + contextNote;
 var promises = [];
 if (activeAIs.claude) promises.push(callClaude(fullText));
 if (activeAIs.gemini) promises.push(callGemini(fullText));
 if (activeAIs.gpt) promises.push(callGPT(fullText));
 await Promise.all(promises);
}
// ADD USER MESSAGE
function addUserMsg(ai, text) {
 var container = document.getElementById('messages-' + ai);
 var empty = container.querySelector('.empty-state');
 if (empty) empty.remove();
 var msg = document.createElement('div');
 msg.className = 'msg user';
 msg.innerHTML = '<div class="msg-role">You</div><div class="msg-content">' + escapeHtml(tex container.appendChild(msg);
 histories[ai].push({ role: 'user', content: text });
 scrollPanel(ai);
 return msg;
}
// ADD AI MESSAGE WITH STREAMING
function addAIMsg(ai) {
 var container = document.getElementById('messages-' + ai);
 var msg = document.createElement('div');
 msg.className = 'msg';
 msg.innerHTML = '<div class="msg-role">' + ai.charAt(0).toUpperCase() + ai.slice(1) + '</di container.appendChild(msg);
 scrollPanel(ai);
 return msg.querySelector('.msg-content');
}
// STREAM TEXT
function streamText(el, text, onDone) {
 var words = text.split('');
 var i = 0;
 el.innerHTML = '<span class="streaming-cursor"></span>';
 var cursor = el.querySelector('.streaming-cursor');
 function next() {
 if (i >= words.length) {
 cursor.remove();
 if (onDone) onDone(el.innerHTML);
 return;
 }
 var chunk = words.slice(i, i + 3).join('');
 i += 3;
 var current = el.innerHTML.replace('<span class="streaming-cursor"></span>', '');
 el.innerHTML = formatText(current + chunk) + '<span class="streaming-cursor"></span>';
 scrollPanel(null);
 setTimeout(next, 18);
 }
 next();
}
function formatText(text) {
 var t3 = String.fromCharCode(96,96,96);
 var t1 = String.fromCharCode(96);
 var r3 = new RegExp(t3 + '(\\w*)\\n?([\\s\\S]*?)' + t3, 'g');
 var r1 = new RegExp(t1 + '([^' + t1 + ']+)' + t1, 'g');
 return text
 .replace(r3, '<pre><code>$2</code></pre>')
 .replace(r1, '<code>$1</code>')
 .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
 .replace(/\n/g, '<br>');
}
function escapeHtml(text) {
 var amp = String.fromCharCode(38);
 var lt = String.fromCharCode(60);
 var gt = String.fromCharCode(62);
 return text
 .replace(new RegExp(amp, 'g'), amp+'amp;')
 .replace(new RegExp(lt, 'g'), amp+'lt;')
 .replace(new RegExp(gt, 'g'), amp+'gt;');
}
function scrollPanel(ai) {
 if (ai) {
 var el = document.getElementById('messages-' + ai);
 if (el) el.scrollTop = el.scrollHeight;
 } else {
 ['claude','gemini','gpt'].forEach(function(a) {
 var el = document.getElementById('messages-' + a);
 if (el) el.scrollTop = el.scrollHeight;
 });
 }
}
// CALL CLAUDE
async function callClaude(text) {
 var userInput = document.getElementById('mainInput').value || text;
 addUserMsg('claude', text);
 var contentEl = addAIMsg('claude');
 try {
 var msgs = histories.claude.map(function(m) { return { role: m.role, content: m.content } var response = await fetch('/api/claude', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 system: settings.promptClaude,
 messages: msgs
 })
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
 for (var li = 0; li < lines.length; li++) { var line = lines[li];
 if (line.startsWith('data: ')) {
 var data = line.slice(6);
 if (data === '[DONE]') continue;
 try {
 var parsed = JSON.parse(data);
 if (parsed.type === 'content_block_delta' && parsed.delta && parsed.delta.text) {
 fullText += parsed.delta.text;
 var current = contentEl.innerHTML.replace('<span class="streaming-cursor"></spa contentEl.innerHTML = formatText(fullText) + '<span class="streaming-cursor"></ scrollPanel('claude');
 }
 } catch(e) {}
 }
 }
 }
 cursor = contentEl.querySelector('.streaming-cursor');
 if (cursor) cursor.remove();
 histories.claude.push({ role: 'assistant', content: fullText });
 } catch(e) {
 contentEl.textContent = 'Error: ' + e.message;
 }
}
// CALL GEMINI
async function callGemini(text) {
 addUserMsg('gemini', text);
 var contentEl = addAIMsg('gemini');
 try {
 var msgs = histories.gemini.map(function(m) {
 return { role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }]  });
 var response = await fetch('/api/gemini', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 system: settings.promptGemini,
 messages: msgs
 })
 });
 contentEl.innerHTML = '<span class="streaming-cursor"></span>';
 var reader = response.body.getReader();
 var decoder = new TextDecoder();
 var fullText = '';
 while (true) {
 var result = await reader.read();
 if (result.done) break;
 var chunk = decoder.decode(result.value);
 var lines = chunk.split('\n');
 for (var li = 0; li < lines.length; li++) { var line = lines[li];
 if (line.startsWith('data: ')) {
 try {
 var parsed = JSON.parse(line.slice(6));
 var t = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
 if (t) {
 fullText += t;
 contentEl.innerHTML = formatText(fullText) + '<span class="streaming-cursor"></ scrollPanel('gemini');
 }
 } catch(e) {}
 }
 }
 }
 var cursor = contentEl.querySelector('.streaming-cursor');
 if (cursor) cursor.remove();
 histories.gemini.push({ role: 'assistant', content: fullText });
 } catch(e) {
 contentEl.textContent = 'Error: ' + e.message;
 }
}
// CALL GPT
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
 contentEl.innerHTML = '<span class="streaming-cursor"></span>';
 var reader = response.body.getReader();
 var decoder = new TextDecoder();
 var fullText = '';
 while (true) {
 var result = await reader.read();
 if (result.done) break;
 var chunk = decoder.decode(result.value);
 var lines = chunk.split('\n');
 for (var li = 0; li < lines.length; li++) { var line = lines[li];
 if (line.startsWith('data: ') && line !== 'data: [DONE]') {
 try {
 var parsed = JSON.parse(line.slice(6));
 var t = parsed.choices?.[0]?.delta?.content;
 if (t) {
 fullText += t;
 contentEl.innerHTML = formatText(fullText) + '<span class="streaming-cursor"></ scrollPanel('gpt');
 }
 } catch(e) {}
 }
 }
 }
 var cursor = contentEl.querySelector('.streaming-cursor');
 if (cursor) cursor.remove();
 histories.gpt.push({ role: 'assistant', content: fullText });
 } catch(e) {
 contentEl.textContent = 'Error: ' + e.message;
 }
}
// PANEL ACTIONS
function copyPanel(ai) {
 var container = document.getElementById('messages-' + ai);
 var msgs = container.querySelectorAll('.msg');
 var text = '';
 msgs.forEach(function(m) {
 var role = m.querySelector('.msg-role');
 var content = m.querySelector('.msg-content');
 if (role && content) {
 text += role.textContent + ':\n' + content.innerText + '\n\n';
 }
 });
 navigator.clipboard.writeText(text.trim()).then(function() {
 showToast('Copied');
 });
}
function clearPanel(ai) {
 histories[ai] = [];
 var container = document.getElementById('messages-' + ai);
 container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">*</div><div c}
// SETTINGS
function openSettings() {
 loadSettings();
 document.getElementById('settingsOverlay').classList.add('show');
}
function closeSettings() {
 document.getElementById('settingsOverlay').classList.remove('show');
}
// TOAST
function showToast(msg) {
 var toast = document.getElementById('copyToast');
 toast.textContent = msg;
 toast.classList.add('show');
 setTimeout(function() { toast.classList.remove('show'); }, 2000);
}
// INPUT AUTO-RESIZE
var textarea = document.getElementById('mainInput');
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
// BACKGROUND STARS
var bgCanvas = document.getElementById('bgCanvas');
var bgCtx = bgCanvas.getContext('2d');
function resizeBg() {
 bgCanvas.width = window.innerWidth;
 bgCanvas.height = window.innerHeight;
 bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
 for (var i = 0; i < 150; i++) {
 var x = Math.random() * bgCanvas.width;
 var y = Math.random() * bgCanvas.height;
 var r = Math.random() * 0.8;
 bgCtx.beginPath();
 bgCtx.arc(x, y, r, 0, Math.PI * 2);
 bgCtx.fillStyle = 'rgba(255,255,255,' + (0.03 + Math.random() * 0.08) + ')';
 bgCtx.fill();
 }
}
resizeBg();
window.addEventListener('resize', resizeBg);
// MOTH ANIMATION
var mc = document.getElementById('mothCanvas');
var mctx = mc.getContext('2d');
mc.width = window.innerWidth;
mc.height = window.innerHeight;
window.addEventListener('resize', function() {
 mc.width = window.innerWidth;
 mc.height = window.innerHeight;
});
var mouse = { x: -999, y: -999 };
window.addEventListener('mousemove', function(e) {
 mouse.x = e.clientX;
 mouse.y = e.clientY;
});
var moth = {
 x: mc.width * 0.85,
 y: mc.height * 0.2,
 vx: 0.6, vy: 0.4,
 angle: 0,
 wingFlap: 0,
 wingSpeed: 0.1,
 wanderAngle: Math.random() * Math.PI * 2,
 wanderTimer: 0,
 resting: false,
 restTimer: 0,
 restDuration: 0,
 speed: 0.9
};
function drawMoth(x, y, angle, flap, alpha) {
 mctx.save();
 mctx.translate(x, y);
 mctx.rotate(angle);
 mctx.globalAlpha = alpha * 0.7;
 var f = Math.sin(flap) * 0.45;
 var fl = Math.sin(flap + 0.3) * 0.3;
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
 mctx.fillStyle = 'rgba(200,169,110,0.12)';
 mctx.fill();
 mctx.strokeStyle = 'rgba(200,169,110,0.7)';
 mctx.lineWidth = 0.7;
 mctx.stroke();
 mctx.beginPath();
 mctx.moveTo(0,0); mctx.lineTo(-18,-10);
 mctx.strokeStyle = 'rgba(200,169,110,0.25)';
 mctx.lineWidth = 0.4; mctx.stroke();
 mctx.beginPath();
 mctx.moveTo(-3,-1); mctx.lineTo(-20,-5);
 mctx.stroke();
 mctx.beginPath();
 mctx.moveTo(0,0); mctx.lineTo(18,-10);
 mctx.stroke();
 mctx.beginPath();
 mctx.moveTo(3,-1); mctx.lineTo(20,-5);
 mctx.stroke();
 mctx.restore();
 mctx.save();
 mctx.scale(1, 1 - fl);
 mctx.beginPath();
 mctx.moveTo(0,2);
 mctx.bezierCurveTo(-5,5,-17,14,-15,19);
 mctx.bezierCurveTo(-11,22,-5,14,0,7);
 mctx.closePath();
 mctx.fillStyle = 'rgba(200,169,110,0.07)';
 mctx.fill();
 mctx.strokeStyle = 'rgba(200,169,110,0.4)';
 mctx.lineWidth = 0.5; mctx.stroke();
 mctx.beginPath();
 mctx.moveTo(0,2);
 mctx.bezierCurveTo(5,5,17,14,15,19);
 mctx.bezierCurveTo(11,22,5,14,0,7);
 mctx.closePath();
 mctx.fillStyle = 'rgba(200,169,110,0.07)';
 mctx.fill();
 mctx.strokeStyle = 'rgba(200,169,110,0.4)';
 mctx.lineWidth = 0.5; mctx.stroke();
 mctx.restore();
 mctx.beginPath();
 mctx.ellipse(0, 2, 2, 8, 0, 0, Math.PI * 2);
 mctx.fillStyle = 'rgba(200,169,110,0.45)';
 mctx.fill();
 mctx.beginPath();
 mctx.arc(0, -5, 2, 0, Math.PI * 2);
 mctx.fillStyle = 'rgba(200,169,110,0.5)';
 mctx.fill();
 mctx.beginPath();
 mctx.moveTo(-1,-7);
 mctx.quadraticCurveTo(-9,-19,-12,-22);
 mctx.strokeStyle = 'rgba(200,169,110,0.4)';
 mctx.lineWidth = 0.4; mctx.stroke();
 mctx.beginPath();
 mctx.arc(-12,-22,0.8,0,Math.PI*2);
 mctx.fillStyle = 'rgba(200,169,110,0.3)'; mctx.fill();
 mctx.beginPath();
 mctx.moveTo(1,-7);
 mctx.quadraticCurveTo(9,-19,12,-22);
 mctx.stroke();
 mctx.beginPath();
 mctx.arc(12,-22,0.8,0,Math.PI*2);
 mctx.fill();
 mctx.restore();
}
var time = 0;
function updateMoth() {
 time += 0.016;
 moth.wingFlap += moth.wingSpeed;
 var dx = mouse.x - moth.x;
 var dy = mouse.y - moth.y;
 var distToMouse = Math.sqrt(dx*dx + dy*dy);
 if (moth.resting) {
 moth.wingSpeed = 0.03;
 moth.restTimer++;
 if (distToMouse < 90) {
 moth.resting = false;
 moth.wanderAngle = Math.atan2(moth.y - mouse.y, moth.x - mouse.x);
 moth.wingSpeed = 0.14;
 }
 if (moth.restTimer > moth.restDuration) {
 moth.resting = false;
 moth.wanderAngle = Math.random() * Math.PI * 2;
 moth.wingSpeed = 0.1;
 }
 moth.angle += (Math.atan2(moth.vy, moth.vx) + Math.PI/2 - moth.angle) * 0.05;
 return;
 }
 moth.wingSpeed = 0.1;
 if (distToMouse < 130) {
 var repel = Math.atan2(moth.y - mouse.y, moth.x - mouse.x);
 var str = (130 - distToMouse) / 130;
 moth.wanderAngle += (repel - moth.wanderAngle) * 0.18;
 moth.wingSpeed = 0.18;
 } else {
 moth.wanderTimer++;
 if (moth.wanderTimer > 90 + Math.random() * 130) {
 moth.wanderAngle += (Math.random() - 0.5) * 1.1;
 moth.wanderTimer = 0;
 }
 moth.wanderAngle += Math.sin(time * 0.25) * 0.007;
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
 var moveAngle = Math.atan2(moth.vy, moth.vx) + Math.PI / 2;
 moth.angle += (moveAngle - moth.angle) * 0.08;
 if (Math.random() < 0.0015 && distToMouse > 160) {
 moth.resting = true;
 moth.restTimer = 0;
 moth.restDuration = 100 + Math.random() * 180;
 }
}
function drawGlow(x, y) {
 var g = mctx.createRadialGradient(x, y, 0, x, y, 50);
 g.addColorStop(0, 'rgba(200,169,110,0.04)');
 g.addColorStop(1, 'transparent');
 mctx.fillStyle = g;
 mctx.beginPath();
 mctx.arc(x, y, 50, 0, Math.PI * 2);
 mctx.fill();
}
function loop() {
 mctx.clearRect(0, 0, mc.width, mc.height);
 updateMoth();
 drawGlow(moth.x, moth.y);
 drawMoth(moth.x, moth.y, moth.angle, moth.wingFlap, 1);
 requestAnimationFrame(loop);
}
loop();
document.addEventListener('DOMContentLoaded', function() {
 loadSettings();
 renderContextTags();
});
