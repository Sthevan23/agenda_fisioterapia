// script.js - FisioAgenda completo (com CRUD pacientes + Histórico)

// ────────────────────────────────────────────────
// Dados globais
// ────────────────────────────────────────────────

let currentDate = new Date();
let selectedDate = null;
let activeHistoryFilter = 'all'; // Filtro ativo no histórico

// Carrega dados iniciais do localStorage ou inicia vazio
let patients = JSON.parse(localStorage.getItem('fisio_patients')) || [];
let appointments = JSON.parse(localStorage.getItem('fisio_appointments')) || [];

const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00'
];

const appointmentTypes = {
    avaliacao: 'Avaliação Inicial',
    sessao: 'Sessão de Fisioterapia',
    retorno: 'Retorno',
    pilates: 'Pilates Terapêutico',
    reabilitacao: 'Reabilitação'
};

const serviceCategories = {
    particular: 'Particular',
    plano: 'Plano de Saúde',
    domicilio: 'Domicílio'
};

// ────────────────────────────────────────────────
// Inicialização
// ────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    renderCalendar();
    renderTodayAppointments();
    renderUpcomingAppointments();
    renderPatientSelect();
    renderPatientList();
    renderHistory();           // Novo: renderiza histórico
    generateTimeSlots();

    const dateInput = document.getElementById('appointmentDate');
    if (dateInput) dateInput.valueAsDate = new Date();

    // Busca pacientes
    document.getElementById('patient-search')?.addEventListener('input', e => {
        renderPatientList(e.target.value);
    });

    // Máscara de telefone
    document.getElementById('patientPhone')?.addEventListener('input', e => {
        e.target.value = formatPhone(e.target.value);
    });

    // Máscara de valor (Real)
    document.getElementById('appointmentValue')?.addEventListener('input', e => {
        e.target.value = formatCurrencyInput(e.target.value);
    });

    // Busca no histórico
    document.getElementById('history-search')?.addEventListener('input', e => {
        renderHistory(e.target.value, activeHistoryFilter);
    });

    // Fechar modais ao clicar fora
    document.getElementById('appointmentModal')?.addEventListener('click', e => {
        if (e.target === e.currentTarget) closeModal();
    });
    document.getElementById('patientModal')?.addEventListener('click', e => {
        if (e.target === e.currentTarget) closePatientModal();
    });
    document.getElementById('cancelModal')?.addEventListener('click', e => {
        if (e.target === e.currentTarget) closeCancelModal();
    });
});

// ────────────────────────────────────────────────
// CRUD Pacientes
// ────────────────────────────────────────────────

