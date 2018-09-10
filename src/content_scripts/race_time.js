const RACETIME_MIN_SECONDS = 0;
const RACETIME_MAX_SECONDS = 5999;

/*
 * Returns object that can convert time to multiple formats
 *
 * Accepts several styles of argument:
 *   number: time in seconds
 *   string: time string H:MM:SS (accepts up to 1:39:59), or
 *           time string MM:SS (accepts up to 99:59)
 *           time string  M:SS (accepts up to  9:59)
 *   Array:  hours, minutes, seconds, or
 *           minutes, seconds, or
 *           seconds
 *           (any undefined or NaN Array values will default to zero)
 *
 * Returned object has two methods:
 *   toSeconds: returns time in seconds, integer
 *   toString: returns time in MM:SS or M:SS format
 */
function RaceTime(time) {
  const tooSmallErr = "RaceTime object only works with non-negative time";
  const tooBigErr = "RaceTime object only works with times under 100 minutes";
  const invalidArgsErr = `RaceTime constructor called with invalid argument: ${time}`;
  const invalidAddArgErr = "Invalid argument to RaceTime.add(): must be integer";
  const MIN_SECONDS = RACETIME_MIN_SECONDS,
        MAX_SECONDS = RACETIME_MAX_SECONDS;

  function throwTypeError(msg) {
    throw new TypeError(msg);
  }

  function secondsFromHMS(h, m, s) {
    return (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
  }

  function checkInRange(seconds) {
    if (seconds > MAX_SECONDS) {
      throwTypeError(tooBigErr);
    }
    if (seconds < MIN_SECONDS) {
      throwTypeError(tooSmallErr);
    }
  }

  //const data = {
  //  seconds: 0,
  //  _seconds: 0 // temp value
  //};
  let _seconds = 0; // temp value

  if (typeof time === "number") {
    _seconds = time; // assuming number given is seconds
  } else if (typeof time === "string") {
    const timeRegex1 = /^(1):([0-3]\d):([0-5]\d)$/;
    const timeRegex2 = /^()(\d{1,2}):([0-5]\d)$/;
    let h, m, s;
    try {
      [, h=0, m=0, s=0] = time.match(timeRegex1) ||
                                time.match(timeRegex2);
    } catch (e) {
      throwTypeError(invalidArgsErr);
    }
    _seconds = secondsFromHMS(parseInt(h), parseInt(m), parseInt(s));
  } else if (time instanceof Array) {
    time.reverse(); // reverse just in case only secs and mins in Array
    const [s=0, m=0, h=0] = time;
    _seconds = secondsFromHMS(h, m, s);
  } else {
    throwTypeError(invalidArgsErr);
  }

  checkInRange(_seconds);

  // if we've passed all the tests, _seconds is probably safe to store
  const seconds = _seconds;

  const toSeconds = function() {
    return seconds;
  };
  const valueOf = function() {
    return toSeconds();
  };
  const toString = function() {
    const s = seconds % 60;
    const secondsString = ("0" + s).slice(-2);
    const m = (seconds - s) / 60;
    const minutesString = ("0" + m).slice(-2);
    return `${minutesString}:${secondsString}`;
  };
  const add = function(n) {
    if (typeof n !== "number" || !Number.isInteger(n)) {
      throwTypeError(invalidAddArgErr);
    }

    let new_seconds = seconds + n;
    if (new_seconds < MIN_SECONDS) {
      new_seconds = MIN_SECONDS;
    } else if (new_seconds > MAX_SECONDS) {
      new_seconds = MAX_SECONDS;
    }

    return RaceTime(new_seconds);
  };

  // public
  return Object.freeze({
    toSeconds,
    valueOf,
    toString,
    add
  });
}

RaceTime.MIN = RaceTime(RACETIME_MIN_SECONDS);
RaceTime.MAX = RaceTime(RACETIME_MAX_SECONDS);
