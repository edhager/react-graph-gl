import BaseLayout from '../../core/base-layout';

import * as d3 from 'd3-force';
import {EDGE_TYPE} from '../../index';

const defaultOptions = {
  alpha: 0.3,
  resumeAlpha: 0.1,
  nBodyStrength: -900,
  nBodyDistanceMin: 100,
  nBodyDistanceMax: 400,
  getCollisionRadius: d => d.collisionRadius,
};

export default class D3ForceLayout extends BaseLayout {
  constructor(options) {
    super(options);
    this._name = 'D3';
    this._options = {
      ...defaultOptions,
      ...options,
    };
    // store graph and prepare internal data
    this._d3Graph = {nodes: [], edges: []};
    this._nodeMap = {};
    this._edgeMap = {};
  }

  initializeGraph(graph) {
    this._graph = graph;
    this._nodeMap = {};
    this._edgeMap = {};
    // nodes
    const d3Nodes = graph.getNodes().map(node => {
      const id = node.id;
      const locked = node.getPropertyValue('locked') || false;
      const x = node.getPropertyValue('x') || 0;
      const y = node.getPropertyValue('y') || 0;
      const collisionRadius = node.getPropertyValue('collisionRadius') || 0;
      const d3Node = {
        id,
        x,
        y,
        fx: locked ? x : null,
        fy: locked ? y : null,
        collisionRadius,
      };
      this._nodeMap[node.id] = d3Node;
      return d3Node;
    });
    // edges
    const d3Edges = graph.getEdges().map(edge => {
      const d3Edge = {
        id: edge.id,
        source: this._nodeMap[edge.getSourceNodeId()],
        target: this._nodeMap[edge.getTargetNodeId()],
      };
      this._edgeMap[edge.id] = d3Edge;
      return d3Edge;
    });
    this._d3Graph = {
      nodes: d3Nodes,
      edges: d3Edges,
    };
  }

  _generateSimulator() {
    if (this._simulator) {
      this._simulator.on('tick', null).on('end', null);
      this._simulator = null;
    }
    const {
      alpha,
      nBodyStrength,
      nBodyDistanceMin,
      nBodyDistanceMax,
      getCollisionRadius,
    } = this._options;

    const g = this._d3Graph;
    this._simulator = d3
      .forceSimulation(g.nodes)
      .force(
        'edge',
        d3
          .forceLink(g.edges)
          .id(n => n.id)
      )
      .force(
        'charge',
        d3
          .forceManyBody()
          .strength(nBodyStrength)
          .distanceMin(nBodyDistanceMin)
          .distanceMax(nBodyDistanceMax)
      )
      .force('center', d3.forceCenter())
      .force('collision', d3.forceCollide().radius(getCollisionRadius))
      .alpha(alpha);
    // register event callbacks
    this._simulator
      .on('tick', this._callbacks.onLayoutChange)
      .on('end', this._callbacks.onLayoutDone);
  }

  start() {
    this._generateSimulator();
    this._simulator.restart();
  }

  resume() {
    const {resumeAlpha} = this._options;
    this._simulator.alpha(resumeAlpha).restart();
  }

  stop() {
    this._simulator.stop();
  }

  // for steaming new data on the same graph
  updateGraph(graph) {
    if (this._graph.getGraphName() !== graph.getGraphName()) {
      // reset the maps
      this._nodeMap = {};
      this._edgeMap = {};
    }
    this._graph = graph;
    // update internal layout data
    // nodes
    const newNodeMap = {};
    const newD3Nodes = graph.getNodes().map(node => {
      const id = node.id;
      const locked = node.getPropertyValue('locked') || false;
      const x = node.getPropertyValue('x') || 0;
      const y = node.getPropertyValue('y') || 0;
      const fx = locked ? x : null;
      const fy = locked ? y : null;
      const collisionRadius = node.getPropertyValue('collisionRadius') || 0;

      const oldD3Node = this._nodeMap[node.id];
      const newD3Node = oldD3Node
        ? oldD3Node
        : {id, x, y, fx, fy, collisionRadius};
      newNodeMap[node.id] = newD3Node;
      return newD3Node;
    });
    this._nodeMap = newNodeMap;
    this._d3Graph.nodes = newD3Nodes;
    // edges
    const newEdgeMap = {};
    const newD3Edges = graph.getEdges().map(edge => {
      const oldD3Edge = this._edgeMap[edge.id];
      const newD3Edge = oldD3Edge
        ? oldD3Edge
        : {
            id: edge.id,
            source: newNodeMap[edge.getSourceNodeId()],
            target: newNodeMap[edge.getTargetNodeId()],
          };
      newEdgeMap[edge.id] = newD3Edge;
      return newD3Edge;
    });
    this._edgeMap = newEdgeMap;
    this._d3Graph.edges = newD3Edges;
  }

  getNodePosition = node => {
    const d3Node = this._nodeMap[node.id];
    if (d3Node) {
      return [d3Node.x, d3Node.y];
    }
    return [0, 0];
  };

  getEdgePosition = edge => {
    const d3Edge = this._edgeMap[edge.id];
    const sourcePosition = d3Edge && d3Edge.source;
    const targetPosition = d3Edge && d3Edge.target;
    if (d3Edge && sourcePosition && targetPosition) {
      return {
        type: EDGE_TYPE.LINE,
        sourcePosition: [sourcePosition.x, sourcePosition.y],
        targetPosition: [targetPosition.x, targetPosition.y],
        controlPoints: [],
      };
    }
    return {
      type: EDGE_TYPE.LINE,
      sourcePosition: [0, 0],
      targetPosition: [0, 0],
      controlPoints: [],
    };
  };

  lockNodePosition = (node, x, y) => {
    const d3Node = this._nodeMap[node.id];
    d3Node.x = x;
    d3Node.y = y;
    d3Node.fx = x;
    d3Node.fy = y;
    this._callbacks.onLayoutChange();
    this._callbacks.onLayoutDone();
  };

  unlockNodePosition = node => {
    const d3Node = this._nodeMap[node.id];
    d3Node.fx = null;
    d3Node.fy = null;
  };
}
