// ─── State ────────────────────────────────────────────────────────────────────
let allData = [];
let filteredData = [];
let currentPage = 1;
const PAGE_SIZE = 50;
let sortCol = null;
let sortDir = 'asc';
let currentView = 'table';

// ─── Column definitions ───────────────────────────────────────────────────────
// Exact prefix matches for column headers as they appear in the CSV file
const COLUMNS = [
  { key: 'SUERTE',     label: 'Suerte',           type: 'text' },
  { key: 'ZONA',       label: 'Zona',             type: 'number' },
  { key: 'ZONANOMBR',  label: 'Zona Nombre',      type: 'text' },
  { key: 'HACIENDA',   label: 'Hacienda (Cód.)',  type: 'number' },
  { key: 'HACIENDAN',  label: 'Hacienda',         type: 'text' },
  { key: 'VARIEDAD',   label: 'Variedad',         type: 'text' },
  { key: 'CICLO',      label: 'Ciclo',            type: 'number' },
  { key: 'ÚLTIMOCORT', label: 'Últ. Corte',       type: 'number' },
  { key: 'TIPO',       label: 'Tipo',             type: 'text' },
  { key: 'FECHA',      label: 'Fecha Últ. Corte', type: 'date' },
  { key: 'ÁREA',       label: 'Área Real (ha)',   type: 'number' },
  { key: 'EDAD',       label: 'Edad (meses)',     type: 'number' },
  { key: 'TCHÚLTIMO',  label: 'TCH Último',       type: 'number' },
];

// Maps a raw CSV header key → friendly display label
// Uses normalized comparison to handle garbled accentuated characters
function getFriendlyLabel(rawKey) {
  // Strip accents and special chars for fuzzy matching
  const norm = (s) => s.toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^A-Z0-9]/g, ''); // only alphanumeric

  const n = norm(rawKey);
  if (n.startsWith('SUERTE'))    return 'Suerte';
  if (n.startsWith('HACIENDAN')) return 'Hacienda';
  if (n.startsWith('HACIENDA'))  return 'Hacienda (Cód.)';
  if (n.startsWith('ZONANOMBR') || n.startsWith('ZONANOMBF')) return 'Zona Nombre';
  if (n.startsWith('ZONA'))      return 'Zona';
  if (n.startsWith('VARIEDAD'))  return 'Variedad';
  if (n.startsWith('CICLO'))     return 'Ciclo';
  if (n.startsWith('ULTIMOCORT') || n.startsWith('LTIMOCORT')) return 'Últ. Corte';
  if (n.startsWith('TIPO'))      return 'Tipo';
  if (n.startsWith('FECHA'))     return 'Fecha Últ. Corte';
  if (n.startsWith('REA') || n.startsWith('AREA')) return 'Área Real (ha)';
  if (n.startsWith('EDAD'))      return 'Edad (meses)';
  if (n.startsWith('TCH'))       return 'TCH Último';
  return rawKey; // fallback: show raw header
}

// ─── CSV Parsing ──────────────────────────────────────────────────────────────
function parseCSV(text) {
  // Strip UTF-8 BOM if present
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

  const lines = text.trim().split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 2) return [];

  // Smart separator detection
  const sep = detectSeparator(lines);

  const rawHeaders = splitCSVLine(lines[0], sep).map(h => h.trim().replace(/^"|"$/g, ''));

  // Skip completely empty headers
  const headers = rawHeaders;
  const colCount = headers.length;

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = splitCSVLine(lines[i], sep);
    if (parts.length === 0 || (parts.length === 1 && parts[0].trim() === '')) continue;
    // Skip rows that look like sub-headers (all cells are strings matching header names)
    const row = {};
    headers.forEach((h, idx) => {
      const raw = parts[idx] !== undefined ? parts[idx].trim().replace(/^"|"$/g, '') : '';
      row[h] = raw;
    });
    records.push(row);
  }
  return records;
}

