// uglifyjs assets/js/libs/combobox-core.js --output assets/js/libs/combobox.min.js
const _selectBox = ".combo-box";
const _selectBoxSelected = ".combo-box-selected";
const _selectBoxSelectedWrap = ".combo-box-selected-wrap";
const _selectBoxPlaceholder = ".combo-box-placeholder";
const _selectBoxDropdown = ".combo-box-dropdown";
const _selectBoxOptions = ".combo-box-options";
const _selectBoxOption = ".combo-option";
const _selectBoxOptionHidden = "combo-option_hidden";
const _selectBoxOptionFocused = ".combo-option_focused";
const _selectBoxSearch = ".combo-box-search";
const _tagModeClass = "tag-mode";
const _tagWrapperClass = "combo-box-tags";
const _tagElementClass = "combo-box-tag";
const _userAddedOptionClass = "user-added-option";
const _emptyMessageClass = "combo-box-message";
const _attrName = "data-combo-name";
const _attrValue = "data-combo-value";
const _optionAttrValue = "data-option-value";
const _tagAttrValue = "data-tag-value";
const _htmlElement = document.querySelector("html");
const _defaultEmptyMessage = "Nothing found";
const _defaultMaxItemsShow = 3;

_htmlElement.addEventListener("click", function(e) {
	if((e && !e.target.closest(_selectBoxDropdown)) || !e.target.closest(_selectBox).classList.contains("multiple")) {
		_closeDropdown();
	}
});
document.addEventListener("DOMContentLoaded", function () {
	_initComboBox();
});

