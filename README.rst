Map 5k
======
A browser extension (Chrome, Firefox) for viewing an athlete's parkruns on an
interactive map.

Build
-----
On linux browse to the root directory of the repository and run:
./build.sh

This will create the following files and folders one directory up:
::
  build/
    chrome/
    firefox/
    map5k-chrome.zip
    map5k-firefox.zip

The chrome and firefox folders contain Extensions which can be installed
locally; the zips are ready to be uploaded to Chrome store and Firefox
developer hub.

Install locally
---------------

Chrome
^^^^^^
1. Browse to the URL chrome://extensions
2. Ensure "Developer mode" (top right) is selected.
3. Click "Load unpacked".
4. Browse to the src folder, then click "Open".
5. The extension's icon should appear on the menu bar automatically.

Firefox
^^^^^^^
1. Browse to the URL about:debugging.
2. Click "Load Temporary Add-on".
3. Browse to the src folder and double-click the manifest.json file.
4. The extension's icon should appear on the menu bar automatically.

How to use
----------
Click this new icon and choose "Settings".
Set your Athlete ID and save.
Open the menu again and choose "Athlete Results".
Click the map marker/pin button (appears underneath the total number of parkruns).
