import React, {Component} from 'react';
import {render} from 'react-dom';
import ReactDOM from 'react-dom';

import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from 'material-ui/Table';

import TextField from 'material-ui/TextField';
import Toggle from 'material-ui/Toggle';

const styles = {
  propContainer: {
    width: 200,
    overflow: 'hidden',
    margin: '20px auto 0',
  },
};


export default class DataTable extends Component {
	
	constructor(props) {
    super(props);
   
    this.state = {
	    height: '300px',
	    networkTraffic: this.props.networkTraffic,
    };
  }

  render() {
    return (
      <div>
        <Table
          height={this.state.height}
        >
          <TableHeader>
            <TableRow>
              <TableHeaderColumn colSpan="3" tooltip="Packet Data" style={{textAlign: 'center'}}>
                Packet Data
              </TableHeaderColumn>
            </TableRow>
            <TableRow>
              <TableHeaderColumn tooltip="The ID">Timestamp</TableHeaderColumn>
              <TableHeaderColumn tooltip="The Name">Destination IP</TableHeaderColumn>
              <TableHeaderColumn tooltip="The Status">Route</TableHeaderColumn>
            </TableRow>
          </TableHeader>
          <TableBody>
            {this.state.networkTraffic.map((packet) => 
				      <TableRow>
				        <TableHeaderColumn> {packet["relative-start-time"]} </TableHeaderColumn>
				        <TableHeaderColumn> {packet["dest-ip"]} </TableHeaderColumn>
				        <TableHeaderColumn> {packet["route"]} </TableHeaderColumn>
				      </TableRow>
				    )}
          </TableBody>
        </Table>
      </div>
    );
  }
}