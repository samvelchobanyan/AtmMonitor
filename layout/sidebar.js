import { StaticElement } from "../core/static-element.js";

class SideBar extends StaticElement {
    constructor() {
        super();
        this.currentRoute = '/home'; // Default route
        this.init();
    }

    init() {
        // Listen for route changes
        document.addEventListener('route-changed', (event) => {
            console.log('Sidebar: Route changed to:', event.detail.route);
            this.currentRoute = event.detail.route;
            this.updateActiveState();
        });

        // Set initial active state based on current URL
        this.currentRoute = window.location.pathname.replace('/ATM_monitor', '') || '/home';
        console.log('Sidebar: Initial route:', this.currentRoute);
        this.updateActiveState();
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
                if (failuresItem) {
                    failuresItem.classList.add('active');
                    console.log('Sidebar: Activated failures item');
                }
                break;
            case '/journal':
                const journalItem = this.querySelector('a[href="journal"]');
                if (journalItem) {
                    journalItem.classList.add('active');
                    console.log('Sidebar: Activated journal item');
                }
                break;
        }
    }

    render() {
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
                            <a href="">Ինկասացիա</a>
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
