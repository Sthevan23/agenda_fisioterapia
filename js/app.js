document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    bindAppEvents();
    await startApp();
});

function bindAppEvents() {
    document.getElementById('patient-search')?.addEventListener('input', e => {
        renderPatientList(e.target.value);
    });

    document.getElementById('patient-select-search')?.addEventListener('input', e => {
        renderPatientSelect(e.target.value);
    });

    document.getElementById('patientPhone')?.addEventListener('input', e => {
        e.target.value = formatPhone(e.target.value);
    });

    document.getElementById('appointmentValue')?.addEventListener('input', e => {
        e.target.value = formatCurrencyInput(e.target.value);
    });

    document.getElementById('newAppointmentValue')?.addEventListener('input', e => {
        e.target.value = formatCurrencyInput(e.target.value);
    });

    document.getElementById('patientAge')?.addEventListener('input', e => {
        updateAgePreview(e.target.value);
    });

    document.getElementById('history-search')?.addEventListener('input', e => {
        renderHistory(e.target.value, activeHistoryFilter);
    });

    document.getElementById('editValueModal')?.addEventListener('click', e => {
        if (e.target === e.currentTarget) closeEditValueModal();
    });

    document.getElementById('appointmentModal')?.addEventListener('click', e => {
        if (e.target === e.currentTarget) closeModal();
    });

    document.getElementById('patientModal')?.addEventListener('click', e => {
        if (e.target === e.currentTarget) closePatientModal();
    });

    document.getElementById('cancelModal')?.addEventListener('click', e => {
        if (e.target === e.currentTarget) closeCancelModal();
    });

    document.getElementById('auth-form')?.addEventListener('submit', submitAuthPassword);
}

async function startApp() {
    const session = await prepareApiSession();

    if (session === 'login') {
        showAuthGate();
        return;
    }

    if (session === 'offline') {
        loadFromLocalStorage();
        showToast('API offline: cadastros ficam só neste aparelho até subir a pasta api/.', 'error');
    } else if (session === 'unconfigured') {
        loadFromLocalStorage();
        setApiBanner(false, false, true);
        showToast('Defina API_TOKEN no servidor para gravar no banco.', 'error');
    } else {
        try {
            await loadAllData();
        } catch (error) {
            console.error(error);
            useApiMode = false;
            loadFromLocalStorage();
            setApiBanner(true);
            showToast('API offline: cadastros ficam só neste aparelho até subir a pasta api/.', 'error');
        }
    }

    renderShell();
}

function renderShell() {
    updateViewButtons();
    renderCalendar();
    renderTodayAppointments();
    renderUpcomingAppointments();
    renderPatientSelect();
    renderPatientList();
    renderHistory();
    initAppointmentTimeSelects();
    generateTimeSlots();
    updateStats();
    updateLogoutButton();
}

async function submitAuthPassword(event) {
    event.preventDefault();
    const input = document.getElementById('auth-password');
    const password = input?.value.trim() || '';
    if (!password) {
        showToast('Digite a senha de acesso', 'error');
        return;
    }

    apiToken = password;
    const ok = await verifyApiToken();
    if (!ok) {
        apiToken = '';
        showToast('Senha incorreta', 'error');
        return;
    }

    sessionStorage.setItem('fisio_api_token', apiToken);
    hideAuthGate();

    try {
        await loadAllData();
    } catch (error) {
        showToast(error.message || 'Erro ao carregar os dados', 'error');
        return;
    }

    renderShell();
}

function logoutApi() {
    sessionStorage.removeItem('fisio_api_token');
    apiToken = '';
    window.location.reload();
}

function showAuthGate() {
    document.getElementById('auth-gate')?.classList.remove('hidden');
    document.getElementById('auth-password')?.focus();
}

function hideAuthGate() {
    document.getElementById('auth-gate')?.classList.add('hidden');
}

function updateLogoutButton() {
    document.getElementById('btn-logout')?.classList.toggle('hidden', !(useApiMode && apiToken));
}
