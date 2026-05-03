let steps = [];
let currentStep = 0;
let autoPlayInterval = null;
let isPlaying = false;

const algorithmInfo = {
    bubble: {
        name: "Bubble Sort",
        description: "Bubble Sort repeatedly compares adjacent elements and swaps them if they are in the wrong order. Simple but O(n²) on average.",
        timeBest: "O(n)",
        timeWorst: "O(n²)",
        space: "O(1)"
    },
    selection: {
        name: "Selection Sort",
        description: "Selection Sort finds the minimum element from the unsorted portion and places it at the beginning each pass.",
        timeBest: "O(n²)",
        timeWorst: "O(n²)",
        space: "O(1)"
    },
    insertion: {
        name: "Insertion Sort",
        description: "Insertion Sort builds the sorted array one item at a time by inserting each value into its correct position.",
        timeBest: "O(n)",
        timeWorst: "O(n²)",
        space: "O(1)"
    },
    quick: {
        name: "Quick Sort",
        description: "Quick Sort uses divide-and-conquer — selecting a pivot and partitioning the array around it recursively.",
        timeBest: "O(n log n)",
        timeWorst: "O(n²)",
        space: "O(log n)"
    }
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('startBtn').addEventListener('click', runAlgorithm);
    document.getElementById('randomBtn').addEventListener('click', generateRandom);
    document.getElementById('prevBtn').addEventListener('click', prevStep);
    document.getElementById('nextBtn').addEventListener('click', nextStep);
    document.getElementById('autoBtn').addEventListener('click', toggleAutoPlay);
    document.getElementById('algorithm').addEventListener('change', updateAlgorithmInfo);
    document.getElementById('exportBtn').addEventListener('click', exportSnapshot);

    updateAlgorithmInfo();
    updateButtons();
    updateMiniStats([]);
    updateMetrics([]);

    // Novelty: Race button
    document.getElementById('raceBtn').addEventListener('click', runAlgorithmRace);
});

function updateAlgorithmInfo() {
    const algo = document.getElementById('algorithm').value;
    const info = algorithmInfo[algo];

    document.getElementById('algoName').textContent = info.name;
    document.getElementById('algoDescription').textContent = info.description;
    document.getElementById('timeBest').textContent = info.timeBest;
    document.getElementById('timeWorst').textContent = info.timeWorst;
    document.getElementById('space').textContent = info.space;
    document.getElementById('selectedAlgoLabel').textContent = info.name;
}

function generateRandom() {
    const count = Math.floor(Math.random() * 8) + 5;
    const arr = [];
    for (let i = 0; i < count; i++) {
        arr.push(Math.floor(Math.random() * 85) + 10);
    }
    document.getElementById('inputData').value = arr.join(', ');
    showToast("Random array generated", "success");
}

