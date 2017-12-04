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
    const {viewport, networkTraffic, networkNodes, trailLength, time, selectedRoutes} = this.props;

    if (!networkTraffic || !networkNodes) {
      return null;
    }

    const layers = [
      new TripsLayer({
        id: 'networkTraffic',
        data: networkTraffic,
        getPath: d => d.route,
        getColor: d => d.protocol == 'tcp' ? [253, 128, 93] : [23, 184, 190],
        opacity: 1,
        strokeWidth: 1000,
        trailLength,
        currentTime: time,
        fp64: true,
        updateTriggers: {
          data: networkTraffic
        }
      }),
      new ScatterplotLayer({
        id: 'networkNodes',
        data: networkNodes ,
        getPosition: d => d.location,
        getIP: d => d => d.ip,
        getColor: d => [255, 0, 0],
        opacity: 1,
        radiusScale: 5000,
        // fps64: true,
        updateTriggers: {
          data: networkTraffic
        }
      }),
      new PathLayer({
        id: 'pathGuide',
        data: networkTraffic,
        rounded: true,
        opacity: 1,
        getWidth: d => 1000,
        getPath: d => d.route,
        getColor: d => [255, 255, 255],
        fps64: true,
        updateTriggers: {
          data: networkTraffic
        }
      }),
      new PathLayer({
        id: 'pathGuide',
        data: selectedRoutes,
        rounded: true,
        opacity: 1,
        getWidth: d => 20000,
        getPath: d => d,
        getColor: d => [30, 249, 53],
        fps64: true,
        updateTriggers: {
          data: selectedRoutes
        }
      })

    ];

    return (
      <DeckGL {...viewport} layers={layers} initWebGLParameters />
    );
  }
}
