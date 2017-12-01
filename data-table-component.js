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
  propToggleHeader: {
    margin: '20px auto 10px',
  },
};

 // let tableRows = {this.props.data.map((packet) => 
    //   <TableRow
    //   selectable={true}>
    //     <TableHeaderColumn> {packet["relative-start-time"]} </TableHeaderColumn>
    //     <TableHeaderColumn> {packet["dest-ip"]} </TableHeaderColumn>
    //     <TableHeaderColumn> {packet["route"]} </TableHeaderColumn>
    //   </TableRow>
    // )}

 					// <Table selectable={true} multiSelectable={true}>
      //       <TableHeader>
      //         <TableRow>
      //           <TableHeaderColumn>Timestamp</TableHeaderColumn>
      //           <TableHeaderColumn>Destination IP</TableHeaderColumn>
      //           <TableHeaderColumn>Route</TableHeaderColumn>
      //         </TableRow>
      //       </TableHeader>
      //       <TableBody>
      //         {tableRows}
      //       </TableBody>
      //     </Table> 


export default class DataTable extends Component {
	
	constructor(props) {
    super(props);
   
    this.state = {
      fixedHeader: true,
	    fixedFooter: true,
	    stripedRows: false,
	    showRowHover: false,
	    selectable: true,
	    multiSelectable: false,
	    enableSelectAll: false,
	    deselectOnClickaway: true,
	    showCheckboxes: true,
	    height: '300px',
	    networkTraffic: this.props.networkTraffic,
	    selected: []
    };
  }

  _isSelected(index) {
    return this.state.selected.indexOf(index) !== -1;
  };

  _handleRowSelection(selectedRows) {
    this.setState({
      selected: selectedRows,
    });
  };

  render() {
    return (
      <div>
        <Table
          height={this.state.height}
          onRowSelection={this._handleRowSelection}
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
            {this.state.networkTraffic.map((packet, index) => 
				      <TableRow
				      key={index}
				      selected={this._isSelected(index)}
				      >
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