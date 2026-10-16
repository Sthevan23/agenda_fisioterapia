function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    if (!t) return;

    const titleEle = document.getElementById('toast-title');
    const messageEle = document.getElementById('toast-message');
    const iconContainer = t.querySelector('.toast-icon');
    const icon = iconContainer.querySelector('i');

    t.classList.remove('toast--error', 'toast--cancelled');
    messageEle.textContent = msg;

    if (type === 'error' || type === 'cancelled') {
        titleEle.textContent = type === 'error' ? 'Erro' : 'Cancelado';
        icon.className = type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-ban';
        t.classList.add(type === 'error' ? 'toast--error' : 'toast--cancelled');
    } else {
        titleEle.textContent = 'Sucesso!';
        icon.className = 'fas fa-check';
    }

    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar.classList.toggle('active');
    overlay?.classList.toggle('active');
}

function showSection(section) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(section + '-section');
    if (target) target.classList.remove('hidden');

    if (section === 'reports') {
        renderReports();
    }

    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const link = document.querySelector(`.nav-link[data-section="${section}"]`);
    if (link) link.classList.add('active');

    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('active');
        document.getElementById('sidebar-overlay')?.classList.remove('active');
    }
}

function resolveThemePreference() {
    const stored = localStorage.getItem('fisio_theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('fisio_theme', isDark ? 'dark' : 'light');
    updateThemeToggleUI(isDark);
}

function initTheme() {
    applyTheme(resolveThemePreference());
}

function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    applyTheme(isDark ? 'light' : 'dark');
}

function updateThemeToggleUI(isDark) {
    const iconClass = isDark ? 'fas fa-sun' : 'fas fa-moon';
    const labelText = isDark ? 'Tema claro' : 'Tema escuro';

    document.getElementById('theme-icon')?.setAttribute('class', iconClass);
    document.getElementById('theme-icon-fab')?.setAttribute('class', iconClass);

    const label = document.getElementById('theme-label');
    if (label) label.textContent = labelText;

    const fab = document.getElementById('btn-theme-fab');
    if (fab) {
        fab.title = isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro';
    }
}
