function isEmailValid(email) {
    var emailRegex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return emailRegex.test(email);
}

function formatPhoneNumber(number) {
    let match = number.match(/^(\d{3})(\d{2})(\d{2})(\d{2})(\d{2})$/);

    if (match) {
        return "(+" + match[1] + ") " + match[2] + " " + match[3] + " " + match[4] + " " + match[5];
    }

    return null;
}

function numberWithSeparator(value, separator = ",") {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

function getOnlyNumbers(str) {
    return str.replace(/[^\d]/g, "");
}

function getStyle(target, property) {
    return window.getComputedStyle(target, null).getPropertyValue(property);
}

function getMultipleSelectValues(select) {
    let selectValues = [];

    if (select) {
        const options = select.querySelectorAll("option");

        if (options.length) {
            options.forEach((option) => {
                if (option.selected) {
                    selectValues = [...selectValues, option.value || option.text];
                }
            });
        }
    }

    return selectValues;
}

function slideUp(target, duration = 300) {
    target.style.transitionProperty = "height, margin, padding";
    target.style.transitionDuration = duration + "ms";
    target.style.height = target.offsetHeight + "px";
    target.offsetHeight;
    target.style.overflow = "hidden";
    target.style.height = 0;
    target.style.paddingTop = 0;
    target.style.paddingBottom = 0;
    target.style.marginTop = 0;
    target.style.marginBottom = 0;

    window.setTimeout(() => {
        if (parseInt(target.style.height) === 0) {
            target.style.display = "none";
            target.style.removeProperty("height");
            target.style.removeProperty("transition-duration");
            target.style.removeProperty("transition-property");
            target.style.removeProperty("padding-top");
            target.style.removeProperty("padding-bottom");
            target.style.removeProperty("margin-top");
            target.style.removeProperty("margin-bottom");
        }
    }, duration);
}

function slideDown(target, duration = 300) {
    target.style.removeProperty("display");
    let display = window.getComputedStyle(target).display;

    if (display === "none") display = "block";

    let height = target.offsetHeight;
    target.style.display = display;
    target.style.overflow = "hidden";
    target.style.height = 0;
    target.style.paddingTop = 0;
    target.style.paddingBottom = 0;
    target.style.marginTop = 0;
    target.style.marginBottom = 0;
    target.offsetHeight;
    target.style.transitionProperty = "height, margin, padding";
    target.style.transitionDuration = duration + "ms";
    target.style.height = height + "px";
    target.style.removeProperty("padding-top");
    target.style.removeProperty("padding-bottom");
    target.style.removeProperty("margin-top");
    target.style.removeProperty("margin-bottom");
    window.setTimeout(() => {
        if (parseInt(target.style.height) === height) {
            target.style.removeProperty("height");
            target.style.removeProperty("overflow");
            target.style.removeProperty("transition-duration");
            target.style.removeProperty("transition-property");
        }
    }, duration);
}

function slideToggle(target, duration = 300) {
    if (window.getComputedStyle(target).display === "none") {
        return slideDown(target, duration);
    } else {
        return slideUp(target, duration);
    }
}

function dynamicAppendInit() {
    const dataAppendElements = document.querySelectorAll("[data-append]");
    if (dataAppendElements.length) {
        dataAppendElements.forEach((dataAppendElement) => {
            let [mediaSize, appendBlockClass] = dataAppendElement.getAttribute("data-append").split(", ");

            if (window.innerWidth < mediaSize) {
                const appendBlockElement = document.querySelector(appendBlockClass);
                const isElementAppended = appendBlockElement && !!appendBlockElement.querySelector(dataAppendElement.getAttribute("class"));

                console.log(dataAppendElement);
                if (appendBlockElement && !isElementAppended) {
                    appendBlockElement.append(dataAppendElement);
                }
            }
        });
    }
}

function splitText(element) {
    let wordsList = element.textContent.trim().split(" ");
    let wrappedWords = wordsList.filter((word) => (word ? word : null)).map((word) => `<span class="split-word"><span>${word}</span></span>`);

    return wrappedWords.join(" ");
}

// function tabsInit() {
//     const tabElements = document.querySelectorAll(".tab");

//     if (tabElements.length) {
//         tabElements.forEach((tabElement) => {
//             tabElement.addEventListener("click", function () {
//                 let contentId = tabElement.getAttribute("data-tab");

//                 if (!tabElement.classList.contains("active")) {
//                     const thisActiveTab = tabElement.closest(".tabs__control").querySelector(".tab.active");
//                     thisActiveTab.classList.remove("active");
//                     tabElement.classList.add("active");

//                     const thisContentElement = document.getElementById(contentId);
//                     if (thisContentElement) {
//                         const thisActiveTabContent = tabElement.closest(".tabs").querySelector(".tab-content.active");
//                         thisActiveTabContent.classList.remove("active");

//                         thisContentElement.classList.add("active");
//                     }
//                 }
//             });
//         });
//     }
// }

function accordionInit(e) {
    const accordionElements = document.querySelectorAll(".accordion");
    accordionElements.forEach((accordionElement) => {
        accordionElement.addEventListener("click", accordionSlideToggle);
        accordionElement.addEventListener("keypress", accordionSlideToggle);
    });
}

function accordionSlideToggle(e) {
    if (e.type === "keypress" && e.keyCode !== 13) return;

    if (e.target.closest(".accordion__header")) {
        const target = e.target.closest(".accordion__header");
        const accordion = target.closest(".accordion");
        const thisItem = target.closest(".accordion__item");
        const openItem = accordion.querySelector(".accordion__item.open");
        const thisBody = thisItem.querySelector(".accordion__body");
        const openBody = openItem && openItem.querySelector(".accordion__body");

        if (thisItem.classList.contains("open")) {
            thisItem.classList.remove("open");
            slideUp(thisBody);
        } else {
            if (openItem) {
                openItem.classList.remove("open");
                slideUp(openBody);
            }
            thisItem.classList.add("open");
            slideDown(thisBody);
        }
    }
}

function generateId(length) {
    let result = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

function toastMessage(message, type = "default") {
    let toastMessagesElement = document.querySelector(".toast-messages");
    const mainElement = document.querySelector("main");
    const toastContainer = `<div class="toast-messages"></div>`;
    const toastId = generateId(7);

    const toastBody = `
    <div class="toast-message ${type}" data-toast-id="${toastId}">
        <div class="toast-message-icon">
            <img src="assets/img/icons/success.svg" alt="success">
        </div>
        <span class="helvetica-65">${message}</span>
        <div class="toast-message__close toast-close">
            <img src="assets/img/icons/close-white.svg" alt="close">
        </div>
    </div>`;

    if (!toastMessagesElement) {
        mainElement.insertAdjacentHTML("beforeend", toastContainer);
    }
    toastMessagesElement = document.querySelector(".toast-messages");

    toastMessagesElement.insertAdjacentHTML("beforeend", toastBody);

    autoRemoveToast(toastId);
}

function autoRemoveToast(id) {
    const thisToast = document.querySelector(`[data-toast-id="${id}"]`);

    if (thisToast) {
        new Promise(function (resolve, reject) {
            setTimeout(function () {
                thisToast.classList.add("toast-message_hidden");
                resolve();
            }, 4000);
        }).then(function () {
            setTimeout(function () {
                thisToast.remove();
                const toastMessageElements = document.querySelectorAll(".toast-message");

                if (!toastMessageElements.length) {
                    const toastMessagesElement = document.querySelector(".toast-messages");

                    if (toastMessagesElement) {
                        toastMessagesElement.remove();
                    }
                }
            }, 500);
        });
    }
}

function removeToast(closeElement, id) {
    if (!id) {
        let toast = closeElement.closest(".toast-message");

        toast.classList.add("toast-message_hidden");

        setTimeout(function () {
            toast.remove();
        }, 500);
    } else {
        const thisToast = document.querySelector(`[data-toast-id="${id}"]`);

        thisToast.classList.add("toast-message_hidden");

        setTimeout(function () {
            thisToast.remove();
        }, 500);
    }
}

function popoverSlideInit(target) {
    let targetContainer = target.closest(".popover-container");
    let targetWrap = target.closest(".popover-wrap");
    let targetHeight;
    let distance = 0;
    let isHeadingTouched = false;
    let startPositionY;

    setTimeout(() => {
        targetHeight = target.offsetHeight;
    }, 300);

    target.addEventListener("touchstart", dragElement, { passive: true });
    target.addEventListener("touchmove", draggingElement, { passive: true });
    target.addEventListener("touchend", draggedElement);

    function dragElement(e) {
        isHeadingTouched = false;
        startPositionY = e.touches[0].clientY;
        let offsetTop = target.offsetTop;
        let paddingTop = parseInt(getStyle(target, "padding-top"));
        let elementTriggerPart = offsetTop + paddingTop;

        if (startPositionY <= elementTriggerPart && startPositionY >= offsetTop) {
            isHeadingTouched = true;
        }
    }

    function draggingElement(e) {
        let posY = e.touches[0].clientY;

        if (isHeadingTouched) {
            targetWrap.classList.add("dragging");
            distance = posY - startPositionY;

            if (distance > 0) {
                target.style.transform = `translateY(${distance}px)`;
                // target.css("transform", `translateY(${distance}px)`);
            } else {
                target.style.transform = `translateY(${distance * 0.1}px)`;
                target.style.setProperty("--negative-offset", `${distance * -0.15}px`);
                // target.css({
                //     "transform": `translateY(${distance * 0.1}px)`,
                //     "--negative-offset": `${distance * -0.15}px`,
                // });
            }
        }
    }

    function draggedElement(e) {
        targetWrap.classList.remove("dragging");
        target.removeAttribute("style");
        let targetHeightHalf = target.offsetHeight / 2;
        const targetWrapHeight = targetWrap.clientHeight - parseFloat(getStyle(targetWrap, "padding-top")) - parseFloat(getStyle(targetWrap, "padding-bottom"));

        if (target.offsetHeight > targetWrapHeight) {
            if (distance > targetWrapHeight / 2) {
                targetContainer.classList.remove("active");
                scrollNone();
            }
        } else {
            if (distance > targetHeightHalf) {
                targetContainer.classList.remove("active");
                scrollNone();
            }
        }
        distance = 0;
    }
}

function headerFixed() {
    const scrollTop = document.documentElement.scrollTop;
    const headerWrapperElement = document.querySelector(".header__wrapper");

    if (scrollTop <= 5) {
        headerWrapperElement.classList.remove("fixed");
    } else {
        headerWrapperElement.classList.add("fixed");
    }
}

function getDocumentVisibleWidth() {
    return Math.max(document.body.scrollWidth, document.documentElement.scrollWidth, document.body.offsetWidth, document.documentElement.offsetWidth, document.body.clientWidth, document.documentElement.clientWidth);
}

function disableIntro() {
    let now = new Date();
    now.setDate(now.getDate() + 1);
    document.cookie = `disableLoader=true; expires=${now.toUTCString()}`;
}

function scrollNone() {
    const body = document.querySelector("body");
    const activeModal = document.querySelector(".modal.active");
    const activeProductModal = document.querySelector(".product-modal.active");
    const activeFilterModal = document.querySelector(".filter-modal.active");

    const activePopover = document.querySelector(".popover-container.active");
    const headerActive = document.querySelector(".header.active");
    const shiftElements = document.querySelectorAll(".shift-element");

    let lockBody = activeModal || activeProductModal || activeFilterModal || activePopover || headerActive;
    let scrollWidthBeforeFreeze = getDocumentVisibleWidth();

    if (lockBody) {
        body.classList.add("locked");

        let scrollWidthAfterFreeze = getDocumentVisibleWidth();

        if (scrollWidthBeforeFreeze < scrollWidthAfterFreeze) {
            let scrollSpace = scrollWidthAfterFreeze - scrollWidthBeforeFreeze;

            if (shiftElements.length) {
                shiftElements.forEach((el) => {
                    el.style.paddingRight = scrollSpace + "px";
                });
            }
        }
    } else {
        body.classList.remove("locked");

        if (shiftElements.length) {
            shiftElements.forEach((el) => {
                el.style.paddingRight = "";

                if (el.getAttribute("style") === "") {
                    el.removeAttribute("style");
                }
            });
        }

        if (body.getAttribute("class") === "") {
            body.removeAttribute("class");
        }
    }
}

function convertRemToPixels(rem) {
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}
