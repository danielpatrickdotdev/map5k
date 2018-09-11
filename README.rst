======
Map 5k
======

A Firefox and Chrome extension/add-on for viewing an athlete's parkruns on an interactive map.

------------------
Installing Add-ons
------------------

The Firefox add-on is available from `<https://addons.mozilla.org/en-GB/firefox/addon/map-5k/>`_

The add-on is not yet on the Chrome store. For Chrome installations, see `Installing locally`_.

----------
How to use
----------

1. Click the add-on icon in the menu bar and click "Settings" on the drop down menu.
2. Set your parkrun Athlete ID and save.
3. Open the drop down menu again and click "Athlete Results".
4. Click the map marker/pin button (appears underneath the total number of parkruns).

------------------
Installing locally
------------------

1. Build
========
On linux browse to the root directory of the repository and run:
./build.sh

This will create the following files and folders one directory up:
::
  build/
    chrome/
    firefox/
    map5k-chrome.zip
    map5k-firefox.zip

The chrome and firefox folders contain the extensions/add-ons for local installation (the zip files are for submission to the Chrome store and Firefox developer hub).

2. Install
==========

Chrome
------
1. Browse to the URL `<chrome://extensions>`_.
2. Ensure "Developer mode" (top right) is selected.
3. Click "Load unpacked".
4. Browse to the src folder, then click "Open".
5. The extension's icon should appear on the menu bar automatically.

Firefox
-------
1. Browse to the URL `<about:debugging>`_.
2. Click "Load Temporary Add-on".
3. Browse to the src folder and double-click the manifest.json file.
4. The extension's icon should appear on the menu bar automatically.
