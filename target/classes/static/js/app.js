// MEMÓRIA LOCAL
const defaultMembers = [
    { name: 'Davi', phone: '' },
    { name: 'Luana', phone: '' }
];

function loadStoredArray(key, fallback, isValidItem) {
    try {
        const stored = localStorage.getItem(key);
        if (stored === null) return fallback;

        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed) || !parsed.every(isValidItem)) {
            throw new TypeError(`O conteúdo de ${key} possui um formato inválido.`);
        }
        return parsed;
    } catch (error) {
        console.error(`Não foi possível carregar ${key} do armazenamento local.`, error);
        alert('Não foi possível carregar os dados salvos neste navegador. Os dados iniciais serão exibidos.');
        return fallback;
    }
}

let members = loadStoredArray(
    'mft_members',
    defaultMembers,
    member => member && typeof member.name === 'string' && typeof member.phone === 'string'
);
let checkins = loadStoredArray(
    'mft_checkins',
    [],
    item => item &&
        typeof item.user === 'string' &&
        typeof item.date === 'string' &&
        typeof item.time === 'string' &&
        typeof item.exercise === 'string' &&
        typeof item.details === 'string' &&
        typeof item.nutrition === 'string' &&
        Number.isFinite(Number(item.water))
);

document.addEventListener('DOMContentLoaded', () => {
    setDefaultDateTime();
    renderMembersOptions();
    renderMembersManageList();
    renderCheckins();
});

// GERENCIAMENTO DE ABAS
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

    if (tabName === 'checkin') {
        document.getElementById('btnTabCheckin').classList.add('active');
        document.getElementById('tabCheckin').classList.add('active');
    } else if (tabName === 'history') {
        document.getElementById('btnTabHistory').classList.add('active');
        document.getElementById('tabHistory').classList.add('active');
        renderCheckins();
    } else if (tabName === 'members') {
        document.getElementById('btnTabMembers').classList.add('active');
        document.getElementById('tabMembers').classList.add('active');
        renderMembersManageList();
    }
}

