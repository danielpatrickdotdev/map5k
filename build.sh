#!/bin/bash

rm -rf ../build/firefox

mkdir -p ../build/firefox

cp -r src/* ../build/firefox

sed -i '/"version"/d' ../build/firefox/manifest.json
sed -i 's/"version_name"/"version"/' ../build/firefox/manifest.json
sed -i '/"persistent":/d' ../build/firefox/manifest.json

pushd ../build/firefox
zip -r ../map5k-firefox.zip *
popd


rm -rf ../build/chrome

mkdir -p ../build/chrome

cp -r src/* ../build/chrome

sed -i '/"applications":/,/},/d' ../build/chrome/manifest.json
sed -i '/"browser_style"/d' ../build/chrome/manifest.json

pushd ../build/chrome
zip -r ../map5k-chrome.zip *
popd
