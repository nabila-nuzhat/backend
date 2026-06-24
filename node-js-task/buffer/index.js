/* by default data is in UTF-8 format
* JS: small reference object
* C++: 1000 bytes of raw memory
 */
const buff = Buffer.alloc(10);
console.log(buff); // <Buffer 00 00 00 00 00 00 00 00 00 00> 

const buffFrom = Buffer.from("hola");
console.log("buffFrom", buffFrom); // buffFrom <Buffer 68 6f 6c 61>

const buffFrom2 = Buffer.from("Adios! Hola Amigos", "hex");
console.log("buffFrom2", buffFrom2); // buffFrom2 <Buffer ad>

const buffFrom3 = Buffer.from("hello", "hex");
console.log("buffFrom3", buffFrom3); // buffFrom3 <Buffer >

const buffFrom4 = Buffer.from("Adios", "hex");
console.log("buffFrom4", buffFrom4); // buffFrom4 <Buffer ad>

