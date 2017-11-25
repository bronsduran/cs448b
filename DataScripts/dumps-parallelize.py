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

timeout = 10        # seconds allowing for mtr to timeout
numPackets = 10000     # the number of packets that we want to capture
numCycles = 2       # number of mtr cycles to run
userLat = 37.4275   # hard coded to stanford for now
userLon = -122.1697  # hard coded to stanford for now
timeScaleFactor = 1 # We need to slow down the packets to see them

# This is a list of the URL's to query from all around the world
urls = ["http://bbc.co.uk", "http://government.ru/en/", "https://www.gov.za/", "http://www.dubai.ae/en/Pages/default.aspx", "http://english.gov.cn/"]

multicastIPMin = int(netaddr.IPAddress("224.0.0.0"))
multicastIPMax = int(netaddr.IPAddress("239.255.255.255"))
localHostIP = int(netaddr.IPAddress("127.0.0.1"))


Routes = {}
VisData = []

def isReserved(dest):
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

    api = "http://freegeoip.net/json/" + address
    try:
        result = urllib2.urlopen(api).read()
        result = json.loads(result)
        return (float(result["latitude"]), float(result["longitude"]))
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

def getRouteGivenP(destIP, relStartTime, p):

    route = []

    (out, err) = p.communicate()

    lines = out.split('\n')
    for counter, line in enumerate(lines):

        if counter == 0 or counter == 1:
            continue

        line = line.split(" ")
        line = filter(None, line)

        if len(line) < 3 or line[1] == "???" or isReserved(line[1]):
            continue

        route.append([getLatLon(line[1])[1], getLatLon(line[1])[0],
                      (relStartTime + float(line[2]))*timeScaleFactor])

    Routes[destIP] = route
    print route
    return route


# -------- tcpdump output format --------- #

# tcpdump -i any -n -c {num packets} ip -q

# 19:17:13.090753 IP 10.31.78.74.5353 > 224.0.0.251.5353: UDP, length 1431

# -i any: listen on all interfaces
# -n: don't resolve host names
# -q: be less verbose with output
# -c: capture up to num packets
# ip: only capture IP packets

print "First, let's get all of the unique IP's"

proc = subprocess.Popen(["tcpdump -i any -n -c "+str(numPackets)+" ip -q"],
                        stdout=subprocess.PIPE, shell=True)


for url in urls:
    if proc.poll() is not None:
        break
    print "Getting the following url:", url
    urllib2.urlopen(url).read()



(out, err) = proc.communicate()
print "Done collecting IP's"
print out

startTime = 0

lines = out.split('\n')


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

    # need to convert to ms should be timestamp - startTime not 0
    route = Routes.get(destIP) # return none if key doesn't exist

    if route is None:
        p = subprocess.Popen(["mtr -rn -o \"A\" -c " + str(numCycles) + " " + destIP],
                              stdout=subprocess.PIPE, shell=True)

        packet = {"dest-ip": destIP,
                  "protocol": protocol,
                  "dest-port" : destPort,
                  "relative-start-time" : timestampDifferences(startTime, timestamp),
                  "route": None}
        processes.append((p,packet))

        Routes[destIP] = "waiting"



print "Waiting for all of the parallel processes to finish!"
beginningTime = time.time()
for p, packet in processes:
    p.wait()
    packet["route"] = getRouteGivenP(packet["dest-ip"], packet["relative-start-time"], p)
    Routes[destIP] = packet["dest-ip"]
    VisData.append(packet);


print "All parallel processes finished in " + str(time.time()-beginningTime) + " seconds."
print "Number of original packets (these nums should be equal):" + str(len(VisData)) + " " + str(len(Routes))

with open('network-traffic.json', 'w') as fp:
    json.dump(VisData, fp)

print "Done!"
