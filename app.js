/* global window,document */
import React, {Component} from 'react';
import {render} from 'react-dom';
import ReactDOM from 'react-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

import MapGL from 'react-map-gl';
import DeckGLOverlay from './deckgl-overlay.js';


import {json as requestJson} from 'd3-request';


import DataTable from './data-table-component';
import PlaybackControls from './playback-controls-component';

var networkTraffic = require('./data/network-traffic-0.json');
var networkNodes = require('./data/network-nodes-0.json');

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
      networkTraffic: networkTraffic,
      networkNodes: networkNodes,
      time: 0,
      startTime: Date.now(),
      lastUpdateTime: 0,
      fileNumber: 1,
      totalBufferingTime: 0,
      bufferingTimeStamp: 0,
      updateInterval: 30000,
      selectedRoutes: [],
      paused: false
    };

    this.routeSelectionHandler = this.routeSelectionHandler.bind(this);
    this.playbackToggleHandler = this.playbackToggleHandler.bind(this);
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

  routeSelectionHandler(selectedRoutes) {
    this.setState({
      selectedRoutes: selectedRoutes
    });
  }

  playbackToggleHandler() {
    this.setState({
      paused: !this.state.paused
    });
  }


  _animate() {
    const timeNow = Date.now() - this.state.startTime;
    const lastUpdateTime = this.state.lastUpdateTime;
    var totalBufferingTime = this.state.totalBufferingTime;
    var bufferingTimeStamp = this.state.bufferingTimeStamp;
    const updateInterval = this.state.updateInterval;



    const loopLength = 700;
    const loopTime = 30000;

    if (!this.state.paused) {
      if (timeNow - lastUpdateTime >= updateInterval) {
        try {
          var latestNetworkTraffic = require('./data/network-traffic-'+this.state.fileNumber+'.json');
          var latestNetworkNodes = require('./data/network-nodes-'+this.state.fileNumber+'.json');
          console.log("updated to file "+ this.state.fileNumber);
          var oldNum = this.state.fileNumber + 1;
          if (oldNum >= 10) {
            oldNum = 0;
          }
          if (this.state.bufferingTimeStamp > 0) {
            this.state.totalBufferingTime += timeNow - this.state.bufferingTimeStamp;
            totalBufferingTime += timeNow - this.state.bufferingTimeStamp;
          }
          this.setState({
            fileNumber: oldNum,
            networkTraffic: latestNetworkTraffic,
            time: 0,
            lastUpdateTime: timeNow - totalBufferingTime,
            bufferingTimeStamp: 0,
            networkNodes: latestNetworkNodes,
            selectedRoutes: []
          });
         } catch (e) {
           console.log("buffering...");
           if (bufferingTimeStamp == 0) {
              this.state.bufferingTimeStamp = timeNow;
              bufferingTimeStamp = timeNow;
           }
           this.setState({
            time: 0
           });
         }
      }
      else {
        this.setState({
         time: ((Date.now() % loopTime) / loopTime) * loopLength
        });
      }
    }

    this._animationFrame = window.requestAnimationFrame(this._animate.bind(this));
	
  }

  _resize() {
    this._onViewportChange({
      width: window.innerWidth,
      height: window.innerHeight*2/3
    });
  }

  _onViewportChange(viewport) {
    this.setState({
      viewport: {...this.state.viewport, ...viewport}
    });
  }

  render() {
    const {viewport, networkTraffic, time, networkNodes, selectedRoutes} = this.state;

    return (
      <MuiThemeProvider>
        <div>
          <MapGL
            {...viewport}
            mapStyle="mapbox://styles/mapbox/dark-v9"
            onViewportChange={this._onViewportChange.bind(this)}
            mapboxApiAccessToken={MAPBOX_TOKEN}>
            <DeckGLOverlay viewport={viewport}
              networkTraffic={networkTraffic}
              networkNodes={networkNodes}
              trailLength={3}
              time={time}
              selectedRoutes={selectedRoutes}
              />
          </MapGL>
          <PlaybackControls playbackToggleHandler={this.playbackToggleHandler}/> 
          <DataTable networkTraffic={networkTraffic} selectedRoutes={selectedRoutes} routeSelectionHandler={this.routeSelectionHandler}/>
        </div>
      </MuiThemeProvider>
    );
  }
}


render(<Root />, document.body.appendChild(document.createElement('div')));
