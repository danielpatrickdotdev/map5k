// Elements we'll be using
const submitBtn = document.getElementById("save-options-btn");
const idInput = document.getElementById("parkrun-id-input");
const idInputGroup = document.getElementById("parkrun-id-input-group");
const form = document.getElementById("options-form");

const successDiv = document.createElement("div");
successDiv.classList = "alert alert-success";
successDiv.innerHTML = `\
      <svg class="icon icon-success">
        <use href="/assets/images/icons/fa-solid.svg#check-circle"/>
      </svg>
      Parkrun ID saved`;

const invalidDiv = document.createElement("div");
invalidDiv.classList = "alert alert-danger";
invalidDiv.innerHTML = `\
      <svg class="icon icon-error">
        <use href="/assets/images/icons/fa-solid.svg#exclamation-triangle"/>
      </svg>
      Please enter a valid parkrun ID.`;

// Regex matches parkrun IDs (optional a/A followed by 1-10 digits)
// Bracketed group catches digits only as we won't store the A
const idRegex = /^A?([\d]{1,10})$/i;

/* Event handlers */

// Imports user settings and inserts into form
function loadSettings(e) {
  // Get parkrun ID from storage, return empty string if nothing in storage
  browser.storage.sync.get({parkrunId: ""})
    .then(function(items) {
      // replace form input value with retreived ID, if input value empty
      if (idInput.value === "") {
        idInput.value = items.parkrunId;
      }
    })
    .catch(function(err) {
      console.log(err);
    });
}

// To be called when input changes value or loses focus
// Only sides affect is to hide/show form errors
function validateFormHandler(e) {
  hideError();

  if (getValidatedId() === null) {
    showError();
  }

  e.preventDefault();
}

// Handler for form submission
function submitHandler(e) {
  hideError();

  const [matched, id] = getValidatedId() || [];

  if (matched === undefined) {
    // not a valid ID
    showError();
  } else {
    // Remove the A from form input if it exists
    if (id !== matched) {
      idInput.value = id;
      console.log(matched, id);
    }

    // Store ID (as string) in backend for use later
    browser.storage.sync.set({parkrunId: id})
      .catch(function(err) {
        console.log(err);
      });

    form.appendChild(successDiv);
    setTimeout(function() {
      successDiv.remove();
    }, 3000);
  }

  e.preventDefault();
}

/* Helper functions */

function hideError() {
  // remove error div and input's invalid status if they exist
  invalidDiv.remove();
  idInputGroup.classList.remove("is-invalid");
}

function getValidatedId() {
  // get input and validate against parkrun ID regex
  const input = idInput.value;
  return input.match(idRegex);
}

function showError() {
  // add error message div and set input as invalid
  form.insertBefore(invalidDiv, submitBtn);
  idInputGroup.classList.add("is-invalid");
}

/* Attach event listeners */

// Get user settings after DOM has loaded
document.addEventListener("DOMContentLoaded", loadSettings);

// Handle changes to input value
// (undecided whether it makes better sense to use blur or change event)
idInput.addEventListener("change", validateFormHandler);

// Handle form submission
submitBtn.addEventListener("click", submitHandler);
