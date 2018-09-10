/*
 * Creates the button for toggling map visibility
 * Argument: callback that shows/hides the map
 */
function ToggleMapBtn(toggleMapVisibilityCallback) {
  function _createMapBtn({iconHTML, id, title, hidden, handler}) {
    const _nameDiv = document.querySelector("h2");
    const btn = document.createElement("button");
    btn.title = title;
    btn.id = id;
    btn.innerHTML = iconHTML;
    btn.classList.add("btn", "toggle-map");
    if (hidden) {
      btn.classList.add("hidden");
    }
    btn.addEventListener("click", handler);
    _nameDiv.parentElement.insertBefore(btn, _nameDiv.nextElementSibling);
    return btn;
  }
  function _showMapHandler(e) {
    _showMapBtn.classList.add("hidden");
    _hideMapBtn.classList.remove("hidden");
    toggleMapVisibilityCallback();
    e.preventDefault();
  }
  function _hideMapHandler(e) {
    _showMapBtn.classList.remove("hidden");
    _hideMapBtn.classList.add("hidden");
    toggleMapVisibilityCallback();
    e.preventDefault();
  }
  const _showMapBtn = _createMapBtn({
    iconHTML: mapMarkerIcon,
    id: "show-map-btn",
    title: "Show map",
    hidden: false,
    handler: _showMapHandler
  });
  const _hideMapBtn = _createMapBtn({
    iconHTML: mapMarkerCrossedIcon,
    id: "hide-map-btn",
    title: "Hide map",
    hidden: true,
    handler: _hideMapHandler
  });
}

function FilterBtn(initiallyFiltered, clickHandler) {
  const _filterBtn = document.createElement("button");
  _filterBtn.addEventListener("click", clickHandler);

  const _filterBtnDiv = document.createElement("div");
  _filterBtnDiv.className = "filter-btn ol-unselectable ol-control";
  _filterBtnDiv.appendChild(_filterBtn);

  setFiltered(initiallyFiltered);

  // Public methods
  function setFiltered(filtered=false) {
    if (filtered) {
      _filterBtn.innerHTML = activeFilterIcon;
    } else {
      _filterBtn.innerHTML = filterIcon;
    }
  }
  function getElement() {
    return _filterBtnDiv;
  }

  return Object.freeze({
    setFiltered,
    getElement
  });
}

function RaceTimeInput({
  id,
  initialTime,
  defaultTime,
  minTime,
  maxTime,
  inputUpdatedCallback = () => {}
}) {
  const _timePattern = "^[0-9]{1,2}:[0-5][0-9]$";

  const _input = document.createElement("input");
  _input.type = "text";
  _input.maxLength = 5;
  _input.pattern = _timePattern;
  _input.classList.add("time-input");
  _input.id = id;
  _input.addEventListener("wheel", _inputWheelHandler);
  _input.addEventListener("change", _inputChangeHandler);
  setValue(initialTime.toString());

  function _inputChangeHandler(e) {
    // Allow checking and dealing with any errors
    inputUpdatedCallback();
  }

  /*
   * When the mouse wheel is used over the input, we'll increment/decrement
   * the input's value.
   * We change the minutes or seconds value depending on which the mouse is
   * over at the time of the wheel event
   */
  function _inputWheelHandler(e) {
    /* Set movement as +/- 1 depending on scroll up or down. Have to reverse the
     * sign as wheel events capture downward scrolls as negative.
     * Due to Chrom and Firefox capturing different values for the same type of
     * event it's safest to just use Math.sign
     */
    const movement = -Math.sign(e.deltaY);
    const multiplier = e.offsetX >= 1  && e.offsetX <= 20 ? 60:
                       e.offsetX >= 24 && e.offsetX <= 43 ?  1 : 0;
    // First check we have a valid input value
    if (isValid()) {
      const time = getValue();
      // Add 1 or 60 seconds to previous time
      const newTime = time.add(movement * multiplier);

      // If this takes us outside the min/maxTime range, set to min or max
      if (newTime < minTime) {
        setValue(minTime);
      } else if (newTime > maxTime) {
        setValue(maxTime);
      } else {
        setValue(newTime);
      }
      // Allow additional processing to occur via callback
      inputUpdatedCallback();
    }

    e.preventDefault();
  }

  function isValid() {
    return _input.value.trim().match(_timePattern) !== null;
  }
  function reset(e) {
    setValue(defaultTime.toString());
    inputUpdatedCallback();
    e.preventDefault();
  }
  function markInvalid() {
    _input.classList.add("error");
  }
  function unmarkInvalid() {
    _input.classList.remove("error");
  }
  function getElement() {
    return _input;
  }
  function getValue() {
    // Should not be used unless isValid() returns true - will blow up
    // if invalid
    return RaceTime(_input.value.trim());
  }
  function setValue(raceTime) {
    _input.value = raceTime.toString();
  }

  return Object.freeze({
    reset,
    isValid,
    markInvalid,
    unmarkInvalid,
    getElement,
    getValue,
    setValue
  });
}

