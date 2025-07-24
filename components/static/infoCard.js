// // components/static/info-card-new.js
// import { BaseElement } from "../../core/base-element.js";

// class InfoCard extends BaseElement {
//     static get properties() {
//         return ["title", "value", "value-currency", "value-color", "icon", "button-text", "trend", "stat-class", "message", "highlight", "border", "duration"];
//     }

//     render() {
//         const title = this.getAttribute("title") || "";
//         const value = this.getAttribute("value") || "";
//         const valueCurrency = this.getAttribute("value-currency");
//         const valueColor = this.getAttribute("value-color") || "";
//         const icon = this.getAttribute("icon") || "";
//         const buttonText = this.getAttribute("button-text");
//         const trend = this.getAttribute("trend");
//         const statClass = this.getAttribute("stat-class") || "";
//         const message = this.getAttribute("message");
//         const duration = this.getAttribute("duration");

//         const isHighlighted = this.hasAttribute("highlight");
//         const hasBorder = this.getAttribute("show-border") === "true";

//         this.classList.add("info", isHighlighted && "info_highlighted", hasBorder && "info_border");

//         this.innerHTML = `
//       <div class="info__top">
//         <div class="info__title">${title}</div>
//         ${icon ? `<div class="info__icon"><i class="${icon}"></i></div>` : ""}
//       </div>
//       <div class="info__bottom">
//         <div class="info__text ${valueColor}">${value}${valueCurrency ? `<span>${valueCurrency}</span>` : ""}</div>
//         ${trend ? `<change-indicator value="${trend}"></change-indicator>` : ""}
//         ${buttonText ? `<div class="btn btn_link"><span>${buttonText}</span> <i class="icon icon-chevron-right"></i></div>` : ""}
//         ${duration ? `<div class="info__duration">${duration}</div>` : ""}
//         ${message ? `<div class="info__message message"><i class="icon icon-message"></i><span>${message}</span></div>` : ""}
//       </div>
//     `;
//     }
// }

// customElements.define("info-card", InfoCard);

// components/dynamic/info-card-new.js
import { DynamicElement } from "../../core/dynamic-element.js";
import { api } from "../../core/api-client.js";

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
      "message-endpoint",
    ];
  }

  onConnected() {
    this.state = { isLoading: false, error: false, modalContent: "" };
  }

  addEventListeners() {
    const messageEl = this.$(".info__message");
    if (messageEl) {
      this.addListener(messageEl, "click", this.handleMessageClick);
    }
  }

  // todo change design of modal content, move to dynamic if needed
  _openMessagesPopup(messages) {
    const popup = document.createElement("modal-popup");
    popup.setAttribute("open", "");

    const content = document.createElement("div");
    content.setAttribute("slot", "content");

    content.innerHTML = `
    <div class="modal__title">Մեկնաբանություններ</div>
    <div class="modal__messages">
      ${
        messages.length
          ? messages
              .map(
                (msg) => `
        <div class="modal__message">
          <div class="modal__message-text">${msg.comment}</div>
          <div class="modal__message-meta">
            <span>${msg.date_time}</span> | <span>User ID: ${msg.user_id}</span>
          </div>
        </div>`
              )
              .join("")
          : `<div class="modal__message-empty">Մեկնաբանություններ չկան</div>`
      }
    </div>
    <div class="modal__buttons">
      <button class="ok btn btn_md btn_blue"><span>Փակել</span></button>
    </div>
  `;

    content.querySelector(".ok").addEventListener("click", () => popup.remove());
    popup.appendChild(content);
    document.body.appendChild(popup);
  }

  async handleMessageClick() {
    const endpoint = this.getAttribute("message-endpoint");
    if (!endpoint) return;

    this.setState({ isLoading: true });

    const fakeMessages = [
      {
        id: 1,
        comment: "Բարև, խնդրում եմ նորացնել տեղեկատվությունը:",
        date_time: "2025-07-23 10:45",
        user_id: 12,
      },
      {
        id: 2,
        comment: "Նկարներն արդեն վերաբերցվել են:",
        date_time: "2025-07-23 11:10",
        user_id: 15,
      },
      {
        id: 3,
        comment: "Հնարավոր է՞ ավելացնել մեկ տարբերակ:",
        date_time: "2025-07-24 09:00",
        user_id: 12,
      },
      {
        id: 4,
        comment: "Շնորհակալ եմ արձագանքի համար։",
        date_time: "2025-07-24 12:30",
        user_id: 18,
      },
    ];

    try {
      // fake to see it works, no data in api yet
      this._openMessagesPopup(fakeMessages);

      // const response = await this.fetchData(endpoint); // 👈 Should return the array of comments
      // if (Array.isArray(response)) {
      //   this._openMessagesPopup(response);
      // } else {
      //   console.warn("Expected array of messages but got:", response);
      // }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  template() {
    const title = this.getAttr("title");
    const value = this.getAttr("value");
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
        <div class="info__text ${valueColor}">${value}${
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
