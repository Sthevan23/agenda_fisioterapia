function getAgeCategory(age) {
    if (age === null || age === undefined || age === '') return null;
    const n = Number(age);
    if (isNaN(n)) return null;
    if (n <= 12) return { label: 'Criança', class: 'age-child' };
    if (n <= 59) return { label: 'Adulto', class: 'age-adult' };
    return { label: 'Idoso', class: 'age-elderly' };
}

function getAgeBadge(age) {
    const cat = getAgeCategory(age);
    if (!cat) return '';
    return `<span class="age-badge ${cat.class} age-badge--inline">${cat.label}</span>`;
}

function getGenderBadge(patient) {
    if (!patient) return '';
    let gender = patient.gender;
    if (!gender) {
        const name = patient.name.toLowerCase().trim();
        gender = name.endsWith('a') ? 'feminino' : 'masculino';
    }
    const isMale = gender === 'masculino';
    const color = isMale ? '#3498db' : '#ff6b81';
    const icon = isMale ? 'fa-mars' : 'fa-venus';
    return `<i class="fas ${icon} gender-icon" style="color: ${color};" title="${isMale ? 'Homem' : 'Mulher'}"></i>`;
}

function formatPhone(value) {
    let digits = value.replace(/\D/g, '');
    if (digits.length > 11) digits = digits.slice(0, 11);

    if (digits.length <= 2) {
        return digits.length ? '(' + digits : '';
    } else if (digits.length <= 6) {
        return '(' + digits.slice(0, 2) + ') ' + digits.slice(2);
    } else if (digits.length === 11) {
        return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 3) + ' ' + digits.slice(3, 7) + '-' + digits.slice(7);
    }
    return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 6) + '-' + digits.slice(6);
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return `${d.getDate()}/${d.getMonth() + 1}`;
}

function formatDateISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getWeekRange(anchor = new Date()) {
    const start = new Date(anchor);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay());

    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    return {
        start,
        end,
        startStr: formatDateISO(start),
        endStr: formatDateISO(end),
    };
}

const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function calculateEndTime(start) {
    const [h, m] = start.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m + 50);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatCurrencyInput(value) {
    let v = value.replace(/\D/g, '');
    v = (v / 100).toFixed(2) + '';
    v = v.replace('.', ',');
    v = v.replace(/(\d)(\d{3})(\d{3}),/g, '$1.$2.$3,');
    v = v.replace(/(\d)(\d{3}),/g, '$1.$2,');
    return 'R$ ' + v;
}

function updateAgePreview(age) {
    const preview = document.getElementById('age-category-preview');
    if (!preview) return;

    const cat = getAgeCategory(age ? parseInt(age) : null);
    if (cat) {
        preview.textContent = `(${cat.label})`;
        preview.className = 'age-preview ' + cat.class;
    } else {
        preview.textContent = '';
        preview.className = 'age-preview';
    }
}
