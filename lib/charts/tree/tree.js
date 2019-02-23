'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = function (DOMNode) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var _deepmerge = (0, _deepmerge3.default)(defaultOptions, options),
      id = _deepmerge.id,
      style = _deepmerge.style,
      size = _deepmerge.size,
      aspectRatio = _deepmerge.aspectRatio,
      initialZoom = _deepmerge.initialZoom,
      margin = _deepmerge.margin,
      isSorted = _deepmerge.isSorted,
      widthBetweenNodesCoeff = _deepmerge.widthBetweenNodesCoeff,
      heightBetweenNodesCoeff = _deepmerge.heightBetweenNodesCoeff,
      transitionDuration = _deepmerge.transitionDuration,
      blinkDuration = _deepmerge.blinkDuration,
      state = _deepmerge.state,
      rootKeyName = _deepmerge.rootKeyName,
      pushMethod = _deepmerge.pushMethod,
      tree = _deepmerge.tree,
      tooltipOptions = _deepmerge.tooltipOptions,
      onClickText = _deepmerge.onClickText;

  var width = size - margin.left - margin.right;
  var height = size * aspectRatio - margin.top - margin.bottom;
  var fullWidth = size;
  var fullHeight = size * aspectRatio;

  var attr = {
    id: id,
    preserveAspectRatio: 'xMinYMin slice'
  };

  if (!style.width) {
    attr.width = fullWidth;
  }

  if (!style.width || !style.height) {
    attr.viewBox = '0 0 ' + fullWidth + ' ' + fullHeight;
  }

  var root = _d4.default.select(DOMNode);
  var zoom = _d4.default.behavior.zoom().scaleExtent([0.1, 3]).scale(initialZoom);
  var vis = root.append('svg').attr(attr).style(_extends({ cursor: '-webkit-grab' }, style)).call(zoom.on('zoom', function () {
    var _d3$event = _d4.default.event,
        translate = _d3$event.translate,
        scale = _d3$event.scale;

    vis.attr('transform', 'translate(' + translate + ')scale(' + scale + ')');
  })).append('g').attr({
    transform: 'translate(' + (margin.left + style.node.radius) + ', ' + margin.top + ') scale(' + initialZoom + ')'
  });

  var layout = _d4.default.layout.tree().size([width, height]);
  var data = void 0;

  if (isSorted) {
    layout.sort(function (a, b) {
      return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;
    });
  }

  // previousNodePositionsById stores node x and y
  // as well as hierarchy (id / parentId);
  // helps animating transitions
  var previousNodePositionsById = {
    root: {
      id: 'root',
      parentId: null,
      x: height / 2,
      y: 0
    }

    // traverses a map with node positions by going through the chain
    // of parent ids; once a parent that matches the given filter is found,
    // the parent position gets returned
  };function findParentNodePosition(nodePositionsById, nodeId, filter) {
    var currentPosition = nodePositionsById[nodeId];
    while (currentPosition) {
      currentPosition = nodePositionsById[currentPosition.parentId];
      if (!currentPosition) {
        return null;
      }
      if (!filter || filter(currentPosition)) {
        return currentPosition;
      }
    }
  }

  return function renderChart() {
    var nextState = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : tree || state;

    data = !tree ? (0, _map2tree2.default)(nextState, { key: rootKeyName, pushMethod: pushMethod }) : nextState;

    if ((0, _ramda.isEmpty)(data) || !data.name) {
      data = { name: 'error', message: 'Please provide a state map or a tree structure' };
    }

    var nodeIndex = 0;
    var maxLabelLength = 0;

    // nodes are assigned with string ids, which reflect their location
    // within the hierarcy; e.g. "root|branch|subBranch|subBranch[0]|property"
    // top-level elemnt always has id "root"
    (0, _utils.visit)(data, function (node) {
      maxLabelLength = Math.max(node.name.length, maxLabelLength);
      node.id = node.id || 'root';
    }, function (node) {
      return node.children && node.children.length > 0 ? node.children.map(function (c) {
        c.id = (node.id || '') + '|' + c.name;
        return c;
      }) : null;
    });

    /*eslint-disable*/
    update();
    /*eslint-enable*/

    function update() {
      // path generator for links
      var diagonal = _d4.default.svg.diagonal().projection(function (d) {
        return [d.y, d.x];
      });
      // set tree dimensions and spacing between branches and nodes
      var maxNodeCountByLevel = Math.max.apply(Math, (0, _utils.getNodeGroupByDepthCount)(data));

      layout = layout.size([maxNodeCountByLevel * 25 * heightBetweenNodesCoeff, width]);

      var nodes = layout.nodes(data);
      var links = layout.links(nodes);

      nodes.forEach(function (node) {
        return node.y = node.depth * (maxLabelLength * 7 * widthBetweenNodesCoeff);
      });

      var nodePositions = nodes.map(function (n) {
        return {
          parentId: n.parent && n.parent.id,
          id: n.id,
          x: n.x,
          y: n.y
        };
      });
      var nodePositionsById = {};
      nodePositions.forEach(function (node) {
        return nodePositionsById[node.id] = node;
      });

      // process the node selection
      var node = vis.selectAll('g.node').property('__oldData__', function (d) {
        return d;
      }).data(nodes, function (d) {
        return d.id || (d.id = ++nodeIndex);
      });
      var nodeEnter = node.enter().append('g').attr({
        'class': 'node',
        transform: function transform(d) {
          var position = findParentNodePosition(nodePositionsById, d.id, function (n) {
            return previousNodePositionsById[n.id];
          });
          var previousPosition = position && previousNodePositionsById[position.id] || previousNodePositionsById.root;
          return 'translate(' + previousPosition.y + ',' + previousPosition.x + ')';
        }
      }).style({
        fill: style.text.colors.default,
        cursor: 'pointer'
      }).on({
        mouseover: function mouseover() {
          _d4.default.select(this).style({
            fill: style.text.colors.hover
          });
        },
        mouseout: function mouseout() {
          _d4.default.select(this).style({
            fill: style.text.colors.default
          });
        }
      });

      if (!tooltipOptions.disabled) {
        nodeEnter.call((0, _d3tooltip2.default)(_d4.default, 'tooltip', _extends({}, tooltipOptions, { root: root })).text(function (d, i) {
          var customText = tooltipOptions.getText(d, i, tooltipOptions);

          if (customText === undefined) {
            return (0, _utils.getTooltipString)(d, i, tooltipOptions);
          }

          return customText;
        }).style(tooltipOptions.style));
      }

      // g inside node contains circle and text
      // this extra wrapper helps run d3 transitions in parallel
      var nodeEnterInnerGroup = nodeEnter.append('g');
      nodeEnterInnerGroup.append('circle').attr({
        'class': 'nodeCircle',
        r: 0
      }).on({
        click: function click(clickedNode) {
          if (_d4.default.event.defaultPrevented) return;
          (0, _utils.toggleChildren)(clickedNode);
          update();
        }
      });

      nodeEnterInnerGroup.append('text').attr({
        'class': 'nodeText',
        'text-anchor': 'middle',
        'transform': 'translate(0,0)',
        dy: '.35em'
      }).style({
        'fill-opacity': 0
      }).text(function (d) {
        return d.name;
      }).on({
        click: onClickText
      });

      // update the text to reflect whether node has children or not
      node.select('text').text(function (d) {
        return d.name;
      });

      // change the circle fill depending on whether it has children and is collapsed
      node.select('circle').style({
        stroke: 'black',
        'stroke-width': '1.5px',
        fill: function fill(d) {
          return d._children ? style.node.colors.collapsed : d.children ? style.node.colors.parent : style.node.colors.default;
        }
      });

      // transition nodes to their new position
      var nodeUpdate = node.transition().duration(transitionDuration).attr({
        transform: function transform(d) {
          return 'translate(' + d.y + ',' + d.x + ')';
        }
      });

      // ensure circle radius is correct
      nodeUpdate.select('circle').attr('r', style.node.radius);

      // fade the text in and align it
      nodeUpdate.select('text').style('fill-opacity', 1).attr({
        transform: function transform(d) {
          var x = (d.children || d._children ? -1 : 1) * (this.getBBox().width / 2 + style.node.radius + 5);
          return 'translate(' + x + ',0)';
        }
      });

      // blink updated nodes
      node.filter(function flick(d) {
        // test whether the relevant properties of d match
        // the equivalent property of the oldData
        // also test whether the old data exists,
        // to catch the entering elements!
        return this.__oldData__ && d.value !== this.__oldData__.value;
      }).select('g').style('opacity', '0.3').transition().duration(blinkDuration).style('opacity', '1');

      // transition exiting nodes to the parent's new position
      var nodeExit = node.exit().transition().duration(transitionDuration).attr({
        transform: function transform(d) {
          var position = findParentNodePosition(previousNodePositionsById, d.id, function (n) {
            return nodePositionsById[n.id];
          });
          var futurePosition = position && nodePositionsById[position.id] || nodePositionsById.root;
          return 'translate(' + futurePosition.y + ',' + futurePosition.x + ')';
        }
      }).remove();

      nodeExit.select('circle').attr('r', 0);

      nodeExit.select('text').style('fill-opacity', 0);

      // update the links
      var link = vis.selectAll('path.link').data(links, function (d) {
        return d.target.id;
      });

      // enter any new links at the parent's previous position
      link.enter().insert('path', 'g').attr({
        'class': 'link',
        d: function d(_d) {
          var position = findParentNodePosition(nodePositionsById, _d.target.id, function (n) {
            return previousNodePositionsById[n.id];
          });
          var previousPosition = position && previousNodePositionsById[position.id] || previousNodePositionsById.root;
          return diagonal({
            source: previousPosition,
            target: previousPosition
          });
        }
      }).style(style.link);

      // transition links to their new position
      link.transition().duration(transitionDuration).attr({
        d: diagonal
      });

      // transition exiting nodes to the parent's new position
      link.exit().transition().duration(transitionDuration).attr({
        d: function d(_d2) {
          var position = findParentNodePosition(previousNodePositionsById, _d2.target.id, function (n) {
            return nodePositionsById[n.id];
          });
          var futurePosition = position && nodePositionsById[position.id] || nodePositionsById.root;
          return diagonal({
            source: futurePosition,
            target: futurePosition
          });
        }
      }).remove();

      // delete the old data once it's no longer needed
      node.property('__oldData__', null);

      // stash the old positions for transition
      previousNodePositionsById = nodePositionsById;
    }
  };
};

