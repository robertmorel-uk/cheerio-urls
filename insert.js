let mysql  = require('mysql');
let config = require('./config.js');
let connection = mysql.createConnection(config);

// insert statment
let sql = "INSERT INTO `cryptourlentries` (`urlTitle`,`urlLink`,`urlDescription`,`urlSource`,`urlDate`) VALUES (1,3,4,5,6)";

// execute the insert statment
connection.query(sql);

connection.end();