function renderReports() {
    const finishedApps = appointments.filter(a => a.status === 'finished');

    const totalRevenue = finishedApps.reduce((acc, app) => acc + (app.value || 0), 0);
    document.getElementById('total-revenue').textContent = formatCurrency(totalRevenue);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthlyApps = finishedApps.filter(app => {
        const appDate = new Date(app.date + 'T00:00:00');
        return appDate.getMonth() === currentMonth && appDate.getFullYear() === currentYear;
    });
    const monthlyRevenue = monthlyApps.reduce((acc, app) => acc + (app.value || 0), 0);
    document.getElementById('monthly-revenue').textContent = formatCurrency(monthlyRevenue);

    const avgValue = finishedApps.length ? totalRevenue / finishedApps.length : 0;
    document.getElementById('average-value').textContent = formatCurrency(avgValue);

    const revenueByCategory = {};
    const atendsByCategory = {};

    Object.keys(serviceCategories).forEach(cat => {
        revenueByCategory[cat] = 0;
        atendsByCategory[cat] = 0;
    });

    const revenueByPayment = { dinheiro: 0, pix: 0, cartao: 0 };
    const atendsByPayment = { dinheiro: 0, pix: 0, cartao: 0 };

    finishedApps.forEach(app => {
        if (app.category && Object.prototype.hasOwnProperty.call(revenueByCategory, app.category)) {
            revenueByCategory[app.category] += (app.value || 0);
            atendsByCategory[app.category]++;
        }

        if (app.payment === 'dinheiro') {
            revenueByPayment.dinheiro += (app.value || 0);
            atendsByPayment.dinheiro++;
        } else if (app.payment === 'pix') {
            revenueByPayment.pix += (app.value || 0);
            atendsByPayment.pix++;
        } else if (app.payment === 'credito' || app.payment === 'debito') {
            revenueByPayment.cartao += (app.value || 0);
            atendsByPayment.cartao++;
        }
    });

    document.getElementById('revenue-by-category').innerHTML = Object.entries(serviceCategories).map(([key, label]) => `
        <div class="report-row">
            <span class="report-row__label">${label}</span>
            <span class="report-row__value report-row__value--success">${formatCurrency(revenueByCategory[key])}</span>
        </div>
    `).join('');

    const paymentLabels = {
        dinheiro: 'Dinheiro',
        pix: 'Pix',
        cartao: 'Cartão (C/D)'
    };

    document.getElementById('revenue-by-payment').innerHTML = Object.entries(paymentLabels).map(([key, label]) => `
        <div class="report-row">
            <div class="report-row__group">
                <span class="report-row__label">${label}</span>
                <small class="report-row__meta">${atendsByPayment[key]} pessoas</small>
            </div>
            <span class="report-row__value report-row__value--success">${formatCurrency(revenueByPayment[key])}</span>
        </div>
    `).join('');

    document.getElementById('atends-by-category').innerHTML = Object.entries(serviceCategories).map(([key, label]) => `
        <div class="report-row">
            <span class="report-row__label">${label}</span>
            <span class="report-row__value report-row__value--primary">${atendsByCategory[key]} atendimentos</span>
        </div>
    `).join('');
}
