# We need the users Lat & Long
#
# The first packet's start time to zero, from there we
# set the relative start times for the rest of the packets
#
# pN-start-time = pN-timestamp - p1-timestamp
#
# ----------- Data Format ---------
# [{
#   "src-ip": src-ip,                                               // Packet 1
#   "dest-ip": dest-ip,
#   "protocol": protocol,
#   "src-port": src-port,
#   "dest-port": dest-port,
#   "route": [
#     [userLat, userLong, p1-start-time],
#     [p1-h1-lat, p1-h1-long, p1-h1-delay],
#     ...
#     [p1-hM-lat, p1-hM-long, p1-hM-delay]
#   ]
# },
# {
#   "src-ip": src-ip,                                               // Packet 2
#   "dest-ip": dest-ip,
#   "protocol": protocol,
#   "src-port" : src-port,
#   "dest-port" : dest-port,
#   "route": [
#     [userLat, userLong, p2-start-time],
#     [p2-h1-lat, p2-h1-long, p2-start-time + p2-h1-delay],
#      ...
#     [p2-hM-lat, p2-hM-long, p2-start-time + p2-hM-delay]
#   ]
# },
# ...
# {
#   "src-ip": src-ip,                                               // Packet n
#   "dest-ip": dest-ip,
#   "protocol": protocol,
#   "src-port" : src-port,
#   "dest-port" : dest-port,
#   "route": [
#     [userLat, userLong, pN-start-time],
#     [pN-h1-lat, pN-h1-long, pN-start-time + pN-h1-delay],
#      ...
#     [pN-hM-lat, pN-hM-long, pN-start-time + pN-hM-delay]
#   ]
# }]

#------- mtr outpout format  -------#

# mtr -rn -o "A" -c 3 google.com

# -r generate mtr report
# -n don't resolve host names
# -c number of mtr cycles to run
# -o "A" only show the average latency

# Start: 2017-11-14T22:01:57-0800
# HOST: AAA.SUNet                     Avg
#   1.|-- 10.31.64.2                  1.2
#   2.|-- 128.12.1.42                 1.2
#   3.|-- 128.12.1.54                 1.5
#   4.|-- 128.12.0.205               47.1
#   5.|-- 137.164.23.157              3.0
#   6.|-- 74.125.48.172               3.6
#   7.|-- 108.170.243.1               7.4
#   8.|-- 108.170.237.119             4.2
#   9.|-- 216.58.195.238              3.3

# -------- tcpdump output format --------- #

# tcpdump -i any -n -c {num packets} ip -q

# 19:17:13.090753 IP 10.31.78.74.5353 > 224.0.0.251.5353: UDP, length 1431

# -i any: listen on all interfaces
# -n: don't resolve host names
# -q: be less verbose with output
# -c: capture up to num packets
# ip: only capture IP packets

import collections
import datetime
import json
import subprocess
from threading import Timer
import urllib2
import json
from sets import Set
import netaddr
import time
import urllib2
import sys
import os
from threading import Thread
import signal
import glob

numCycles = 2           # number of mtr cycles to run
userLat = 37.4275       # hard coded to stanford for now
userLon = -122.1697     # hard coded to stanford for now
timeScaleFactor = 1.5    # We need to slow down the packets to see them
TCPDUMPTIMER = 30       # number of Seconds to run tcpdump
filterFactor = 100      # GPU can't handle all of the packets 
corectionFactor = 0.5   # Correction for aproximate latencies

# This is a list of the URL's to query from all around the world
urls = ["http://bbc.co.uk", "http://government.ru/en/", "https://www.gov.za/", "http://www.dubai.ae/en/Pages/default.aspx", "http://english.gov.cn/"]

multicastIPMin = int(netaddr.IPAddress("224.0.0.0"))
multicastIPMax = int(netaddr.IPAddress("239.255.255.255"))
localHostIP = int(netaddr.IPAddress("127.0.0.1"))

Nodes = {}
NodesVisData = []
latenciesD = {}



"""
    The following IP addresses are known to be reserved

    local IP's.
    10.0.0.0 - 10.255.255.255
    172.16.0.0 - 172.31.255.255
    192.168.0.0 - 192.168.255.255

    Multicast IP's
    224.0.0.0 - 239.255.255.255

    Local host
    127.0.0.1
    """
def isReserved(dest):
    
    ip = int(netaddr.IPAddress(dest))

    if ip >= multicastIPMin and ip <= multicastIPMax:
        return True

    if ip == localHostIP:
        return True

    dest = dest.split('.')
    dest = [int(x) for x in dest]
    if dest[0] == 192 and dest[1] == 168:
        return True
    if dest[0] == 172 and dest[1] >= 16 and dest[1] <= 31:
        return True
    if dest[0] == 10:
        return True
    if all(x==255 for x in dest):
        return True
    return False



def getLatLon(address):

    if address in Nodes:
        return Nodes[address]
    api = "http://freegeoip.net/json/" + address
    try:
        result = urllib2.urlopen(api).read()
        result = json.loads(result)
        result = (float(result["latitude"]), float(result["longitude"]))
        Nodes[address] = result
        visResult = (result[1], result[0])
        node = {"ip": address, "location": visResult}
        NodesVisData.append(node)
        return result
    except:
        print("Could not find: ", address)
        return None

def getIP(ipPort):
    nums = ipPort.split(".")
    return nums[0] + "." + nums[1] + "." + nums[2] + "." + nums[3]

