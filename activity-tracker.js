class ActivityTracker {
    constructor() {
        this.storageKey = 'activity-tracker-data';
        this.data = this.loadOrCreateSession();
        this.startTime = Date.now();

        this.renderWidget();
        this.recordPageView();
        this.attachEventListeners();
        this.updateUI();
    }

    loadOrCreateSession() {
        const existing = localStorage.getItem(this.storageKey);

        if (existing) {
            return JSON.parse(existing);
        }

        const newSession = {
            sessionId: this.generateSessionId(),
            startedAt: Date.now(),
            events: []
        };

        localStorage.setItem(this.storageKey, JSON.stringify(newSession));
        return newSession;
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    }

    persist() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }

    recordEvent(type, details = {}) {
        const event = {
            type,
            ...details,
            time: Date.now()
        };

        this.data.events.push(event);
        this.persist();
        this.updateUI();
    }

    recordPageView() {
        this.recordEvent('pageview', {
            page: window.location.pathname.split('/').pop() || 'home'
        });
    }

    attachEventListeners() {

        document.addEventListener('click', (e) => {

            const target = e.target.closest('a, button');

            if (target && !target.classList.contains('delete-event')) {
                this.recordEvent('click', {
                    element: target.tagName,
                    text: target.textContent.trim().slice(0, 50)
                });
            }

            if (e.target.id === 'tracker-toggle') {
                document.getElementById('tracker-body').classList.toggle('hidden');
            }

            if (e.target.id === 'tracker-close') {
                document.getElementById('tracker-body').classList.add('hidden');
            }

            if (e.target.id === 'clear-events') {
                this.clearEvents();
            }

            if (e.target.classList.contains('delete-event')) {
                const index = e.target.dataset.index;
                this.deleteEvent(index);
            }

        }, true);

        document.addEventListener('submit', (e) => {
            this.recordEvent('form_submit', {
                formId: e.target.id || 'unknown'
            });
        }, true);
    }

    deleteEvent(index) {
        this.data.events.splice(index, 1);
        this.persist();
        this.updateUI();
    }

    clearEvents() {
        this.data.events = [];
        this.persist();
        this.updateUI();
    }

    getStats() {
        const stats = {
            pageviews: 0,
            clicks: 0,
            forms: 0,
            duration: Date.now() - this.data.startedAt
        };

        this.data.events.forEach(e => {
            if (e.type === 'pageview') stats.pageviews++;
            if (e.type === 'click') stats.clicks++;
            if (e.type === 'form_submit') stats.forms++;
        });

        return stats;
    }

    renderWidget() {

        if (document.getElementById('activity-tracker-widget')) return;

        const widget = document.createElement('div');
        widget.id = 'activity-tracker-widget';

        widget.innerHTML = `
            <div id="tracker-header">
                <span>Activity Tracker</span>
                <div>
                    <button id="tracker-toggle">Toggle</button>
                    <button id="tracker-close">Close</button>
                </div>
            </div>

            <div id="tracker-body">
                <div id="tracker-stats"></div>

                <button id="clear-events">Clear Activities</button>

                <ul id="tracker-timeline"></ul>
            </div>
        `;

        document.body.appendChild(widget);
    }

    updateUI() {
        this.updateStats();
        this.updateTimeline();
    }

    updateStats() {

        const stats = this.getStats();
        const container = document.getElementById('tracker-stats');

        container.innerHTML = `
            <p><strong>Session:</strong> ${this.data.sessionId}</p>
            <p>Page Views: ${stats.pageviews}</p>
            <p>Clicks: ${stats.clicks}</p>
            <p>Forms: ${stats.forms}</p>
            <p>Duration: ${Math.floor(stats.duration / 1000)}s</p>
        `;
    }

    updateTimeline() {

        const timeline = document.getElementById('tracker-timeline');
        timeline.innerHTML = '';

        this.data.events.slice().reverse().forEach((event, index) => {

            const li = document.createElement('li');

            const time = new Date(event.time).toLocaleTimeString();

            li.innerHTML = `
                <span>
                [${time}] ${event.type.toUpperCase()} 
                ${event.page || event.element || event.formId || ''}
                </span>

                <button class="delete-event" data-index="${this.data.events.length - 1 - index}">
                    
                </button>
            `;

            timeline.appendChild(li);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ActivityTracker();
});