function FilterMenu({
  availableFilters = {
    years: [],
    times: {}
  },
  selectedFilters = {},
  applyFiltersCallback
}) {
  // Private variables and functions
  const _yearHeading = document.createElement("p");
  _yearHeading.classList.add("filter-heading");
  _yearHeading.textContent = "Date";

  const _yearCheckboxes = availableFilters.years.map(function(year) {
    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = `year-checkbox-${year}`;
    input.checked = selectedFilters.years == undefined ||
                    selectedFilters.years.includes(year);

    const label = document.createElement("label");
    label.htmlFor = input.id;
    label.textContent = `${year}`;

    const div = document.createElement("div");
    div.classList.add("checkbox");
    div.appendChild(input);
    div.appendChild(label);
    return div;
  });

  const _yearCheckboxesDiv = document.createElement("div");
  _yearCheckboxesDiv.id = "year-checkboxes";
  _yearCheckboxesDiv.classList.add("filter-form-column");
  _yearCheckboxesDiv.appendChild(_yearHeading);
  _yearCheckboxes.forEach(function(checkboxDiv) {
    _yearCheckboxesDiv.appendChild(checkboxDiv);
  });

  const _timesHeading = document.createElement("p");
  _timesHeading.classList.add("filter-heading");
  _timesHeading.textContent = "Time taken";

  // Set initial time filters
  const {
    slowestTime,
    fastestTime
  } = selectedFilters.times || availableFilters.times;

  const _minTimeLabel = document.createElement("label");
  _minTimeLabel.htmlFor = "min-time-input";
  _minTimeLabel.textContent = "Min";

  const _minTimeInput = RaceTimeInput({
    id: "min-time-input",
    initialTime: fastestTime,
    defaultTime: availableFilters.times.fastestTime,
    minTime: availableFilters.times.fastestTime,
    maxTime: availableFilters.times.slowestTime,
    inputUpdatedCallback: _validateTimeInputs
  });

  const _minTimeResetBtn = document.createElement("button");
  _minTimeResetBtn.classList.add("time-reset-btn");
  _minTimeResetBtn.innerHTML = resetIcon;
  _minTimeResetBtn.addEventListener("click", _minTimeInput.reset);

  const _minTimeDiv = document.createElement("div");
  _minTimeDiv.classList.add("time-input");
  _minTimeDiv.appendChild(_minTimeLabel);
  _minTimeDiv.appendChild(_minTimeInput.getElement());
  _minTimeDiv.appendChild(_minTimeResetBtn);

  const _maxTimeLabel = document.createElement("label");
  _maxTimeLabel.htmlFor = "max-time-input";
  _maxTimeLabel.textContent = "Max";

  const _maxTimeInput = RaceTimeInput({
    id: "max-time-input",
    initialTime: slowestTime,
    defaultTime: availableFilters.times.slowestTime,
    minTime: availableFilters.times.fastestTime,
    maxTime: availableFilters.times.slowestTime,
    inputUpdatedCallback: _validateTimeInputs
  });

  const _maxTimeResetBtn = document.createElement("button");
  _maxTimeResetBtn.classList.add("time-reset-btn");
  _maxTimeResetBtn.innerHTML = resetIcon;
  _maxTimeResetBtn.addEventListener("click", _maxTimeInput.reset);

  const _maxTimeDiv = document.createElement("div");
  _maxTimeDiv.classList.add("time-input");
  _maxTimeDiv.appendChild(_maxTimeLabel);
  _maxTimeDiv.appendChild(_maxTimeInput.getElement());
  _maxTimeDiv.appendChild(_maxTimeResetBtn);

  const _errorSpan = document.createElement("span");
  _errorSpan.classList.add("error", "hidden");

  const _timesSelectorDiv = document.createElement("div");
  _timesSelectorDiv.id = "times-selectors";
  _timesSelectorDiv.classList.add("filter-form-column");
  _timesSelectorDiv.appendChild(_timesHeading);
  _timesSelectorDiv.appendChild(_minTimeDiv);
  _timesSelectorDiv.appendChild(_maxTimeDiv);
  _timesSelectorDiv.appendChild(_errorSpan);

  const _applyFilterBtn = document.createElement("button");
  _applyFilterBtn.type = "submit";
  _applyFilterBtn.id = "apply-filter-btn";
  _applyFilterBtn.textContent = "Apply";

  const _filterForm = document.createElement("form");
  _filterForm.appendChild(_yearCheckboxesDiv);
  _filterForm.appendChild(_timesSelectorDiv);
  _filterForm.appendChild(_applyFilterBtn);

  const _filterDropdown = document.createElement("div");
  _filterDropdown.classList.add("filter-dropdown", "ol-unselectable", "ol-control");
  _filterDropdown.appendChild(_filterForm);

  // Clear existing error messages, check for any invalid states and apply new
  // error messages if necessary. Return boolean indicating if any errors found
  function _validateTimeInputs() {
    _clearErrors();

    const min = _minTimeInput.isValid(),
          max = _maxTimeInput.isValid();

    if (!min && !max) {
      _minTimeInput.markInvalid();
      _maxTimeInput.markInvalid();
      _setError("Invalid Times");
      return false;
    } else if (!min) {
      _minTimeInput.markInvalid();
      _setError("Invalid Min");
      return false;
    } else if (!max) {
      _maxTimeInput.markInvalid();
      _setError("Invalid Max");
      return false;
    } else if (_minTimeInput.getValue() > _maxTimeInput.getValue()) {
      _minTimeInput.markInvalid();
      _maxTimeInput.markInvalid();
      _setError("Max < Min");
      return false;
    }
    return true;
  }
  // Display error message
  function _setError(msg) {
    _errorSpan.textContent = msg;
    _errorSpan.classList.remove("hidden");
  }
  // Clears error message and resets error status on time inputs
  function _clearErrors() {
    _minTimeInput.unmarkInvalid();
    _maxTimeInput.unmarkInvalid();
    _errorSpan.textContent = "";
    _errorSpan.classList.add("hidden");
  }

  // Process form in filter dropdown
  function _applyFilterHandler(e) {
    e.preventDefault();

    // First check if we have any issues (and show errors if we do)
    if (_validateTimeInputs()) {
      // If form validates we'll go ahead and process the form
      const checkboxInputs = _yearCheckboxesDiv.querySelectorAll("input");
      const filteredYears = Array.from(checkboxInputs).filter(function(checkbox) {
        return checkbox.checked;
      }).map(function(checkbox) {
        return parseInt(checkbox.id.replace("year-checkbox-", ""));
      });

      const filtersToApply = {
        years: filteredYears,
        times: {
          fastestTime: _minTimeInput.getValue(),
          slowestTime: _maxTimeInput.getValue()
        }
      };

      // Hand filter info over to callback
      applyFiltersCallback(filtersToApply);
    }
  }
  _applyFilterBtn.addEventListener("click", _applyFilterHandler);
  _applyFilterBtn.addEventListener("dblclick", _applyFilterHandler);

  hide();

  // Public methods
  function show() {
    _filterDropdown.classList.remove("hidden");
  }
  function hide() {
    _filterDropdown.classList.add("hidden");
  }
  function getElement() {
    return _filterDropdown;
  }

  return Object.freeze({
    show,
    hide,
    getElement
  });
}


