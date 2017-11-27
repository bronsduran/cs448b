import React, {Component} from 'react';
import DeckGL, {PolygonLayer, ScatterplotLayer, PathLayer, ArcLayer} from 'deck.gl';
import TripsLayer from './trips-layer';

const LIGHT_SETTINGS = {
  lightsPosition: [-74.05, 40.7, 8000, -73.5, 41, 5000],
  ambientRatio: 0.05,
  diffuseRatio: 0.6,
  specularRatio: 0.8,
  lightsStrength: [2.0, 0.0, 0.0, 0.0],
  numberOfLights: 2
};

export default class DeckGLOverlay extends Component {

  static get defaultViewport() {
    return {
      longitude: -122.166,
      latitude: 37.4241,
      zoom: 2,
      maxZoom: 16,
      pitch: 15,
      bearing: 0
    };
  }

  render() {
    const {viewport, buildings, networkTraffic, trailLength, time} = this.props;

    if (!buildings || !networkTraffic) {
      return null;
    }

    const layers = [
      new TripsLayer({
        id: 'networkTraffic',
        data: networkTraffic,
        getPath: d => d.route,
        getColor: d => d.protocol == 'tcp' ? [253, 128, 93] : [23, 184, 190],
        opacity: 0.3,
        strokeWidth: 5,
        trailLength,
        currentTime: time,
        fp64: false
      }),
      new ScatterplotLayer({
      	id: 'networkEndpoints',
      	data: networkTraffic,
      	getPosition: d => ((d.route).slice(-1)[0]),
      	getColor: d => d.protocol == 'tcp' ? [253, 128, 93] : [23, 184, 190],
      	opacity: 0.1,
      	radiusScale: 10000,
      	fps64: false

      }),
      new ScatterplotLayer({
        id: 'networkStartpoints',
        data: networkTraffic,
        getPosition: d => ((d.route).slice(0,1)[0]),
        getColor: d => d.protocol == 'tcp' ? [253, 128, 93] : [23, 184, 190],
        opacity: 0.1,
        radiusScale: 10000,
        fps64: false

      }),
       new ScatterplotLayer({
        id: 'networkMidpoints',
        data: networkTraffic,
        getPosition: d => ((d.route).slice(1, -1)[0]),
        getColor: d => d.protocol == 'tcp' ? [253, 128, 93] : [23, 184, 190],
        opacity: 0.1,
        radiusScale: 10000,
        fps64: false

      }),
      new PathLayer({
        id: 'pathGuide',
        data: networkTraffic,
        rounded: true,
        getWidth: d=> 500,
        getPath: d=> d.route,
        getColor: d=> [173, 216, 230],
        fps64: false
      })
      // new PolygonLayer({
      //   id: 'buildings',
      //   data: buildings,
      //   extruded: true,
      //   wireframe: false,
      //   fp64: true,
      //   opacity: 0.5,
      //   getPolygon: f => f.polygon,
      //   getElevation: f => f.height,
      //   getFillColor: f => [74, 80, 87],
      //   lightSettings: LIGHT_SETTINGS
      // })
    ];

    return (
      <DeckGL {...viewport} layers={layers} initWebGLParameters />
    );
  }
}