async function runAlgorithm() {
    const input = document.getElementById('inputData').value;
    const algo = document.getElementById('algorithm').value;

    if (!input.trim()) {
        showToast("Please enter some numbers", "error");
        return;
    }

    const array = input
        .split(',')
        .map(x => parseInt(x.trim(), 10))
        .filter(x => !isNaN(x));

    if (array.length === 0) {
        showToast("Invalid input", "error");
        return;
    }

    if (array.length > 15) {
        showToast("Max 15 elements allowed", "error");
        return;
    }

    stopAutoPlay();
    setStatus("Running");

    try {
        const res = await fetch('/run-algorithm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ array, algorithm: algo })
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to run algorithm");

        steps = Array.isArray(data.steps) ? data.steps : [];
        currentStep = 0;

        document.getElementById('totalSteps').textContent = steps.length;
        document.getElementById('currentStepBadge').textContent = steps.length ? 1 : 0;

        if (steps.length === 0) {
            renderEmptyState();
            updateMetrics([]);
            showToast("No steps returned", "error");
            setStatus("Ready");
            updateButtons();
            return;
        }

        updateMetrics(steps);
        updateMiniStats(array);
        showStep();
        setStatus("Paused");
        showToast(`Loaded ${algorithmInfo[algo].name}`, "success");

    } catch (error) {
        console.error(error);
        showToast(error.message || "Error running algorithm", "error");
        setStatus("Error");
    }
}

function showStep() {
    if (steps.length === 0) return;

    const step = steps[currentStep];

    renderArray(
        step.array || [],
        step.comparing || [],
        step.swapping || [],
        step.sorted || [],
        typeof step.pivot === 'number' ? step.pivot : -1
    );

    document.getElementById('explanationText').textContent =
        step.explanation || "Processing current step...";

    document.getElementById('stepCounter').textContent = currentStep + 1;
    document.getElementById('currentStepBadge').textContent = currentStep + 1;

    updateMiniStats(step.array || []);
    updateButtons();
    updateStatusByPlayback();

    // ── Novelty panels ──
    updateEfficiencyMeter();
    updateInversionsCounter(step.array || []);
    updateHeatmap();
}

function renderEmptyState() {
    const container = document.getElementById('arrayContainer');
    const arrayTrace = document.getElementById('arrayTrace');

    container.innerHTML = `
        <div class="empty-state dark-empty">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="52" height="52">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p>Enter numbers and run an algorithm to begin the visualization.</p>
        </div>
    `;

    arrayTrace.innerHTML = `<div class="array-placeholder">Array state will appear here</div>`;

    const heatGrid = document.getElementById('heatmapGrid');
    if (heatGrid) heatGrid.innerHTML = '<div class="heatmap-placeholder">Run an algorithm to see the access heatmap</div>';
}

// Color palettes applied via inline style — guarantees colors show regardless
// of CSS specificity or cascade order issues.
const BAR_COLORS = {
    default:   { front: 'linear-gradient(180deg,#e2e8f0,#b0b8c4)', side: 'linear-gradient(180deg,#9aa3af,#76808c)', top: 'linear-gradient(135deg,#f8fafc,#d4dae2)', shadow: 'inset 0 -6px 12px rgba(0,0,0,0.12)' },
    comparing: { front: 'linear-gradient(180deg,#7dd3fc,#2563eb)', side: 'linear-gradient(180deg,#3b82f6,#1d4ed8)', top: 'linear-gradient(135deg,#e0f2fe,#93c5fd)', shadow: '0 0 28px rgba(59,130,246,0.65),inset 0 -6px 12px rgba(0,0,0,0.15)' },
    swapping:  { front: 'linear-gradient(180deg,#fbbf24,#ef4444)', side: 'linear-gradient(180deg,#f97316,#dc2626)', top: 'linear-gradient(135deg,#fef3c7,#fcd34d)', shadow: '0 0 36px rgba(251,146,60,0.80),inset 0 -6px 12px rgba(0,0,0,0.15)' },
    sorted:    { front: 'linear-gradient(180deg,#34d399,#059669)', side: 'linear-gradient(180deg,#10b981,#047857)', top: 'linear-gradient(135deg,#d1fae5,#6ee7b7)', shadow: '0 0 22px rgba(16,185,129,0.45),inset 0 -6px 12px rgba(0,0,0,0.12)' },
    pivot:     { front: 'linear-gradient(180deg,#c084fc,#7c3aed)', side: 'linear-gradient(180deg,#8b5cf6,#6d28d9)', top: 'linear-gradient(135deg,#ede9fe,#c4b5fd)', shadow: '0 0 22px rgba(139,92,246,0.5),inset 0 -6px 12px rgba(0,0,0,0.15)' },
};

function renderArray(arr, comparing = [], swapping = [], sorted = [], pivot = -1) {
    // Normalize to plain integer arrays defensively
    const toArr = v => Array.isArray(v) ? v.map(Number) : [];
    comparing = toArr(comparing);
    swapping  = toArr(swapping);
    sorted    = toArr(sorted);

    const container = document.getElementById('arrayContainer');
    const arrayTrace = document.getElementById('arrayTrace');

    container.innerHTML = '';
    arrayTrace.innerHTML = '';

    if (!arr || arr.length === 0) {
        renderEmptyState();
        return;
    }

    const maxVal = Math.max(...arr, 1);

    arr.forEach((num, index) => {
        // Determine state
        let state;
        if (sorted.includes(index))       state = 'sorted';
        else if (swapping.includes(index)) state = 'swapping';
        else if (comparing.includes(index)) state = 'comparing';
        else if (index === pivot)          state = 'pivot';
        else                               state = 'default';

        const colors = BAR_COLORS[state];
        const normalizedHeight = Math.max(28, (num / maxVal) * 260);

        const barWrap = document.createElement('div');
        barWrap.className = 'chart-bar-wrap';

        const bar3d = document.createElement('div');
        bar3d.className = 'bar-3d';

        // Front face — inline style ensures color always applies
        const bar = document.createElement('div');
        bar.className = `chart-bar state-${state}`;
        bar.style.cssText = `height:${normalizedHeight}px; background:${colors.front}; box-shadow:${colors.shadow};`;
        if (state === 'swapping') bar.style.animation = 'swapPulse 0.28s ease';

        // Right side face
        const side = document.createElement('div');
        side.className = `chart-bar-side side-${state}`;
        side.style.cssText = `height:${normalizedHeight}px; background:${colors.side};`;

        // Top face
        const topFace = document.createElement('div');
        topFace.className = `chart-bar-top top-${state}`;
        topFace.style.cssText = `background:${colors.top};`;

        // Label
        const label = document.createElement('div');
        label.className = 'chart-label';
        label.textContent = num;

        bar3d.appendChild(bar);
        bar3d.appendChild(side);
        bar3d.appendChild(topFace);
        barWrap.appendChild(bar3d);
        barWrap.appendChild(label);
        container.appendChild(barWrap);
    });

    // ─── Array1DTracer ─────────────────────────────────
    const indexRow = document.createElement('div');
    indexRow.className = 'trace-index-row';

    const valueRow = document.createElement('div');
    valueRow.className = 'trace-value-row';

    arr.forEach((num, index) => {
        const idx = document.createElement('div');
        idx.className = 'trace-index-cell';
        idx.textContent = index;
        indexRow.appendChild(idx);

        const val = document.createElement('div');
        val.className = 'trace-value-cell';
        val.textContent = num;

        if (sorted.includes(index))        val.classList.add('trace-sorted');
        else if (swapping.includes(index))  val.classList.add('trace-swapping');
        else if (comparing.includes(index)) val.classList.add('trace-comparing');
        else if (index === pivot)           val.classList.add('trace-pivot');

        valueRow.appendChild(val);
    });

    arrayTrace.appendChild(indexRow);
    arrayTrace.appendChild(valueRow);
}

function updateButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const autoBtn = document.getElementById('autoBtn');
    const autoBtnText = document.getElementById('autoBtnText');

    prevBtn.disabled = currentStep <= 0 || steps.length === 0;
    nextBtn.disabled = currentStep >= steps.length - 1 || steps.length === 0;
    autoBtn.disabled = steps.length === 0;

    if (isPlaying) {
        autoBtn.classList.add('playing');
        autoBtnText.textContent = 'Pause';
    } else {
        autoBtn.classList.remove('playing');
        autoBtnText.textContent = 'Auto Play';
    }
}

