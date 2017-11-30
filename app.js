/* global window,document */
import React, {Component} from 'react';
import {render} from 'react-dom';
import MapGL from 'react-map-gl';
import DeckGLOverlay from './deckgl-overlay.js';

import {json as requestJson} from 'd3-request';

var trips = require('./trips.json');
var buildings = require('./buildings.json');
var networkTraffic = require('./network-traffic.json');

// Set your mapbox token here
const MAPBOX_TOKEN = "pk.eyJ1IjoiYnJvbnNkdXJhbiIsImEiOiJjajk5Ym5vcHgwanc3MzNwYWd4YXBqaTFiIn0.I3l_rQOCwWnZXAced7328w" //process.env.MapboxAccessToken; // eslint-disable-line

class Root extends Component {


  constructor(props) {
    super(props);
    this.latestNetworkTraffic = networkTraffic;

    this.state = {
      viewport: {
        ...DeckGLOverlay.defaultViewport,
        width: 500,
        height: 500
      },
      buildings: buildings,
      networkTraffic: networkTraffic,
      time: 0,
      lastUpdateTime: 1
    };


  }

  componentDidMount() {
    window.addEventListener('resize', this._resize.bind(this));
    this._resize();
    this._animate();
  }

  componentWillUnmount() {
    if (this._animationFrame) {
      window.cancelAnimationFrame(this._animationFrame);
    }
  }

  _animate() {
    const timestamp = Date.now();
    const loopLength = 1800;
    const loopTime = 60000;
    var previousTime = this.state.lastUpdateTime;

    this.setState({
      lastUpdateTime: previousTime+1,
      networkTraffic: this.latestNetworkTraffic,
      time: ((timestamp % loopTime) / loopTime) * loopLength
    });

    if (previousTime % 1000 == 0) {
      console.log("Reload latest network traffic");
      this.latestNetworkTraffic = require('./network-traffic1.json');
    }

    this._animationFrame = window.requestAnimationFrame(this._animate.bind(this));
  }

  _resize() {
    this._onViewportChange({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }

  _onViewportChange(viewport) {
    this.setState({
      viewport: {...this.state.viewport, ...viewport}
    });
  }

  render() {
    const {viewport, buildings, networkTraffic, time} = this.state;

    return (
      <MapGL
        {...viewport}
        mapStyle="mapbox://styles/mapbox/dark-v9"
        onViewportChange={this._onViewportChange.bind(this)}
        mapboxApiAccessToken={MAPBOX_TOKEN}>
        <DeckGLOverlay viewport={viewport}
          buildings={buildings}
          networkTraffic={networkTraffic}
          trailLength={5}
          time={time}
          />
      </MapGL>
    );
  }
}


render(<Root />, document.body.appendChild(document.createElement('div')));
