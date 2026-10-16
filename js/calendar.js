function renderCalendar() {
    if (calendarView === 'week') {
        renderWeekCalendar();
        return;
    }
    renderMonthCalendar();
}

function renderMonthCalendar() {
    const calendarEl = document.getElementById('calendar');
    calendarEl.className = 'calendar-grid';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startingDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    document.getElementById('current-month').textContent = `${MONTH_NAMES[month]} ${year}`;

    let html = '';
    const dayHeaders = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    dayHeaders.forEach(day => html += `<div class="calendar-day-header">${day}</div>`);

    for (let i = startingDay - 1; i >= 0; i--) {
        const d = new Date(year, month, -i);
        html += renderMonthDayCell(d, true);
    }

    const todayStr = formatDateISO(new Date());
    for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        const dateStr = formatDateISO(d);
        html += renderMonthDayCell(d, false, dateStr === todayStr);
    }

    const remaining = 42 - (startingDay + daysInMonth);
    for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        html += renderMonthDayCell(d, true);
    }

    calendarEl.innerHTML = html;
}

function renderMonthDayCell(date, otherMonth, isToday = false) {
    const dateStr = formatDateISO(date);
    const dayApps = appointments.filter(a => a.date === dateStr);
    let dots = '';
    dayApps.forEach(a => dots += `<div class="appointment-dot ${a.status}"></div>`);

    return `<div class="calendar-day ${otherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}" onclick="selectDate('${dateStr}')">
        <div class="day-number">${date.getDate()}</div>
        <div class="day-appointments">${dots}</div>
    </div>`;
}

function renderWeekCalendar() {
    const calendarEl = document.getElementById('calendar');
    calendarEl.className = 'calendar-grid week-grid';

    const { start, end } = getWeekRange(weekAnchor);
    document.getElementById('current-month').textContent = formatWeekTitle(start, end);

    const todayStr = formatDateISO(new Date());
    const dayHeaders = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    let html = '';

    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const dateStr = formatDateISO(d);
        const isToday = dateStr === todayStr;
        const dayApps = appointments
            .filter(a => a.date === dateStr)
            .sort((a, b) => a.time.localeCompare(b.time));

        html += `
            <div class="week-day ${isToday ? 'today' : ''}">
                <div class="week-day-header">
                    <span class="week-day-name">${dayHeaders[i]}</span>
                    <span class="week-day-number">${d.getDate()}</span>
                </div>
                <div class="week-day-slots">
                    ${dayApps.length === 0
                        ? '<div class="week-slot week-slot--empty" onclick="selectDate(\'' + dateStr + '\')">+ Agendar</div>'
                        : dayApps.map(app => renderWeekSlot(app, dateStr)).join('')}
                </div>
            </div>
        `;
    }

    calendarEl.innerHTML = html;
}

function renderWeekSlot(app, dateStr) {
    const p = patients.find(patient => patient.id == app.patientId);
    const fullName = p ? p.name : '';
    const name = fullName ? fullName.split(' ')[0] : 'Paciente';
    const cancelled = app.status === 'cancelled';
    const typeLabel = appointmentTypes[app.type] || app.type || '';

    return `
        <div class="week-slot status-${safeStatus(app.status)} ${cancelled ? 'cancelled-item' : ''}"
             onclick="selectDate('${escapeHtml(dateStr)}')"
             title="${escapeHtml(fullName)} — ${escapeHtml(typeLabel)}">
            <span class="week-slot-time">${escapeHtml(app.time)}</span>
            <span class="week-slot-name">${escapeHtml(name)}</span>
        </div>
    `;
}

function formatWeekTitle(start, end) {
    if (start.getMonth() === end.getMonth()) {
        return `${start.getDate()} – ${end.getDate()} de ${MONTH_NAMES[end.getMonth()]} ${end.getFullYear()}`;
    }
    return `${start.getDate()} ${MONTH_NAMES[start.getMonth()]} – ${end.getDate()} ${MONTH_NAMES[end.getMonth()]} ${end.getFullYear()}`;
}

function changeView(view) {
    calendarView = view === 'week' ? 'week' : 'month';
    if (calendarView === 'week') {
        weekAnchor = new Date(currentDate);
    }
    updateViewButtons();
    renderCalendar();
}