function setDefaultDateTime() {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    document.getElementById('checkDate').value = localDate.toISOString().split('T')[0];
    document.getElementById('checkTime').value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function saveData() {
    try {
        localStorage.setItem('mft_members', JSON.stringify(members));
        localStorage.setItem('mft_checkins', JSON.stringify(checkins));
    } catch (error) {
        console.error('Não foi possível salvar os dados no armazenamento local.', error);
        alert('Não foi possível salvar. Verifique o espaço disponível e as permissões do navegador.');
        throw error;
    }
}

// ABA 3: GERENCIAR INTEGRANTES (ADICIONAR/EDITAR/REMOVER)
function saveMember(e) {
    e.preventDefault();
    const name = document.getElementById('memberName').value.trim();
    const phone = document.getElementById('memberPhone').value.replace(/\D/g, '');
    const editIdx = Number.parseInt(document.getElementById('editMemberIndex').value, 10);

    if (!name) {
        alert('Informe o nome da pessoa.');
        return;
    }

    if (members.some((member, index) => index !== editIdx && member.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
        alert('Já existe uma pessoa cadastrada com esse nome.');
        return;
    }

    if (editIdx !== -1 && (!Number.isInteger(editIdx) || !members[editIdx])) {
        alert('Não foi possível localizar a pessoa que está sendo editada.');
        resetMemberForm();
        return;
    }

    if (editIdx === -1) {
        members.push({ name, phone });
    } else {
        const oldName = members[editIdx].name;
        members[editIdx] = { name, phone };
        // Atualiza registros vinculados se o nome mudou
        checkins.forEach(c => {
            if (c.user === oldName) c.user = name;
        });
    }

    saveData();
    resetMemberForm();
    renderMembersOptions();
    renderMembersManageList();
}

function editMember(index) {
    const m = members[index];
    if (!m) return;
    document.getElementById('memberName').value = m.name;
    document.getElementById('memberPhone').value = m.phone;
    document.getElementById('editMemberIndex').value = index;

    document.getElementById('memberFormTitle').innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Editar Pessoa';
    document.getElementById('btnSaveMember').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Atualizar Cadastro';
    document.getElementById('btnCancelMemberEdit').style.display = 'block';
}

function resetMemberForm() {
    document.getElementById('memberForm').reset();
    document.getElementById('editMemberIndex').value = '-1';
    document.getElementById('memberFormTitle').innerHTML = '<i class="fa-solid fa-user-plus"></i> Adicionar Nova Pessoa';
    document.getElementById('btnSaveMember').innerHTML = '<i class="fa-solid fa-plus"></i> Cadastrar Pessoa';
    document.getElementById('btnCancelMemberEdit').style.display = 'none';
}

function removeMember(index) {
    if (!members[index]) return;
    if (confirm(`Remover ${members[index].name}?`)) {
        members.splice(index, 1);
        saveData();
        renderMembersOptions();
        renderMembersManageList();
    }
}

function renderMembersOptions() {
    const userSelect = document.getElementById('userSelect');
    const filterUser = document.getElementById('filterUser');

    const currentFilter = filterUser.value;
    userSelect.replaceChildren();
    filterUser.replaceChildren(new Option('Mostrar Todos da Família', 'ALL'));

    members.forEach(m => {
        userSelect.add(new Option(m.name, m.name));
        filterUser.add(new Option(`Apenas ${m.name}`, m.name));
    });

    filterUser.value = members.some(member => member.name === currentFilter) ? currentFilter : 'ALL';
}

function renderMembersManageList() {
    const list = document.getElementById('membersManageList');
    list.replaceChildren();

    if (members.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.textContent = 'Nenhuma pessoa cadastrada.';
        list.appendChild(emptyState);
        return;
    }

    members.forEach((m, idx) => {
        const item = document.createElement('div');
        item.className = 'member-manage-item';
        const information = document.createElement('div');
        const name = document.createElement('strong');
        name.textContent = m.name;
        const phone = document.createElement('p');
        phone.style.cssText = 'font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;';
        phone.textContent = `WhatsApp: ${m.phone || 'Não informado'}`;
        information.append(name, phone);

        const actions = document.createElement('div');
        actions.style.cssText = 'display: flex; gap: 8px;';
        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'btn btn-edit';
        editButton.textContent = 'Editar';
        editButton.addEventListener('click', () => editMember(idx));
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'btn btn-danger';
        removeButton.textContent = 'Excluir';
        removeButton.addEventListener('click', () => removeMember(idx));
        actions.append(editButton, removeButton);
        item.append(information, actions);
        list.appendChild(item);
    });
}

// ABA 1 & 2: CHECK-IN & HISTÓRICO
function saveCheckin(e) {
    e.preventDefault();
    const editIdx = Number.parseInt(document.getElementById('editIndex').value, 10);
    const water = Number(document.getElementById('water').value);
    const data = {
        user: document.getElementById('userSelect').value,
        date: document.getElementById('checkDate').value,
        time: document.getElementById('checkTime').value,
        exercise: document.getElementById('exerciseType').value.trim(),
        details: document.getElementById('exerciseDetails').value,
        nutrition: document.getElementById('nutrition').value.trim(),
        water
    };

    if (!members.some(member => member.name === data.user)) {
        alert('Selecione uma pessoa cadastrada.');
        return;
    }
    if (!Number.isFinite(water) || water < 0) {
        alert('Informe um consumo de água válido, igual ou maior que zero.');
        return;
    }
    if (editIdx !== -1 && (!Number.isInteger(editIdx) || !checkins[editIdx])) {
        alert('Não foi possível localizar o check-in que está sendo editado.');
        resetCheckinForm();
        return;
    }

    if (editIdx === -1) {
        checkins.unshift(data);
    } else {
        checkins[editIdx] = data;
    }

    saveData();
    resetCheckinForm();
    switchTab('history');
}

function resetCheckinForm() {
    document.getElementById('checkinForm').reset();
    document.getElementById('editIndex').value = '-1';
    document.getElementById('formTitle').innerHTML = '<i class="fa-solid fa-calendar-check"></i> Registrar Check-in Diário';
    document.getElementById('btnSubmitForm').innerHTML = '<i class="fa-solid fa-check"></i> Salvar e Registrar Check-in';
    document.getElementById('editBanner').style.display = 'none';
    setDefaultDateTime();
}

function editCheckin(index) {
    const item = checkins[index];
    if (!item) return;
    document.getElementById('userSelect').value = item.user;
    document.getElementById('checkDate').value = item.date;
    document.getElementById('checkTime').value = item.time;
    document.getElementById('exerciseType').value = item.exercise;
    document.getElementById('exerciseDetails').value = item.details;
    document.getElementById('nutrition').value = item.nutrition;
    document.getElementById('water').value = item.water;

    document.getElementById('editIndex').value = index;
    document.getElementById('formTitle').innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Editar Check-in';
    document.getElementById('btnSubmitForm').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Atualizar Registro';
    document.getElementById('editBanner').style.display = 'flex';

    switchTab('checkin');
}

function deleteCheckin(index) {
    if (!checkins[index]) return;
    if (confirm('Excluir este registro?')) {
        checkins.splice(index, 1);
        saveData();
        renderCheckins();
    }
}

function sendWhatsApp(index) {
    const item = checkins[index];
    if (!item) return;
    const member = members.find(m => m.name === item.user);
    
    let phone = member ? member.phone : '';
    if (!phone) {
        phone = prompt(`WhatsApp de ${item.user} (DDD + Número):`, '');
        if (!phone) return;
        phone = phone.replace(/\D/g, '');
    }
    if (!/^(?:55)?\d{10,11}$/.test(phone)) {
        alert('Informe um número válido com DDD (10 ou 11 dígitos).');
        return;
    }
    const whatsappNumber = phone.startsWith('55') ? phone : `55${phone}`;

    const dateFormatted = formatDate(item.date);

    const msg = `🏃‍♂️ *CHECK-IN MARATONA - ${item.user.toUpperCase()}* 🏃‍♀️\n\n` +
                `📅 *Data:* ${dateFormatted} às ${item.time}\n` +
                `🏋️ *Treino:* ${item.exercise}\n` +
                `📝 *Relato:* ${item.details}\n` +
                `🥗 *Alimentação:* ${item.nutrition}\n` +
                `💧 *Água:* ${item.water} Litros\n\n` +
                `🚀 *Foco total na Maratona!*`;

    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
}

function formatDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value || 'Data não informada';
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
}

function appendDetail(container, label, value) {
    const box = document.createElement('div');
    box.className = 'detail-box';
    const title = document.createElement('span');
    title.textContent = label;
    const content = document.createElement('strong');
    content.textContent = value ?? '';
    box.append(title, content);
    container.appendChild(box);
}

function renderCheckins() {
    const listContainer = document.getElementById('checkinList');
    const filter = document.getElementById('filterUser').value;
    listContainer.replaceChildren();

    const filtered = checkins
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => filter === 'ALL' || item.user === filter);

    if (filtered.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.textContent = 'Nenhum registro encontrado.';
        listContainer.appendChild(emptyState);
        return;
    }

    filtered.forEach(({ item, index }) => {

        const card = document.createElement('div');
        card.className = 'checkin-item';
        const header = document.createElement('div');
        header.className = 'checkin-header';
        const badge = document.createElement('span');
        badge.className = 'user-badge';
        badge.textContent = item.user || 'Pessoa não informada';
        const date = document.createElement('span');
        date.style.cssText = 'font-size: 0.85rem; color: var(--text-muted);';
        date.textContent = `${formatDate(item.date)} às ${item.time || '--:--'}`;
        header.append(badge, date);

        const details = document.createElement('div');
        details.className = 'checkin-details';
        appendDetail(details, 'EXERCÍCIO', item.exercise);
        appendDetail(details, 'ALIMENTAÇÃO', item.nutrition);
        appendDetail(details, 'ÁGUA', `${item.water ?? ''} L`);

        const report = document.createElement('div');
        report.className = 'detail-box';
        const reportTitle = document.createElement('span');
        reportTitle.textContent = 'RELATO';
        const reportText = document.createElement('p');
        reportText.style.cssText = 'font-size: 0.9rem; margin-top: 2px;';
        reportText.textContent = item.details || '';
        report.append(reportTitle, reportText);

        const actions = document.createElement('div');
        actions.className = 'checkin-actions';
        [
            ['btn btn-whatsapp', 'Mandar no Whats', () => sendWhatsApp(index)],
            ['btn btn-edit', 'Editar', () => editCheckin(index)],
            ['btn btn-danger', 'Excluir', () => deleteCheckin(index)]
        ].forEach(([className, label, handler]) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = className;
            button.textContent = label;
            button.addEventListener('click', handler);
            actions.appendChild(button);
        });
        card.append(header, details, report, actions);
        listContainer.appendChild(card);
    });
}