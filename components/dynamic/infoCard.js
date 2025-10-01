import { DynamicElement } from "../../core/dynamic-element.js";
import { api } from "../../core/api-client.js";
import "./list-view.js";

const observedAttrs = ["value"];
class InfoCard extends DynamicElement {
    static get properties() {
        return [
            "title",
            "value",
            "value-currency",
            "value-color",
            "icon",
            "button-text",
            "trend",
            "stat-class",
            "message",
            "highlight",
            "border",
            "duration",
            "data-endpoint",
        ];
    }
    static get observedAttributes() {
        return observedAttrs;
    }

    onConnected() {
        this.state = { isLoading: false, error: false, modalContent: "" };
    }

    addEventListeners() {
        const messageEl = this.$(".info__message");
        if (messageEl) {
            this.addListener(messageEl, "click", this.handleMessageClick);
        }

        const linkButton = this.$(".btn_link");
        if (linkButton) {
            this.addListener(linkButton, "click", this.handleLinkClick);
        }
    }

    // _openMessagesPopup(messages) {
    //     const modal = document.createElement("modal-popup");
    //     document.body.appendChild(modal);
    //     modal.setContent(`
    //     <div class="modal__header">
    //         <div class="modal__title">Մեկնաբանություններ</div>
    //         <img class="modal__close"   src="assets/img/icons/x-circle.svg" alt="" />
    //     </div>
    //     <div class="modal__body">
    //         <div class="modal__messages">
    //             ${
    //                 messages.length
    //                     ? messages
    //                           .map((msg) => {
    //                               const dt = new Date(msg.date_time);
    //                               const formattedDate = dt.toLocaleDateString("en-GB", {
    //                                   day: "2-digit",
    //                                   month: "long",
    //                               });
    //                               const formattedTime = dt.toLocaleTimeString("en-GB", {
    //                                   hour: "2-digit",
    //                                   minute: "2-digit",
    //                               });
    //                               return `
    //                             <div class="modal__message">
    //                                 <div class="modal__message-meta">${formattedDate} | ${formattedTime}</div>
    //                                 <div class="modal__message-text">${msg.comment}</div>
    //                             </div>`;
    //                           })
    //                           .join("")
    //                     : `<div class="modal__message-empty">Մեկնաբանություններ չկան</div>`
    //             }
    //             </div>
    //   </div>

    // `);
    _openMessagesPopup(messages) {
        const modal = document.createElement("modal-popup");
        document.body.appendChild(modal);
        modal.setContent(`
        <div class="modal__header">
            <div class="modal__title">Մեկնաբանություններ</div>
            <img class="modal__close"   src="assets/img/icons/x-circle.svg" alt="" />
        </div>
        <div class="modal__body">
                <list-view
                    items='${messages}'
                >
                    <template>
                         <div class="modal__message">
                                    <div class="modal__message-meta">{{date_time}}</div>
                                <div class="modal__message-text">{{text}}</div>
                               </div>
                    </template>
                </list-view>
      </div>
    
   
    `);

        // Add close button listener
        const closeBtn = modal.querySelector(".modal__close");
        closeBtn?.addEventListener("click", () => modal.remove());
    }

    _openDataPopup(messages) {
        const modal = document.createElement("modal-popup");
        document.body.appendChild(modal);

        modal.setContent(`
        <div class="modal__header">
            <div class="modal__title">Առգրավված քարտեր</div>
            <img class="modal__close"   src="assets/img/icons/x-circle.svg" alt="" />
        </div>
        <div class="modal__body">

           <list-view items='${JSON.stringify(messages)}'>
                <template>
                    <div class="modal__message">
                        <div class="modal__message-meta">{{date_time}}</div>
                        <div class="modal__message-meta">Atm Id: {{atm_id}}</div>
                        <div class="modal__message-text">Card number: {{card_number}}</div>
                    </div>
                </template>
            </list-view>
            
      </div>
    
   
    `);

        // Add close button listener
        const closeBtn = modal.querySelector(".modal__close");
        closeBtn?.addEventListener("click", () => modal.remove());
    }