function nextStep() {
    if (currentStep < steps.length - 1) {
        currentStep++;
        showStep();
    }
}

function prevStep() {
    if (currentStep > 0) {
        currentStep--;
        showStep();
    }
}

function toggleAutoPlay() {
    if (isPlaying) stopAutoPlay();
    else startAutoPlay();
}

function startAutoPlay() {
    if (steps.length === 0) {
        showToast("Run an algorithm first", "error");
        return;
    }

    isPlaying = true;
    updateButtons();
    setStatus("Playing");

    const speed = parseInt(document.getElementById('speed').value, 10);

    autoPlayInterval = setInterval(() => {
        if (currentStep < steps.length - 1) {
            currentStep++;
            showStep();
        } else {
            stopAutoPlay();
            setStatus("Completed");
            showToast("Sorting complete! 🎉", "success");
        }
    }, speed);
}

function stopAutoPlay() {
    isPlaying = false;

    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
    }

    updateButtons();
    updateStatusByPlayback();
}

function updateStatusByPlayback() {
    if (steps.length === 0) {
        setStatus("Ready");
        document.getElementById('miniStateText').textContent = 'Idle';
        return;
    }

    if (isPlaying) {
        setStatus("Playing");
        document.getElementById('miniStateText').textContent = 'Playing';
        return;
    }

    if (currentStep >= steps.length - 1) {
        setStatus("Completed");
        document.getElementById('miniStateText').textContent = 'Completed';
        return;
    }

    setStatus("Paused");
    document.getElementById('miniStateText').textContent = 'Paused';
}

function setStatus(text) {
    const chip = document.getElementById('statusChip');
    chip.textContent = text;
    chip.classList.remove('status-ready', 'status-running', 'status-playing', 'status-completed', 'status-error', 'status-paused');

    const n = text.toLowerCase();
    if (n === 'ready')     chip.classList.add('status-ready');
    else if (n === 'running')   chip.classList.add('status-running');
    else if (n === 'playing')   chip.classList.add('status-playing');
    else if (n === 'completed') chip.classList.add('status-completed');
    else if (n === 'error')     chip.classList.add('status-error');
    else if (n === 'paused')    chip.classList.add('status-paused');
    else chip.classList.add('status-ready');
}

function updateMetrics(stepsData = []) {
    let comparisons = 0;
    let swaps = 0;

    stepsData.forEach(step => {
        if (Array.isArray(step.comparing) && step.comparing.length > 0) comparisons++;
        if (Array.isArray(step.swapping)  && step.swapping.length  > 0) swaps++;
    });

    document.getElementById('metricComparisons').textContent = comparisons;
    document.getElementById('metricSwaps').textContent = swaps;
    document.getElementById('metricSteps').textContent = stepsData.length;
}

function updateMiniStats(arr = []) {
    document.getElementById('miniArraySize').textContent = Array.isArray(arr) ? arr.length : 0;
}

