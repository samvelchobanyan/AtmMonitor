import { DynamicElement } from '../../core/dynamic-element.js';
import { api } from '../../core/api-client.js';
import './list-view.js';

const observedAttrs = ['value', 'duration'];
class InfoCard extends DynamicElement {
  static get properties() {
    return [
      'title',
      'value',
      'value-currency',
      'value-color',
      'icon',
      'button-text',
      'trend',
      'stat-class',
      'message',
      'highlight',
      'border',
      'duration',
      'data-endpoint',
    ];
  }
  static get observedAttributes() {
    return observedAttrs;
  }

  onConnected() {
    this.state = { isLoading: false, error: false, modalContent: '' };
  }

  addEventListeners() {
    const messageEl = this.$('.info__message');
    if (messageEl) {
      this.addListener(messageEl, 'click', this.handleMessageClick);
    }

    const linkButton = this.$('.btn_link');
    if (linkButton) {
      if (this.getAttribute('incashment-data')) {
        this.addListener(linkButton, 'click', this.handleIncashmentClick);
      } else {
        this.addListener(linkButton, 'click', this.handleLinkClick);
      }
    }
  } 

  _openMessagesPopup(messages) {
    const modal = document.createElement('modal-popup');
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
    const closeBtn = modal.querySelector('.modal__close');
    closeBtn?.addEventListener('click', () => modal.remove());
  }

  _openIncashmentPopup(incData) {
    const modal = document.createElement('modal-popup');
    document.body.appendChild(modal);
    modal.setContent(`
        <div class="modal__header">
            <div class="modal__title">Վերջին ինկասացիա</div>
            <img class="modal__close" src="assets/img/icons/x-circle.svg" alt="" />
        </div>
        <div class="modal__body">
                <list-view
                    items='${incData}'
                >
                    <template>
                        <div class="modal__incashment">
                            <div class="modal__incashment-text">{{banknot_name}}</div>
                            <div class="modal__incashment-text">{{count}} հատ</div>
                            <div class="modal__incashment-text">{{result}}</div>
                        </div>
                    </template>
                </list-view>
      </div>
    
   
    `);

    // Add close button listener
    const closeBtn = modal.querySelector('.modal__close');
    closeBtn?.addEventListener('click', () => modal.remove());
  }

  _openCardPopup(messages) {
    const modal = document.createElement('modal-popup');
    document.body.appendChild(modal);

    const endpoint = this.getAttribute('data-endpoint');

    // Decide template content based on endpoint
    let itemTemplate = '';
    let modalTitle = '';
    if (endpoint == '/dashboard/taken-cards') {
      modalTitle = 'Առգրավված քարտեր';
      itemTemplate = `
                <a href="atms/{{atm_id}}">
                    <div class="atm-item">
                        <div class="atm-item__icon">
                            <img src="assets/img/credit-card.svg" alt="ATM Icon"/>
                        </div>
                        <div class="atm-item__info">
                            <div class="atm-item__location">
                                <div><span class="atm-item__value">{{date_time}}</span></div>
                            </div>
                            <div class="atm-item__id">
                                <span class="atm-item__label">ATM ID:</span>
                                <span class="atm-item__value">#<span class="font-black">{{atm_id}}</span></span>
                            </div>
                            <div class="atm-item__address">
                                <span class="atm-item__value">Քարտի համար։ {{card_number}}</span>
                            </div>
                        </div>
                    </div>
                </a>
        `;
    } else if (endpoint === '/dashboard/almost-empty-cassettes') {
      modalTitle = 'Վերջացող';

      itemTemplate = `
            <a href="atms/{{atm_id}}">
                <div class="atm-item">
                    <div class="atm-item__icon">
                        <img src="assets/img/atm-icon.svg" alt="ATM Icon"/>
                    </div>
                    <div class="atm-item__info">
                        <div class="atm-item__location">
                            <span class="atm-item__value">{{date_time}}</span>
                        </div>
                        <div class="atm-item__id">
                            <span class="atm-item__label">ATM ID:</span>
                            <span class="atm-item__value">#{{atm_id}}</span>
                        </div>
                        <div class="atm-item__address">
                            <span class="atm-item__value">Կասետի տիպ : {{cassette_type}}</span>
                        </div>
                        <div class="atm-item__address">
                            <span class="atm-item__value">Մնացած քանակ : {{count}}</span>
                        </div>
                    </div>
                    </div>
                </div>
            </a>
        `;
    } else if (endpoint === '/dashboard/empty-cassettes') {
      modalTitle = 'Դատարկ';

      itemTemplate = `
            <a href="atms/{{atm_id}}"class="atm-item">
                        <div class="atm-item__icon">
                            <img src="assets/img/atm-icon.svg" alt="ATM Icon"/>
                        </div>    
                    <div class="atm-item__info">
                        <div class="atm-item__id">
                            <span class="atm-item__label">ATM ID:</span>
                            <span class="atm-item__value">#{{atm_id}}</span>
                        </div>
                        <div class="atm-item__address">
                            <span class="atm-item__value">Կասետի տիպ : {{cassette_type}}</span>
                        </div>
                    </div>
                </div>
            </a>
        `;
    } else if (endpoint === '/dashboard/not-working-atms') {
      modalTitle = 'Չաշխատող';

      itemTemplate = `
            <a href="atms/{{atm_id}}">
                <div class="atm-item">
                    <div class="atm-item__icon">
                        <img src="assets/img/atm-icon.svg" alt="ATM Icon"/>
                    </div>
                    <div class="atm-item__info">
                        <div class="atm-item__id"><span class="atm-item__label">ATM ID:</span> <span class="atm-item__value">#<span class="font-black">{{atm_id}}</span></span></div>
                        <div class="atm-item__location">
                            <div><span class="atm-item__label">Քաղաք՝</span> <span class="atm-item__value">{{city}}</span></div>
                            <div><span class="atm-item__label">Համայնք՝</span> <span class="atm-item__value">{{district}}</span></div>
                            </div>
                            <div class="atm-item__address">
                            <span class="atm-item__label">Հասցե՝</span> <span class="atm-item__value">{{address}}</span>
                            </div>
                            <div><span class="atm-item__label">Անսարքություն՝</span> <span class="atm-item__value">{{device_type_name}}</span></div>
                    </div>
                </div>
            </a>
           
        `;
    } else {
      itemTemplate = `
            <div class="atm-item">
                <span>Unknown endpoint: ${endpoint}</span>
            </div>
        `;
    }

    modal.setContent(`
        <div class="modal__header">
            <div class="modal__title">${modalTitle}</div>
            <img class="modal__close" src="assets/img/icons/x-circle.svg" alt="" />
        </div>
        <div class="modal__body">
            <list-view items='${JSON.stringify(messages)}'>
                <template>
                    ${itemTemplate}
                </template>
            </list-view>
        </div>
    `);

    // Add close button listener
    const closeBtn = modal.querySelector('.modal__close');
    closeBtn?.addEventListener('click', () => modal.remove());

    // Remove modal after page redirection
    const body = modal.querySelector('.modal__body');
    body.addEventListener('click', (e) => {
      const link = e.target.closest('a'); // any <a> inside modal body
      if (link) {
        modal.remove();
      }
    });
  }