function splitCSVLine(line, sep) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === sep && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ─── Smart separator detection ────────────────────────────────────────────────
// Picks the separator that produces the most CONSISTENT column count across rows
function detectSeparator(lines) {
  const candidates = [';', ',', '\t', '|'];
  let bestSep = ',';
  let bestScore = -1;
  for (const sep of candidates) {
    const counts = lines.slice(0, Math.min(10, lines.length)).map(l => splitCSVLine(l, sep).length);
    const mode = counts.sort()[Math.floor(counts.length / 2)];
    if (mode < 2) continue; // at least 2 columns
    const score = counts.filter(c => c === mode).length * mode;
    if (score > bestScore) { bestScore = score; bestSep = sep; }
  }
  return bestSep;
}

// ─── Map CSV headers to known columns ────────────────────────────────────────
function resolveKey(row, colKey) {
  const k = Object.keys(row).find(h => h.toUpperCase().replace(/[()\s]/g, '').startsWith(colKey.toUpperCase().replace(/[()\s]/g, '')));
  return k ? row[k] : '';
}

// ─── File input — tries UTF-8, then Latin-1 as fallback ──────────────────────
document.getElementById('csv-input').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.csv')) {
    showToast('⚠️ Por favor selecciona un archivo .csv');
    return;
  }

  function tryParse(text, label) {
    const data = parseCSV(text);
    if (!data || data.length === 0) return null;
    // Quality check: first row must have a reasonable SUERTE-like value
    const firstRow = data[0];
    const keys = Object.keys(firstRow);
    // If we have >= 5 columns and first column header contains recognizable field names
    const headerStr = keys.join(' ').toUpperCase();
    const quality = (keys.length >= 5) &&
      (headerStr.includes('SUERTE') || headerStr.includes('ZONA') ||
       headerStr.includes('VARIEDAD') || headerStr.includes('HACIENDA'));
    return quality ? data : null;
  }

  const attemptLoad = (encoding) => {
    return new Promise((resolve) => {
      const r = new FileReader();
      r.onload = (ev) => resolve(ev.target.result);
      r.onerror = () => resolve(null);
      r.readAsText(file, encoding);
    });
  };

  showToast('⏳ Procesando archivo…');

  (async () => {
    try {
      // Try UTF-8 first, then Latin-1 (Windows-1252)
      for (const enc of ['UTF-8', 'ISO-8859-1', 'windows-1252']) {
        const text = await attemptLoad(enc);
        if (!text) continue;
        const data = tryParse(text, enc);
        if (data) {
          allData = data;
          filteredData = [...allData];
          showToast(`✅ ${allData.length} registros cargados`);
          initApp();
          return;
        }
      }
      showToast('❌ No se pudo leer el CSV. Verifica que sea un archivo válido.');
    } catch(err) {
      showToast('❌ Error: ' + err.message);
    }
  })();

  e.target.value = '';
});

// ─── Init after loading CSV ───────────────────────────────────────────────────
function initApp() {
  document.getElementById('empty-state').classList.add('hidden');
  document.getElementById('main-content').classList.remove('hidden');
  document.getElementById('record-count').classList.remove('hidden');

  buildTableHeader(); // must run BEFORE applyFilters → renderTable
  populateFilters();
  renderKPIs(allData);
  applyFilters();
}

// ─── KPIs ─────────────────────────────────────────────────────────────────────
function resolveByLabel(row, labels) {
  for (const label of labels) {
    const k = Object.keys(row).find(h => h.toUpperCase().includes(label.toUpperCase()));
    if (k) return row[k];
  }
  return '';
}