function exportSnapshot() {
    if (!steps.length) {
        showToast("Run an algorithm first", "error");
        return;
    }

    const step     = steps[currentStep];
    const algo     = document.getElementById('algorithm').value;
    const info     = algorithmInfo[algo];
    const arr      = step.array    || [];
    const comparing = step.comparing || [];
    const swapping  = step.swapping  || [];
    const sorted    = step.sorted    || [];
    const pivot     = typeof step.pivot === 'number' ? step.pivot : -1;

    const maxVal = Math.max(...arr, 1);

    // Count metrics up to current step
    let totalComparisons = 0, totalSwaps = 0;
    for (let i = 0; i <= currentStep; i++) {
        if (steps[i].comparing?.length > 0) totalComparisons++;
        if (steps[i].swapping?.length  > 0) totalSwaps++;
    }

    // Build bar SVG for snapshot
    const BAR_W = 36, GAP = 10, PAD = 24;
    const svgW  = arr.length * (BAR_W + GAP) - GAP + PAD * 2;
    const svgH  = 200;

    const barsSvg = arr.map((val, i) => {
        const h    = Math.max(12, (val / maxVal) * (svgH - 40));
        const x    = PAD + i * (BAR_W + GAP);
        const y    = svgH - 24 - h;

        let fill = '#94a3b8';
        if (sorted.includes(i))       fill = '#10b981';
        else if (swapping.includes(i)) fill = '#f97316';
        else if (comparing.includes(i)) fill = '#3b82f6';
        else if (i === pivot)          fill = '#8b5cf6';

        // Slight 3D: right face + top face
        const sideX  = x + BAR_W;
        const sideW  = 8;
        const skewOff = 6;
        const sideFill   = fill + 'bb';
        const topFill    = fill + 'dd';

        return `
          <rect x="${x}" y="${y}" width="${BAR_W}" height="${h}" rx="3" fill="${fill}" opacity="0.95"/>
          <polygon points="${sideX},${y} ${sideX+sideW},${y-skewOff} ${sideX+sideW},${y+h-skewOff} ${sideX},${y+h}" fill="${sideFill}" opacity="0.8"/>
          <polygon points="${x},${y} ${sideX},${y} ${sideX+sideW},${y-skewOff} ${x+sideW},${y-skewOff}" fill="${topFill}" opacity="0.9"/>
          <text x="${x + BAR_W/2}" y="${svgH - 6}" text-anchor="middle" font-size="10" fill="#94a3b8" font-family="monospace">${val}</text>
        `;
    }).join('');

    // Build array trace HTML
    const traceHTML = arr.map((val, i) => {
        let bg = '#2a2f3a', color = '#e5e7eb';
        if (sorted.includes(i))        { bg = '#047857'; color = '#fff'; }
        else if (swapping.includes(i))  { bg = '#c2410c'; color = '#fff'; }
        else if (comparing.includes(i)) { bg = '#1d4ed8'; color = '#fff'; }
        else if (i === pivot)           { bg = '#6d28d9'; color = '#fff'; }

        return `
          <div style="text-align:center;">
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px;font-family:monospace;">${i}</div>
            <div style="width:44px;height:40px;background:${bg};color:${color};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;border:1px solid rgba(255,255,255,0.1);font-family:monospace;">${val}</div>
          </div>`;
    }).join('');

    // Build step log table
    const logRows = steps.slice(0, currentStep + 1).map((s, i) => {
        const isActive = i === currentStep;
        const rowBg    = isActive ? 'rgba(59,130,246,0.15)' : (i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent');
        const stepType = s.swapping?.length  ? '🔀 Swap'
                       : s.comparing?.length ? '🔍 Compare'
                       : s.sorted?.length    ? '✅ Sorted'
                       : '📌 Update';
        return `<tr style="background:${rowBg};">
          <td style="padding:6px 10px;color:${isActive?'#93c5fd':'#94a3b8'};font-weight:${isActive?700:400};border-bottom:1px solid rgba(255,255,255,0.04);">${i+1}</td>
          <td style="padding:6px 10px;color:#e5e7eb;border-bottom:1px solid rgba(255,255,255,0.04);">${stepType}</td>
          <td style="padding:6px 10px;color:#cbd5e1;font-size:12px;border-bottom:1px solid rgba(255,255,255,0.04);">${s.explanation || ''}</td>
          <td style="padding:6px 10px;color:#64748b;font-size:11px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,0.04);">[${(s.array||[]).join(', ')}]</td>
        </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>AlgoVista Snapshot — ${info.name} Step ${currentStep+1}</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#070b13;color:#e2e8f0;font-family:'DM Sans',sans-serif;min-height:100vh;padding:40px 24px;}
  .page{max-width:960px;margin:0 auto;}

  /* Header */
  .top-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:32px;flex-wrap:wrap;gap:12px;}
  .brand{display:flex;align-items:center;gap:12px;}
  .brand-icon{width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#2563eb,#06b6d4);display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 8px 20px rgba(37,99,235,0.35);}
  .brand-name{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;}
  .brand-sub{font-size:12px;color:#64748b;margin-top:2px;}
  .export-badge{background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.25);color:#93c5fd;padding:8px 14px;border-radius:99px;font-size:12px;font-weight:600;}

  /* Cards */
  .card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;overflow:hidden;margin-bottom:20px;}
  .card-header{background:rgba(255,255,255,0.04);border-bottom:1px solid rgba(255,255,255,0.07);padding:12px 18px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;display:flex;align-items:center;gap:8px;}
  .card-body{padding:20px 18px;}

  /* Meta grid */
  .meta-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;}
  .meta-box{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:14px;}
  .meta-label{font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#64748b;font-weight:700;margin-bottom:6px;}
  .meta-value{font-size:16px;font-weight:700;color:#fff;}
  .meta-value.blue{color:#60a5fa;}
  .meta-value.green{color:#34d399;}
  .meta-value.orange{color:#fb923c;}

  /* Complexity */
  .complexity-row{display:flex;gap:10px;flex-wrap:wrap;}
  .c-pill{flex:1;min-width:80px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:10px 12px;text-align:center;}
  .c-pill-label{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;margin-bottom:4px;}
  .c-pill-val{font-size:14px;font-weight:700;color:#e2e8f0;}

  /* Explanation */
  .explanation-box{background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);border-radius:12px;padding:16px;font-size:14px;line-height:1.7;color:#cbd5e1;}
  .step-badge{display:inline-flex;align-items:center;background:rgba(59,130,246,0.15);border:1px solid rgba(59,130,246,0.25);color:#93c5fd;padding:5px 12px;border-radius:99px;font-size:12px;font-weight:700;margin-bottom:12px;}

  /* SVG chart */
  .chart-wrap{background:#18181c;border-radius:12px;overflow:hidden;padding:16px 16px 8px;}
  svg{display:block;width:100%;height:auto;}

  /* Trace */
  .trace-wrap{display:flex;gap:0;overflow-x:auto;padding-bottom:6px;}

  /* Legend */
  .legend{display:flex;gap:16px;flex-wrap:wrap;padding:0 18px 16px;}
  .legend-item{display:flex;align-items:center;gap:7px;font-size:12px;color:#94a3b8;}
  .legend-dot{width:10px;height:10px;border-radius:50%;}

  /* Log table */
  .log-wrap{overflow-x:auto;max-height:360px;overflow-y:auto;}
  table{width:100%;border-collapse:collapse;font-size:13px;}
  th{background:rgba(255,255,255,0.04);padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;font-weight:700;border-bottom:1px solid rgba(255,255,255,0.07);position:sticky;top:0;}

  /* Footer */
  .footer{text-align:center;margin-top:32px;color:#1e293b;font-size:12px;padding-bottom:24px;}

  @media(max-width:600px){.meta-grid{grid-template-columns:1fr 1fr;}}
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="top-bar">
    <div class="brand">
      <div class="brand-icon">📊</div>
      <div>
        <div class="brand-name">AlgoVista</div>
        <div class="brand-sub">Sorting Algorithm Visualizer</div>
      </div>
    </div>
    <div class="export-badge">📸 Snapshot Export</div>
  </div>

  <!-- Meta -->
  <div class="card">
    <div class="card-header">📋 Snapshot Details</div>
    <div class="card-body">
      <div class="meta-grid">
        <div class="meta-box">
          <div class="meta-label">Algorithm</div>
          <div class="meta-value">${info.name}</div>
        </div>
        <div class="meta-box">
          <div class="meta-label">Current Step</div>
          <div class="meta-value blue">${currentStep + 1} <span style="color:#475569;font-size:13px;">/ ${steps.length}</span></div>
        </div>
        <div class="meta-box">
          <div class="meta-label">Array Size</div>
          <div class="meta-value">${arr.length}</div>
        </div>
        <div class="meta-box">
          <div class="meta-label">Comparisons</div>
          <div class="meta-value blue">${totalComparisons}</div>
        </div>
        <div class="meta-box">
          <div class="meta-label">Swaps</div>
          <div class="meta-value orange">${totalSwaps}</div>
        </div>
        <div class="meta-box">
          <div class="meta-label">Exported At</div>
          <div class="meta-value" style="font-size:13px;color:#94a3b8;">${new Date().toLocaleString()}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Complexity -->
  <div class="card">
    <div class="card-header">⚡ Complexity</div>
    <div class="card-body">
      <div class="complexity-row">
        <div class="c-pill"><div class="c-pill-label">Best Time</div><div class="c-pill-val">${info.timeBest}</div></div>
        <div class="c-pill"><div class="c-pill-label">Worst Time</div><div class="c-pill-val">${info.timeWorst}</div></div>
        <div class="c-pill"><div class="c-pill-label">Space</div><div class="c-pill-val">${info.space}</div></div>
      </div>
    </div>
  </div>

  <!-- Step Explanation -->
  <div class="card">
    <div class="card-header">💡 Current Step Explanation</div>
    <div class="card-body">
      <div class="step-badge">Step ${currentStep + 1}</div>
      <div class="explanation-box">${step.explanation || 'No explanation available.'}</div>
    </div>
  </div>

  <!-- 3D Bar Chart -->
  <div class="card">
    <div class="card-header">📊 3D ChartTracer — Array State</div>
    <div class="chart-wrap" style="padding:20px 16px 8px;">
      <svg viewBox="0 0 ${svgW + 20} ${svgH + 10}" xmlns="http://www.w3.org/2000/svg">
        ${barsSvg}
      </svg>
    </div>
    <div class="legend">
      <div class="legend-item"><div class="legend-dot" style="background:#94a3b8;"></div>Normal</div>
      <div class="legend-item"><div class="legend-dot" style="background:#3b82f6;box-shadow:0 0 5px rgba(59,130,246,0.6);"></div>Comparing</div>
      <div class="legend-item"><div class="legend-dot" style="background:#f97316;box-shadow:0 0 5px rgba(249,115,22,0.6);"></div>Swapping</div>
      <div class="legend-item"><div class="legend-dot" style="background:#10b981;box-shadow:0 0 5px rgba(16,185,129,0.6);"></div>Sorted</div>
      <div class="legend-item"><div class="legend-dot" style="background:#8b5cf6;box-shadow:0 0 5px rgba(139,92,246,0.6);"></div>Pivot</div>
    </div>
  </div>

  <!-- Array1DTracer -->
  <div class="card">
    <div class="card-header">🔢 Array1DTracer</div>
    <div class="card-body">
      <div class="trace-wrap">${traceHTML}</div>
    </div>
  </div>

  <!-- Step Log -->
  <div class="card">
    <div class="card-header">📜 Step History (1 → ${currentStep + 1})</div>
    <div class="log-wrap">
      <table>
        <thead>
          <tr>
            <th style="width:60px;">#</th>
            <th style="width:110px;">Type</th>
            <th>Explanation</th>
            <th style="width:220px;">Array State</th>
          </tr>
        </thead>
        <tbody>${logRows}</tbody>
      </table>
    </div>
  </div>

  <div class="footer">Generated by AlgoVista • ${new Date().toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'})}</div>
</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `algovista-${algo}-step-${currentStep + 1}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("Snapshot exported as HTML ✨", "success");
}

function showToast(message, type = "info") {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ═══════════════════════════════════════════════════════════════
// NOVELTY FEATURE 1 — Live Efficiency Meter
// Shows real comparisons & swaps so far vs theoretical worst case
// ═══════════════════════════════════════════════════════════════

function updateEfficiencyMeter() {
    if (!steps.length) return;

    const n = (steps[0].array || []).length;
    // Theoretical worst-case comparisons = n*(n-1)/2, swaps = same
    const worstComp = Math.round(n * (n - 1) / 2);
    const worstSwap = Math.round(n * (n - 1) / 2);

    // Count actual so far up to currentStep
    let actualComp = 0, actualSwap = 0;
    for (let i = 0; i <= currentStep; i++) {
        if (steps[i].comparing?.length > 0) actualComp++;
        if (steps[i].swapping?.length  > 0) actualSwap++;
    }

    const progress = Math.round(((currentStep + 1) / steps.length) * 100);
    const compPct  = Math.min(100, Math.round((actualComp / worstComp) * 100));
    const swapPct  = Math.min(100, Math.round((actualSwap / worstSwap) * 100));

    document.getElementById('effActualComp').style.width = compPct + '%';
    document.getElementById('effActualSwap').style.width = swapPct + '%';
    document.getElementById('effProgress').style.width   = progress + '%';
    document.getElementById('effCompVal').textContent    = `${actualComp} / ${worstComp}`;
    document.getElementById('effSwapVal').textContent    = `${actualSwap} / ${worstSwap}`;
    document.getElementById('effProgressVal').textContent = `${progress}%`;

    // Verdict
    const algo    = document.getElementById('algorithm').value;
    const verdict = document.getElementById('effVerdict');
    let msg = '';
    if (progress === 100) {
        if (actualSwap === 0) msg = '🏆 Perfect! Array was already sorted — no swaps needed.';
        else if (swapPct < 30) msg = '✅ Excellent efficiency — well below worst case.';
        else if (swapPct < 70) msg = '🟡 Average case — typical for this input.';
        else msg = '🔴 Near worst case — input was almost reverse sorted.';
    } else {
        if (algo === 'bubble') msg = `Bubble Sort: comparing pass by pass. ${worstComp - actualComp} comparisons remaining in worst case.`;
        else if (algo === 'selection') msg = `Selection Sort: finding min each pass. ${n - (steps[currentStep].sorted || []).length} passes left.`;
        else if (algo === 'insertion') msg = `Insertion Sort: building sorted prefix. ${n - (steps[currentStep].sorted || []).length} elements remain.`;
        else msg = `Quick Sort: partitioning recursively. Pivot choices determine efficiency.`;
    }
    verdict.textContent = msg;
}

// ═══════════════════════════════════════════════════════════════
// NOVELTY FEATURE 2 — Inversions Counter
// An inversion is a pair (i,j) where i<j but arr[i]>arr[j].
// The number of inversions = how many swaps bubble sort needs.
// Watching it drop to 0 proves the array is sorted.
// ═══════════════════════════════════════════════════════════════

let initialInversions = 0;

function countInversions(arr) {
    let count = 0;
    for (let i = 0; i < arr.length - 1; i++)
        for (let j = i + 1; j < arr.length; j++)
            if (arr[i] > arr[j]) count++;
    return count;
}

function updateInversionsCounter(arr) {
    if (!arr || arr.length === 0) return;

    const inv    = countInversions(arr);
    const maxInv = (arr.length * (arr.length - 1)) / 2;
    const pct    = maxInv > 0 ? Math.round((inv / maxInv) * 100) : 0;

    // Track initial on step 0
    if (currentStep === 0) initialInversions = countInversions(steps[0].array || arr);

    const prev = currentStep > 0 ? countInversions(steps[currentStep - 1].array || arr) : inv;
    const delta = inv - prev;

    const invEl = document.getElementById('invCount');
    invEl.textContent = inv;
    invEl.className = inv === 0 ? 'inv-zero' : pct > 60 ? 'inv-high' : '';
    document.getElementById('invMax').textContent    = `Max (${maxInv})`;
    document.getElementById('invBarFill').style.width = pct + '%';

    // Delta badge
    const deltaEl = document.getElementById('invDelta');
    if (delta < 0) {
        deltaEl.textContent = `▼ ${Math.abs(delta)} resolved this step`;
        deltaEl.className = 'inv-delta delta-down';
    } else if (delta > 0) {
        deltaEl.textContent = `▲ ${delta} added (reorder)`;
        deltaEl.className = 'inv-delta delta-up';
    } else {
        deltaEl.textContent = inv === 0 ? '✅ Fully sorted — zero inversions!' : 'No change this step';
        deltaEl.className = 'inv-delta delta-same';
    }

    // Color the bar by disorder level
    const fill = document.getElementById('invBarFill');
    if (pct === 0)       fill.style.background = 'linear-gradient(90deg,#10b981,#34d399)';
    else if (pct < 30)   fill.style.background = 'linear-gradient(90deg,#3b82f6,#60a5fa)';
    else if (pct < 65)   fill.style.background = 'linear-gradient(90deg,#f59e0b,#fbbf24)';
    else                 fill.style.background = 'linear-gradient(90deg,#ef4444,#f97316)';
}

// ═══════════════════════════════════════════════════════════════
// NOVELTY FEATURE 3 — Algorithm Race
// Calls the backend for all 4 algorithms on the same array,
// then animates a live progress bar race between them.
// ═══════════════════════════════════════════════════════════════

async function runAlgorithmRace() {
    const input = document.getElementById('inputData').value;
    if (!input.trim()) {
        showToast("Enter an array first to race!", "error");
        return;
    }

    const array = input.split(',').map(x => parseInt(x.trim(), 10)).filter(x => !isNaN(x));
    if (array.length < 2) { showToast("Need at least 2 elements", "error"); return; }
    if (array.length > 15) { showToast("Max 15 elements for race", "error"); return; }

    const raceBtn     = document.getElementById('raceBtn');
    const raceResults = document.getElementById('raceResults');

    raceBtn.disabled    = true;
    raceBtn.textContent = '⏳ Racing...';
    raceResults.style.display = 'none';

    const algos = [
        { key: 'bubble',    name: 'Bubble Sort',    color: '#3b82f6' },
        { key: 'selection', name: 'Selection Sort',  color: '#f59e0b' },
        { key: 'insertion', name: 'Insertion Sort',  color: '#10b981' },
        { key: 'quick',     name: 'Quick Sort',      color: '#8b5cf6' },
    ];

    // Fetch all 4 in parallel
    let results;
    try {
        const fetches = algos.map(a =>
            fetch('/run-algorithm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ array: [...array], algorithm: a.key })
            }).then(r => r.json()).then(d => ({ ...a, stepCount: (d.steps || []).length }))
        );
        results = await Promise.all(fetches);
    } catch (e) {
        showToast("Race failed — check server", "error");
        raceBtn.disabled    = false;
        raceBtn.textContent = 'Run Race on Current Array';
        return;
    }

    // Sort by stepCount ascending (fewest steps = winner)
    results.sort((a, b) => a.stepCount - b.stepCount);
    const maxSteps = results[results.length - 1].stepCount || 1;
    const medals   = ['🥇', '🥈', '🥉', '4️⃣'];

    // Build race result HTML
    raceResults.innerHTML = results.map((r, i) => {
        const pct   = Math.round((r.stepCount / maxSteps) * 100);
        const isWin = i === 0;
        const rankClass = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : '';
        return `
        <div class="race-row">
            <div class="race-rank ${rankClass}">${medals[i]}</div>
            <div class="race-bar-col">
                <div class="race-algo-name">
                    ${r.name}${isWin ? ' <span class="race-winner-crown">👑</span>' : ''}
                </div>
                <div class="race-track">
                    <div class="race-fill" style="width:0%;background:${r.color};" data-target="${pct}"></div>
                </div>
            </div>
            <div class="race-steps-val">${r.stepCount}</div>
        </div>`;
    }).join('') + `<div class="race-winner-badge">🏆 ${results[0].name} wins with fewest steps!</div>`;

    raceResults.style.display = 'block';

    // Animate bars filling up
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            raceResults.querySelectorAll('.race-fill').forEach(bar => {
                bar.style.transition = 'width 1s cubic-bezier(0.4,0,0.2,1)';
                bar.style.width      = bar.dataset.target + '%';
            });
        });
    });

    raceBtn.disabled    = false;
    raceBtn.textContent = '🔄 Re-run Race';
    showToast(`🏆 ${results[0].name} wins with ${results[0].stepCount} steps!`, "success");
}

