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
      selected: []
    };
  }

  handleRowSelection(rowNumber, columnId) {
    
    const route = this.props.networkTraffic[rowNumber]["route"];
    this.props.routeSelectionHandler([route]);
  }

  toggleRowSelection(selectedRows) {
    this.setState({
      selected: selectedRows
    })
  }

  isSelected(index) {
    return this.state.selected.indexOf(index) !== -1;
  }

  render() {
    return (
      <div>
        <Table 
          height={this.state.height}
          onCellClick={this.handleRowSelection.bind(this)}
          onRowSelection={this.toggleRowSelection.bind(this)}
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
              <TableHeaderColumn tooltip="The Route">Route</TableHeaderColumn>
              <TableHeaderColumn tooltip="The Protocol">Protocol</TableHeaderColumn>
              <TableHeaderColumn tooltip="The Destination Port">Desintation Port</TableHeaderColumn>
            </TableRow>
          </TableHeader>
          <TableBody>
            {this.props.networkTraffic.map((packet, index) => 
				      <TableRow selected={this.isSelected(index)}>
				        <TableRowColumn> {packet["relative-start-time"]} </TableRowColumn>
				        <TableRowColumn> {packet["dest-ip"]} </TableRowColumn>
				        <TableRowColumn> {packet["route"]} </TableRowColumn>
                <TableRowColumn> {packet["protocol"]} </TableRowColumn>
                <TableRowColumn> {packet["dest-port"]} </TableRowColumn>
				      </TableRow>
				    )}
          </TableBody>
        </Table>
      </div>
    );
  }
}