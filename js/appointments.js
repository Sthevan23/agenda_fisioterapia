function getMinAppointmentDateStr() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return formatDateISO(yesterday);
}

function openModal(initialDate = null) {
    if (initialDate) {
        if (!selectedAppointmentDates.length) {
            addAppointmentDate(initialDate, false);
        }
        modalPickerMonth = new Date(initialDate + 'T12:00:00');
    } else {
        selectedAppointmentDates = [];
        appointmentTimeByDate = {};
        modalPickerMonth = new Date();
    }

    document.getElementById('appointmentModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    renderDateChips();
    renderModalMonthPicker();
}

function closeModal() {
    document.getElementById('appointmentModal').classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('appointmentForm').reset();
    selectedAppointmentDates = [];
    appointmentTimeByDate = {};

    const searchInput = document.getElementById('patient-select-search');
    if (searchInput) {
        searchInput.value = '';
        renderPatientSelect();
    }

    renderDateChips();
    renderModalMonthPicker();
}

function toggleAppointmentDate(dateStr) {
    if (!dateStr) return;

    if (selectedAppointmentDates.includes(dateStr)) {
        removeAppointmentDate(dateStr);
        return;
    }

    addAppointmentDate(dateStr, false);
}

function addAppointmentDate(dateStr, showDuplicateToast = true) {
    if (!dateStr) return;

    const minDate = getMinAppointmentDateStr();
    if (dateStr < minDate) {
        showToast('Não é possível agendar consultas antes de ontem.', 'error');
        return;
    }

    if (selectedAppointmentDates.includes(dateStr)) {
        if (showDuplicateToast) {
            showToast('Esta data já foi adicionada.', 'error');
        }
        return;
    }

    selectedAppointmentDates.push(dateStr);
    selectedAppointmentDates.sort();
    renderDateChips();
}

function removeAppointmentDate(dateStr) {
    selectedAppointmentDates = selectedAppointmentDates.filter(d => d !== dateStr);
    delete appointmentTimeByDate[dateStr];
    renderDateChips();
}

function clearAppointmentDates() {
    selectedAppointmentDates = [];
    appointmentTimeByDate = {};
    renderDateChips();
}

function addNextWeekdaysFromInput() {
    const input = document.getElementById('quick-day-count');
    const count = Math.min(60, Math.max(1, parseInt(input?.value, 10) || 1));
    addNextWeekdays(count);
}

function addNextWeekdays(count) {
    const minDate = getMinAppointmentDateStr();
    let cursor = new Date();
    cursor.setHours(12, 0, 0, 0);
    if (formatDateISO(cursor) < minDate) {
        cursor.setDate(cursor.getDate() + 1);
    }

    let added = 0;
    let guard = 0;
    while (added < count && guard < 400) {
        guard++;
        const weekday = cursor.getDay();
        if (weekday >= 1 && weekday <= 5) {
            const dateStr = formatDateISO(cursor);
            if (dateStr >= minDate && !selectedAppointmentDates.includes(dateStr)) {
                selectedAppointmentDates.push(dateStr);
                added++;
            }
        }
        cursor.setDate(cursor.getDate() + 1);
    }

    selectedAppointmentDates.sort();
    renderDateChips();

    if (added === 0) {
        showToast('Nenhum dia útil novo para adicionar.', 'error');
    } else {
        showToast(`${added} dia(s) úteis adicionados.`);
    }
}

function buildTimeOptions(selected = '') {
    return timeSlots.map(t =>
        `<option value="${t}" ${t === selected ? 'selected' : ''}>${t}</option>`
    ).join('');
}

function initAppointmentTimeSelects() {
    const bulk = document.getElementById('bulk-time-select');
    if (!bulk) return;
    bulk.innerHTML = `<option value="">Mesmo horário para todos</option>${buildTimeOptions()}`;
}

function setAppointmentTimeForDate(dateStr, time) {
    if (!dateStr) return;
    if (time) {
        appointmentTimeByDate[dateStr] = time;
    } else {
        delete appointmentTimeByDate[dateStr];
    }
}

function applyBulkTimeToAllDates() {
    const bulk = document.getElementById('bulk-time-select');
    const time = bulk?.value;
    if (!time) {
        showToast('Escolha um horário para aplicar a todos.', 'error');
        return;
    }
    selectedAppointmentDates.forEach(dateStr => {
        appointmentTimeByDate[dateStr] = time;
    });
    renderDateTimeRows();
    showToast('Horário aplicado a todos os dias.');
}

function renderDateTimeRows() {
    const section = document.getElementById('date-times-section');
    const container = document.getElementById('date-time-rows');
    if (!section || !container) return;

    if (selectedAppointmentDates.length === 0) {
        section.classList.add('hidden');
        container.innerHTML = '';
        return;
    }

    section.classList.remove('hidden');
    container.innerHTML = selectedAppointmentDates.map(dateStr => {
        const selected = appointmentTimeByDate[dateStr] || '';
        return `
            <div class="date-time-row">
                <span class="date-time-row__label">${formatDateLabel(dateStr)}</span>
                <select class="form-select date-time-row__select"
                    data-date="${dateStr}"
                    onchange="setAppointmentTimeForDate('${dateStr}', this.value)"
                    required>
                    <option value="">Horário</option>
                    ${buildTimeOptions(selected)}
                </select>
            </div>
        `;
    }).join('');
}

function changeModalPickerMonth(delta) {
    modalPickerMonth.setMonth(modalPickerMonth.getMonth() + delta);
    renderModalMonthPicker();
}

function selectWeekdaysInModalMonth() {
    const year = modalPickerMonth.getFullYear();
    const month = modalPickerMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const minDate = getMinAppointmentDateStr();
    let added = 0;

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const weekday = date.getDay();
        if (weekday < 1 || weekday > 5) continue;

        const dateStr = formatDateISO(date);
        if (dateStr < minDate) continue;
        if (selectedAppointmentDates.includes(dateStr)) continue;

        selectedAppointmentDates.push(dateStr);
        added++;
    }

    selectedAppointmentDates.sort();
    renderDateChips();

    if (added === 0) {
        showToast('Nenhum dia útil novo para adicionar neste mês.', 'error');
    } else {
        showToast(`${added} dia(s) úteis adicionados.`);
    }
}