function openPatientModal(editId = null) {
    const modal = document.getElementById('patientModal');
    const title = document.getElementById('patientModalTitle');
    const form = document.getElementById('patientForm');

    if (!modal) return;

    form.reset();
    document.getElementById('editPatientId').value = '';

    if (editId) {
        const patient = patients.find(p => p.id === editId);
        if (patient) {
            title.textContent = 'Editar Paciente';
            document.getElementById('patientName').value = patient.name;
            document.getElementById('patientPhone').value = patient.phone;
            document.getElementById('patientAge').value = patient.age || '';
            document.getElementById('editPatientId').value = patient.id;

            // Mostrar botão de excluir
            const delBtn = document.getElementById('btn-delete-patient');
            if (delBtn) delBtn.style.display = 'inline-flex';
        }
    } else {
        title.textContent = 'Novo Paciente';
        document.getElementById('patientForm').reset();
        document.getElementById('editPatientId').value = '';

        // Esconder botão de excluir
        const delBtn = document.getElementById('btn-delete-patient');
        if (delBtn) delBtn.style.display = 'none';
    }
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function deletePatientFromModal() {
    const id = document.getElementById('editPatientId').value;
    if (id) {
        deletePatient(parseInt(id));
        closePatientModal();
    }
}

function closePatientModal() {
    const modal = document.getElementById('patientModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function savePatient() {
    const name = document.getElementById('patientName')?.value.trim();
    const phone = document.getElementById('patientPhone')?.value.trim();
    const age = document.getElementById('patientAge')?.value;
    const editId = document.getElementById('editPatientId')?.value;

    if (!name || !phone) {
        showToast('Nome e telefone são obrigatórios', 'error');
        return;
    }

    if (editId) {
        const patient = patients.find(p => p.id == editId);
        if (patient) {
            patient.name = name;
            patient.phone = phone;
            patient.age = age ? parseInt(age) : null;
            showToast('Paciente atualizado!');
        }
    } else {
        const newId = patients.length ? Math.max(...patients.map(p => p.id)) + 1 : 1;
        patients.push({ id: newId, name, phone, age: age ? parseInt(age) : null });
        showToast('Paciente adicionado!');
    }

    saveData(); // Persiste no banco local
    renderPatientList();
    renderPatientSelect();
    closePatientModal();
}

function deletePatient(id) {
    if (confirm('Deseja realmente remover este paciente?')) {
        patients = patients.filter(p => p.id !== id);
        saveData(); // Persiste no banco local
        renderPatientList();
        renderPatientSelect();
        showToast('Paciente removido');
    }
}
// ────────────────────────────────────────────────
// Render Pacientes
// ────────────────────────────────────────────────

function renderPatientList(search = '') {
    const container = document.getElementById('patient-list');
    if (!container) return;

    const filtered = patients.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.phone.includes(search)
    );

    container.innerHTML = filtered.map(p => `
        <div class="patient-item">
            <div class="patient-avatar">${p.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</div>
            <div style="flex:1">
                <div style="font-weight:600;">${p.name}</div>
                <div style="color:var(--text-light);">${p.phone}</div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:0.75rem; color:var(--text-light);">Idade</div>
                <div style="font-weight:600;">${p.age ? p.age + ' anos' : '—'}</div>
            </div>
            <div style="display:flex; gap:8px; margin-left:16px;">
                <button class="btn btn-secondary" style="padding:6px 10px;" onclick="openPatientModal(${p.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button style="padding:6px 10px; color:var(--danger); border:1px solid var(--danger); background:transparent;" 
                        onclick="deletePatient(${p.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function renderPatientSelect() {
    const select = document.getElementById('patientSelect');
    if (!select) return;

    select.innerHTML = '<option value="">Selecione um paciente</option>' +
        patients.map(p => `<option value="${p.id}">${p.name} - ${p.phone}</option>`).join('');
}

// ────────────────────────────────────────────────
// Histórico de Consultas (NOVO)
// ────────────────────────────────────────────────

function filterHistory(status) {
    activeHistoryFilter = status;

    // Atualiza visual dos botões
    ['all', 'confirmed', 'cancelled'].forEach(s => {
        const btn = document.getElementById('filter-' + s);
        if (!btn) return;
        if (s === status) {
            btn.style.background = 'var(--primary)';
            btn.style.color = '#fff';
            btn.style.border = 'none';
        } else {
            btn.style.background = 'transparent';
            btn.style.color = 'var(--text-light)';
            btn.style.border = '1px solid var(--border)';
        }
    });

    const searchInput = document.getElementById('history-search');
    renderHistory(searchInput ? searchInput.value : '', activeHistoryFilter);
}

function renderHistory(search = '', statusFilter = 'all') {
    const container = document.getElementById('history-list');
    if (!container) return;

    let filtered = appointments.slice();

    // Filtra por status
    if (statusFilter !== 'all') {
        filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Ordena por data + hora (mais recente primeiro)
    filtered.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));

    if (search) {
        const lowerSearch = search.toLowerCase();
        filtered = filtered.filter(app => {
            const patient = patients.find(p => p.id == app.patientId);
            const patientName = patient ? patient.name.toLowerCase() : '';
            return patientName.includes(lowerSearch) ||
                app.date.includes(search) ||
                app.time.includes(search);
        });
    }

    container.innerHTML = filtered.length === 0
        ? `<div style="text-align:center; padding:3rem 1rem;">
               <i class="fas fa-calendar-xmark" style="font-size:2.5rem; color:var(--border); margin-bottom:1rem; display:block;"></i>
               <p style="color:var(--text-light);">Nenhuma consulta encontrada.</p>
           </div>`
        : filtered.map(app => {
            const patient = patients.find(p => p.id == app.patientId);
            const isCancelled = app.status === 'cancelled';
            const borderColor = isCancelled ? 'var(--danger)' : 'var(--success)';
            return `
                <div class="appointment-item ${isCancelled ? 'cancelled-item' : ''}" style="border-left: 4px solid ${borderColor}">
                    <div class="appointment-time">
                        <span class="time-start">${formatDate(app.date)}</span>
                        <span class="time-end">${app.time}</span>
                    </div>
                    <div class="appointment-details">
                        <div class="patient-name">${patient ? patient.name : 'Paciente removido'}</div>
                        <div class="appointment-type">${appointmentTypes[app.type] || app.type}</div>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span class="status-badge status-${app.status}">
                            ${isCancelled ? 'Cancelado' : 'Confirmado'}
                        </span>
                        ${!isCancelled ? `<button class="btn-cancel-appt" onclick="confirmCancelAppointment(${app.id})" title="Cancelar consulta"><i class="fas fa-ban"></i></button>` : ''}
                    </div>
                </div>
            `;
        }).join('');
}

// ────────────────────────────────────────────────
// Calendário e Agendamentos (mantidos)
// ────────────────────────────────────────────────

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);

    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    const prevDays = prevLastDay.getDate();

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    document.getElementById('current-month').textContent = `${monthNames[month]} ${year}`;

    let html = '';
    const dayHeaders = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    dayHeaders.forEach(day => html += `<div class="calendar-day-header">${day}</div>`);

    for (let i = startingDay - 1; i >= 0; i--) {
        html += `<div class="calendar-day other-month"><div class="day-number">${prevDays - i}</div></div>`;
    }

    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year;
        const dayApps = appointments.filter(a => a.date === dateStr);

        let dots = '';
        dayApps.forEach(a => dots += `<div class="appointment-dot ${a.status}"></div>`);

        html += `<div class="calendar-day ${isToday ? 'today' : ''}" onclick="selectDate('${dateStr}')">
            <div class="day-number">${i}</div>
            <div class="day-appointments">${dots}</div>
        </div>`;
    }

    const remaining = 42 - (startingDay + daysInMonth);
    for (let i = 1; i <= remaining; i++) {
        html += `<div class="calendar-day other-month"><div class="day-number">${i}</div></div>`;
    }

    document.getElementById('calendar').innerHTML = html;
}

function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    renderCalendar();
}

function goToToday() {
    currentDate = new Date();
    renderCalendar();
}

function selectDate(date) {
    selectedDate = date;
    document.getElementById('appointmentDate').value = date;
    openModal();
}

function renderTodayAppointments() {
    const today = new Date().toISOString().split('T')[0];
    const todayApps = appointments.filter(a => a.date === today)
        .sort((a, b) => a.time.localeCompare(b.time));

    document.getElementById('today-appointments').innerHTML = todayApps.map(app => {
        const p = patients.find(p => p.id == app.patientId);
        const isCancelled = app.status === 'cancelled';
        return `
            <div class="appointment-item ${isCancelled ? 'cancelled-item' : ''}">
                <div class="appointment-time">
                    <span class="time-start">${app.time}</span>
                    <span class="time-end">${calculateEndTime(app.time)}</span>
                </div>
                <div class="appointment-details">
                    <div class="patient-name">${p ? p.name : 'Paciente removido'}</div>
                    <div class="appointment-type">${appointmentTypes[app.type]}</div>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span class="status-badge status-${app.status}">${isCancelled ? 'Cancelado' : (app.status === 'confirmed' ? 'Confirmado' : 'Pendente')}</span>
                    ${!isCancelled ? `<button class="btn-cancel-appt" onclick="confirmCancelAppointment(${app.id})" title="Cancelar consulta"><i class="fas fa-ban"></i></button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function renderUpcomingAppointments() {
    const today = new Date().toISOString().split('T')[0];
    const upcoming = appointments.filter(a => a.date > today).slice(0, 5);

    document.getElementById('upcoming-appointments').innerHTML = upcoming.map(app => {
        const p = patients.find(p => p.id == app.patientId);
        const isCancelled = app.status === 'cancelled';
        return `
            <div class="appointment-item ${isCancelled ? 'cancelled-item' : ''}">
                <div class="appointment-time">
                    <span class="time-start">${formatDate(app.date)}</span>
                    <span class="time-end">${app.time}</span>
                </div>
                <div class="appointment-details">
                    <div class="patient-name">${p ? p.name : 'Paciente removido'}</div>
                    <div class="appointment-type">${appointmentTypes[app.type]}</div>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    ${isCancelled ? '<span class="status-badge status-cancelled">Cancelado</span>' : `<button class="btn-cancel-appt" onclick="confirmCancelAppointment(${app.id})" title="Cancelar consulta"><i class="fas fa-ban"></i></button>`}
                </div>
            </div>
        `;
    }).join('');
}

function calculateEndTime(start) {
    const [h, m] = start.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m + 50);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}`;
}

function openModal() {
    document.getElementById('appointmentModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('appointmentModal').classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('appointmentForm').reset();
    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
}

function generateTimeSlots() {
    document.getElementById('timeSlots').innerHTML = timeSlots.map(t =>
        `<div class="time-slot" onclick="selectTime(this,'${t}')">${t}</div>`
    ).join('');
}

function selectTime(el, time) {
    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
    el.classList.add('selected');
    document.getElementById('selectedTime').value = time;
}

function saveAppointment() {
    const patientId = document.getElementById('patientSelect').value;
    const date = document.getElementById('appointmentDate').value;
    const time = document.getElementById('selectedTime').value;
    const type = document.getElementById('appointmentType').value;
    const valueInput = document.getElementById('appointmentValue').value;
    const category = document.getElementById('appointmentCategory').value;

    if (!patientId) return showToast('Selecione um paciente', 'error');
    if (!date) return showToast('Selecione a data', 'error');
    if (!time) return showToast('Selecione um horário', 'error');
    if (!valueInput || valueInput === 'R$ 0,00') return showToast('Informe o valor da consulta', 'error');
    if (!category) return showToast('Selecione a categoria', 'error');

    // Converte "R$ 150,00" para 150.00
    const cleanValue = valueInput.replace(/[^\d,]/g, '').replace(',', '.');
    const value = parseFloat(cleanValue);

    if (isNaN(value) || value <= 0) {
        showToast('Informe um valor válido', 'error');
        return;
    }

    const patient = patients.find(p => p.id == patientId);
    if (!patient) {
        showToast('Paciente não encontrado', 'error');
        return;
    }

    appointments.push({
        id: appointments.length + 1,
        patientId: patient.id,
        patient: patient.name,
        date,
        time,
        type,
        value: parseFloat(value),
        category,
        status: 'confirmed'
    });

    appointments.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));

    saveData(); // Persiste no banco local
    renderCalendar();
    renderTodayAppointments();
    renderUpcomingAppointments();
    renderHistory();
    updateStats();
    closeModal();
    showToast('Consulta agendada!');
}

function updateStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayCount = appointments.filter(a => a.date === today && a.status !== 'cancelled').length;
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStr = weekStart.toISOString().split('T')[0];
    const weekCount = appointments.filter(a => a.date >= weekStr && a.status !== 'cancelled').length;
    const confirmed = appointments.filter(a => a.status === 'confirmed').length;
    const cancelled = appointments.filter(a => a.status === 'cancelled').length;

    document.getElementById('today-count').textContent = todayCount;
    document.getElementById('week-count').textContent = weekCount;
    document.getElementById('confirmed-count').textContent = confirmed;
    document.getElementById('cancelled-count').textContent = cancelled;
}

// ────────────────────────────────────────────────
// Cancelamento de Consultas
// ────────────────────────────────────────────────

function confirmCancelAppointment(id) {
    const app = appointments.find(a => a.id === id);
    if (!app) return;
    const patient = patients.find(p => p.id == app.patientId);
    const name = patient ? patient.name : 'paciente';

    const modal = document.getElementById('cancelModal');
    document.getElementById('cancel-patient-name').textContent = name;
    document.getElementById('cancel-appt-date').textContent = formatDate(app.date) + ' às ' + app.time;
    document.getElementById('cancel-appt-type').textContent = appointmentTypes[app.type] || app.type;
    modal.dataset.appointmentId = id;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCancelModal() {
    const modal = document.getElementById('cancelModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function executeCancelAppointment() {
    const modal = document.getElementById('cancelModal');
    const id = parseInt(modal.dataset.appointmentId);
    const app = appointments.find(a => a.id === id);
    if (app) {
        app.status = 'cancelled';
        saveData(); // Persiste no banco local
        renderCalendar();
        renderTodayAppointments();
        renderUpcomingAppointments();
        renderHistory();
        updateStats();
        showToast('Consulta cancelada.', 'cancelled');
    }
    closeCancelModal();
}

// ────────────────────────────────────────────────
// Auxiliares
// ────────────────────────────────────────────────

function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    if (!t) return;

    const titleEle = document.getElementById('toast-title');
    const messageEle = document.getElementById('toast-message');
    const iconContainer = t.querySelector('.toast-icon');
    const icon = iconContainer.querySelector('i');

    // Reset classes
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

function formatPhone(value) {
    // Remove tudo que não é número
    let digits = value.replace(/\D/g, '');

    // Limita a 11 dígitos (celular com DDD)
    if (digits.length > 11) digits = digits.slice(0, 11);

    // Formata progressivamente
    if (digits.length <= 2) {
        return digits.length ? '(' + digits : '';
    } else if (digits.length <= 6) {
        return '(' + digits.slice(0, 2) + ') ' + digits.slice(2);
    } else if (digits.length === 11) {
        // Celular: (37) 9 9124-4506
        return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 3) + ' ' + digits.slice(3, 7) + '-' + digits.slice(7);
    } else {
        // Fixo: (37) 9124-4506
        return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 6) + '-' + digits.slice(6);
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

function showSection(section) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    const target = document.getElementById(section + '-section');
    if (target) target.style.display = 'block';

    if (section === 'reports') {
        renderReports();
    }

    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const link = document.querySelector(`.nav-link[onclick="showSection('${section}')"]`);
    if (link) link.classList.add('active');
}

function saveData() {
    localStorage.setItem('fisio_patients', JSON.stringify(patients));
    localStorage.setItem('fisio_appointments', JSON.stringify(appointments));
}

function formatCurrencyInput(value) {
    let v = value.replace(/\D/g, '');
    v = (v / 100).toFixed(2) + '';
    v = v.replace(".", ",");
    v = v.replace(/(\d)(\d{3})(\d{3}),/g, "$1.$2.$3,");
    v = v.replace(/(\d)(\d{3}),/g, "$1.$2,");
    return "R$ " + v;
}

// ────────────────────────────────────────────────
// Relatórios e Financeiro
// ────────────────────────────────────────────────

function renderReports() {
    const confirmedApps = appointments.filter(a => a.status === 'confirmed');

    // Faturamento Total
    const totalRevenue = confirmedApps.reduce((acc, app) => acc + (app.value || 0), 0);
    document.getElementById('total-revenue').textContent = formatCurrency(totalRevenue);

    // Faturamento Mensal (Mês atual)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthlyApps = confirmedApps.filter(app => {
        const appDate = new Date(app.date);
        return appDate.getMonth() === currentMonth && appDate.getFullYear() === currentYear;
    });
    const monthlyRevenue = monthlyApps.reduce((acc, app) => acc + (app.value || 0), 0);
    document.getElementById('monthly-revenue').textContent = formatCurrency(monthlyRevenue);

    // Média por Consulta
    const avgValue = confirmedApps.length ? totalRevenue / confirmedApps.length : 0;
    document.getElementById('average-value').textContent = formatCurrency(avgValue);

    // Faturamento por Categoria
    const revenueByCategory = {};
    const atendsByCategory = {};

    Object.keys(serviceCategories).forEach(cat => {
        revenueByCategory[cat] = 0;
        atendsByCategory[cat] = 0;
    });

    confirmedApps.forEach(app => {
        if (app.category && revenueByCategory.hasOwnProperty(app.category)) {
            revenueByCategory[app.category] += (app.value || 0);
            atendsByCategory[app.category]++;
        }
    });

    // Renderizar Faturamento por Categoria
    document.getElementById('revenue-by-category').innerHTML = Object.entries(serviceCategories).map(([key, label]) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--border);">
            <span style="font-weight: 500;">${label}</span>
            <span style="font-weight: 700; color: var(--success);">${formatCurrency(revenueByCategory[key])}</span>
        </div>
    `).join('');

    // Renderizar Distribuição de Atendimentos
    document.getElementById('atends-by-category').innerHTML = Object.entries(serviceCategories).map(([key, label]) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--border);">
            <span style="font-weight: 500;">${label}</span>
            <span style="font-weight: 700; color: var(--primary);">${atendsByCategory[key]} atendimentos</span>
        </div>
    `).join('');
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}