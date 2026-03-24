const SUERTES = [
    {"suerte":"02001","zona_nombre":"CANDELARIA","hacienda_nombre":"NAVARRO","variedad":"CC 11-600","corte":2,"tipo":"SOCA","area":11.77,"tch":110.3,"ton_ha_mes":8.62,"toneladas":1298.1,"madurante":"N"},
    {"suerte":"02002","zona_nombre":"CANDELARIA","hacienda_nombre":"NAVARRO","variedad":"CC 11-595","corte":2,"tipo":"SOCA","area":10.1,"tch":140.5,"ton_ha_mes":7.56,"toneladas":1419.0,"madurante":"N"},
    {"suerte":"02005","zona_nombre":"CANDELARIA","hacienda_nombre":"NAVARRO","variedad":"CC 05-430","corte":3,"tipo":"SOCA","area":12.07,"tch":119.0,"ton_ha_mes":8.55,"toneladas":1436.3,"madurante":"N"},
    {"suerte":"06001","zona_nombre":"CANDELARIA","hacienda_nombre":"SAN MICHEL","variedad":"CC 09-066","corte":3,"tipo":"SOCA","area":19.62,"tch":162.6,"ton_ha_mes":12.21,"toneladas":3190.0,"madurante":"S"},
    {"suerte":"07010","zona_nombre":"FLORIDA","hacienda_nombre":"BELGICA","variedad":"CC 01-1940","corte":10,"tipo":"SOCA","area":15.79,"tch":130.0,"ton_ha_mes":11.24,"toneladas":2052.7,"madurante":"N"},
    {"suerte":"07030","zona_nombre":"FLORIDA","hacienda_nombre":"BELGICA","variedad":"CC 11-595","corte":3,"tipo":"SOCA","area":25.78,"tch":140.0,"ton_ha_mes":7.91,"toneladas":3609.2,"madurante":"N"},
    {"suerte":"01035","zona_nombre":"PRADERA","hacienda_nombre":"LA LORENA","variedad":"CC 05-430","corte":5,"tipo":"SOCA","area":31.08,"tch":147.9,"ton_ha_mes":10.61,"toneladas":4596.7,"madurante":"N"},
    {"suerte":"04006","zona_nombre":"PRADERA","hacienda_nombre":"CANARIAS","variedad":"CC 09-066","corte":5,"tipo":"SOCA","area":30.61,"tch":163.7,"ton_ha_mes":12.42,"toneladas":5009.4,"madurante":"N"},
    {"suerte":"03001","zona_nombre":"PALMIRA","hacienda_nombre":"PALMAR","variedad":"VARIEDADES","corte":2,"tipo":"SOCA","area":25.41,"tch":127.7,"ton_ha_mes":10.79,"toneladas":3244.9,"madurante":"N"},
    {"suerte":"05001","zona_nombre":"PALMIRA","hacienda_nombre":"MIRRIÑAQUE","variedad":"CC 05-430","corte":4,"tipo":"SOCA","area":19.28,"tch":159.4,"ton_ha_mes":12.06,"toneladas":3216.3,"madurante":"N"},
    {"suerte":"08300","zona_nombre":"PALMIRA","hacienda_nombre":"RETIRO","variedad":"CC 85-92","corte":12,"tipo":"SOCA","area":23.4,"tch":109.2,"ton_ha_mes":7.45,"toneladas":2555.6,"madurante":"N"}
];

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    renderDashboard();
    renderMaestro();
    initFilters();
});

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');
    const pageTitle = document.getElementById('page-title');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');
            
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            
            views.forEach(v => v.classList.remove('active'));
            document.getElementById(`view-${target}`).classList.add('active');
            
            if(target === 'dashboard') pageTitle.textContent = 'Dashboard General';
            if(target === 'maestro') pageTitle.textContent = 'Directorio de Suertes';
        });
    });
}

function renderDashboard() {
    const totalArea = SUERTES.reduce((sum, s) => sum + s.area, 0);
    const totalTon = SUERTES.reduce((sum, s) => sum + s.toneladas, 0);
    const avgTCH = SUERTES.reduce((sum, s) => sum + s.tch, 0) / SUERTES.length;
    
    document.getElementById('dashboard-kpis').innerHTML = `
        <div class="kpi-card">
            <div class="kpi-title">Área Total (ha)</div>
            <div class="kpi-value">${totalArea.toFixed(2)}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-title">TCH Promedio</div>
            <div class="kpi-value">${avgTCH.toFixed(2)}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-title">Producción Est. (Ton)</div>
            <div class="kpi-value">${totalTon.toFixed(0)}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-title">Total Suertes Activas</div>
            <div class="kpi-value">${SUERTES.length}</div>
        </div>
    `;

    // Zona Bars
    const zonas = {};
    SUERTES.forEach(s => {
        zonas[s.zona_nombre] = (zonas[s.zona_nombre] || 0) + s.area;
    });
    
    const maxZ = Math.max(...Object.values(zonas));
    document.getElementById('zona-bars').innerHTML = Object.entries(zonas).map(([z, val]) => `
        <div class="bar-wrap">
            <div class="bar-label">${z}</div>
            <div class="bar-track">
                <div class="bar-fill" style="width: ${(val/maxZ)*100}%"></div>
            </div>
            <div class="bar-value">${val.toFixed(1)}</div>
        </div>
    `).join('');

    // Top TCH
    const topTch = [...SUERTES].sort((a,b) => b.tch - a.tch).slice(0, 5);
    document.getElementById('top-tch-body').innerHTML = topTch.map(s => `
        <tr>
            <td><strong>${s.suerte}</strong></td>
            <td>${s.hacienda_nombre}</td>
            <td class="text-right">
                <span class="badge badge-green">${s.tch.toFixed(1)}</span>
            </td>
        </tr>
    `).join('');
}

function renderMaestro(filterText = '') {
    const tbody = document.getElementById('maestro-body');
    const filtered = SUERTES.filter(s => 
        s.suerte.toLowerCase().includes(filterText) ||
        s.hacienda_nombre.toLowerCase().includes(filterText) ||
        s.variedad.toLowerCase().includes(filterText)
    );

    tbody.innerHTML = filtered.map(s => {
        let tchBadge = 'badge-yellow';
        if(s.tch > 140) tchBadge = 'badge-green';
        if(s.tch < 115) tchBadge = 'badge-red';

        return `
        <tr>
            <td><strong>${s.suerte}</strong></td>
            <td>${s.zona_nombre}</td>
            <td>${s.hacienda_nombre}</td>
            <td>${s.variedad}</td>
            <td class="text-center">${s.corte}</td>
            <td>${s.tipo}</td>
            <td class="text-right">${s.area.toFixed(2)}</td>
            <td class="text-right"><span class="badge ${tchBadge}">${s.tch.toFixed(1)}</span></td>
            <td class="text-right">${s.ton_ha_mes.toFixed(2)}</td>
            <td class="text-right">${s.toneladas.toFixed(1)}</td>
            <td class="text-center">${s.madurante === 'S' ? '✅' : '-'}</td>
        </tr>
    `}).join('');
    
    document.getElementById('maestro-count').textContent = `Mostrando ${filtered.length} registros`;
}

function initFilters() {
    document.getElementById('searchInput').addEventListener('input', (e) => {
        renderMaestro(e.target.value.toLowerCase());
    });
}
