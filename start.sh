#!/bin/bash
sudo python DataScripts/dumps-parallelize.py &
APP_PID=$!
sleep 40
npm start

#sudo kill -9 $APP_PID
sudo pkill -f python