import React, {Component} from 'react';
import {render} from 'react-dom';
import ReactDOM from 'react-dom';


import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import FlatButton from 'material-ui/FlatButton';

export default class PlaybackControls extends Component {


	constructor(props) {
    super(props);
    
  } 

  togglePlayback() {
  	this.props.playbackToggleHandler();
  }

  render() {
    return (
      <Card 
       style={{
          width: '15%',
          position: 'absolute',
        }}
        >
		    <CardHeader
		      title="Playback Controls"
		    />
		    <CardActions>
		      <FlatButton label="Pause" onClick={this.togglePlayback.bind(this)} />
		      <FlatButton label="Play" 	onClick={this.togglePlayback.bind(this)}/>
		    </CardActions>
        <CardText>
          <p>TCP: Orange </p>
          <p>UDP: Blue </p>
          <p>ICMP: Yellow </p>
          <p>Select individual packet in table below to view it's route. </p>
        </CardText>
		  </Card>
    );
  }
    
  
}
