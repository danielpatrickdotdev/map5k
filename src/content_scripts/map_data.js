async function initEventsData() {

  // Private data & methods

  // Retrieve regions/countries and events data from storage
  async function _getStoredData() {
    return browser.storage.local.get({parkrunRegions: [], parkrunEvents: []})
      .then(function(data) {
        return data;
      })
      .catch(function(err) {
        console.log(err);
        return {parkrunRegions: [], parkrunEvents: []};
      });
  }

  /* Parse athlete event data from the current DOM
   * Returns an object containing:
   *   results: a Map which has the following:
   *     keys: event URLs
   *     values: Arrays of event result data, eg:
   *       [{
   *         date: Date object,
   *         runNumber: integer,
   *         position: integer,
   *         time: RaceTime object,
   *         ageGrade: string eg 50.00%,
   *         pb: boolean
   *       }]
   */
  function _getAthleteEventData() {
    // Get all tables in page
    const tables = document.querySelectorAll("table.sortable");
    if (!(tables instanceof NodeList) || tables.length < 2) {
      // No point in continuing if the format of the page has changed
      console.log("Problem locating event summary table");
      return [];
    }

    // Get all the anchor tags from the first column of 2nd table
    //const selector = "tbody tr td:first-child a";
    const eventResultLinkNodes = tables[1].querySelectorAll("tbody tr");
    if (!(eventResultLinkNodes instanceof NodeList)) {
      // No point in continuing if the format of the page has changed
      console.log("Problem reading event summary table");
      return [];
    }

    // Parse the hrefs of these anchor tags into the format we want
    const nodeArray = Array.from(eventResultLinkNodes);
    const eventData = nodeArray.reduce(function(acc, row) {
      // get URL
      const runUrlCell = row.querySelector("td:first-child")
      const url = runUrlCell.firstElementChild.href
          .replace("http://", "https://")
          .replace("/results", "")
          .replace("/rezultaty", "");

      // get run date
      const runDateCell = runUrlCell.nextElementSibling;
      const runDateString = runDateCell.firstElementChild.textContent;
      const regex = /^([\d]{1,2})\/([\d]{1,2})\/([\d]{4})$/;
      const [all, d, m, y] = runDateString.match(regex) || [];
      const date = all === undefined ? undefined : new Date(`${y}-${m}-${d}`);

      // get run numbers
      const runNumberCell = runDateCell.nextElementSibling;
      const runNumber = parseInt(runNumberCell.textContent);

      // get position
      const runPositionCell = runNumberCell.nextElementSibling;
      const position = parseInt(runPositionCell.textContent);

      // get time
      const runTimeCell = runPositionCell.nextElementSibling;
      const timeString = runTimeCell.textContent;
      const time = RaceTime(timeString);

      // get age grade
      const runAgeGradeCell = runTimeCell.nextElementSibling;
      const ageGrade = runAgeGradeCell.textContent;

      // get PB boolean
      const runPBCell = runAgeGradeCell.nextElementSibling;
      pb = runPBCell.textContent === "PB";

      // construct result
      const result = {
        // Just return all the data - we're agnostic about what might be useful
        date,
        runNumber,
        position,
        time,
        ageGrade,
        pb
      }

      if (acc.results.has(url)) {
        acc.results.get(url).push(result);
      } else {
        acc.results.set(url, [result]);
      }
      return acc;
    }, {results: new Map()});

    return eventData;
  }

  // Arrays of regions and events
  const {
    parkrunRegions: _parkrunRegions,
    parkrunEvents: _parkrunEvents
  } = await _getStoredData();

  // Object of regions referenced by country.id
  const _regionsById = _parkrunRegions.reduce(function(acc, cur) {
    acc[cur.id] = cur;
    return acc;
  }, {});

  // Object of events referenced by their computed url
  const _eventsByUrl = _parkrunEvents.reduce(function(acc, cur) {
    acc[_regionsById[cur.country].url + "/" + cur.slug] = cur;
    return acc;
  }, {});

  // Returns the event for a given url, or null if not doesn't exist
  function _eventForUrl(url) {
    return (_eventsByUrl[url] !== undefined) ? _eventsByUrl[url] : null;
  }

  // Returns the region with the given id, or null if doesn't exist
  function _regionForId(id) {
    return (_regionsById[id] !== undefined) ? _regionsById[id] : null;
  }

  // Array of objects containing event urls, dates run etc
  const _athleteEventData = _getAthleteEventData();

  function _filterData(filters=[]) {
    const filteredResults = [];
    _athleteEventData.results.forEach(function(results, url) {
      const parkrunEvent = _eventForUrl(url);

      if (parkrunEvent === null) {
        console.log(`unable to locate parkrun event ${url}`);
      } else {
        const {
          id, name, longitude, latitude, country, region,
          isJuniors, isRestricted, isCancelled
        } = parkrunEvent;

        const country_name = _regionForId(country).name;
        const region_name = _regionForId(region).name;

        const eventData = {
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
            id,
            name,
            url,
            country_name,
            country_id: country,
            region_name,
            region_id: region,
            isJuniors,
            isRestricted,
            isCancelled,
            results
          };

        if (filters.every(func => func(eventData))) {
          filteredResults.push(eventData);
        }
      }
    });
    return filteredResults;
  }

  // Public methods

  // Returns Array of event data objects
  function allEvents() {
    return _filterData();
  }
  // Returns Array of event data objects after applying filter functions
  function filter(filters=[]) {
    if (typeof filters === "function") {
      filters = [filters];
    } else if (!(filters instanceof Array)) {
      throw new TypeError("Invalid filter(s) passed to _filterData()" +
                          ". Must be function or Array of functions");
    }
    return _filterData(filters);
  }
  // Returns an Array of all years in which the athlete has run
  function getYears() {
    const yearsSet = new Set();
    _athleteEventData.results.forEach(function(eventResults, url) {
      eventResults.forEach(function(eventResult) {
        yearsSet.add(eventResult.date.getFullYear());
      });
    });
    return Array.from(yearsSet).sort();
  }
  // Returns an object containing slowestTime and fastestTime,
  // given in number of seconds
  function getFastestAndSlowestTimes() {
    let slowestTime, fastestTime;
    _athleteEventData.results.forEach(function(eventResults, url) {
      eventResults.forEach(function(eventResult) {
        const {time} = eventResult;
        if (slowestTime === undefined || time > slowestTime) {
          slowestTime = time;
        }
        if (fastestTime === undefined || time < fastestTime) {
          fastestTime = time;
        }
      });
    });
    return {
      slowestTime: slowestTime || RaceTime.MAX,
      fastestTime: fastestTime || RaceTime.MIN
    };
  }

  return Object.freeze({
    allEvents,
    filter,
    getYears,
    getFastestAndSlowestTimes
  });
};