// ═══════════════════════════════════════════════════════════════
// INDEX ACCESS HEATMAP
// Tracks how many times each array index has been compared or
// swapped across all steps up to currentStep. Renders as a
// gradient bar chart — cold (blue) = rarely touched,
// hot (red/amber) = heavily accessed.
// ═══════════════════════════════════════════════════════════════

function buildAccessCounts() {
    if (!steps.length) return [];
    const n = (steps[0].array || []).length;
    const counts = new Array(n).fill(0);

    for (let i = 0; i <= currentStep; i++) {
        const s = steps[i];
        (s.comparing || []).forEach(idx => { if (idx >= 0 && idx < n) counts[idx]++; });
        (s.swapping  || []).forEach(idx => { if (idx >= 0 && idx < n) counts[idx] += 2; }); // swaps count double
    }
    return counts;
}

function heatColor(ratio) {
    // ratio 0→1: deep navy → blue → cyan → amber → red
    if (ratio < 0.001) return { bg: '#1a2030', text: '#374151' };
    const stops = [
        [0.00, [30, 58, 138]],   // deep blue
        [0.30, [37, 99, 235]],   // blue
        [0.55, [8, 145, 178]],   // cyan
        [0.75, [245, 158, 11]],  // amber
        [1.00, [239, 68, 68]],   // red
    ];
    let lo = stops[0], hi = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) {
        if (ratio >= stops[i][0] && ratio <= stops[i + 1][0]) {
            lo = stops[i]; hi = stops[i + 1]; break;
        }
    }
    const t = (ratio - lo[0]) / (hi[0] - lo[0] || 1);
    const r = Math.round(lo[1][0] + t * (hi[1][0] - lo[1][0]));
    const g = Math.round(lo[1][1] + t * (hi[1][1] - lo[1][1]));
    const b = Math.round(lo[1][2] + t * (hi[1][2] - lo[1][2]));
    return { bg: `rgb(${r},${g},${b})`, text: `rgba(${r},${g},${b},0.7)` };
}

