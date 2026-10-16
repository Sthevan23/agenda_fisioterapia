let API_BASE = '/api';
let useApiMode = false;

function getApiCandidates() {
    const meta = document.querySelector('meta[name="api-base"]');
    const fromMeta = meta?.content?.replace(/\/$/, '') || '/api';

    return [
        fromMeta,
        '/api/index.php',
        '/api',
        '/api.php',
    ].filter((value, index, list) => list.indexOf(value) === index);
}

async function probeApiBase(base) {
    const urls = [
        `${base}/health`,
        `${base}?route=health`,
    ];

    for (const url of urls) {
        try {
            const response = await fetch(url, { headers: { Accept: 'application/json' } });
            const payload = await response.json();
            if (response.ok && payload.success) {
                return { base, url, payload };
            }
        } catch {
            // tenta próxima URL
        }
    }

    return null;
}

async function initApiConnection() {
    const candidates = getApiCandidates();

    for (const base of candidates) {
        const result = await probeApiBase(base);
        if (result) {
            API_BASE = result.base;
            useApiMode = true;
            setApiBanner(false, result.payload);
            return true;
        }
    }

    useApiMode = false;
    loadFromLocalStorage();
    setApiBanner(true);
    return false;
}

function loadFromLocalStorage() {
    patients = JSON.parse(localStorage.getItem('fisio_patients') || '[]');
    appointments = JSON.parse(localStorage.getItem('fisio_appointments') || '[]');
}

function saveLocalStorage() {
    localStorage.setItem('fisio_patients', JSON.stringify(patients));
    localStorage.setItem('fisio_appointments', JSON.stringify(appointments));
}

function setApiBanner(offline, healthPayload = null) {
    const banner = document.getElementById('api-offline-banner');
    if (!banner) return;

    if (offline) {
        banner.classList.remove('hidden');
        banner.innerHTML = `
            <i class="fas fa-triangle-exclamation"></i>
            <span>
                <strong>Banco offline:</strong> os cadastros ficam só neste celular/navegador.
                No Hostinger, envie a pasta <code>api/</code> + <code>.htaccess</code> para
                <code>domains/fisio.sthevandev.com.br/public_html</code> e teste
                <a href="/api/health" target="_blank" rel="noopener">/api/health</a>.
            </span>
        `;
        return;
    }

    banner.classList.add('hidden');
}

async function apiRequest(method, path, body = null) {
    if (!useApiMode) {
        throw new Error('API indisponível — usando armazenamento local');
    }

    const paths = [
        `${API_BASE}${path}`,
        `${API_BASE}?route=${path.replace(/^\//, '')}`,
    ];

    let lastError = null;

    for (const url of paths) {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        };

        if (body !== null) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, options);
            let payload = null;

            try {
                payload = await response.json();
            } catch {
                payload = { success: false, error: 'Resposta inválida do servidor' };
            }

            if (!response.ok || payload.success === false) {
                lastError = new Error(payload.error || `Erro HTTP ${response.status}`);
                continue;
            }

            return payload.data ?? payload;
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error('Falha na comunicação com a API');
}

const api = {
    health: () => apiRequest('GET', '/health'),

    getPatients: () => apiRequest('GET', '/patients'),
    createPatient: (data) => apiRequest('POST', '/patients', data),
    updatePatient: (id, data) => apiRequest('PUT', `/patients/${id}`, data),
    deletePatient: (id) => apiRequest('DELETE', `/patients/${id}`),

    getAppointments: () => apiRequest('GET', '/appointments'),
    createAppointment: (data) => apiRequest('POST', '/appointments', data),
    updateAppointment: (id, data) => apiRequest('PATCH', `/appointments/${id}`, data),
    deleteAppointment: (id) => apiRequest('DELETE', `/appointments/${id}`),
};

async function loadAllData() {
    const connected = await initApiConnection();
    if (!connected) {
        return;
    }

    const [patientsData, appointmentsData] = await Promise.all([
        api.getPatients(),
        api.getAppointments(),
    ]);

    patients = patientsData;
    appointments = appointmentsData.sort(
        (a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)
    );
}

function refreshAllViews() {
    renderCalendar();
    renderTodayAppointments();
    renderUpcomingAppointments();
    renderPatientList();
    renderPatientSelect();
    renderHistory();
    updateStats();

    const reportsSection = document.getElementById('reports-section');
    if (reportsSection && !reportsSection.classList.contains('hidden')) {
        renderReports();
    }
}