function renderKPIs(data) {
  const haciendas = new Set(data.map(r => resolveByLabel(r, ['HACIENDAN', 'HACIENDA'])));
  const variedades = new Set(data.map(r => resolveByLabel(r, ['VARIEDAD'])));
  
  const areas = data.map(r => parseFloat(resolveByLabel(r, ['ÁREA', 'AREA'])) || 0);
  const totalArea = areas.reduce((a, b) => a + b, 0);
  
  const edades = data.map(r => parseFloat(resolveByLabel(r, ['EDAD'])) || 0).filter(x => x > 0);
  const avgEdad = edades.length ? edades.reduce((a, b) => a + b, 0) / edades.length : 0;

  const tchs = data.map(r => parseFloat(resolveByLabel(r, ['TCH'])) || 0).filter(x => x > 0);
  const avgTCH = tchs.length ? tchs.reduce((a, b) => a + b, 0) / tchs.length : 0;

  document.getElementById('kpi-suertes').textContent = data.length.toLocaleString();
  document.getElementById('kpi-haciendas').textContent = haciendas.size;
  document.getElementById('kpi-area').textContent = totalArea.toLocaleString('es', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  document.getElementById('kpi-variedades').textContent = variedades.size;
  document.getElementById('kpi-edad').textContent = avgEdad.toFixed(1);
  document.getElementById('kpi-tch').textContent = avgTCH.toFixed(1);
  document.getElementById('record-count').textContent = data.length.toLocaleString() + ' registros';
}

// ─── Filter population ────────────────────────────────────────────────────────
function getHeaderKey(label) {
  return Object.keys(allData[0] || {}).find(h => h.toUpperCase().includes(label.toUpperCase())) || label;
}

function populateFilters() {
  const hKey = getHeaderKey('HACIENDAN') || getHeaderKey('HACIENDA');
  const zKey = getHeaderKey('ZONANOMBR') || getHeaderKey('ZONA');
  const vKey = getHeaderKey('VARIEDAD');
  const tKey = getHeaderKey('TIPO');

  populateSelect('filter-hacienda', hKey);
  populateSelect('filter-zona', zKey);
  populateSelect('filter-variedad', vKey);
  populateSelect('filter-tipo', tKey);
}

function populateSelect(id, colKey) {
  const sel = document.getElementById(id);
  const first = sel.options[0];
  sel.innerHTML = '';
  sel.appendChild(first);
  if (!colKey) return;
  const vals = [...new Set(allData.map(r => r[colKey]).filter(Boolean))].sort();
  vals.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    sel.appendChild(opt);
  });
}

// ─── Apply Filters ────────────────────────────────────────────────────────────
function applyFilters() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const hacienda = document.getElementById('filter-hacienda').value;
  const zona = document.getElementById('filter-zona').value;
  const variedad = document.getElementById('filter-variedad').value;
  const tipo = document.getElementById('filter-tipo').value;

  const hKey = getHeaderKey('HACIENDAN') || getHeaderKey('HACIENDA');
  const zKey = getHeaderKey('ZONANOMBR') || getHeaderKey('ZONA');
  const vKey = getHeaderKey('VARIEDAD');
  const tKey = getHeaderKey('TIPO');

  filteredData = allData.filter(row => {
    if (hacienda && row[hKey] !== hacienda) return false;
    if (zona && row[zKey] !== zona) return false;
    if (variedad && row[vKey] !== variedad) return false;
    if (tipo && row[tKey] !== tipo) return false;
    if (search) {
      const combined = Object.values(row).join(' ').toLowerCase();
      if (!combined.includes(search)) return false;
    }
    return true;
  });

  if (sortCol !== null) applySorting();

  currentPage = 1;
  updateResultsCount();
  render();
}

function applySorting() {
  const headers = Object.keys(allData[0] || {});
  const key = headers[sortCol];
  filteredData.sort((a, b) => {
    let av = a[key], bv = b[key];
    const af = parseFloat(av.replace(',', '.'));
    const bf = parseFloat(bv.replace(',', '.'));
    if (!isNaN(af) && !isNaN(bf)) { av = af; bv = bf; }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });
}

function updateResultsCount() {
  document.getElementById('filtered-count').textContent =
    filteredData.length.toLocaleString() + ' resultado' + (filteredData.length !== 1 ? 's' : '');
}

// ─── Render (table + cards) ───────────────────────────────────────────────────
function render() {
  if (currentView === 'table') {
    renderTable();
    renderPagination('pagination', false);
  } else {
    renderCards();
    renderPagination('pagination-cards', true);
  }
}

// ─── Table Header ──────────────────────────────────────────────────────────────
let tableHeaders = [];
function buildTableHeader() {
  if (!allData[0]) return;
  tableHeaders = Object.keys(allData[0]);
  const thead = document.getElementById('table-head');
  const tr = document.createElement('tr');
  tableHeaders.forEach((key, i) => {
    const th = document.createElement('th');
    th.setAttribute('data-col', i);
    const label = getFriendlyLabel(key);
    th.innerHTML = label + ' <span class="sort-arrow">↕</span>';
    th.title = key; // show raw key on hover
    th.addEventListener('click', () => handleSort(i, th));
    tr.appendChild(th);
  });
  thead.innerHTML = '';
  thead.appendChild(tr);
}

