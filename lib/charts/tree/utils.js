'use strict';

exports.__esModule = true;
exports.collapseChildren = collapseChildren;
exports.expandChildren = expandChildren;
exports.toggleChildren = toggleChildren;
exports.visit = visit;
exports.getNodeGroupByDepthCount = getNodeGroupByDepthCount;
exports.getTooltipString = getTooltipString;

var _ramda = require('ramda');

var _sortAndSerialize = require('./sortAndSerialize');

var _sortAndSerialize2 = _interopRequireDefault(_sortAndSerialize);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function collapseChildren(node) {
  if (node.children) {
    node._children = node.children;
    node._children.forEach(collapseChildren);
    node.children = null;
  }
}

function expandChildren(node) {
  if (node._children) {
    node.children = node._children;
    node.children.forEach(expandChildren);
    node._children = null;
  }
}

function toggleChildren(node) {
  if (node.children) {
    node._children = node.children;
    node.children = null;
  } else if (node._children) {
    node.children = node._children;
    node._children = null;
  }
  return node;
}

function visit(parent, visitFn, childrenFn) {
  if (!parent) {
    return;
  }

  visitFn(parent);

  var children = childrenFn(parent);
  if (children) {
    var count = children.length;

    for (var i = 0; i < count; i++) {
      visit(children[i], visitFn, childrenFn);
    }
  }
}

function getNodeGroupByDepthCount(rootNode) {
  var nodeGroupByDepthCount = [1];

  var traverseFrom = function traverseFrom(node) {
    var depth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    if (!node.children || node.children.length === 0) {
      return 0;
    }

    if (nodeGroupByDepthCount.length <= depth + 1) {
      nodeGroupByDepthCount.push(0);
    }

    nodeGroupByDepthCount[depth + 1] += node.children.length;

    node.children.forEach(function (childNode) {
      traverseFrom(childNode, depth + 1);
    });
  };

  traverseFrom(rootNode);
  return nodeGroupByDepthCount;
}

function getTooltipString(node, i, _ref) {
  var _ref$indentationSize = _ref.indentationSize,
      indentationSize = _ref$indentationSize === undefined ? 4 : _ref$indentationSize;

  if (!(0, _ramda.is)(Object, node)) return '';

  var spacer = (0, _ramda.join)('&nbsp;&nbsp;');
  var cr2br = (0, _ramda.replace)(/\n/g, '<br/>');
  var spaces2nbsp = (0, _ramda.replace)(/\s{2}/g, spacer(new Array(indentationSize)));
  var json2html = (0, _ramda.pipe)(_sortAndSerialize2.default, cr2br, spaces2nbsp);

  var children = node.children || node._children;

  if (typeof node.value !== 'undefined') return json2html(node.value);
  if (typeof node.object !== 'undefined') return json2html(node.object);
  if (children && children.length) return 'childrenCount: ' + children.length;
  return 'empty';
}