function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    if (!t) return;

    const titleEle = document.getElementById('toast-title');
    const messageEle = document.getElementById('toast-message');
    const iconContainer = t.querySelector('.toast-icon');
    const icon = iconContainer.querySelector('i');

    t.classList.remove('error', 'cancelled');
    messageEle.textContent = msg;

    if (type === 'error' || type === 'cancelled') {
        titleEle.textContent = type === 'error' ? 'Erro' : 'Cancelado';
        icon.className = type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-ban';
        t.style.borderLeft = '4px solid #ff4757';
        iconContainer.style.background = 'rgba(255, 71, 87, 0.1)';
        iconContainer.style.color = '#ff4757';
    } else {
        titleEle.textContent = 'Sucesso!';
        icon.className = 'fas fa-check';
        t.style.borderLeft = '4px solid #2ed573';
        iconContainer.style.background = 'rgba(46, 213, 115, 0.1)';
        iconContainer.style.color = '#2ed573';
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
