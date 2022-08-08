# TRACE
TRACE is a rocket simulation program to plot data of recorded spaceship voyage

## Setup
1. npm install

2.0 npm run dev - runs dev enviroment
2.5 npm run build - runs build enviorment

Should be hosted at www.localhost.com/8080

## Usage
Choose a csv file from upload file, file, as of currently for proper use, needs to be on format:
time, x, y, z, lightStrength, temp, humidity

time - time in ms since program started
x - acceleration in x axis
y - acceleration in y axis
z - accleration in z axis
lightStrength - light sensor
temp - temperature in celcius
humidity - moisture in air %

there is an example file in src/client/data called DATA.txt, you can use this to make a test plot.
