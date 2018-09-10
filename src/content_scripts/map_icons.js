/*
 * Declare SVGs as strings because of problems with <use> tags in content
 * scripts.
 */
const mapMarkerIcon = `\
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
      <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s 192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"/> 
    </svg>
    <!--
    map-marker-alt.svg
    Font Awesome Free 5.2.0 by @fontawesome - https://fontawesome.com
    License - https://fontawesome.com/license (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
    -->`;

const mapMarkerCrossedIcon = `\
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 520">
      <path d="M260 4C153.961 4 68 89.961 68 196C68 244.117 78.563 270.849 121.348 334.652L203.449 252.551C188.967 238.079 180 218.093 180 196C180 151.817 215.817 116 260 116C282.093 116 302.079 124.967 316.551 139.449L395.753 60.246C361.011 25.499 313.020 4 260 4zM435.641 118.359L337.273 216.727C329.910 244.247 308.248 265.907 280.729 273.271L161.385 392.615C182.878 423.278 208.278 459.295 240.268 505.67C249.802 519.443 270.197 519.444 279.732 505.67C425.030 295.031 452 273.413 452 196C452 168.366 446.151 142.101 435.641 118.359z"/>
      <path d="M42.572 428.428 443.02 27.980C452.011 19.09 452.023 19.071 460.5 27.5l 17 17c8.673 8.410 8.619 8.429-0.480 17.480L76.98 462.02C68.074 471.104 68.106 471.140 59.5 462.5l-17-17c-8.721-8.364-8.668-8.236 0.072-17.072z"/>
    </svg>
    <!--
    Adapted from map-marker-alt.svg
    Font Awesome Free 5.2.0 by @fontawesome - https://fontawesome.com
    License - https://fontawesome.com/license (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
    -->`;

const filterIcon = `\
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <path d="M487.976 0H24.028C2.71 0-8.047 25.866 7.058 40.971L192 225.941V432c0 7.831 3.821 15.17 10.237 19.662l80 55.98C298.02 518.69 320 507.493 320 487.98V225.941l184.947-184.97C520.021 25.896 509.338 0 487.976 0z"/>
      <!--
    </svg>
    filter.svg
    Font Awesome Free 5.2.0 by @fontawesome - https://fontawesome.com
    License - https://fontawesome.com/license (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
    -->`;

const activeFilterIcon = `\
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <path d="M487.976 0H24.028C2.71 0-8.047 25.866 7.058 40.971L192 225.941V432c0 7.831 3.821 15.17 10.237 19.662l80 55.98C298.02 518.69 320 507.493 320 487.98V225.941l184.947-184.97C520.021 25.896 509.338 0 487.976 0z"/>
      <circle cx="444" cy="433" r="66"/>
    </svg>
    <!--
    Adapted from filter.svg
    Font Awesome Free 5.2.0 by @fontawesome - https://fontawesome.com
    License - https://fontawesome.com/license (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
    -->`;

const resetIcon = `\
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <path d="M255.545 8c-66.269.119-126.438 26.233-170.86 68.685L48.971 40.971C33.851 25.851 8 36.559 8 57.941V192c0 13.255 10.745 24 24 24h134.059c21.382 0 32.09-25.851 16.971-40.971l-41.75-41.75c30.864-28.899 70.801-44.907 113.23-45.273 92.398-.798 170.283 73.977 169.484 169.442C423.236 348.009 349.816 424 256 424c-41.127 0-79.997-14.678-110.63-41.556-4.743-4.161-11.906-3.908-16.368.553L89.34 422.659c-4.872 4.872-4.631 12.815.482 17.433C133.798 479.813 192.074 504 256 504c136.966 0 247.999-111.033 248-247.998C504.001 119.193 392.354 7.755 255.545 8z"/>
    </svg>
    <!--
    undo-alt.svg
    Font Awesome Free 5.2.0 by @fontawesome - https://fontawesome.com
    License - https://fontawesome.com/license (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
    -->`;

/*
 * Returns a map marker icon
 *
 * Accepts one object as an argument, which has two optional attributes
 * fillColor: hex color string for icon fill (defaults to black "#000000")
 * strokeColor: the hex color string for the icon outline
 *
 * If not given, the outline color, if not set, will default to one of
 * "#eeeeee" or "#444444", depending on how dark/light the fillColor is.
 *
 * Currently using this function until I find something simpler that allows
 * flexibility with colours as well as being compatible with OpenLayers
 */
function getMarkerIcon({fillColor="#000000", strokeColor} = {}) {
  function isPaleHex(hexColor) {
    const rgbRegex = /#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})/;
    const [all, r, g, b] = hexColor.match(rgbRegex);
    const rgbSum = parseInt(r, 16) + parseInt(g, 16) + parseInt(b, 16);
    return rgbSum >= (parseInt("77", 16) * 3) ||
           parseInt(g, 16) >= parseInt("aa", 16) ||
           (parseInt(r, 16) + parseInt(g, 16)) >= (parseInt("88", 16) * 2) ||
           (parseInt(g, 16) + parseInt(b, 16)) >= (parseInt("88", 16) * 2) ||
           (parseInt(g, 16) >= parseInt("99", 16) &&
            (parseInt(r, 16) + parseInt(b, 16)) >= (parseInt("55", 16) * 2));
  }
  if (strokeColor === undefined) {
    strokeColor = isPaleHex(fillColor) ? "#444444" : "#eeeeee";
  }
  const svg = `\
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" 
         viewBox="0 0 408 536" x="0" y="0" width="24px" height="24px">
      <path d="M  172.268   501.67
               C   26.97    291.031    0      269.413    0      192
                    0        85.961   85.961    0      192        0
               s  192        85.961  192      192
               c    0        77.413  -26.97    99.031 -172.268  309.67
                   -9.535    13.774  -29.93    13.773  -39.464    0
               z
               M  192       272
               c   44.183     0       80      -35.817   80      -80
               s  -35.817   -80      -80      -80      -80       35.817
                  -80        80       35.817   80       80       80
               z"
       transform="translate(12 12)"
       fill="${fillColor}" stroke="${strokeColor}" stroke-width="24"/>
    </svg>
    <!--
    Adapted from map-marker-alt.svg
    Font Awesome Free 5.2.0 by @fontawesome - https://fontawesome.com
    License - https://fontawesome.com/license
    (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
    -->`;
  const image = new Image();
  image.src = "data:image/svg+xml," + encodeURIComponent(svg);
  image.classList.add("map-marker");
  //image.classList.add(isPaleHex(fillColor) ? "dark-shadow" : "light-shadow");
  return image;
}

const markerIconBlack = getMarkerIcon();