function _initComboBox(selector) {
	const _selectBoxElements = document.querySelectorAll(_selectBox);

	if(selector) {
		initSingleSelect(selector);
	} else {
		_selectBoxElements.forEach((selectBoxElement) => {
			initSingleSelect(selectBoxElement);
		});
	}

	function initSingleSelect(selectBoxElement) {
		const selectBoxSelectedElement = selectBoxElement.querySelector(_selectBoxSelected);
		const selectBoxName = selectBoxElement.getAttribute(_attrName);
		const selectOptions = selectBoxElement.querySelectorAll(_selectBoxOption);
		const placeholderElement = selectBoxElement.querySelector(_selectBoxPlaceholder);
		const selectBoxOptionsElement = selectBoxElement.querySelector(_selectBoxOptions);
		let _emptyMessage = _defaultEmptyMessage;
		let _maxItemsShow = _defaultMaxItemsShow;

		// Options attributes
		const maxItemsAttribute = selectBoxElement.getAttribute("data-max-items");
		const emptyMessageAttribute = selectBoxElement.getAttribute("data-empty-message");

		if(maxItemsAttribute !== null && Number(maxItemsAttribute)) {
			_maxItemsShow = maxItemsAttribute;
		}
		if(emptyMessageAttribute !== null) {
			_emptyMessage = emptyMessageAttribute;
		}
		
		let currentTabIndex = -1;
		let multiData = [];

		createSelectElement(selectBoxElement, selectBoxName, selectOptions);

		if (selectBoxElement.classList.contains("multiple")) {
			// Sync multiData array with default selected options
			if(selectBoxElement.getAttribute(_attrValue)) {
				selectBoxElement.querySelectorAll(_selectBoxOption + ".selected").forEach((element) => {
					let text = element.textContent;
					let value = element.getAttribute(_optionAttrValue);
					
					multiData = [...multiData, {value, text}];
				});
			}
		}

		selectBoxElement.addEventListener("keyup", handleKeyup);

		// Keyboard Control
		selectBoxElement.addEventListener("keydown", function(e) {
			const keyCode = e.keyCode || e.which;
			const arrow = { tab: 9, enter: 13, up: 38, down: 40, esc: 27, backspace: 8 };
			const isSelectBoxSelectedActive = selectBoxElement.querySelector(_selectBoxSelected).classList.contains("active")
	
			if (keyCode === arrow.up && isSelectBoxSelectedActive) {
				// Arrow Up
				decreaseTabIndex();
			} else if (keyCode === arrow.down && isSelectBoxSelectedActive) {
				// Arrow Down
				increaseTabIndex();
			} else if (keyCode === arrow.enter && isSelectBoxSelectedActive) {
				const selectBoxOptionFocusedElement = document.querySelector(_selectBoxOptionFocused)
				// Enter
				if (selectBoxOptionFocusedElement) {
					selectBoxOptionFocusedElement.click();
				} else {
					if(e.target.classList.contains("allow-custom-options")) {
						addUserOption(e.target);
					}
				}
	
				resetSearchInput(e.target);
			} else if (keyCode === arrow.esc && isSelectBoxSelectedActive) {
				// Escape
				_closeDropdown();
			} else if (keyCode === arrow.backspace && isSelectBoxSelectedActive) {
				// Backspace
				if (selectBoxElement.querySelector(_selectBoxSearch).value === "" && selectBoxElement.getAttribute(_attrValue) && selectBoxElement.classList.contains("multiple")) {
					let lastSelectedValue = getLastSelectedValue(selectBoxElement.getAttribute(_attrValue));
	
					removeMultiOption(e.target, lastSelectedValue);
				}
			}
		});

		selectBoxElement.addEventListener("click", function(e) {
			// Selected Element
			if(e.target.closest(_selectBoxSelected)) {
				e.stopPropagation();
				currentTabIndex = -1;
		
				if (!e.target.closest("." + _tagElementClass) && !e.target.closest(_selectBoxSearch)) {
					toggleDropdown(e.target);
				}
			}

			// Remove tag
			if (e.target.closest("." + _tagElementClass + "__remove")) {
				let value = e.target.closest("." + _tagElementClass).getAttribute(_tagAttrValue);
	
				removeMultiOption(e.target, value);
			}

			if(e.target.closest(_selectBoxOption)) {
				// SINGLE SELECT
				const option = e.target.closest(_selectBoxOption);

				if (!option.closest(_selectBox).classList.contains("multiple")) {
					const optionSelectBox = option.closest(_selectBox);
					const optionSelect = optionSelectBox.querySelector("select");

					option.closest(_selectBoxDropdown).querySelectorAll(_selectBoxOption).forEach((option) => {
						option.classList.remove("selected");
					});
					option.classList.add("selected");
	
					optionSelectBox.setAttribute(_attrValue, option.getAttribute(_optionAttrValue));
					optionSelect.value = option.getAttribute(_optionAttrValue);
					optionSelect.dispatchEvent(new Event("change"));
					optionSelectBox.querySelector(_selectBoxSelectedWrap).innerHTML = option.innerHTML;
				} else {
					// MULTIPLE VALUE UNSELECTING
					if (option.classList.contains('selected')) {
						option.classList.remove('selected');
						let value = option.getAttribute(_optionAttrValue);
	
						removeMultiOption(option, value);
					}
					// MULTIPLE VALUE SELECTING
					else {
						option.classList.add('selected');
						let value = option.getAttribute(_optionAttrValue);
						let text = option.textContent;
	
						addMultiOption(option, { value, text });
					}
				}
			}
		});

		function handleKeyup (e) {
			filterOptionsWithQuery(e);
			
			moveFocus();
		}

		// SEARCH
		function filterOptionsWithQuery (e, options) {
			if(e.target.classList.contains(_selectBoxSearch.replace(".", ""))) {
				const thisSearch = e.target;
				let val = thisSearch.value;

				if (val.trim().length) {
					val = val.toUpperCase();

					selectOptions.forEach((option) => {
						let optionVal = option.textContent;

						if (optionVal.toUpperCase().indexOf(val) > -1) {
							option.classList.remove(_selectBoxOptionHidden);
						} else {
							option.classList.add(_selectBoxOptionHidden);
						}
					});
				} else {
					selectOptions.forEach((option) => {
						option.classList.remove(_selectBoxOptionHidden);
					});
				}
			}
		}

		const addMultiOption = (target, newOption) => {
			multiData = [...multiData, newOption];
			let [multiValues, multiValuesArray, multiTexts] = getMultiVars(multiData);
			const targetSelectBox = target.closest(_selectBox);
			const targetSelect = targetSelectBox.querySelector("select");
			const targetSelectWrap = targetSelectBox.querySelector(_selectBoxSelectedWrap);
			
			multiValuesArray.forEach((value) => {
				if(targetSelect.querySelector(`option[value="${value}"]`)) {
					targetSelect.querySelector(`option[value="${value}"]`).setAttribute("selected", true);
					targetSelect.querySelector(`option[value="${value}"]`).selected = true;
				}
			});
			targetSelect.dispatchEvent(new Event('change'));
			targetSelectBox.setAttribute(_attrValue, multiValues);
			
			if (targetSelectBox.classList.contains(_tagModeClass)) {
				let tagsTemplate = getTagsTemplate(multiData, _tagElementClass);
				targetSelectWrap.innerHTML = tagsTemplate;
			} else {
				targetSelectWrap.textContent = multiTexts;
				
				if (multiData.length > _maxItemsShow) {
					const maxItemsShowText = getMaxItemsShowText(multiTexts);
					const restOptionsCount = multiData.length - _maxItemsShow;
					targetSelectWrap.textContent = (maxItemsShowText + ` +${restOptionsCount}`);
				}
			}
	
			// if(multiData.length == selectOptions.length){
			// 	targetSelectWrap.textContent = "All selected!";
			// }
		}
	
		const removeMultiOption = (target, value) => {
			multiData = [...multiData.filter(data => data.value !== value)];
			let [multiValues, multiValuesArray, multiTexts] = getMultiVars(multiData);
			const selectBoxContainer = target.closest(_selectBox);
			const selectBoxWrap = selectBoxContainer.querySelector(_selectBoxSelectedWrap);
			const targetSelect = selectBoxContainer.querySelector("select");
			const selectBoxContainerSearch = selectBoxContainer.querySelector("select");
	
			if(targetSelect.querySelector(`option[value="${value}"]`)) {
				targetSelect.querySelector(`option[value="${value}"]`).removeAttribute("selected", true);
				targetSelect.querySelector(`option[value="${value}"]`).selected = false;
			}
			targetSelect.dispatchEvent(new Event('change'));
			selectBoxContainer.setAttribute(_attrValue, multiValues);
			selectBoxContainer.querySelector(_selectBoxOption + `[${_optionAttrValue}="${value}"]`).classList.remove('selected');
	
			if (multiData.length) {
				if (multiData.length > _maxItemsShow && !selectBoxContainer.classList.contains(_tagModeClass)) {
					const maxItemsShowText = getMaxItemsShowText(multiTexts);
					const restOptionsCount = multiData.length - _maxItemsShow;
					selectBoxWrap.textContent = (maxItemsShowText + ` +${restOptionsCount}`);
				} else {
					if (selectBoxContainer.classList.contains(_tagModeClass)) {
						let tagsTemplate = getTagsTemplate(multiData, _tagElementClass);
						selectBoxWrap.innerHTML = tagsTemplate;
						selectBoxContainer.querySelector(_selectBoxOption + `[${_optionAttrValue}="${value}"]`).classList.remove('selected');
					} else {
						selectBoxWrap.textContent = multiTexts;
					}
				}
			} else {
				selectBoxWrap.innerHTML = placeholderElement.innerHTML;
				selectBoxContainer.removeAttribute(_attrValue);
				if(selectBoxContainerSearch) {
					selectBoxContainerSearch.focus();
				}
			}
	
			let targetSelectOption = selectBoxContainer.querySelector(`option[value="${value}"]`);
			if (targetSelectOption && targetSelectOption.classList.contains(_userAddedOptionClass)) {
				targetSelectOption.remove();
			}
		}

		const addUserOption = (target) => {
			const selectBoxSearchElement = target.querySelector(_selectBoxSearch);
			let value = selectBoxSearchElement.value;
			let containsValue = false;
			multiData.map((data) => data.text === value ? containsValue = true : null);

			if (!containsValue) {
				selectBoxElement.querySelector("select").insertAdjacentHTML("beforeend", `<option class="${_userAddedOptionClass}" value="${value}">${value}</option>`);
				addMultiOption(selectBoxElement, { value, text: value });
			}
		}

		const decreaseTabIndex = () => {
			index = 0;

			if (currentTabIndex > 0) {
				currentTabIndex--;
				index = currentTabIndex;
			}

			const currentOption = getVisibleOptions(selectBoxElement)[index];

			scrollToFocusedOption(currentOption);
		}

		const increaseTabIndex = () => {
			const visibleSelectOptions = getVisibleOptions(selectBoxElement);
			
			if (currentTabIndex < visibleSelectOptions.length - 1) {
				currentTabIndex++;
			}

			scrollToFocusedOption(visibleSelectOptions[currentTabIndex]);
		}

		const resetSearchInput = (target) => {
			if(target.closest(_selectBox)) {
				const selectBoxSearchElement = target.closest(_selectBox).querySelector(_selectBoxSearch);
				selectBoxSearchElement.value = ""
			}
			selectOptions.forEach((option) => {
				option.classList.remove(_selectBoxOptionHidden);
			});
		}

		const moveFocus = () => {
			const visibleSelectOptions = getVisibleOptions(selectBoxElement);

			if(visibleSelectOptions.length) {
				if(selectBoxOptionsElement.querySelector("." + _emptyMessageClass)) {
					selectBoxOptionsElement.querySelector("." + _emptyMessageClass).remove();
				}
				const isFirstFocused = currentTabIndex === 0 && visibleSelectOptions[currentTabIndex].classList.contains(_selectBoxOptionFocused.replace(".", ""));
				const isLastFocused = currentTabIndex + 1 === visibleSelectOptions.length && visibleSelectOptions[currentTabIndex].classList.contains(_selectBoxOptionFocused.replace(".", ""));
				
				if(isFirstFocused || isLastFocused) {
					return;
				}
	
				selectOptions.forEach((option) => {
					option.classList.remove(_selectBoxOptionFocused.replace(".", ""));
				});
				
				if (currentTabIndex !== -1) {
					visibleSelectOptions[currentTabIndex].classList.add(_selectBoxOptionFocused.replace(".", ""));
				} else if(visibleSelectOptions.length === 1) {
					visibleSelectOptions[0].classList.add(_selectBoxOptionFocused.replace(".", ""));
				}
			} else {
				if(!selectBoxOptionsElement.querySelector("." + _emptyMessageClass)) {
					selectBoxOptionsElement.insertAdjacentHTML("beforeend", `<div class="${_emptyMessageClass}">${_emptyMessage}</div>`);
				}
			}
		}

		function createSelectElement(selectBoxElement, name, options) {
			let multiple = selectBoxElement.classList.contains("multiple");
			let multiData = [];
	
			if(selectBoxElement.querySelector("select")) {
				selectBoxElement.querySelector("select").remove();
			}
	
			selectBoxElement.insertAdjacentHTML("beforeend", `<select name="${name}" style='display:none' ${multiple ? "multiple='multiple'" : ''}></select>`);
			
			options.forEach((option) => {
				const text = option.textContent;
				const value = option.getAttribute(_optionAttrValue);
				const isDisabled = option.classList.contains("disabled");
				const isSelected = option.classList.contains("selected");
				const optionSelect = option.closest(_selectBox).querySelector('select');
				
				optionSelect.insertAdjacentHTML(
					"beforeend",
					`<option ${isSelected ? "selected='selected'" : ""} ${isDisabled ? "disabled='disabled'" : ""} value="${value}">${text}</option>`
				);
				
				
				if(isSelected) {
					if(selectBoxElement.classList.contains("multiple")) {
						// DUPLICATED CODE NEED TO REFACTOR THIS!!!!!!!!!! ***************************************
						multiData = [...multiData, {value, text}];
						let [multiValues, multiValuesArray, multiTexts] = getMultiVars(multiData);
				
						selectBoxElement.closest(_selectBox).setAttribute(_attrValue, multiValues);
				
						if (selectBoxElement.closest(_selectBox).classList.contains(_tagModeClass)) {
							let tagsTemplate = getTagsTemplate(multiData, _tagElementClass);
							selectBoxElement.closest(_selectBox).querySelector(_selectBoxSelectedWrap).innerHTML = tagsTemplate;
						} else {
							selectBoxElement.closest(_selectBox).querySelector(_selectBoxSelectedWrap).textContent = multiTexts;
				
							if (multiData.length > _maxItemsShow) {
								const maxItemsShowText = getMaxItemsShowText(multiTexts);
								const restOptionsCount = multiData.length - _maxItemsShow;
								selectBoxElement.closest(_selectBox).querySelector(_selectBoxSelectedWrap).textContent = (maxItemsShowText + ` +${restOptionsCount}`);
							}
						}
						// **************************************************************************************************
					} else {
						optionSelect.value = option.value;
						optionSelect.dispatchEvent(new Event('change'));
						option.closest(_selectBox).querySelector(_selectBoxSelectedWrap).innerHTML = option.innerHTML;
					}
				}
			});
	
		}

		function getMaxItemsShowText(text) {
			return text.split(", ").slice(0, _maxItemsShow).join(", ");
		}
	}

	function scrollToFocusedOption(currentOption) {
		// TODO: Works fine, but need to check here for bugs
		const optionsWrapper = currentOption.closest(_selectBox).querySelector(_selectBoxOptions);
		const optionsWrapperView = optionsWrapper.offsetHeight - parseFloat(getStyle(optionsWrapper, "padding-top"));
		const currentOptionTop = currentOption.offsetTop;

		if(currentOptionTop >= optionsWrapperView) {
			optionsWrapper.scrollTop = optionsWrapper.scrollTop + currentOption.offsetHeight;
		} else {
			const currentOptionTopInView = currentOptionTop - optionsWrapper.scrollTop;

			if(currentOptionTopInView < 0) {
				optionsWrapper.scrollTop = currentOptionTop;
			}
		}
		// =========================>
	}

	function toggleDropdown(target) {
		target = target.closest(_selectBoxSelected);
		const selectBoxElements = document.querySelectorAll(_selectBox);
		const selectBoxDropdownElements = document.querySelectorAll(_selectBoxDropdown);
		const selectBoxSelectedElements = document.querySelectorAll(_selectBoxSelected);

		selectBoxElements.forEach((select) => {
			const selectSearch = select.querySelector(_selectBoxSearch);

			if(selectSearch) {
				selectSearch.remove();
			}
		});
		selectBoxDropdownElements.forEach((dropdown) => {
			dropdown.classList.remove("opened");
		});

		if (target.classList.contains("active")) {
			target.closest(_selectBox).querySelector(_selectBoxSelected).classList.remove("active");
			target.closest(_selectBox).querySelector(_selectBoxDropdown).classList.remove('opened');
		} else {
			selectBoxSelectedElements.forEach((selectedElement) => {
				selectedElement.classList.remove("active");
			});
			target.classList.add("active");
			target.closest(_selectBox).querySelector(_selectBoxDropdown).classList.add('opened');

			if (target.closest(_selectBox).classList.contains("searchable")) {
				target.insertAdjacentHTML("beforeend", `<input type="text" class="${_selectBoxSearch.replace(".", "")}" />`);
				if(target.querySelector(_selectBoxSearch)) {
					target.querySelector(_selectBoxSearch).focus();
				}
			}
		}
	}

	function getLastSelectedValue(values) {
		let selectedValues = values.split(", ");
		let lastSelectedValue = selectedValues[selectedValues.length - 1];
		return lastSelectedValue;
	}

	function getMultiVars(array) {
		let multiValues = "";
		let multiValuesArray = [];
		let multiTexts = "";

		array.map((data, index) => {
			if (index === array.length - 1) {
				multiValues += data.value;
				multiTexts += data.text;
			} else {
				multiValues += data.value + ", ";
				multiTexts += data.text + ", ";
			}
			multiValuesArray = [...multiValuesArray, data.value];
		});

		return [multiValues, multiValuesArray, multiTexts];
	}

	function getTagsTemplate(array, elementClass = _tagElementClass) {
		let selectedTags = `<div class="${_tagWrapperClass}">`;

		array.map(({ value, text }) => {
			selectedTags = selectedTags +
				`<div class="${elementClass}" ${_tagAttrValue}="${value}">
					<div class="${elementClass}__value">
						${text}
					</div>
					<div class="${elementClass}__remove">
						<img src="assets/img/icons/close-white.svg" alt="close">
					</div>
				</div>`
		});
		selectedTags += "</div>";

		return selectedTags;
	}

	function getVisibleOptions(selectBoxElement) {
		return selectBoxElement.querySelectorAll(`${_selectBoxOption}:not(.${_selectBoxOptionHidden})`);
	}

	function getStyle(element, property) {
		return window.getComputedStyle(element, null).getPropertyValue(property);
	};
}

