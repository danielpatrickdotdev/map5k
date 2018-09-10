// main program
function init() {
  const [, athleteId] = location.href.match(/athleteNumber=(\d+)/);
  let mapVisible = false;
  let filterMenuVisible = false;

  function isFiltered(availableFilters, selectedFilters) {
    const {years, times} = selectedFilters || {};

    let filtered = (years !== undefined) &&
      !availableFilters.years.every(function(year) {
        return years.includes(year);
    });

    filtered = filtered || (times !== undefined &&
              (times.slowestTime < availableFilters.times.slowestTime ||
              times.fastestTime > availableFilters.times.fastestTime));

    return filtered;
  }
  function toggleMapBtnCallback() {
    if (mapVisible) {
      mapVisible = false;
      map.hide();
    } else {
      mapVisible = true;
      map.show();
    }
  }
  function getFilterFuncs(filters) {
    const filterFuncs = [];
    const {years, times} = filters;

    // If years is undefined we shouldn't apply any filters
    // (Currently not checking for year being any other type either)
    if (years instanceof Array) {
      filterFuncs.push(function(parkrunEvent) {
        return parkrunEvent.results.some(function(result) {
          return years.some(function(year) {
            //year = parseInt(year);
            return result.date.getFullYear() === year;
          });
        });
      })
    }
    const {slowestTime, fastestTime} = times || {};
    if (slowestTime !== undefined && fastestTime !== undefined) {
      filterFuncs.push(function(parkrunEvent) {
        return parkrunEvent.results.some(function(result) {
          return (result.time <= slowestTime && result.time >= fastestTime);
        });
      });
    }

    return filterFuncs;
  }

  // Request some data that might take a while to fetch and thus returns promises
  const eventsDataPromise = initEventsData();
  const selectedFiltersPromise = getLastUsedFilters(athleteId);

  // Create map object while we wait
  const map = ParkrunMap({
    markerColor: "#222222"
  });
  const toggleMapBtn = ToggleMapBtn(toggleMapBtnCallback);

  // When promises resolve we can use data to add things to the map
  Promise.all([eventsDataPromise, selectedFiltersPromise])
    .then(function([eventsData, selectedFilters]) {
      function handleFilterMenuBtn(e) {
        if (filterMenuVisible) {
          filterMenuVisible = false;
          filterMenu.hide();
        } else {
          filterMenuVisible = true;
          filterMenu.show();
        }
        e.preventDefault();
      }
      function applyFiltersCallback(selectedFilters) {
        const filterFuncs = getFilterFuncs(selectedFilters);
        const filteredEvents = eventsData.filter(filterFuncs);
        map.drawMarkers(filteredEvents);

        filterMenuVisible = false;
        filterMenu.hide();
        filterBtn.setFiltered(isFiltered(availableFilters, selectedFilters));

        setLastUsedFilters(athleteId, selectedFilters);
      }

      const availableFilters = {
        years: eventsData.getYears(),
        times: eventsData.getFastestAndSlowestTimes()
      };

      map.drawMarkers(eventsData.filter(getFilterFuncs(selectedFilters)));

      const filterMenu = FilterMenu({
        availableFilters,
        selectedFilters,
        applyFiltersCallback
      });
      const filterBtn = FilterBtn(
        isFiltered(availableFilters, selectedFilters), handleFilterMenuBtn
      );

      map.addFilterBtn(filterBtn.getElement());
      map.addFilterMenu(filterMenu.getElement());
    })
    .catch(function(err) {
      console.log(err);
    });
}

// run main program
init();