function updateHeatmap() {
    const grid = document.getElementById('heatmapGrid');
    if (!steps.length) {
        grid.innerHTML = '<div class="heatmap-placeholder">Run an algorithm to see the access heatmap</div>';
        return;
    }

    const counts  = buildAccessCounts();
    const maxCount = Math.max(...counts, 1);

    // Get currently active indices for highlight
    const step = steps[currentStep];
    const activeNow = new Set([
        ...(step.comparing || []),
        ...(step.swapping  || []),
    ]);

    grid.innerHTML = '';
    counts.forEach((count, idx) => {
        const ratio   = count / maxCount;
        const barH    = Math.max(3, Math.round(ratio * 52));
        const color   = heatColor(ratio);
        const isActive = activeNow.has(idx);

        const col = document.createElement('div');
        col.className = 'heatmap-col' + (isActive ? ' heatmap-active' : '');

        col.innerHTML = `
            <div class="heatmap-bar-wrap">
                <div class="heatmap-bar"
                     style="height:${barH}px; background:${color.bg}; ${isActive ? `box-shadow:0 0 10px ${color.bg};filter:brightness(1.4);` : ''}">
                </div>
            </div>
            <div class="heatmap-count" style="color:${color.text}">${count}</div>
            <div class="heatmap-idx">${idx}</div>
        `;
        grid.appendChild(col);
    });
}