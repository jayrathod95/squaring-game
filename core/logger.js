var fs = require('fs');
var path = require('path');
var logfile = 'log-'+new Date().getDate()+'.log';


var logger  = function(message){
    if(!fs.exists(logfile))fs.writeFile(logfile);
    fs.appendFile(logfile,message+'\n');
}

module.exports = logger;