def getPort(ipPort):
    nums = ipPort.split(".")
    if len(nums) < 5:
        return 0
    else:
        return nums[4]



def timestampDifferences(timestamp1, timestamp2):
    # 15:02:19.732712
    dt1 = datetime.datetime.strptime(timestamp1, '%H:%M:%S.%f')
    dt2 = datetime.datetime.strptime(timestamp2, '%H:%M:%S.%f')
    return abs((dt2-dt1).total_seconds())


def getRouteGivenP(destIP, relStartTime, out, err):

    route = []

    relativeRoute = []

    lines = out.split('\n')

    for counter, line in enumerate(lines):

        if counter == 0 or counter == 1:
            continue

        line = line.split(" ")
        line = filter(None, line)

        if len(line) < 3 or line[1] == "???" or isReserved(line[1]):
            continue



        route.append([getLatLon(line[1])[1], getLatLon(line[1])[0],
                      (relStartTime + (float(line[2])*timeScaleFactor) + (counter * corectionFactor))])

        relativeRoute.append([getLatLon(line[1])[1], getLatLon(line[1])[0],
                      ((float(line[2])*timeScaleFactor) + (counter * corectionFactor))])

    Routes[destIP] = route

    latenciesD[destIP] = relativeRoute

    return route


def getTCPDumpWithTimer(timeout_sec):
    """Execute `cmd` in a subprocess and enforce timeout `timeout_sec` seconds.

    Return subprocess exit code on natural completion of the subprocess.
    Raise an exception if timeout expires before subprocess completes."""
    proc = subprocess.Popen(["tcpdump -l -i any -n ip -q"], bufsize=1, universal_newlines=True, stdout=subprocess.PIPE, shell=True)

    lines = []
    startTime = time.time()
    while True:
        if time.time()-startTime >= timeout_sec:
            break
        lines.append(proc.stdout.readline().strip())
    proc.kill()

    return lines

def updateRouteLatencies(destIP, relStartTime):

    route = latenciesD.get(destIP)

    if route is not None:
        for hop in route:
            hop[2] += relStartTime

    return route

def iterative(c):
    global Routes

    VisData = []

    print "First, let's get all of the unique IP's"

    proc = None
    if sys.platform.startswith('win'):
        path = os.path.dirname(os.path.abspath(__file__)) + "\\"+ 'WinDump.exe'
        print path
        proc = subprocess.Popen([path, " -n -c "+str(numPackets)+" ip -q"], stdout=subprocess.PIPE, shell=True)
    else:
        lines = getTCPDumpWithTimer(TCPDUMPTIMER)

    # for url in urls:
    #     if proc.poll() is not None:
    #         break
    #     print "Getting the following url:", url
    #     urllib2.urlopen(url).read()

    print "Done capturing packets"

    startTime = 0

    print "Executing them all in parallel..."
    processes = []
    for counter, line in enumerate(lines):
        line = line.split(" ")

        if len(line) < 6 or line[2] == "wrong":
            continue


        timestamp = line[0]
        destIP = getIP(line[4]).replace(":","")
        destPort = str(getPort(line[4])).replace(":","")
        protocol = line[5].replace(",","")


        if isReserved(destIP):
            continue

        if startTime == 0:
            startTime = timestamp
            

        print "Getting routing data for packet " + str(counter + 1) +"/"+ str(len(lines))

    
        route = Routes.get(destIP)

        if route is None:
            p = subprocess.Popen(["mtr -rn -o \"A\" -c " + str(numCycles) + " " + destIP], stdout=subprocess.PIPE, shell=True)

            packet = {"dest-ip": destIP,
                      "protocol": protocol,
                      "dest-port" : destPort,
                      "relative-start-time" : timestampDifferences(startTime, timestamp),
                      "route": None}
            processes.append((p,packet))

            Routes[destIP] = "waiting"


        elif (counter % filterFactor == 0): 
            newRoute = updateRouteLatencies(destIP, timestampDifferences(startTime, timestamp))
            if newRoute is not None:
                packet = {"dest-ip": destIP,
                      "protocol": protocol,
                      "dest-port" : destPort,
                      "relative-start-time" : timestampDifferences(startTime, timestamp),
                      "route": newRoute}
                VisData.append(packet)
        
            

    print "Waiting for all of the parallel processes to finish!"
    beginningTime = time.time()
    for p, packet in processes:
        (out, err) = p.communicate()

        packet["route"] = getRouteGivenP(packet["dest-ip"], packet["relative-start-time"], out, err)

        Routes[destIP] = packet["dest-ip"]
        VisData.append(packet);


    print "All parallel processes finished in " + str(time.time()-beginningTime) + " seconds."
    print "Number of original packets (these nums should be equal):" + str(len(VisData)) + " " + str(len(Routes))

    with open('data/network-traffic-'+str(c)+'.json', 'w') as fp:
        json.dump(VisData, fp)

    with open('data/network-nodes-'+str(c)+'.json', 'w') as fp:
        json.dump(NodesVisData, fp)

    print "Done with counter "+str(c)+"!"


if __name__ == "__main__":
    global Routes
    Routes = {}
    c = 0

    files = glob.glob('./data/*')
    for f in files:
        os.remove(f)

    while (True):
        print "Starting new thread with counter "+str(c)
        if c >= 10:
            c = 0
        processThread = Thread(target=iterative, args=(c,))
        processThread.start()
        c += 1
        time.sleep(float(TCPDUMPTIMER))
        print ""
