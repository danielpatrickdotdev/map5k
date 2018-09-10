function resultsUrl(athleteId) {
  //return "https://www.parkrun.org.uk/results/athleteresultshistory/" +
  //       `?athleteNumber=${athleteId}`;
  return "https://www.parkrun.org.uk/results/athleteeventresultshistory/" +
         `?athleteNumber=${athleteId}&eventNumber=0`;
}

function init(e) {
  const athleteResultsLink = document.getElementById("athlete-results-link");
  const optionsLink = document.getElementById("options-link");

  // Factory creates an event handler to load a given url in tab that has tab_id
  function createLinkingHandler(tab_id, url) {
    function handler(e) {
      browser.tabs.update(tab_id, {url});
      window.close();
      e.preventDefault();
    }
    return handler;
  }

  async function getCurrentTab() {
    return browser.tabs.query({ active:true, currentWindow:true })
      .then(function(tabs) {
        return tabs[0];
      })
    // don't catch - any errors can be handled by consumer of promise
  }

  // Create link and disable if no athlete ID set
  function setupAthleteLink() {
    browser.storage.sync.get({parkrunId: ""})
      .then(function(items) {
        const athleteId = items.parkrunId;
        if (athleteId === "") {
          // Change display so menu item is clearly not active
          athleteResultsLink.classList.add("inactive");
        } else {
          // Handle click on athlete results link
          const url = resultsUrl(athleteId);
          getCurrentTab()
            .then(function(tab) {
              athleteResultsLink.onclick = createLinkingHandler(tab.id, url);
            })
            .catch(function(err) {
              console.log(err);
            })
        }
      })
      .catch(function(err) {
        console.log(err);
      })
  }

  setupAthleteLink();

  // Set action for settings menu item
  optionsLink.onclick = function(e) {
    /*
    // The following might be a better way to do this - needs testing
    browser.runtime.openOptionsPage();
    window.close();
    e.preventDefault();
    */
    const url = "/options/options_page.html";
    getCurrentTab()
      .then(function(tab) {
        browser.tabs.update(tab.id, {url});
        window.close();
        e.preventDefault();
      })
      .catch(function(err) {
        console.log(err);
      })
  }

  // Prevent right-click on menu
  document.addEventListener("contextmenu", function(e){
    e.preventDefault();
  });

}

document.addEventListener("DOMContentLoaded", init);