    async handleMessageClick() {
        let comments = this.getAttribute("messages-data");

        // const fakeMessages = [
        //     {
        //         id: 1,
        //         comment: "Բարև, խնդրում եմ նորացնել տեղեկատվությունը:",
        //         date_time: "2025-07-23 10:45",
        //         user_id: 12,
        //     },
        //     {
        //         id: 2,
        //         comment: "Նկարներն արդեն վերաբերցվել են:",
        //         date_time: "2025-07-23 11:10",
        //         user_id: 15,
        //     },
        //     {
        //         id: 3,
        //         comment: "Հնարավոր է՞ ավելացնել մեկ տարբերակ:",
        //         date_time: "2025-07-24 09:00",
        //         user_id: 12,
        //     },
        //     {
        //         id: 4,
        //         comment: "Շնորհակալ եմ արձագանքի համար։",
        //         date_time: "2025-07-24 12:30",
        //         user_id: 18,
        //     },
        //     {
        //         id: 2,
        //         comment: "Նկարներն արդեն վերաբերցվել են:",
        //         date_time: "2025-07-23 11:10",
        //         user_id: 15,
        //     },
        //     {
        //         id: 3,
        //         comment: "Հնարավոր է՞ ավելացնել մեկ տարբերակ:",
        //         date_time: "2025-07-24 09:00",
        //         user_id: 12,
        //     },
        //     {
        //         id: 4,
        //         comment: "Շնորհակալ եմ արձագանքի համար։",
        //         date_time: "2025-07-24 12:30",
        //         user_id: 18,
        //     },
        // ];
        // this._openMessagesPopup(fakeMessages);
        this._openMessagesPopup(comments);
    }

    async handleLinkClick() {
        const endpoint = this.getAttribute("data-endpoint");
        if (!endpoint) return;

        this.setState({ isLoading: true });
        try {
            const response = await this.fetchData(endpoint);
            this._openDataPopup(response.data);
        } catch (err) {
            console.error("Failed to fetch messages:", err);
        } finally {
            this.setState({ isLoading: false });
        }
    }

    onAttributeChange(name, oldValue, newValue) {
        if (name === "value" && oldValue !== newValue) {
            this.updateValue(newValue);
        }
    }

    updateValue(newValue) {
        const valueEl = this.querySelector(".info__text");
        if (valueEl) {
            const formattedValue = isNaN(newValue) ? newValue : Number(newValue).toLocaleString();
            const valueCurrency = this.getAttr("value-currency");
            valueEl.innerHTML = `${formattedValue}${
                valueCurrency ? `<span>${valueCurrency}</span>` : ""
            }`;
        }
    }

    template() {
        const title = this.getAttr("title");
        const value = this.getAttr("value");
        const formattedValue = isNaN(value) ? value : Number(value).toLocaleString();
        const valueCurrency = this.getAttr("value-currency");
        const valueColor = this.getAttr("value-color");
        const icon = this.getAttr("icon");
        const buttonText = this.getAttr("button-text");
        const trend = this.getAttr("trend");
        const statClass = this.getAttr("stat-class");
        const message = this.getAttr("message");
        const duration = this.getAttr("duration");
        const isHighlighted = this.hasAttribute("highlight");
        const hasBorder = this.getAttribute("show-border") === "true";

        this.classList.add("info");
        if (isHighlighted) this.classList.add("info_highlighted");
        if (hasBorder) this.classList.add("info_border");

        return `
      <div class="info__top">
        <div class="info__title">${title}</div>
        ${icon ? `<div class="info__icon"><i class="${icon}"></i></div>` : ""}
      </div>
      <div class="info__bottom">
        <div class="info__text ${valueColor}">${formattedValue}${
            valueCurrency ? `<span>${valueCurrency}</span>` : ""
        }</div>
        ${trend ? `<change-indicator value="${trend}"></change-indicator>` : ""}
        ${
            buttonText
                ? `<div class="btn btn_link"><span>${buttonText}</span> <i class="icon icon-chevron-right"></i></div>`
                : ""
        }
        ${duration ? `<div class="info__duration">${duration}</div>` : ""}
        ${
            message
                ? `<div class="info__message message"><i class="icon icon-message"></i><span>${message}</span></div>`
                : ""
        }
      </div>
    `;
    }
}

customElements.define("info-card", InfoCard);
