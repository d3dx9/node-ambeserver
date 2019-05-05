var SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline')

const colors = require("colors");


var DEBUG = (function(){
    var timestamp = function(){};
    timestamp.toString = function(){
        return "[INFO " + (new Date).toLocaleTimeString() + "]";    
    };

    return {
        log: console.log.bind(console, '%s', timestamp)
    }
})();

DEBUG.log("Node AMBEServer".green);
DEBUG.log("#########################".blue);
SerialPort.list((err, results) => {
		results.forEach((data) => {
			
			if(data.productId == 6015) {
			
				DEBUG.log("Serial Number: ".green + data.serialNumber.red);
				DEBUG.log("Type: DV-stick 30".green);
				
				openPort(data.comName);
			}
		});
});

function openPort(comPort) {
	var connected = false;
	var port = new SerialPort(comPort, {
		baudRate: 460800
	});
	// Port writer
	const dgram = require('dgram');
	const server = dgram.createSocket('udp4');

	server.on('error', (err) => {
	  DEBUG.log(`server error:\n${err.stack}`);
	  server.close();
	});


	server.on('listening', () => {
	  const address = server.address();
	  DEBUG.log(`server listening ${address.address}:${address.port}`);
	});

	server.bind(2460);
	var grinfo;
	server.on('message', (msg, rinfo) => {
		
		port.write(Buffer.from(msg));
		grinfo = rinfo;
		if(rinfo.size == 5) {
			DEBUG.log("Keepalive");
		}
	});
	port.on("open", function () {
		port.write(Buffer.from("6100010030", "hex"));
		port.on('data', function(data) {
			if(!connected) {
				var msg = data.toString().substr(5);
				msg = msg.substr(0, msg.length-1);
				if(msg == "AMBE3000R"){
					DEBUG.log("Connected to device (AMBE3000R)".red);
					connected = true;
				}
			}else{
				server.send(data,grinfo.port, grinfo.address,  (err) => {
						if (err) DEBUG.log(err);
					});
			}
			
		});
	});
	


}
	
	
