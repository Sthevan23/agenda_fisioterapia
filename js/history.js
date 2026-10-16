function filterHistory(status) {
    activeHistoryFilter = status;

    ['all', 'confirmed', 'finished', 'cancelled'].forEach(s => {
        const btn = document.getElementById('filter-' + s);
        if (!btn) return;
        btn.classList.toggle('active', s === status);
    });

    const searchInput = document.getElementById('history-search');
    renderHistory(searchInput ? searchInput.value : '', activeHistoryFilter);
}

function renderHistory(search = '', statusFilter = 'all') {
    const container = document.getElementById('history-list');
    if (!container) return;

    let filtered = appointments.slice();

    if (statusFilter !== 'all') {
        filtered = filtered.filter(app => app.status === statusFilter);
    }

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
        ? `<div class="empty-state">
               <i class="fas fa-calendar-xmark"></i>
               <p>Nenhuma consulta encontrada.</p>
           </div>`
        : filtered.map(app => {
            const patient = patients.find(p => p.id == app.patientId);
            const isCancelled = app.status === 'cancelled';
            const status = safeStatus(app.status);
            const id = safeId(app.id);
            const paymentLabel = app.payment ? (paymentMethods[app.payment] || app.payment) : '';
            return `
                <div class="appointment-item appointment-item--stacked ${isCancelled ? 'cancelled-item' : ''}" data-status="${status}">
                    <div class="appointment-item__row">
                        <div class="appointment-time">
                            <span class="time-start">${escapeHtml(formatDate(app.date))}</span>
                            <span class="time-end">${escapeHtml(app.time)}</span>
                        </div>
                        <div class="appointment-details">
                            <div class="patient-name">
                                ${patient ? escapeHtml(patient.name) : 'Paciente removido'}
                                ${getGenderBadge(patient)}
                                ${getAgeBadge(patient ? patient.age : null)}
                            </div>
                            <div class="appointment-type">
                                ${escapeHtml(appointmentTypes[app.type] || app.type || '')}
                                ${paymentLabel ? `<small class="payment-tag">${escapeHtml(paymentLabel)}</small>` : ''}
                                ${app.value ? `- <span class="appointment-value">${formatCurrency(app.value)}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="appointment-actions">
                        <span class="status-badge status-${status} status-badge--inline">
                            ${isCancelled ? 'Cancelado' : (app.status === 'finished' ? 'Finalizado' : 'Confirmado')}
                        </span>
                        ${(!isCancelled && app.status !== 'finished') ? `
                            <button class="btn-appt btn-appt-finish" onclick="finishAppointment(${id})" title="Finalizar"><i class="fas fa-check"></i> Finalizar</button>
                            <button class="btn-appt btn-appt-cancel" onclick="confirmCancelAppointment(${id})" title="Cancelar"><i class="fas fa-ban"></i> Cancelar</button>
                        ` : ''}
                        ${app.status === 'finished' ? `
                            <button class="btn-appt btn-appt-edit" onclick="openEditValueModal(${id})" title="Editar Valor"><i class="fas fa-edit"></i> Valor</button>
                            <button class="btn-appt btn-appt-revert" onclick="revertBilling(${id})" title="Reverter Faturamento"><i class="fas fa-undo"></i> Estornar</button>
                            <button class="btn-appt btn-appt-cancel btn-appt-icon" onclick="deleteAppointment(${id})" title="Excluir"><i class="fas fa-trash"></i></button>
                        ` : ''}
                        ${isCancelled ? `
                             <button class="btn-appt btn-appt-cancel btn-appt-icon" onclick="deleteAppointment(${id})" title="Excluir"><i class="fas fa-trash"></i></button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
}