function updateViewButtons() {
    document.getElementById('btn-view-month')?.classList.toggle('active', calendarView === 'month');
    document.getElementById('btn-view-week')?.classList.toggle('active', calendarView === 'week');
}

function changePeriod(delta) {
    if (calendarView === 'week') {
        weekAnchor.setDate(weekAnchor.getDate() + delta * 7);
        renderCalendar();
        return;
    }
    changeMonth(delta);
}

function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    renderCalendar();
}

function goToToday() {
    currentDate = new Date();
    weekAnchor = new Date();
    renderCalendar();
}

function selectDate(date) {
    selectedDate = date;

    const modal = document.getElementById('appointmentModal');
    if (modal?.classList.contains('active')) {
        toggleAppointmentDate(date);
        return;
    }

    selectedAppointmentDates = [];
    openModal(date);
}

function renderTodayAppointments() {
    const today = formatDateISO(new Date());
    const todayApps = appointments.filter(a => a.date === today)
        .sort((a, b) => a.time.localeCompare(b.time));

    const badge = document.getElementById('today-count-badge');
    if (badge) {
        badge.textContent = `${todayApps.filter(a => a.status !== 'cancelled').length} agendadas`;
    }

    document.getElementById('today-appointments').innerHTML = todayApps.map(app =>
        renderAppointmentCard(app, 'time')
    ).join('');
}

function renderUpcomingAppointments() {
    const today = formatDateISO(new Date());
    const upcoming = appointments
        .filter(a => a.date > today && a.status !== 'cancelled')
        .sort((a, b) => (a.date + ' ' + a.time).localeCompare(b.date + ' ' + b.time))
        .slice(0, 5);

    document.getElementById('upcoming-appointments').innerHTML = upcoming.map(app =>
        renderAppointmentCard(app, 'date')
    ).join('');
}

function renderAppointmentCard(app, timeMode) {
    const p = patients.find(patient => patient.id == app.patientId);
    const isCancelled = app.status === 'cancelled';

    const timeBlock = timeMode === 'time'
        ? `<span class="time-start">${escapeHtml(app.time)}</span><span class="time-end">${escapeHtml(calculateEndTime(app.time))}</span>`
        : `<span class="time-start">${escapeHtml(formatDate(app.date))}</span><span class="time-end">${escapeHtml(app.time)}</span>`;
    const id = safeId(app.id);

    return `
        <div class="appointment-item appointment-item--stacked ${isCancelled ? 'cancelled-item' : ''}">
            <div class="appointment-item__row">
                <div class="appointment-time">${timeBlock}</div>
                <div class="appointment-details">
                    <div class="patient-name">
                        ${p ? escapeHtml(p.name) : 'Paciente removido'}
                        ${getGenderBadge(p)}
                        ${getAgeBadge(p ? p.age : null)}
                    </div>
                    <div class="appointment-type">${escapeHtml(appointmentTypes[app.type] || app.type || '')}</div>
                </div>
            </div>
            <div class="appointment-actions">
                ${isCancelled ? '<span class="status-badge status-cancelled">Cancelado</span>' : (app.status === 'finished'
                    ? '<span class="status-badge status-finished">Finalizado</span>'
                    : `
                        <button class="btn-appt btn-appt-finish" onclick="finishAppointment(${id})" title="Finalizar"><i class="fas fa-check"></i> Finalizar</button>
                        <button class="btn-appt btn-appt-cancel" onclick="confirmCancelAppointment(${id})" title="Cancelar"><i class="fas fa-ban"></i> Cancelar</button>
                    `)}
            </div>
        </div>
    `;
}

function updateStats() {
    const today = formatDateISO(new Date());
    const { startStr, endStr } = getWeekRange();

    const todayCount = appointments.filter(a => a.date === today && a.status !== 'cancelled').length;
    const weekCount = appointments.filter(a =>
        a.date >= startStr && a.date <= endStr && a.status !== 'cancelled'
    ).length;
    const confirmed = appointments.filter(a => a.status === 'confirmed').length;
    const cancelled = appointments.filter(a => a.status === 'cancelled').length;

    document.getElementById('today-count').textContent = todayCount;
    document.getElementById('week-count').textContent = weekCount;
    document.getElementById('confirmed-count').textContent = confirmed;
    document.getElementById('cancelled-count').textContent = cancelled;
}