function handleSort(colIdx, th) {
  if (sortCol === colIdx) {
    sortDir = sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    sortCol = colIdx;
    sortDir = 'asc';
  }
  // Update arrow indicators
  document.querySelectorAll('#table-head th').forEach(el => {
    el.classList.remove('sort-asc', 'sort-desc');
    el.querySelector('.sort-arrow').textContent = '↕';
  });
  th.classList.add('sort-' + sortDir);
  th.querySelector('.sort-arrow').textContent = sortDir === 'asc' ? '↑' : '↓';
  applySorting();
  currentPage = 1;
  render();
}

// ─── Table render ─────────────────────────────────────────────────────────────
function renderTable() {
  const tbody = document.getElementById('table-body');
  tbody.innerHTML = '';
  const start = (currentPage - 1) * PAGE_SIZE;
  const slice = filteredData.slice(start, start + PAGE_SIZE);

  if (slice.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = tableHeaders.length;
    td.style.cssText = 'text-align:center;padding:2rem;color:var(--text-muted)';
    td.textContent = 'Sin resultados para los filtros seleccionados.';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  slice.forEach(row => {
    const tr = document.createElement('tr');
    tableHeaders.forEach((key) => {
      const td = document.createElement('td');
      const val = row[key] || '';
      // Format type/soca cells
      if (key.toUpperCase().includes('TIPO')) {
        td.innerHTML = formatTipo(val);
      } else {
        td.textContent = val;
      }
      tr.appendChild(td);
    });
    tr.addEventListener('click', () => showModal(row));
    tbody.appendChild(tr);
  });
}

function formatTipo(val) {
  const cls = val.toUpperCase().includes('SOCA') ? 'pill-soca' : 'pill-planta';
  return `<span class="pill ${cls}">${val}</span>`;
}

// ─── Cards render ─────────────────────────────────────────────────────────────
function renderCards() {
  const grid = document.getElementById('cards-grid');
  grid.innerHTML = '';
  const start = (currentPage - 1) * PAGE_SIZE;
  const slice = filteredData.slice(start, start + PAGE_SIZE);

  if (slice.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-muted);text-align:center;grid-column:1/-1;padding:2rem">Sin resultados.</p>';
    return;
  }

  const suerteKey = tableHeaders.find(h => h.toUpperCase().includes('SUERTE')) || tableHeaders[0];
  const haciendaKey = getHeaderKey('HACIENDAN') || getHeaderKey('HACIENDA');
  const varKey = getHeaderKey('VARIEDAD');
  const tipoKey = getHeaderKey('TIPO');
  const areaKey = tableHeaders.find(h => h.toUpperCase().includes('ÁREA') || h.toUpperCase().includes('AREA'));
  const edadKey = tableHeaders.find(h => h.toUpperCase().includes('EDAD'));
  const tchKey = tableHeaders.find(h => h.toUpperCase().includes('TCH'));

  slice.forEach(row => {
    const card = document.createElement('div');
    card.className = 'data-card';
    const tipo = row[tipoKey] || '';
    card.innerHTML = `
      <div class="data-card-header">
        <span class="data-card-id">${row[suerteKey] || '—'}</span>
        ${tipo ? `<span class="pill ${tipo.toUpperCase().includes('SOCA') ? 'pill-soca' : 'pill-planta'}">${tipo}</span>` : ''}
      </div>
      <div class="data-card-grid">
        <div class="data-card-field">
          <div class="data-card-label">Hacienda</div>
          <div class="data-card-value">${row[haciendaKey] || '—'}</div>
        </div>
        <div class="data-card-field">
          <div class="data-card-label">Variedad</div>
          <div class="data-card-value">${row[varKey] || '—'}</div>
        </div>
        <div class="data-card-field">
          <div class="data-card-label">Área (ha)</div>
          <div class="data-card-value">${row[areaKey] || '—'}</div>
        </div>
        <div class="data-card-field">
          <div class="data-card-label">Edad (meses)</div>
          <div class="data-card-value">${row[edadKey] || '—'}</div>
        </div>
        <div class="data-card-field">
          <div class="data-card-label">TCH Último</div>
          <div class="data-card-value">${row[tchKey] || '—'}</div>
        </div>
      </div>
    `;
    card.addEventListener('click', () => showModal(row));
    grid.appendChild(card);
  });
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function renderPagination(containerId, isCards) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  const total = Math.ceil(filteredData.length / PAGE_SIZE);
  if (total <= 1) return;

  const addBtn = (label, page, disabled, active) => {
    const btn = document.createElement('button');
    btn.className = 'page-btn' + (active ? ' active' : '');
    btn.textContent = label;
    btn.disabled = disabled;
    btn.addEventListener('click', () => { currentPage = page; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    container.appendChild(btn);
  };

  addBtn('«', 1, currentPage === 1);
  addBtn('‹', currentPage - 1, currentPage === 1);

  const range = pageRange(currentPage, total);
  let prev = null;
  range.forEach(p => {
    if (prev !== null && p - prev > 1) {
      const dot = document.createElement('span');
      dot.className = 'page-btn';
      dot.textContent = '…';
      dot.style.cursor = 'default';
      container.appendChild(dot);
    }
    addBtn(p, p, false, p === currentPage);
    prev = p;
  });

  addBtn('›', currentPage + 1, currentPage === total);
  addBtn('»', total, currentPage === total);
}

function pageRange(current, total) {
  const delta = 2;
  const range = [];
  for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
    range.push(i);
  }
  if (range[0] > 1) range.unshift(1);
  if (range[range.length - 1] < total) range.push(total);
  return range;
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function showModal(row) {
  const suerteKey = tableHeaders.find(h => h.toUpperCase().includes('SUERTE')) || tableHeaders[0];
  document.getElementById('modal-title').textContent = `Suerte: ${row[suerteKey] || '—'}`;
  const body = document.getElementById('modal-body');
  body.innerHTML = '';
  Object.entries(row).forEach(([key, val]) => {
    if (!val && val !== 0) return;
    const field = document.createElement('div');
    field.className = 'modal-field';
    const label = getFriendlyLabel(key);
    field.innerHTML = `<div class="modal-field-label">${label}</div><div class="modal-field-value">${val || '—'}</div>`;
    body.appendChild(field);
  });
  document.getElementById('detail-modal').classList.remove('hidden');
}

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('detail-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('detail-modal')) closeModal();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

function closeModal() {
  document.getElementById('detail-modal').classList.add('hidden');
}

// ─── Filters & events ─────────────────────────────────────────────────────────
document.getElementById('search-input').addEventListener('input', debounce(applyFilters, 250));
document.getElementById('filter-hacienda').addEventListener('change', applyFilters);
document.getElementById('filter-zona').addEventListener('change', applyFilters);
document.getElementById('filter-variedad').addEventListener('change', applyFilters);
document.getElementById('filter-tipo').addEventListener('change', applyFilters);

document.getElementById('clear-filters').addEventListener('click', () => {
  document.getElementById('search-input').value = '';
  document.getElementById('filter-hacienda').value = '';
  document.getElementById('filter-zona').value = '';
  document.getElementById('filter-variedad').value = '';
  document.getElementById('filter-tipo').value = '';
  applyFilters();
});

// ─── View toggle ──────────────────────────────────────────────────────────────
document.getElementById('view-table').addEventListener('click', () => {
  currentView = 'table';
  document.getElementById('view-table').classList.add('active');
  document.getElementById('view-cards').classList.remove('active');
  document.getElementById('table-view').classList.remove('hidden');
  document.getElementById('cards-view').classList.add('hidden');
  render();
});

document.getElementById('view-cards').addEventListener('click', () => {
  currentView = 'cards';
  document.getElementById('view-cards').classList.add('active');
  document.getElementById('view-table').classList.remove('active');
  document.getElementById('cards-view').classList.remove('hidden');
  document.getElementById('table-view').classList.add('hidden');
  render();
});

// ─── Toast ────────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 3500);
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

// ─── Service Worker registration ──────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
