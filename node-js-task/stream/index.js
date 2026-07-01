/* BIG File create -------------------------------------------------- */
    /* BIG File create 
    1. in local folder -------------------------------------------- */
    // // const fs = require('fs'); // for type commonJs
    // // import fs from "fs" // how this too work? ISSUE solved (claude suggetsion "Node.js Package.json type field compatibility syntax code")
        //  import fs from "node:fs";
        // const file = fs.createWriteStream('./big.file');

        // for(let i=0; i<= 5*1e2; i++) {
        //     //   file.write('Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n');
        //     file.write(' Ami Home Work korte bhulbo na.\n');
        // }

        // file.end();

    /* BIG File create 
    2. in port for serving the created big file in a node web server ---------------------------------- */

    // // const fs = require('fs'); //  for type commonJs
    // // import fs from "fs" // how this too work? ISSUE solved (claude suggetsion "Node.js Package.json type field compatibility syntax code")
   import fs from "node:fs"
   import http from "node:http"
       // // const server = require('http').createServer(); // for type commonJs

       const server = http.createServer();
        server.on('request', (req, res) => {
        fs.readFile('./big.file', (err, data) => {
            if (err) throw err;

            res.end(data);
            });
        });

        server.listen(3000);
        // server.listen(8000);