/*
 * Returns a promise which resolves to an object containing
 * the last filters applied for the given athlete
 * Filters which may be returned are:
 *   years: Array of years given as numbers in YYYY format
 *   times: Object containing two elements:
 *     slowestTime: RaceTime object
 *     fastestTime: RaceTime object
 * If no previous filters have been applied, objects may be empty or not exist
 */
async function getLastUsedFilters(athleteId) {
  return browser.storage.local.get({parkrunFilters: {}})
    .then(function(data) {
      const filters = data.parkrunFilters[athleteId] || {};

      // deserialize times
      const {times} = filters || {};
      if (times && times.slowestTime !== undefined) {
        times.slowestTime = RaceTime(times.slowestTime);
      }
      if (times && times.fastestTime !== undefined) {
        times.fastestTime = RaceTime(times.fastestTime);
      }

      return filters;
    })
    .catch(function(err) {
      console.log(err);
      return {};
    });
}

/*
 * Stores filters to database for later use by getLastUsedFilters
 *
 * Arguments:
 *   athleteId: number
 *   filters: object containing (all optional):
 *     years: Array of years given as numbers in YYYY format
 *     times: Object containing two elements:
 *       slowestTime: RaceTime object
 *       fastestTime: RaceTime object
 */
function setLastUsedFilters(athleteId, filters) {
  browser.storage.local.get({parkrunFilters: {}})
    .then(function(data) {
      // serialize times
      const {slowestTime, fastestTime} = filters.times || {};
      if (slowestTime !== undefined) {
        filters.times.slowestTime = slowestTime.toSeconds();
      }
      if (fastestTime !== undefined) {
        filters.times.fastestTime = fastestTime.toSeconds();
      }

      // attribute filters to athlete and then store
      data.parkrunFilters[athleteId] = filters;
      browser.storage.local.set({parkrunFilters: data.parkrunFilters});
    })
    .catch(function(err) {
      console.log(err);
    });
}