/*
 * Constructs html for map and returns an interface for interacting with it
 *
 * Arguments
 * markers, an Array of coordinate objects:
 *   {coordinates: [longitude (float), latutude (float)]}
 * avilableFilters, object:
 *   {
 *     years, an Array of years for which parkrun results exist for this athlete
 *     times, an object with the slowestTime and fastestTime run
 *   }
 * selectedFilters, object:
 *   {
 *     years, an Array of years which we want to display for this athlete
 *     times, an object with the slowestTime and fastestTime we want to display
 *   }
 * markerColor (optional), hex color including hash
 * initiallyFiltered (optional), boolean indicating whether filter button
 *                               should be marked active or not
 */
function ParkrunMap({
    markers: initialMarkers=[],
    markerColor = "#000000",
    initiallyFiltered = false
}) {
  // Start map
  const _mapDiv = (function() {
    const mapDiv = document.createElement("div");
    mapDiv.id = "map";
    const _contentDiv = document.querySelector("div#content");
    const _firstResultsDiv = (Array.from(
        _contentDiv.querySelectorAll("div")) || []).find(function(div) {
      return (div.id === "" && div.classList.length === 0);
    });
    _contentDiv.insertBefore(mapDiv, _firstResultsDiv);
    return mapDiv;
  })();

  const _map = (function() {
    const map = new ol.Map({
      target: "map",
      layers: [
        new ol.layer.Tile({
          source: new ol.source.OSM()
        })
      ],
      view: new ol.View({
        center: ol.proj.fromLonLat([-0.329985, 51.413849]), // Bushy Park
        zoom: 2
      })
    });
    return map;
  })();
  // End map

  // Start vector layer and actions
  function _getIconStyle(fillColor="#000000") {
    const iconStyle = new ol.style.Style({
      image: new ol.style.Icon(({
        img: getMarkerIcon({fillColor}),
        imgSize: [24, 24],
        anchor: [0.5, 1]
      }))
    });
    return iconStyle;
  }
  const _vectorLayer = (function() {
    // Create the default style of our icons (may vary styles later)
    const features = new ol.Collection([], {unique: true});
    // Create vector layer and add to map
    const vectorLayer = new ol.layer.Vector({
      source: new ol.source.Vector({features}),
      style: _getIconStyle()
    });
    return vectorLayer;
  })();
  _map.addLayer(_vectorLayer);

  function _autoZoom() {
    const options = {
      size: _map.getSize(),
      padding: [50, 50, 50, 50],
      minResolution: 50
    };

    let extent = _vectorLayer.getSource().getExtent();
    // OpenLayers crashes silently if we have Infinity in extent
    if (!extent.every(isFinite)) {
      extent = _map.getView().calculateExtent();
    }

    _map.getView().fit(extent, options);
  }
  // End vector layer and actions

  hide();


  // Public methods
  function show() {
    _mapDiv.classList.remove("hidden");
    _map.updateSize();
  }
  function hide() {
    _mapDiv.classList.add("hidden");
  }
  function addFilterBtn(element) {
    const filterControl = new ol.control.Control({
      element
    });
    _map.addControl(filterControl);
  }
  function addFilterMenu(filterMenu) {
    document.querySelector(".filter-btn").parentElement.appendChild(filterMenu);
  }
  // Add athlete's event markers to map
  function drawMarkers(markerData) {
    // Get current markers
    const _markerCollection = _vectorLayer.getSource().getFeaturesCollection();

    // Remove existing markers
    _markerCollection.clear();

    // Sort coordinates so that southernmost pins are placed last,
    // and thus appear on top
    markerData.sort(function(a, b) {
      if (a.coordinates[1] > b.coordinates[1]) {
        return -1;
      } else if (a.coordinates[1] < b.coordinates[1]) {
        return 1;
      } else {
        return 0;
      }
    });

    // Create points on map AKA features
    markerData.forEach(function(markerData) {
      // Set data for drawing markers
      // Default to markerColor (as passed to the top level function)
      // if color is undefined
      const {coordinates, color=markerColor} = markerData;

      // Create feature with translated coordinates
      const feature = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat(coordinates))
      });

      // Set feature style and add to collection - automatically updates map
      feature.setStyle(_getIconStyle(color));
      _markerCollection.push(feature);
    });

    // zoom to extent of new set of markers
    _autoZoom();
  }

  return {
    show,
    hide,
    addFilterBtn,
    addFilterMenu,
    drawMarkers
  };
}
