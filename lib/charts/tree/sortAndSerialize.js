'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = sortAndSerialize;

var _ramda = require('ramda');

function sortObject(obj, strict) {
  if (obj instanceof Array) {
    var ary = void 0;
    if (strict) {
      ary = obj.sort();
    } else {
      ary = obj;
    }
    return ary;
  }

  if (obj && (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object') {
    var tObj = {};
    Object.keys(obj).sort().forEach(function (key) {
      return tObj[key] = sortObject(obj[key]);
    });
    return tObj;
  }

  return obj;
}

function sortAndSerialize(obj) {
  return JSON.stringify(sortObject(obj, true), undefined, 2);
}