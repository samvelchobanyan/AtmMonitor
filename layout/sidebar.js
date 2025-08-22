import { DynamicElement } from "../core/dynamic-element.js";

class SideBar extends DynamicElement {
    constructor() {
        super();
        this.currentRoute = '/home';
        this.state = { 
            isExpanded: false
        };
    }

    onConnected() {
        // Set initial route
        this.currentRoute = window.location.pathname.replace('/ATM_monitor', '') || '/home';
        
        // Check if sidebar is already expanded (from CSS)
        this.state.isExpanded = this.classList.contains('active');
        
        // Set initial active state
        this.updateActiveState();
    }

    addGlobalEventListeners() {
        // Listen for route changes using the proper DynamicElement pattern
        this.addListener(document, 'route-changed', (event) => {
            console.log('Sidebar: Route changed to:', event.detail.route);
            this.currentRoute = event.detail.route;
            this.updateActiveState();
        });
    }

    addEventListeners() {
        // Sidebar toggle button
        const toggleBtn = this.$('.sidebar-toggle');
        if (toggleBtn) {
            this.addListener(toggleBtn, 'click', this.handleToggle.bind(this));
        }

        // Dropdown sections
        const dropdownItems = this.$$('.sidebar__item-has-dropdown');
        dropdownItems.forEach(item => {
            this.addListener(item, 'click', this.handleDropdownClick.bind(this));
        });

        // Click outside to close dropdowns
        this.addListener(document, 'click', this.handleOutsideClick.bind(this));
    }

    handleToggle() {
        // Toggle icon classes first (matching jQuery order)
        const icon = this.$('.sidebar-toggle .icon');
        if (icon) {
            icon.classList.toggle('icon-chevrons-right');
            icon.classList.toggle('icon-chevrons-left');
        }

        // Toggle sidebar active class
        this.classList.toggle('active');

        // Toggle active class for the sidebar element inside the template
        const sidebarEl = this.querySelector('.sidebar');
        if (sidebarEl) {
            sidebarEl.classList.toggle('active');
        }

        // Toggle active class for all main-container elements
        const mainContainers = document.querySelectorAll('.main-container');
        mainContainers.forEach(container => {
            container.classList.toggle('active');
        });

        // Handle dropdown visibility based on sidebar state (matching jQuery logic)
        if (this.classList.contains('active')) {
            // When sidebar becomes expanded: close all dropdown sections and hide dropdowns instantly
            this.$$('.sidebar__section').forEach(section => {
                section.classList.remove('active');
            });
            this.$$('.sidebar__dropdown').forEach(dropdown => {
                dropdown.style.display = 'none'; // jQuery .hide()
            });
        } else {
            // When sidebar becomes collapsed: show all dropdowns (tooltip mode)
            this.$$('.sidebar__dropdown').forEach(dropdown => {
                dropdown.style.display = 'block'; // jQuery .show()
            });
        }

        // Update internal state to match CSS class
        this.state.isExpanded = this.classList.contains('active');
    }

    handleDropdownClick(event) {
        const section = event.currentTarget.closest('.sidebar__section');
        if (!section) return;

        section.classList.toggle('active');
        const dropdown = event.currentTarget.nextElementSibling;
        if (!dropdown || !dropdown.classList.contains('sidebar__dropdown')) return;

        if (this.classList.contains('active')) {
            // Sidebar expanded: use slide animation
            this.slideToggle(dropdown, 300);
        } else {
            // Sidebar collapsed: toggle dropdown visibility directly
            if (section.classList.contains('active')) {
                dropdown.style.display = 'block';
            } else {
                dropdown.style.display = 'none';
            }
        }
    }

    // Helper method to replicate jQuery's slideToggle functionality  
    slideToggle(element, duration = 300) {
        if (element.style.display === 'none' || !element.style.display) {
            this.slideDown(element, duration);
        } else {
            this.slideUp(element, duration);
        }
    }

    slideDown(element, duration = 300) {
        element.style.display = 'block';
        element.style.height = '0';
        element.style.overflow = 'hidden';
        element.style.transition = `height ${duration}ms ease`;
        
        setTimeout(() => {
            element.style.height = element.scrollHeight + 'px';
        }, 10);
        
        setTimeout(() => {
            element.style.height = '';
            element.style.overflow = '';
            element.style.transition = '';
        }, duration);
    }

    slideUp(element, duration = 300) {
        element.style.height = element.scrollHeight + 'px';
        element.style.overflow = 'hidden';
        element.style.transition = `height ${duration}ms ease`;
        
        setTimeout(() => {
            element.style.height = '0';
        }, 10);
        
        setTimeout(() => {
            element.style.display = 'none';
            element.style.height = '';
            element.style.overflow = '';
            element.style.transition = '';
        }, duration);
    }

