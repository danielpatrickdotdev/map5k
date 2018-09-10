/*
 * Calculate the hours since a given date string
 * Accepts the same dateString formats as new Date()
 */
function hoursSince(dateString) {
  const msSince = (new Date()).getTime() - (new Date(dateString)).getTime();
  return msSince / 1000 / 60 / 60;
}

// Confirm that the parkrunRegion object matches our expected format
function validateRegion(parkrunRegion) {
  function isValidParkrunUrl(url) {
    return (url.match(/^https:\/\/www\.parkrun(?:\.[a-z]+){1,2}$/) !== null);
  }
  const latitudeRegex = /^-?(?:90|(?:(?:[1-8]?[0-9])(?:\.[0-9]{1,6})?))$/;
  const longitudeRegex = /^-?(?:180|(?:(?:1[0-7]?[0-9]|[1-9]?[0-9])(?:\.[0-9]{1,6})?))$/;

  const {
    id,
    name,
    latitude,
    longitude,
    pid,
    url
  } = parkrunRegion;

  // this may be a bit "belt & braces" but I'd rather be thorough
  return (typeof id === "number" && Number.isInteger(id) && id > 0) &&
         (typeof name === "string" && name !== "") &&
         (typeof latitude === "string" && latitude.match(latitudeRegex) !== null) &&
         (typeof longitude === "string" && longitude.match(longitudeRegex) !== null) &&
         (pid === null || (typeof pid === "number" && Number.isInteger(pid) && pid > 0)) &&
         (url === null || (typeof url === "string" && isValidParkrunUrl(url)));
}

// Confirm that the parkrunEvent object matches our expected format
function validateEvent(parkrunEvent) {
  const slugRegex = /^(?:[a-z0-9][a-z0-9-]+)*[a-z0-9]$/;
  const latitudeRegex = /^-?(?:90|(?:(?:[1-8]?[0-9])(?:\.[0-9]{1,6})?))$/;
  const longitudeRegex = /^-?(?:180|(?:(?:1[0-7]?[0-9]|[1-9]?[0-9])(?:\.[0-9]{1,6})?))$/;
  const {
    id,
    name,
    country,
    region,
    slug,
    isJuniors,
    isRestricted,
    isCancelled,
    latitude,
    longitude
  } = parkrunEvent;

  // this may be a bit "belt & braces" but I'd rather be thorough
  return (id === null || (typeof id === "number" && Number.isInteger(id) && id > 0)) &&
         (typeof country === "number" && Number.isInteger(country) && country > 0) &&
         (typeof region === "number" && Number.isInteger(region) && region > 0) &&
         (typeof name === "string" && name !== "") && 
         (typeof slug === "string" && slug.match(slugRegex) !== null) &&
         (typeof isJuniors === "boolean") &&
         (typeof isRestricted === "boolean") &&
         (typeof isCancelled === "boolean") &&
         (typeof latitude === "string" && latitude.match(latitudeRegex) !== null) &&
         (typeof longitude === "string" && longitude.match(longitudeRegex) !== null);
}

// Returns response XML if response code is 2XX otherwise returns empty XML file
async function getXMLContent(url) {
  const headers = new Headers({"Accept": "application/xml, text/xml"});

  return fetch(url, {headers})
    .then(function(response) {
      return response.text().then(function(data) {
        if (response.ok) {
          return data;
        } else {
          return Promise.reject({status: response.status, data});
        }
      })
    })
    .catch(function(err) {
      console.log(err);
      // Likely a network error - no need to break things so just return
      // an empty xml doc
      return "<?xml version=\"1.0\" ?>";
    })
}

// Fetch all XML data from parkrun and also load local data
async function getXmlDOMs() {
  const baseUrl = "https://www.parkrun.org.uk/wp-content/themes/parkrun/xml/";
  const geoUrl = baseUrl + "geo.xml";
  const jrGeoUrl = baseUrl + "geojuniors.xml";
  const localGeoUrl = "/data/geo_restricted_or_discontinued.xml";

  // Use await instead of Promise.all because we don't want to reject all
  // results in the case of one error
  const parkrunXML = await getXMLContent(geoUrl);
  const juniorXML = await getXMLContent(jrGeoUrl);
  const otherXML = await getXMLContent(localGeoUrl);

  const parser = new DOMParser();

  return {
    mainXML: parser.parseFromString(parkrunXML, "application/xml"),
    juniorXML: parser.parseFromString(juniorXML, "text/xml"),
    otherXML: parser.parseFromString(otherXML, "text/xml")
  };
}

/*
 * Specifically test for NaN because hacky approach is hacky:
 *   (parseInt("") || null) === (parseInt("0" || null)
 *   (parseInt("") || 0) === (parseInt("0" || 0)
 *
 * This way we ensure zero and null are distinct values
 */
function parseIntOrNull(str) {
  const n = parseInt(str);
  return isNaN(n) ? null : n;
}

