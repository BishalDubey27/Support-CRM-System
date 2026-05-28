// Global Application State
let appState = {
    tickets: [],
    selectedTicket: null,
    activeFilter: 'all',
    searchQuery: '',
    selectedStatus: null // tracks chosen status in details drawer
};

// --- DOM Selectors ---
const DOM = {
    ticketsContainer: document.getElementById('tickets-container'),
    searchInput: document.getElementById('search-input'),
    filterPills: document.querySelectorAll('.filter-pill'),
    
    // Create Ticket Modal Selectors
    createModal: document.getElementById('create-modal'),
    btnOpenCreateModal: document.getElementById('btn-open-create-modal'),
    btnCloseCreateModal: document.getElementById('btn-close-create-modal'),
    btnCancelCreate: document.getElementById('btn-cancel-create'),
    createForm: document.getElementById('create-ticket-form'),
    
    // Details Drawer Selectors
    detailsDrawer: document.getElementById('details-drawer'),
    btnCloseDrawer: document.getElementById('btn-close-drawer'),
    drawerTicketId: document.getElementById('drawer-ticket-id'),
    drawerBadge: document.getElementById('drawer-badge'),
    drawerCustomerName: document.getElementById('drawer-customer-name'),
    drawerCustomerEmail: document.getElementById('drawer-customer-email'),
    drawerSubject: document.getElementById('drawer-subject'),
    drawerDescription: document.getElementById('drawer-description'),
    drawerNotesTimeline: document.getElementById('drawer-notes-timeline'),
    notesCount: document.getElementById('notes-count'),
    statusToggleBtns: document.querySelectorAll('[data-status-btn]'),
    noteInput: document.getElementById('note-input'),
    btnSaveChanges: document.getElementById('btn-save-changes'),
    
    // Statistics Counters
    statOpen: document.getElementById('stat-open'),
    statProgress: document.getElementById('stat-progress'),
    statClosed: document.getElementById('stat-closed'),
    
    // Toast Alert
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message')
};

// --- API Methods ---

/**
 * Fetches tickets lists from the backend with current active search and status filters.
 */
async function fetchTickets() {
    try {
        let url = '/api/tickets?';
        const params = new URLSearchParams();
        
        if (appState.activeFilter !== 'all') {
            params.append('status', appState.activeFilter);
        }
        if (appState.searchQuery.trim()) {
            params.append('search', appState.searchQuery.trim());
        }
        
        url += params.toString();
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network error fetching tickets');
        
        appState.tickets = await response.ok ? await response.json() : [];
        renderTicketsList();
        updateStatistics(); // runs independently, no need to await
    } catch (error) {
        console.error('Error fetching tickets:', error);
        showToast('Error connecting to support servers.');
    }
}

/**
 * Fetches comprehensive detail metrics for a single ticket by its ticket_id code.
 */
async function fetchTicketDetails(ticketId) {
    try {
        const response = await fetch(`/api/tickets/${ticketId}`);
        if (!response.ok) throw new Error('Error retrieving ticket details');
        
        appState.selectedTicket = await response.json();
        appState.selectedStatus = appState.selectedTicket.status;
        renderTicketDetails();
    } catch (error) {
        console.error('Error fetching details:', error);
        showToast('Could not fetch ticket details.');
    }
}

/**
 * Submits a new support ticket payload.
 */
