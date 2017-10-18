var _ = require('lodash');
var endings = require('./lib/endings');
var lettersToTonify = require('./lib/letters-to-tonify');
var toneMap = require('./lib/tone-map');
var toneNumbers = [0, 1, 2, 3, 4];

module.exports = tonifyPhrase;

/**
 * @param {string} phrase
 * @return {string}
 */
function tonifyPhrase(phrase) {
  var spaceIndexes = [];
  phrase.split('').forEach(function(char, i) {
    if (char === ' ') {
      spaceIndexes.push(i);
    }
  });
  var words = splitPhraseIntoWords(phrase);
  var tonifiedWords = words.map(tonifyWord);
  var arrayWithoutSpaces = tonifiedWords.join('').split('');
  var arrayWithSpaces = arrayWithoutSpaces;
  spaceIndexes.forEach(function(spaceIndex, i) {
    arrayWithSpaces.splice(spaceIndex - (i + 1), 0, ' ');
  });
  var result = arrayWithSpaces.join('');
  // Special case due to 'ring e' and 'ring i' being split into two characters
  result = result.replace(/[\*$€]/g, function(m) {
    return {
        '*': 'e̊',
        '$': 'i̊',
        '€': 'o̊'
    }[m];
  });
  return result;
}

/**
 * @param {string} word
 * @return {string}
 */
function tonifyWord(word) {
  var tone = getTone(word);
  var ending = getEnding(word);

  if (tone === null || !ending) {
    return getTonelessFallback(word);
  }

  // TODO: Refactor this exception.
  if (_.includes(['nue', 'lue'], stripToneNumber(word))) {
    word = word.replace('u', 'ü');
    ending = ending.replace('u', 'ü');
  }

  var tonifiedEnding = tonifyEnding(ending, tone);
  var tonifiedWord = word.replace(ending, tonifiedEnding);
  return stripToneNumber(tonifiedWord);
}

/**
 * @param {string} word
 * @return {string}
 */
function getTonelessFallback(word) {
  var fallbackIoMap = {
    lv: 'lü',
    nv: 'nü',
    lue: 'lüe',
    nue: 'nüe'
  };

  return _.get(fallbackIoMap, word, word);
}

/**
 * @param {string} letter
 * @param {number} tone
 * @return {string}
 */
function tonifyLetter(letter, tone) {
  var keys = letter + '.' + tone;
  return _.get(toneMap, keys, letter);
}

/**
 * @param {string} ending
 * @param {number} tone
 * @return {string}
 */
function tonifyEnding(ending, tone) {
  var letter;

  _.forEach(lettersToTonify, function(letterAndPattern) {
    if (!letter && ending.match(letterAndPattern.pattern)) {
      letter = letterAndPattern.letter;
    }
  });

  if (!letter) {
    return ending;
  }

  return ending.replace(letter, tonifyLetter(letter, tone));
}

/**
 * @param {string} word
 * @return {string}
 */
function stripToneNumber(word) {
  return _.trim(word, toneNumbers);
}

/**
 * @param {string} phrase
 * @return {array}
 */
function splitPhraseIntoWords(phrase) {
  var spacedPhrase = phrase.replace(/([0-9](?! ))/g, '$1 ').trim();
  return spacedPhrase.split(' ');
}

/**
 * @param {string} word
 * @return {number|null}
 */
function getTone(word) {
  var lastCharacter = parseInt(_.last(word), 10);
  return _.includes(toneNumbers, lastCharacter) ? lastCharacter : null;
}

/**
 * @param {string} word
 * @return {string|null}
 */
function getEnding(word) {
  var ending = null;

  _.forEach(endings, function(pattern, plainEnding) {
    if (word.match(pattern)) {
      ending = plainEnding;
    }
  });

  return ending;
}
