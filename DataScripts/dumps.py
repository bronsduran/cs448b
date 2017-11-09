# sudo pip install python-geoip
import urllib2
import json
import collections
import subprocess
from threading import Timer

timeout = 10 # seconds allowing for traceroute to timeout




def isLocalIP(dest):
    """
    The following IP addresses are known to be reserved
    only for local IP's.
    10.0.0.0 - 10.255.255.255
    172.16.0.0 - 172.31.255.255
    192.168.0.0 - 192.168.255.255
    """
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



# sudo tcpdump -i any -n -c 100 ip -q
proc = subprocess.Popen(["sudo tcpdump -i any -n -c 50 ip -q"], stdout=subprocess.PIPE, shell=True)
(out, err) = proc.communicate()
print out



destinationsDict = collections.defaultdict(dict)

lines = out.split('\n')
for line in lines:
    line = line.strip()
    if line == "":
        continue

    destination = '.'.join(line.split('> ')[1].split(':')[0].split('.')[0:4])

    if isLocalIP(destination):
        continue

    udptcp = line.split('> ')[1].split(': ')[1]
    udptcp = udptcp[:3]

    length = line.split(' ')[-1]


    thisD = destinationsDict[destination]
    if len(thisD) == 0:
        thisD['count'] = 1
        thisD['type'] = [udptcp]
        thisD['lengths'] = [length]
    else:
        thisD['count'] += 1
        thisD['type'].append(udptcp)
        thisD['lengths'].append(length)
    destinationsDict[destination] = thisD

print destinationsDict
print ""


# FAKE DICTIONARY FOR TESTING PURPOSES
destinationsDict = {"23.203.187.27":{'count':1, 'type':['tcp'], 'length':[100]}}
destinationsDict["23.203.225.13"] = {'count':1, 'type':['tcp'], 'length':[100]}

counter = 0
for ip in destinationsDict:
    counter += 1
    print "running traceroute for ip =", ip, "("+str(counter)+"/"+str(len(destinationsDict))+")"



    p = subprocess.Popen(["traceroute -d "+ip], stdout=subprocess.PIPE, shell=True)

    killed = False
    def k(x):
        x.kill()

        global killed
        killed = True

        print "KILLED DUE TO TIMEOUT (" + str(timeout) + " seconds)"

    my_timer = Timer(timeout, k, [p])
    try:
        my_timer.start()
        (out, err) = p.communicate()
        if not killed:
            # we want to store this
            destinationsDict[ip]['traceroute'] = out
            #print out
    finally:
        my_timer.cancel()
        killed = False

    print ''




finalOutputDict = {}

print "Final output:"
for ip in destinationsDict:
    if 'traceroute' in destinationsDict[ip]:
        lines = destinationsDict[ip]['traceroute'].split('\n')

        ipRoute = []
        timeAverages = []
        latitudes = []
        longitudes = []

        dataVizFormat = []
        for line in lines:
            line = line.strip()
            if line == "":
                continue
            # get the IP from this line
            thisIP = line.split('(')[1].split(')')[0]
            ipRoute.append(thisIP)

            # get the latitude/longitude of this IP
            (latitude, longitude) = getLatLon(thisIP)

            latitudes.append(latitude)
            longitudes.append(longitude)

            # we want to compute the average time delay (ms) per line
            times = line.split(')')[1].split(' ms')[0:3]
            avgTime = sum([float(x.strip()) for x in times])/len(times)
            timeAverages.append(avgTime)

            dataVizFormat.append([latitude, longitude, avgTime])


        # make sure that we ended up at the IP we asked for!
        if ipRoute[-1] != ip:
            continue

        finalOutputDict[ip] = dataVizFormat


print finalOutputDict
