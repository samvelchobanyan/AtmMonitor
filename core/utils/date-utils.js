export function resolvePeriodToDates(period) {
    const now = new Date();
    let start, end;

    switch (period) {
        case "today":
            start = new Date(now);
            end = new Date(now);
            break;
        case "week":
            start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            end = new Date(now);
            break;
        case "custom":
        default:
            return null;
    }

    const fmt = (d) => d.toISOString().slice(0, 10);
    return { startDate: fmt(start), endDate: fmt(end) };
}

export function openDateRangePopup() {
    return new Promise((resolve) => {
        const modal = document.createElement("modal-popup");
        document.body.appendChild(modal);

        modal.querySelector(".modal-content").classList.add("modal-content--sm");

        modal.setContent(`
      <div class="modal__header">
        <div class="modal__title">
          Ընտրեք ամսաթվի միջակայքը
        </div>
      </div>

      <div class="modal__datepickers">
        <div class="datepicker">
          <label for="start" class="datepicker__label">սկիզբ</label>
          <input type="date" id="start" class="datepicker__input" />
        </div>
        <div class="datepicker">
          <label for="end" class="datepicker__label">ավարտ</label>
          <input type="date" id="end" class="datepicker__input" />
        </div>
      </div>

      <div class="modal__buttons">
        <button class="cancel btn btn_md btn_white"><span>Չեղարկել</span></button>
        <button class="ok btn btn_md btn_blue"><span>Կիրառել</span></button>
      </div>
    `);

        // Set default values: end date defaults to today if nothing is provided
        const endInput = modal.querySelector("#end");
        if (endInput) {
            const todayStr = new Date().toISOString().slice(0, 10);
            endInput.value = todayStr;
        }

        const cancelBtn = modal.querySelector(".cancel");
        const okBtn = modal.querySelector(".ok");

        cancelBtn?.addEventListener("click", () => {
            modal.remove();
            resolve(null);
        });

        okBtn?.addEventListener("click", () => {
            const start = modal.querySelector("#start").value;
            const end = modal.querySelector("#end").value;
            if (!start || !end) return;
            modal.remove();
            resolve({ startDate: start, endDate: end });
        });
    });
}