function renderModalMonthPicker() {
    const grid = document.getElementById('modal-month-picker');
    const title = document.getElementById('modal-picker-title');
    if (!grid || !title) return;

    const year = modalPickerMonth.getFullYear();
    const month = modalPickerMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startingDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const minDate = getMinAppointmentDateStr();
    const todayStr = formatDateISO(new Date());

    title.textContent = `${MONTH_NAMES[month]} ${year}`;

    const dayHeaders = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    let html = dayHeaders.map(d => `<div class="modal-picker-day-header">${d}</div>`).join('');

    for (let i = 0; i < startingDay; i++) {
        html += '<div class="modal-picker-day modal-picker-day--pad"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = formatDateISO(new Date(year, month, day));
        const isSelected = selectedAppointmentDates.includes(dateStr);
        const isPast = dateStr < minDate;
        const isToday = dateStr === todayStr;

        html += `
            <button type="button"
                class="modal-picker-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${isPast ? 'disabled' : ''}"
                ${isPast ? 'disabled' : ''}
                onclick="toggleAppointmentDate('${dateStr}')"
                aria-pressed="${isSelected}">
                ${day}
            </button>
        `;
    }

    grid.innerHTML = html;
}

function renderDateChips() {
    const container = document.getElementById('selected-dates-chips');
    const hidden = document.getElementById('appointmentDate');
    const saveBtn = document.getElementById('btn-save-appointment');

    if (!container) return;

    const countEl = document.getElementById('selected-dates-count');
    const count = selectedAppointmentDates.length;

    if (countEl) {
        countEl.textContent = count === 1 ? '1 dia selecionado' : `${count} dias selecionados`;
    }

    renderModalMonthPicker();

    renderDateTimeRows();

    if (count === 0) {
        container.innerHTML = '<p class="date-chips-empty">Nenhum dia marcado. Clique no calendário ou use &quot;Próximos N dias úteis&quot;.</p>';
        if (hidden) hidden.value = '';
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fas fa-check"></i> Confirmar';
        }
        return;
    }

    container.innerHTML = selectedAppointmentDates.map(dateStr => {
        const label = formatDateLabel(dateStr);
        return `
            <span class="date-chip">
                <i class="fas fa-calendar-day"></i> ${label}
                <button type="button" class="date-chip-remove" onclick="removeAppointmentDate('${dateStr}')" aria-label="Remover data">
                    <i class="fas fa-times"></i>
                </button>
            </span>
        `;
    }).join('');

    if (hidden) hidden.value = selectedAppointmentDates[0];
    if (saveBtn) {
        const n = selectedAppointmentDates.length;
        saveBtn.innerHTML = n === 1
            ? '<i class="fas fa-check"></i> Confirmar 1 consulta'
            : `<i class="fas fa-check"></i> Confirmar ${n} consultas`;
    }
}