// Parse all XML DOMs to build and validate region objects
// Returns Map of region objects with integer IDs as keys
function parseRegions({mainXML, juniorXML, otherXML}) {
  // Create a region object from given XML tag's data
  function createRegion(tag) {
    return {
      id: parseIntOrNull(tag.getAttribute("id")),
      name: tag.getAttribute("n"),
      latitude: tag.getAttribute("la") || null,
      longitude: tag.getAttribute("lo") || null,
      // not actually sure what z is for
      //z: parseIntOrNull(tag.getAttribute("z")),
      pid: parseIntOrNull(tag.getAttribute("pid")),
      url: tag.getAttribute("u").replace("http://", "https://") || null
    };
  }

  // Combine r tags from 3 XML DOMs
  regionTags = [
    ...mainXML.querySelectorAll("r"),
    ...juniorXML.querySelectorAll("r"),
    ...otherXML.querySelectorAll("r")
  ]

  // Turn this Array into a Map
  const regions = regionTags.reduce(function(acc, tag) {
    const region = createRegion(tag);

    // Only add to the map if data is valid and we don't already have it
    if (validateRegion(region) && !acc.has(region.id)) {
      acc.set(region.id, region);
    }
    return acc;
  }, new Map());

  return regions;
}

// Parse all XML DOMs to build and validate event objects
// Returns Map of event objects with url strings as keys
function parseEvents({mainXML, juniorXML, otherXML}, regions) {
  /* Traverses region tree using region's parent ID (.pid) until it finds
   * a region with a url (this must be the top-level country).
   *
   * If original region is a country, returns this region's ID.
   *
   * If no ancestor region has a url, returns null
   * If it meets an ancestor without a pid, returns null
   * If it traverses 20 levels without finding a match, returns null
   */
  function getCountryId(regionId, n=20) {
    // Guard against malformed data by limiting recursive calls to 20
    if (n-- === 0) {
      return null
    }

    const region = regions.get(regionId);
    // If we haven't found a region with this ID or this region has no parent
    if (!region || region.pid === null || !regions.has(region.pid)) {
      return null;
    }
    // If we've found a region with a url with "World" as a parent
    if (region.url !== null && region.pid === 1) {
      return region.id;
    }
    // If all the above fail, keep going up the tree
    return getCountryId(regions.get(region.pid).id, n);
  }

  // Create an event object from given XML tag's data
  function createParkrunEvent(tag, isJuniors) {
    const region = parseIntOrNull(tag.getAttribute("r"));
    const country = getCountryId(region);

    const info = tag.getAttribute("info") || null;
    const isCancelled = info !== null && info === "cancelled";
    const isRestricted = info !== null && info === "restricted";

    return {
      id: parseIntOrNull(tag.getAttribute("id")),
      name: tag.getAttribute("m"),
      slug: tag.getAttribute("n").toLowerCase(),
      latitude: tag.getAttribute("la") || null,
      longitude: tag.getAttribute("lo") || null,
      // not actually sure what c is for
      //c: parseIntOrNull(tag.getAttribute("c")),
      region,
      country,
      isCancelled,
      isRestricted,
      isJuniors
    };
  }


  // Construct url from event and region data
  function getUrl(parkrunEvent) {
    if (parkrunEvent.country === null) {
      return null;
    }
    return regions.get(parkrunEvent.country).url + "/" + parkrunEvent.slug;
  }

  // Since we need to treat data from each XML file differently, we'll have to
  // use forEach instead of reduce (which we use for regions)
  const parkrunEvents = new Map();
  function parseAndAddEvents(eventTags, isJuniors=false) {
    eventTags.forEach(function(tag) {
      const parkrunEvent = createParkrunEvent(tag, isJuniors);

      url = getUrl(parkrunEvent);
      if (url !== null && validateEvent(parkrunEvent) &&
          !parkrunEvents.has(url)) {
        parkrunEvents.set(url, parkrunEvent);
      //} else {
      //  console.log("Invalid data for event:", parkrunEvent);
      }
    });
  }

  parseAndAddEvents(mainXML.querySelectorAll("e"));
  parseAndAddEvents(juniorXML.querySelectorAll("e"), isJuniors=true);
  parseAndAddEvents(otherXML.querySelectorAll("e"));

  return parkrunEvents;
}

// Download and validate event and region info, update storage
function updateEventData() {
  return getXmlDOMs()
    .then(function(xmlDOMs) {
      const regions = parseRegions(xmlDOMs);
      const events = parseEvents(xmlDOMs, regions);

      browser.storage.local.set({parkrunRegions: [...regions.values()]})
        .catch(function(err) {
          console.log(err);
        });
      browser.storage.local.set({parkrunEvents: [...events.values()]})
        .catch(function(err) {
          console.log(err);
        });
    })
}

// If data hasn't been updated in over 12 hours, retrieve fresh data from API
function checkDataUpToDate() {
  browser.storage.local.get({lastEventLocationSync: null})
    .then(function(data) {
      const {lastEventLocationSync:date} = data || {};

      if (date === null || hoursSince(date) >= 12) {
        updateEventData()
          .then(function() {
            const dateString = (new Date()).toUTCString();
            browser.storage.local.set({lastEventLocationSync: dateString})
              .catch(function(err) {
                console.log(err);
              });
          })
      }
    })
    .catch(function(err) {
      console.log(err);
    })
}

// Run each time firefox starts
browser.runtime.onStartup.addListener(checkDataUpToDate);

// Run when event is installed or updated, and when browser is updated
browser.runtime.onInstalled.addListener(checkDataUpToDate);