    handleOutsideClick(event) {
        // If clicking outside dropdown triggers
        if (!event.target.closest('.sidebar__item-has-dropdown')) {
            // Only close dropdowns if sidebar is collapsed (not expanded)
            if (!this.classList.contains('active')) {
                // Find the currently active section and close it (same way as toggle)
                const activeSection = this.$('.sidebar__section.active');
                if (activeSection) {
                    activeSection.classList.remove('active');
                }
            }
        }
    }

    updateActiveState() {
        console.log('Sidebar: Updating active state for route:', this.currentRoute);
        
        // Remove all active classes
        const allItems = this.querySelectorAll('.sidebar__item, .sidebar__dropdown a');
        allItems.forEach(item => item.classList.remove('active'));

        // Add active class based on current route
        switch (this.currentRoute) {
            case '/home':
                const homeItem = this.querySelector('a[href="./home"]');
                if (homeItem) {
                    homeItem.classList.add('active');
                    console.log('Sidebar: Activated home item');
                }
                break;
            case '/inout':
                const inoutItem = this.querySelector('a[href="inout"]');
                if (inoutItem) {
                    inoutItem.classList.add('active');
                    console.log('Sidebar: Activated inout item');
                }
                break;
            case '/geo':
                const geoItem = this.querySelector('a[href="geo"]');
                if (geoItem) {
                    geoItem.classList.add('active');
                    console.log('Sidebar: Activated geo item');
                }
                break;
            case '/cumulative':
                const cumulativeItem = this.querySelector('a[href="cumulative"]');
                if (cumulativeItem) {
                    cumulativeItem.classList.add('active');
                    console.log('Sidebar: Activated cumulative item');
                }
                break;
            case '/atms':
                const atmsItem = this.querySelector('a[href="atms"]');
                if (atmsItem) {
                    atmsItem.classList.add('active');
                    console.log('Sidebar: Activated atms item');
                }
                break;
            case '/failures':
                const failuresItem = this.querySelector('a[href="failures"]');
                const journalItemcheck = this.querySelector('a[href="journal"]');
                console.log('failuresItem - check journalItem', journalItemcheck);
                if (failuresItem) {
                    failuresItem.classList.add('active');
                    console.log('Sidebar: Activated failures item',failuresItem);
                }
                break;
            case '/journal':
                const journalItem = this.querySelector('a[href="journal"]');
                const failuresItemcheck = this.querySelector('a[href="failures"]');
                console.log('journalItem - check failuresItem', failuresItemcheck);
                
                if (journalItem) {
                    journalItem.classList.add('active');
                    console.log('Sidebar: Activated journal item',journalItem);
                }
                break;
        }
    }

    template() {
        return /* html */ `
            <aside class="sidebar">
                <div class="sidebar__toggle sidebar-toggle"><i class="icon icon-chevrons-right"></i></div>
                <div class="sidebar__top">
                    <div class="sidebar__logo">
                        <img src="assets/img/logo-sm.svg" alt="" />
                        <img src="assets/img/logo.png" alt="" />
                    </div>
                    <div class="notification">
                        <i class="icon icon-bell"></i>
                        <div class="notification__count">10</div>
                    </div>
                </div>
                <div class="sidebar__nav">
                    <a href="./home" class="sidebar__item"> <i class="icon icon-grid"></i><span>Ակնարկ</span> </a>
                    <div class="sidebar__section">
                        <div class="sidebar__item sidebar__item-has-dropdown">
                            <i class="icon icon-activity"></i><span>Անալիտիկա</span>
                            <div class="sidebar__item-toggle">
                                <i class="icon icon-chevron-down"></i>
                            </div>
                        </div>
                        <div class="sidebar__dropdown">
                            <a href="inout">Մուտք / Ելք</a>
                            <a href="geo" id="geo">Աշխարհագրական</a>
                            <a href="cumulative" id="cumulative">Կումուլատիվ</a>
                            <a href="incassate" id="incassate" >Ինկասացիա</a>
                        </div>
                    </div>
                    <a href="atms" class="sidebar__item"> <i class="icon icon-box"></i><span>Բանկոմատներ</span> </a>
                    <a href="failures" class="sidebar__item"> <i class="icon icon-x-octagon"></i><span>Անսարքություններ</span> </a>
                    <a href="journal" class="sidebar__item"> <i class="icon icon-clipboard"></i><span>Մատյան</span> </a>
                </div>
            </aside>
        `;
    }
}

customElements.define("side-bar", SideBar);