  async handleMessageClick() {
    let comments = this.getAttribute('messages-data');
    this._openMessagesPopup(comments);
  }

  async handleIncashmentClick() {
    let incData = this.getAttribute('incashment-data');
    this._openIncashmentPopup(incData);
  }

  async handleLinkClick() {
    const endpoint = this.getAttribute('data-endpoint');
    if (!endpoint) return;

    this.setState({ isLoading: true });
    try {
      const response = await this.fetchData(endpoint);
      this._openCardPopup(response.data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  onAttributeChange(name, oldValue, newValue) {
    if (name === 'value' && oldValue !== newValue) {
      this.updateValue(newValue);
    }
  }

  updateValue(newValue) {
    const valueEl = this.querySelector('.info__text');
    if (valueEl) {
      const formattedValue = isNaN(newValue)
        ? newValue
        : Number(newValue).toLocaleString();
      const valueCurrency = this.getAttr('value-currency');
      valueEl.innerHTML = `${formattedValue}${
        valueCurrency ? `<span>${valueCurrency}</span>` : ''
      }`;
    }
  }

  template() {
    const title = this.getAttr('title');
    const value = this.getAttr('value');
    const formattedValue = isNaN(value)
      ? value
      : Number(value).toLocaleString();
    const valueCurrency = this.getAttr('value-currency');
    const valueColor = this.getAttr('value-color');
    const icon = this.getAttr('icon');
    const buttonText = this.getAttr('button-text');
    const trend = this.getAttr('trend');
    const statClass = this.getAttr('stat-class');
    const message = this.getAttr('message');
    const duration = this.getAttr('duration');

    const isHighlighted = this.hasAttribute('highlight');
    const hasBorder = this.getAttribute('show-border') === 'true';

    this.classList.add('info');
    if (isHighlighted) this.classList.add('info_highlighted');
    if (hasBorder) this.classList.add('info_border');

    return `
      <div class="info__top">
        <div class="info__title">${title}</div>
        ${icon ? `<div class="info__icon"><i class="${icon}"></i></div>` : ''}
      </div>
      <div class="info__bottom">
        <div class="info__text ${valueColor}">${formattedValue}${
      valueCurrency ? `<span>${valueCurrency}</span>` : ''
    }</div>
        ${trend ? `<change-indicator value="${trend}"></change-indicator>` : ''}
        ${
          value !== '0' && value !== 0 && buttonText
            ? `<div class="btn btn_link"><span>${buttonText}</span> <i class="icon icon-chevron-right"></i></div>`
            : ''
        }
        ${duration ? `<div class="info__duration">${duration}</div>` : ''}
        ${
          message
            ? `<div class="info__message message"><i class="icon icon-message"></i><span>${message}</span></div>`
            : ''
        }
      </div>
    `;
  }
}

customElements.define('info-card', InfoCard);
