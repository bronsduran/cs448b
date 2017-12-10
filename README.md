# cs448b
Real Time Network Visualization

## Requirments:

These build instructions are for Linux and Mac OS systems. Support for other systems is slated for a future release. 

You will need to have the following resources installed on your system:
- Python 2.7 (bundled with Mac OS)
- MTR (Can be installed using homebrew)
- Node.js 7.5.0 (the latest stable installation can be found on [their website](https://nodejs.org/en/download/))
- `npm` package manager for Javascript (bundled with the Node.js installer above)

### Usage
Copy the content of this folder to your project. To start the data capture and processing module run
```
sudo python DataScripts/dumps-parallelize.py
```
To start the web client visualization, in a different terminal window run 
```
npm install
npm start
```

Note: Once the python script is started, it removes all data from the data file, so if you are just wanting to test the visualization, it is recommended that you run the commands below and not the data script. 

```
npm install
npm start
```

### Data format
Sample data is stored in network-nodes-sample.json as well as network-traffic-sample.json 