function formatDateLabel(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    const weekday = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()];
    return `${weekday}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

async function saveAppointment() {
    const patientId = document.getElementById('patientSelect').value;
    const dates = [...selectedAppointmentDates];

    const type = document.getElementById('appointmentType').value;
    const valueInput = document.getElementById('appointmentValue').value;
    const category = document.getElementById('appointmentCategory').value;
    const payment = document.getElementById('appointmentPayment').value;
    const observations = document.getElementById('observations')?.value.trim() || null;

    if (!patientId) return showToast('Selecione um paciente', 'error');
    if (dates.length === 0) return showToast('Adicione pelo menos uma data', 'error');

    const missingTime = dates.filter(d => !appointmentTimeByDate[d]);
    if (missingTime.length) {
        showToast('Defina o horário de cada dia selecionado.', 'error');
        return;
    }
    if (!valueInput || valueInput === 'R$ 0,00') return showToast('Informe o valor da consulta', 'error');
    if (!category) return showToast('Selecione a categoria', 'error');
    if (!payment) return showToast('Selecione a forma de pagamento', 'error');

    const cleanValue = valueInput.replace(/[^\d,]/g, '').replace(',', '.');
    const value = parseFloat(cleanValue);

    if (isNaN(value) || value <= 0) {
        showToast('Informe um valor válido', 'error');
        return;
    }

    const payloadBase = {
        patientId: parseInt(patientId),
        type,
        value,
        category,
        payment,
        status: 'confirmed',
        observations,
    };

    const patient = patients.find(p => p.id == patientId);
    let successCount = 0;
    let failCount = 0;

    for (const date of dates) {
        const time = appointmentTimeByDate[date];
        try {
            if (useApiMode) {
                const created = await api.createAppointment({ ...payloadBase, date, time });
                appointments.push(created);
            } else {
                appointments.push({
                    id: Date.now() + successCount,
                    patientId: patient.id,
                    patient: patient.name,
                    date,
                    time,
                    ...payloadBase,
                });
            }
            successCount++;
        } catch {
            failCount++;
        }
    }

    if (!useApiMode && successCount > 0) {
        saveLocalStorage();
    }

    appointments.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));

    refreshAllViews();
    closeModal();

    if (failCount === 0) {
        const suffix = useApiMode ? '' : ' (salvo neste navegador)';
        showToast((successCount === 1 ? 'Consulta agendada!' : `${successCount} consultas agendadas!`) + suffix);
    } else if (successCount === 0) {
        showToast('Não foi possível agendar. Verifique a pasta api/ no servidor.', 'error');
    } else {
        showToast(`${successCount} agendada(s), ${failCount} falhou(ram).`, 'error');
    }
}

async function finishAppointment(id) {
    try {
        if (useApiMode) {
            const updated = await api.updateAppointment(id, { status: 'finished' });
            replaceAppointment(updated);
        } else {
            const app = appointments.find(a => a.id === id);
            if (app) app.status = 'finished';
            saveLocalStorage();
        }
        refreshAllViews();
        renderReports();
        showToast('Atendimento finalizado com sucesso!');
    } catch (error) {
        showToast(error.message || 'Erro ao finalizar consulta', 'error');
    }
}

async function revertBilling(id) {
    if (!confirm('Deseja reverter o faturamento desta consulta? O status voltará para "Confirmado".')) return;

    try {
        if (useApiMode) {
            const updated = await api.updateAppointment(id, { status: 'confirmed' });
            replaceAppointment(updated);
        } else {
            const app = appointments.find(a => a.id === id);
            if (app) app.status = 'confirmed';
            saveLocalStorage();
        }
        refreshAllViews();
        showToast('Faturamento revertido.');
    } catch (error) {
        showToast(error.message || 'Erro ao reverter faturamento', 'error');
    }
}

async function deleteAppointment(id) {
    if (!confirm('Tem certeza que deseja excluir permanentemente esta consulta?')) return;

    try {
        if (useApiMode) {
            await api.deleteAppointment(id);
        }
        appointments = appointments.filter(a => a.id !== id);
        if (!useApiMode) saveLocalStorage();
        refreshAllViews();
        showToast('Consulta excluída permanentemente.');
    } catch (error) {
        showToast(error.message || 'Erro ao excluir consulta', 'error');
    }
}

function openEditValueModal(id) {
    const app = appointments.find(a => a.id === id);
    if (!app) return;

    const modal = document.getElementById('editValueModal');
    document.getElementById('editValueApptId').value = id;
    document.getElementById('newAppointmentValue').value = formatCurrency(app.value || 0);
    document.getElementById('editAppointmentPayment').value = app.payment || 'dinheiro';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeEditValueModal() {
    const modal = document.getElementById('editValueModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

async function saveNewValue() {
    const id = parseInt(document.getElementById('editValueApptId').value);
    const valueInput = document.getElementById('newAppointmentValue').value;
    const payment = document.getElementById('editAppointmentPayment').value;

    const cleanValue = valueInput.replace(/[^\d,]/g, '').replace(',', '.');
    const value = parseFloat(cleanValue);

    if (isNaN(value) || value < 0) {
        showToast('Informe um valor válido', 'error');
        return;
    }

    try {
        if (useApiMode) {
            const updated = await api.updateAppointment(id, { value, payment });
            replaceAppointment(updated);
        } else {
            const app = appointments.find(a => a.id === id);
            if (app) {
                app.value = value;
                app.payment = payment;
            }
            saveLocalStorage();
        }
        renderHistory();
        renderReports();
        showToast('Valor atualizado com sucesso!');
        closeEditValueModal();
    } catch (error) {
        showToast(error.message || 'Erro ao atualizar valor', 'error');
    }
}

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

async function executeCancelAppointment() {
    const modal = document.getElementById('cancelModal');
    const id = parseInt(modal.dataset.appointmentId);

    try {
        if (useApiMode) {
            const updated = await api.updateAppointment(id, { status: 'cancelled' });
            replaceAppointment(updated);
        } else {
            const app = appointments.find(a => a.id === id);
            if (app) app.status = 'cancelled';
            saveLocalStorage();
        }
        refreshAllViews();
        showToast('Consulta cancelada.', 'cancelled');
    } catch (error) {
        showToast(error.message || 'Erro ao cancelar consulta', 'error');
    }

    closeCancelModal();
}

function replaceAppointment(updated) {
    const index = appointments.findIndex(a => a.id === updated.id);
    if (index >= 0) {
        appointments[index] = updated;
    }
}
