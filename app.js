/* global window,document */
import React, {Component} from 'react';
import {render} from 'react-dom';
import ReactDOM from 'react-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

import MapGL from 'react-map-gl';
import DeckGLOverlay from './deckgl-overlay.js';

import {json as requestJson} from 'd3-request';


import DataTable from './data-table-component';

var networkTraffic = require('./network-traffic-0.json');
var networkNodes = require('./network-nodes-0.json');



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
      lastUpdateTime: 1,
      fileNumber: 1
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
    const loopLength = 720; // loop length in number of frames
    const loopTime = 12000; // milliseconds for the entire loop
    var previousTime = this.state.lastUpdateTime;
    //console.log(((timestamp % loopTime) / loopTime) * loopLength);
    let timenow = ((timestamp % loopTime) / loopTime) * loopLength
    this.setState({
       lastUpdateTime: previousTime+1,
       networkTraffic: this.latestNetworkTraffic,
      time: timenow
    });
    
    if (timenow >=0 && timenow < 5) {
       console.log("Reload latest network traffic");
       try {
         this.latestNetworkTraffic = require('./network-traffic-'+this.state.fileNumber+'.json');
         console.log("updated to file "+ this.state.fileNumber);
         var oldNum = this.state.fileNumber + 1;
         if (oldNum >= 5) {
         	oldNum = 0;
         }

         this.setState({
       		fileNumber: oldNum
   		 });
       } catch (e) {
         console.log("no file " + this.state.fileNumber);
       }
         console.log(this.latestNetworkTraffic);
      console.log("NEW LOOP" + timenow.toString());
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
    const {viewport, buildings, networkTraffic, time} = this.state;

   

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
              />
          </MapGL>
          <DataTable networkTraffic={networkTraffic}/>
        </div>
      </MuiThemeProvider>
    );
  }
}


render(<Root />, document.body.appendChild(document.createElement('div')));
