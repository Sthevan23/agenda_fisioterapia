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

            const genderRadio = document.querySelector(`input[name="gender"][value="${patient.gender || 'masculino'}"]`);
            if (genderRadio) genderRadio.checked = true;

            updateAgePreview(patient.age);

            const delBtn = document.getElementById('btn-delete-patient');
            if (delBtn) delBtn.classList.remove('hidden');
        }
    } else {
        title.textContent = 'Novo Paciente';
        document.getElementById('patientForm').reset();
        document.getElementById('editPatientId').value = '';

        const delBtn = document.getElementById('btn-delete-patient');
        if (delBtn) delBtn.classList.add('hidden');

        updateAgePreview(null);
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

async function savePatient() {
    const name = document.getElementById('patientName')?.value.trim();
    const phone = document.getElementById('patientPhone')?.value.trim();
    const age = document.getElementById('patientAge')?.value;
    const gender = document.querySelector('input[name="gender"]:checked')?.value || 'masculino';
    const editId = document.getElementById('editPatientId')?.value;

    if (!name || !phone) {
        showToast('Nome e telefone são obrigatórios', 'error');
        return;
    }

    const payload = {
        name,
        phone,
        age: age ? parseInt(age) : null,
        gender,
    };

    try {
        if (useApiMode) {
            if (editId) {
                const updated = await api.updatePatient(editId, payload);
                const index = patients.findIndex(p => p.id == editId);
                if (index >= 0) patients[index] = updated;
                showToast('Paciente atualizado!');
            } else {
                const created = await api.createPatient(payload);
                patients.push(created);
                showToast('Paciente adicionado!');
            }
        } else if (editId) {
            const patient = patients.find(p => p.id == editId);
            if (patient) {
                Object.assign(patient, payload);
                showToast('Paciente atualizado só neste aparelho — suba a pasta api/ no Hostinger.', 'error');
            }
        } else {
            const newId = patients.length ? Math.max(...patients.map(p => p.id)) + 1 : 1;
            patients.push({ id: newId, ...payload });
            showToast('Salvo só neste celular. A API ainda não está no ar (MySQL).', 'error');
        }

        if (!useApiMode) saveLocalStorage();
        refreshAllViews();
        closePatientModal();
    } catch (error) {
        showToast(error.message || 'Erro ao salvar paciente', 'error');
    }
}

async function deletePatient(id) {
    if (!confirm('Deseja realmente remover este paciente?')) return;

    try {
        if (useApiMode) {
            await api.deletePatient(id);
        }
        patients = patients.filter(p => p.id !== id);
        if (!useApiMode) saveLocalStorage();
        renderPatientList();
        renderPatientSelect();
        showToast('Paciente removido');
    } catch (error) {
        showToast(error.message || 'Erro ao remover paciente', 'error');
    }
}

function renderPatientList(search = '') {
    const container = document.getElementById('patient-list');
    if (!container) return;

    const filtered = patients.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.phone.includes(search)
    ).sort((a, b) => a.name.localeCompare(b.name));

    if (filtered.length === 0) {
        const offlineHint = useApiMode
            ? ''
            : '<p class="empty-state-hint">Os dados estão só neste aparelho até a API estar no ar.</p>';
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-plus"></i>
                <p>${search ? 'Nenhum paciente encontrado.' : 'Nenhum paciente cadastrado ainda.'}</p>
                ${offlineHint}
                <button type="button" class="btn btn-primary empty-state-cta" onclick="openPatientModal()">
                    <i class="fas fa-plus"></i> Cadastrar primeiro paciente
                </button>
            </div>`;
        return;
    }

    container.innerHTML = filtered.map(p => {
        let gender = p.gender;
        if (!gender) {
            const name = p.name.toLowerCase().trim();
            gender = name.endsWith('a') ? 'feminino' : 'masculino';
        }
        const isMale = gender === 'masculino';
        const avatarClass = isMale ? 'patient-avatar--male' : 'patient-avatar--female';
        const iconClass = isMale ? 'fa-mars' : 'fa-venus';

        return `
        <div class="patient-item">
            <div class="patient-avatar ${avatarClass}">
                <i class="fas ${iconClass}"></i>
            </div>
            <div class="patient-info">
                <div class="patient-name-text">
                    ${p.name}
                    ${getAgeBadge(p.age)}
                </div>
                <div class="patient-phone-text">${p.phone}</div>
            </div>
            <div class="patient-age-box">
                <div class="patient-age-text">${p.age ? p.age + ' anos' : '—'}</div>
            </div>
            <div class="patient-actions">
                <button class="btn btn-secondary" onclick="openPatientModal(${p.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger-outline" onclick="deletePatient(${p.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `}).join('');
}

function renderPatientSelect(search = '') {
    const select = document.getElementById('patientSelect');
    if (!select) return;

    const filtered = patients
        .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name));

    select.innerHTML = '<option value="">Selecione um paciente</option>' +
        filtered.map(p => `<option value="${p.id}">${p.name} - ${p.phone}</option>`).join('');
}
