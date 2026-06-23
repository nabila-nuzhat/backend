/* by default data is in UTF-8 format
* JS: small reference object
* C++: 1000 bytes of raw memory
 */
const buff = Buffer.alloc(10);
console.log(buff); // <Buffer 00 00 00 00 00 00 00 00 00 00> 
