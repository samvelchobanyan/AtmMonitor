import { StaticElement } from "../core/static-element.js";

class SideBar extends StaticElement {
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
                    <a href="./" class="sidebar__item active"> <i class="icon icon-grid"></i><span>Ակնարկ</span> </a>
                    <div class="sidebar__section">
                        <div class="sidebar__item sidebar__item-has-dropdown">
                            <i class="icon icon-activity"></i><span>Անալիտիկա</span>
                            <div class="sidebar__item-toggle">
                                <i class="icon icon-chevron-down"></i>
                            </div>
                        </div>
                        <div class="sidebar__dropdown">
                            <a href="inout" class="active">Մուտք / Ելք</a>
                            <a href="geo" id="geo">Աշխարհագրական</a>
                            <a href="">Կումուլատիվ</a>
                            <a href="">Ինկասացիա</a>
                        </div>
                    </div>
                    <a href="geo" class="sidebar__item"> <i class="icon icon-box"></i><span>Բանկոմատներ</span> </a>
                    <a href="failures" class="sidebar__item"> <i class="icon icon-x-octagon"></i><span>Անսարքություններ</span> </a>
                    <a href="journal" class="sidebar__item"> <i class="icon icon-clipboard"></i><span>Մատյան</span> </a>
                </div>
            </aside>
        `;
    }
}

customElements.define("side-bar", SideBar);