function _addDynamicOptions(target, options) {
	const targetOptionsWrap = target.querySelector(_selectBoxOptions);
	const targetSelectElement = target.querySelector('select');
	let optionsHtml = '';
	let optionsCoreHtml = '';
	let dataAttrs = '';

	options.map(({ value, name, data }) => {
		if(data && Object.keys(data).length) {
			for (const [key, value] of Object.entries(data)) {
				dataAttrs += `data-${key}="${value}" `;
			}
		}

		optionsHtml += `<div class="combo-option" data-option-value="${value}" ${dataAttrs}>${name}</div>`;
		optionsCoreHtml += `<option value="${value}">${name}</option>`;
	});

	targetOptionsWrap.insertAdjacentHTML("beforeend", optionsHtml);
	targetSelectElement.insertAdjacentHTML("beforeend", optionsCoreHtml);
}

function _closeDropdown() {
	const selectBoxElements = document.querySelectorAll(_selectBox);
	const selectBoxSelectedElements = document.querySelectorAll(_selectBoxSelected);
	const selectBoxDropdownElements = document.querySelectorAll(_selectBoxDropdown);
	const selectBoxOptionElements = document.querySelectorAll(_selectBoxOption);

	selectBoxSelectedElements.forEach((element) => {
		element.classList.remove("active");
	});
	selectBoxDropdownElements.forEach((dropdown) => {
		dropdown.classList.remove("opened");
	});
	selectBoxOptionElements.forEach((option) => {
		option.classList.remove(_selectBoxOptionFocused.replace(".", ""), _selectBoxOptionHidden);
	});
	selectBoxElements.forEach((select) => {
		if (select.classList.contains("searchable")) {
			const selectSearch = select.querySelector(_selectBoxSearch);
			
			if(selectSearch) {
				selectSearch.remove();
			}
		}
	});
}