var _d3 = require('d3');

var _d4 = _interopRequireDefault(_d3);

var _ramda = require('ramda');

var _map2tree = require('map2tree');

var _map2tree2 = _interopRequireDefault(_map2tree);

var _deepmerge2 = require('deepmerge');

var _deepmerge3 = _interopRequireDefault(_deepmerge2);

var _utils = require('./utils');

var _d3tooltip = require('d3tooltip');

var _d3tooltip2 = _interopRequireDefault(_d3tooltip);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaultOptions = {
  state: undefined,
  rootKeyName: 'state',
  pushMethod: 'push',
  tree: undefined,
  id: 'd3svg',
  style: {
    node: {
      colors: {
        'default': '#ccc',
        collapsed: 'lightsteelblue',
        parent: 'white'
      },
      radius: 7
    },
    text: {
      colors: {
        'default': 'black',
        hover: 'skyblue'
      }
    },
    link: {
      stroke: '#000',
      fill: 'none'
    }
  },
  size: 500,
  aspectRatio: 1.0,
  initialZoom: 1,
  margin: {
    top: 10,
    right: 10,
    bottom: 10,
    left: 50
  },
  isSorted: false,
  heightBetweenNodesCoeff: 2,
  widthBetweenNodesCoeff: 1,
  transitionDuration: 750,
  blinkDuration: 100,
  onClickText: function onClickText() {},
  tooltipOptions: {
    disabled: false,
    left: undefined,
    right: undefined,
    offset: {
      left: 0,
      top: 0
    },
    style: undefined,
    getText: function getText() {
      return undefined;
    }
  }
};