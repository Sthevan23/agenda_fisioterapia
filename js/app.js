document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadAllData();
    } catch (error) {
        console.error(error);
        loadFromLocalStorage();
        setApiBanner(true);
        showToast('API indisponível — usando dados deste navegador.', 'error');
    }

    updateViewButtons();
    renderCalendar();
    renderTodayAppointments();
    renderUpcomingAppointments();
    renderPatientSelect();
    renderPatientList();
    renderHistory();
    generateTimeSlots();
    updateStats();

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
});
