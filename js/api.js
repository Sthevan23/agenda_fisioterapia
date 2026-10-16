let API_BASE = '/api';
let useApiMode = false;
let apiToken = '';

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

function authHeaders(json = false) {
    const headers = { Accept: 'application/json' };
    if (json) headers['Content-Type'] = 'application/json';
    if (apiToken) headers['X-Api-Token'] = apiToken;
    return headers;
}

async function probeApiBase(base) {
    const urls = [
        `${base}?route=health`,
        `${base}/health`,
    ];

    for (const url of urls) {
        try {
            const response = await fetch(url, { headers: { Accept: 'application/json' } });
            const payload = await response.json();
            if (response.ok && payload.success) {
                return { base, url, payload };
            }
            const errorText = payload?.error || '';
            if (errorText.includes('DB_PASS') || errorText.includes('Senha do MySQL') || errorText.includes('using password: NO')) {
                return { base, url, payload, needsConfigLocal: true };
            }
        } catch {
            // tenta próxima URL
        }
    }

    return null;
}

async function prepareApiSession() {
    apiToken = sessionStorage.getItem('fisio_api_token') || '';
    const candidates = getApiCandidates();
    let needsConfigLocal = false;

    for (const base of candidates) {
        const result = await probeApiBase(base);
        if (result?.needsConfigLocal) {
            needsConfigLocal = true;
            continue;
        }
        if (!result) continue;

        API_BASE = result.base;
        useApiMode = true;

        if (result.payload.authConfigured === false) {
            useApiMode = false;
            return 'unconfigured';
        }

        if (apiToken && await verifyApiToken()) {
            setApiBanner(false);
            return 'ready';
        }

        apiToken = '';
        return 'login';
    }

    useApiMode = false;
    setApiBanner(true, needsConfigLocal);
    return 'offline';
}

async function verifyApiToken() {
    try {
        await apiRequest('GET', '/auth');
        return true;
    } catch {
        return false;
    }
}

function loadFromLocalStorage() {
    patients = JSON.parse(localStorage.getItem('fisio_patients') || '[]');
    appointments = JSON.parse(localStorage.getItem('fisio_appointments') || '[]');
}

function saveLocalStorage() {
    localStorage.setItem('fisio_patients', JSON.stringify(patients));
    localStorage.setItem('fisio_appointments', JSON.stringify(appointments));
}

function setApiBanner(offline, needsConfigLocal = false, needsAuthSetup = false) {
    const banner = document.getElementById('api-offline-banner');
    if (!banner) return;

    if (offline || needsAuthSetup) {
        banner.classList.remove('hidden');
        if (needsAuthSetup) {
            banner.innerHTML = `
                <i class="fas fa-triangle-exclamation"></i>
                <span>
                    <strong>A agenda ainda não tem senha de acesso.</strong>
                    No servidor, em <code>api/config.local.php</code>, defina
                    <code>API_TOKEN</code> (ou a variável <code>FISIO_API_TOKEN</code>).
                    Até lá, os cadastros ficam só neste aparelho.
                </span>
            `;
        } else if (needsConfigLocal) {
            banner.innerHTML = `
                <i class="fas fa-triangle-exclamation"></i>
                <span>
                    <strong>Falta a senha do MySQL no servidor.</strong>
                    No Hostinger (File Manager), em <code>api/</code>, copie
                    <code>config.local.example.php</code> para <code>config.local.php</code>
                    e preencha <code>DB_PASS</code> e <code>API_TOKEN</code>. Depois teste
                    <a href="/api/index.php?route=health" target="_blank" rel="noopener">a API</a>.
                </span>
            `;
        } else {
            banner.innerHTML = `
                <i class="fas fa-triangle-exclamation"></i>
                <span>
                    <strong>Banco offline:</strong> os cadastros ficam só neste celular/navegador.
                    Confira se a pasta <code>api/</code> está no site e se o MySQL foi importado.
                </span>
            `;
        }
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
            headers: authHeaders(body !== null),
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
    if (!useApiMode) return;

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
    updateLogoutButton();

    const reportsSection = document.getElementById('reports-section');
    if (reportsSection && !reportsSection.classList.contains('hidden')) {
        renderReports();
    }
}
