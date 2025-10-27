import { DynamicElement } from "../core/dynamic-element.js";
import { api } from "../core/api-client.js";
import "../components/dynamic/select-box-search.js";
import encode from "../assets/js/utils/encode.js";
import "../components/dynamic/yandex-address.js";
import "../components/ui/customCheck.js";
import "../components/ui/selectBox.js";
import { store } from "../core/store/store.js";

class SegmentsPage extends DynamicElement {
    constructor() {
        super();
        this.state = { segments: null };
    }

    onStoreChange(storeState) {
        this.setState({
            segments: storeState.segments.map((item) => ({
                value: item.id,
                text: item.name,
            })),
        });
    }

    addEventListeners() {
        const addBtn = this.$(".add-segment-btn");
        if (addBtn)
            addBtn.addEventListener("click", () => {
                this.openCreatePopup();
            });

        if (!this._editListenerAttached) {
            this.addEventListener("click", (e) => {
                const editBtn = e.target.closest(".edit-segment-btn");
                if (editBtn) {
                    const id = editBtn.dataset.id;
                    const name = editBtn.dataset.name;
                    this.openEditPopup({ id, name });
                }
            });
            this._editListenerAttached = true;
        }
    }

    openCreatePopup() {
        const modal = document.createElement("modal-popup");
        document.body.appendChild(modal);

        modal.renderModal({
            title: "Ստեղծել սեգմենտ",
            bodyContent: `
               <div class="form__item column sm-12">
                    <label for="name">Անուն</label>
                    <input id="name" class="w-100" name="name" type="text" required />
                </div>
            `,
            footerContent: `<button type="submit" class="btn btn_fit btn_blue btn_md" id='add-segment-btn' disabled>Հաստատել</button>`,
        });

        const nameInput = modal.querySelector("#name");
        nameInput?.addEventListener("input", () => {
            const hasValue = nameInput.value.trim().length > 0;
            submitBtn.disabled = !hasValue;
        });
        // Add submit button listener
        const submitBtn = modal.querySelector("#add-segment-btn");
        submitBtn?.addEventListener("click", async () => {
            const segmentName = nameInput?.value.trim();
            if (!segmentName) return;
            submitBtn.disabled = true;
            try {
                await api.post(`/atm/add-segment?name=${segmentName}`);
                const responseSegments = await api.get("/atm/segments");

                store.setState({
                    segments: responseSegments.data,
                });

                modal.remove();
            } catch (err) {
                console.error("Failed to create segment:", err);
                submitBtn.disabled = false;
            }
        });
    }

    openEditPopup(segment) {
        const modal = document.createElement("modal-popup");
        document.body.appendChild(modal);

        modal.renderModal({
            title: "Խմբագրել սեգմենտտ",
            bodyContent: `
               <div class="form__item column sm-12">
                    <label for="edit-name">Անուն</label>
                    <input id="edit-name" class="w-100" name="name" type="text" value="${segment.name}" required />
                </div> 
            `,
            footerContent: `<button class="btn btn_fit btn_blue btn_md" id='save-edit-btn' data-id="${segment.id}">Պահպանել</button>`,
        });
        const saveBtn = modal.querySelector("#save-edit-btn");
        saveBtn?.addEventListener("click", async () => {
            const newName = modal.querySelector("#edit-name")?.value.trim();
            if (!newName || newName === segment.name) {
                modal.remove();
                return;
            }
            try {
                await api.post("/atm/edit-segment", { id: Number(segment.id), name: newName });

                const responseSegments = await api.get("/atm/segments");

                store.setState({
                    segments: responseSegments.data,
                });
                modal.remove();
            } catch (err) {
                console.error("Failed to update segment:", err);
            }
        });
    }

    template() {
        if (this.segments?.length == 0) {
            return /*html*/ `
            <div class="row">
                <div class="column sm-12">
                    <div class="loading">
                        <div class="loading__spinner spinner"></div>
                        <div class="loading__text">Տվյալները բեռնվում են…</div>
                    </div>
                </div>
            </div>
            `;
        }

        return /* html */ `
        <div class="row">
            <div class="column">

                <div class="container">
                    <div class="segments-page">
                        <div class="segments-header">
                            <h2>Սեգմենտներ</h2>
                            <button class="btn btn_blue add-segment-btn">+ Ավելացնել</button>
                        </div>

                        <div class="segments-list">
                            ${this.state.segments
                                .map(
                                    (seg) => `
                                    <div class="segment-card">
                                        <div class="segment-name align-between">
                                            <p>${seg.text}</p>
                                            <img src='assets/img/icons/edit.png' 
                                            class="edit-segment-btn" 
                                            data-id="${seg.value}" 
                                            data-name="${seg.text}"/>
                                       </div>
                                        
                                       <div class="segment-id">ID: ${seg.value}</div>
                                    </div>
                                `
                                )
                                .join("")}
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
        `;
    }
}

customElements.define("segments-page", SegmentsPage);