async function submitTicket(payload) {
    try {
        const response = await fetch('/api/tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) throw new Error('Submission refused by server.');
        
        const receipt = await response.json();
        showToast(`Ticket successfully raised: ${receipt.ticket_id}`);
        
        // Hide Modal and refresh lists
        closeCreateModal();
        fetchTickets();
    } catch (error) {
        console.error('Submission failed:', error);
        showToast('Could not register ticket. Try again.');
    }
}

/**
 * Performs PUT request to update ticket states and/or append internal logs.
 */
async function submitTicketUpdate(ticketId, status, notes) {
    try {
        const response = await fetch(`/api/tickets/${ticketId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, notes })
        });
        
        if (!response.ok) throw new Error('Refused updating properties');
        
        showToast(`Ticket details updated.`);
        DOM.noteInput.value = ''; // clear input comment
        
        // Refresh detail view and list dashboard
        await fetchTicketDetails(ticketId);
        fetchTickets();
    } catch (error) {
        console.error('Update failed:', error);
        showToast('Failed to save update annotations.');
    }
}

// --- DOM Rendering Methods ---

/**
 * Renders support dashboard list view cards dynamically based on state array.
 */
function renderTicketsList() {
    if (appState.tickets.length === 0) {
        DOM.ticketsContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <div class="h-12 w-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                    <i data-lucide="inbox" class="h-6 w-6"></i>
                </div>
                <div>
                    <h3 class="text-xs font-semibold text-slate-300">No support tickets found</h3>
                    <p class="text-[10px] text-slate-500 mt-1">Try relaxing filters or check back later.</p>
                </div>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    DOM.ticketsContainer.innerHTML = appState.tickets.map((ticket, index) => {
        const date = new Date(ticket.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        // Determine status badges styling classes
        let statusClasses = '';
        if (ticket.status === 'Open') statusClasses = 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400';
        else if (ticket.status === 'In Progress') statusClasses = 'bg-amber-500/10 border border-amber-500/30 text-amber-400';
        else statusClasses = 'bg-slate-800 border border-slate-700 text-slate-400';

        const isSelected = appState.selectedTicket && appState.selectedTicket.ticket_id === ticket.ticket_id;
        const selectedClasses = isSelected ? 'ring-2 ring-indigo-500 border-transparent bg-slate-900' : 'bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700/60 border-slate-900/60';

        return `
            <div onclick="handleTicketCardClick('${ticket.ticket_id}')" class="ticket-card-anim p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${selectedClasses}" style="animation-delay: ${index * 40}ms">
                <div class="space-y-1.5 min-w-0">
                    <div class="flex items-center space-x-2.5">
                        <span class="text-xs font-bold text-indigo-400 tracking-wider">${ticket.ticket_id}</span>
                        <span class="px-2 py-0.5 rounded-full text-[9px] font-bold ${statusClasses}">${ticket.status}</span>
                        <span class="text-[10px] text-slate-500 font-medium">${date}</span>
                    </div>
                    <h4 class="text-xs font-bold text-slate-200 truncate">${ticket.subject}</h4>
                    <div class="flex items-center space-x-2 text-[10px] text-slate-400">
                        <i data-lucide="user" class="h-3 w-3 text-indigo-400/80"></i>
                        <span class="font-medium">${ticket.customer_name}</span>
                    </div>
                </div>
                <div class="flex items-center self-end md:self-center shrink-0">
                    <div class="h-8 w-8 rounded-lg bg-slate-950/60 flex items-center justify-center text-slate-400 border border-slate-800/40 hover:text-slate-200">
                        <i data-lucide="chevron-right" class="h-4 w-4"></i>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

/**
 * Fills detailed data logs into the drawer components upon selection.
 */
function renderTicketDetails() {
    const ticket = appState.selectedTicket;
    if (!ticket) return;

    DOM.drawerTicketId.textContent = ticket.ticket_id;
    DOM.drawerCustomerName.textContent = ticket.customer_name;
    DOM.drawerCustomerEmail.textContent = ticket.customer_email;
    DOM.drawerCustomerEmail.href = `mailto:${ticket.customer_email}`;
    DOM.drawerSubject.textContent = ticket.subject;
    DOM.drawerDescription.textContent = ticket.description;

    // Badge styling mapping
    let statusClasses = '';
    if (ticket.status === 'Open') statusClasses = 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400';
    else if (ticket.status === 'In Progress') statusClasses = 'bg-amber-500/10 border border-amber-500/20 text-amber-400';
    else statusClasses = 'bg-slate-800 border border-slate-700 text-slate-400';
    
    DOM.drawerBadge.textContent = ticket.status;
    DOM.drawerBadge.className = `px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusClasses}`;

    // Render operations buttons states
    DOM.statusToggleBtns.forEach(btn => {
        const btnStatus = btn.getAttribute('data-status-btn');
        if (btnStatus === appState.selectedStatus) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Render Notes lists
    DOM.notesCount.textContent = `${ticket.notes.length} Note${ticket.notes.length === 1 ? '' : 's'}`;
    
    if (ticket.notes.length === 0) {
        DOM.drawerNotesTimeline.innerHTML = `
            <div class="text-center py-6 border border-dashed border-slate-800 rounded-xl">
                <p class="text-[10px] text-slate-500">No agent comments recorded yet.</p>
            </div>
        `;
    } else {
        DOM.drawerNotesTimeline.innerHTML = ticket.notes.map(note => {
            const timeStr = new Date(note.created_at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
            const dateStr = new Date(note.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });

            return `
                <div class="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5 space-y-1.5">
                    <div class="flex items-center justify-between text-[9px] text-slate-500 font-semibold uppercase tracking-wider">
                        <span>Agent Entry</span>
                        <span>${dateStr} @ ${timeStr}</span>
                    </div>
                    <p class="text-xs text-slate-300 leading-normal whitespace-pre-wrap">${note.note_text}</p>
                </div>
            `;
        }).join('');
    }

    lucide.createIcons();
}

/**
 * Fetches ALL tickets (no filter) to compute accurate header statistics,
 * independent of whatever filter/search is currently active in the list view.
 */
async function updateStatistics() {
    try {
        const response = await fetch('/api/tickets');
        if (!response.ok) return;
        const allTickets = await response.json();

        let counts = { Open: 0, 'In Progress': 0, Closed: 0 };
        allTickets.forEach(t => {
            if (counts[t.status] !== undefined) counts[t.status]++;
        });

        DOM.statOpen.textContent = counts['Open'];
        DOM.statProgress.textContent = counts['In Progress'];
        DOM.statClosed.textContent = counts['Closed'];
    } catch (error) {
        console.error('Error updating statistics:', error);
    }
}

// --- Handler operations triggers ---

/**
 * Handle clicking a support ticket row. Sets drawer focus.
 */
function handleTicketCardClick(ticketId) {
    fetchTicketDetails(ticketId);
    openDrawer();
    
    // Re-render ticket lists to update highlighted background state
    setTimeout(renderTicketsList, 50);
}

// --- UI Animations and State Toggles ---

function openDrawer() {
    DOM.detailsDrawer.classList.remove('translate-x-full');
}

function closeDrawer() {
    DOM.detailsDrawer.classList.add('translate-x-full');
    appState.selectedTicket = null;
    appState.selectedStatus = null;
    renderTicketsList();
}

function openCreateModal() {
    DOM.createModal.classList.remove('opacity-0', 'pointer-events-none');
    DOM.createModal.firstElementChild.classList.remove('scale-95');
    DOM.createModal.firstElementChild.classList.add('scale-100');
}

function closeCreateModal() {
    DOM.createModal.classList.add('opacity-0', 'pointer-events-none');
    DOM.createModal.firstElementChild.classList.remove('scale-100');
    DOM.createModal.firstElementChild.classList.add('scale-95');
    DOM.createForm.reset();
}

/**
 * Shows temporary status notification popups
 */
function showToast(message) {
    DOM.toastMessage.textContent = message;
    DOM.toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
    DOM.toast.classList.add('translate-y-0', 'opacity-100');
    
    setTimeout(() => {
        DOM.toast.classList.remove('translate-y-0', 'opacity-100');
        DOM.toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
    }, 3500);
}

// --- Debounce algorithms definition ---

function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

// --- Register Event Listeners ---

// Create Ticket Trigger Button Listeners
DOM.btnOpenCreateModal.addEventListener('click', openCreateModal);
DOM.btnCloseCreateModal.addEventListener('click', closeCreateModal);
DOM.btnCancelCreate.addEventListener('click', closeCreateModal);

// Close slide-out Drawer panel
DOM.btnCloseDrawer.addEventListener('click', closeDrawer);

// Main Modal Form raise execution trigger
DOM.createForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const payload = {
        customer_name: document.getElementById('form-customer-name').value.trim(),
        customer_email: document.getElementById('form-customer-email').value.trim(),
        subject: document.getElementById('form-subject').value.trim(),
        description: document.getElementById('form-description').value.trim()
    };
    
    submitTicket(payload);
});

// Search inputs bound with debounced API querying
DOM.searchInput.addEventListener('input', debounce((e) => {
    appState.searchQuery = e.target.value;
    fetchTickets();
}, 250));

// Filter pills clicking triggers
DOM.filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
        DOM.filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        
        appState.activeFilter = pill.getAttribute('data-filter');
        fetchTickets();
    });
});

// Status selection toggle configuration inside side-out details panel
DOM.statusToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        appState.selectedStatus = btn.getAttribute('data-status-btn');
        
        // Instant visual update of selected status states
        DOM.statusToggleBtns.forEach(b => {
            if (b === btn) b.classList.add('active');
            else b.classList.remove('active');
        });
    });
});

// Note/Audit submissions saving operations
DOM.btnSaveChanges.addEventListener('click', () => {
    if (!appState.selectedTicket) return;
    
    const ticketId = appState.selectedTicket.ticket_id;
    const nextStatus = appState.selectedStatus;
    const newNote = DOM.noteInput.value.trim();
    
    if (!nextStatus && !newNote) {
        showToast('Specify a state transition or log comment.');
        return;
    }
    
    submitTicketUpdate(ticketId, nextStatus, newNote || null);
});

// Click outside closing modal window operations
window.addEventListener('click', (e) => {
    if (e.target === DOM.createModal) {
        closeCreateModal();
    }
});

// Initialize dashboard components instantly on page loading sequence
document.addEventListener('DOMContentLoaded', () => {
    fetchTickets();
});
