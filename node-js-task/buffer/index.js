/* by default data is in UTF-8 format
* JS: small reference object
* C++: 1000 bytes of raw memory
 */
const buff = Buffer.alloc(10);
console.log(buff); // <Buffer 00 00 00 00 00 00 00 00 00 00> 

/* * ISSUE ??: Why string not converted to hex Buffer.from() 
   * Why in the example buffFrom4 and buffFrom2 has same output = <Buffer ad> 
        while having different length of string? 
      **************  RESOLVED ISSUE *************
      **************Check Buffer from encoding word doc   */
const buffFrom = Buffer.from("hola");
console.log("buffFrom", buffFrom); // buffFrom <Buffer 68 6f 6c 61>

// hex  XXXXX not actual practise
    // const buffFrom2 = Buffer.from("Adios! Hola Amigos", "hex");
    // console.log("buffFrom2", buffFrom2); // buffFrom2 <Buffer ad> 

    // const buffFrom3 = Buffer.from("hello", "hex");
    // console.log("buffFrom3", buffFrom3); // buffFrom3 <Buffer >

    // const buffFrom4 = Buffer.from("Adios", "hex");
    // console.log("buffFrom4", buffFrom4); // buffFrom4 <Buffer ad> 

// default
const buffFrom22 = Buffer.from("Adios! Hola Amigos");
console.log("buffFrom22 = ", buffFrom22); // 

const buffFrom44 = Buffer.from("Adios");
console.log("buffFrom44 = ", buffFrom44); // 

// base64 XXXXX not actual practise
    /* const buffFrom22Base64 = Buffer.from("Adios! Hola Amigos", "base64");
    console.log("buffFrom22Base64 = ", buffFrom22Base64); // 

    const buffFrom44Base64 = Buffer.from("Adios", "base64");
    console.log("buffFrom22Base64 = ", buffFrom44Base64); //  
    */

// converting back to origin text from base64 start ----------------------
const buffMainString = Buffer.from("hola! Amigos");
console.log(buffMainString); // <Buffer 68 6f 6c 61 21 20 41 6d 69 67 6f 73> it's a hex visual output of default utf-8 translation

const buffBase64 = buffMainString.toString("base64");
console.log(buffBase64); // aG9sYSEgQW1pZ29z
console.log(typeof buffBase64); // string

const buffBase64toString = Buffer.from("aG9sYSEgQW1pZ29z", "base64"); // parsing the encoded compatible format mentioned in encoding, converting it to binary to store and showing hex o/p for human readability. 
console.log(buffBase64toString); // <Buffer 68 6f 6c 61 21 20 41 6d 69 67 6f 73> (hex)

const textOriginal = buffBase64toString.toString("utf-8"); // translating the binary back to original text format;
console.log(textOriginal); // hola! Amigos
// converting back to origin base64 text endline ----------------------

// Reading Buffer -------------------------------------------------
/* buf.toString([encoding], [start], [end])
 * start - Optional. Start byte index
    end - Optional. End byte index (exclusive)
 */
// const readTextOrg = textOriginal.toString("utf-8", 0, 8);
console.log(textOriginal.toString("utf-8", 0, 8)); // hola! Amigos ??? ISSUE: WHY textOriginal not same as buffMainString ?????? ?????????
console.log(buffMainString.toString("utf-8", 0, 8)); // hola! Am
// const readTextinBase64 = textOriginal.toString("base64", 7, 12);
console.log(textOriginal.toString("base64", 7, 12)); // hola! Amigos ??? ISSUE: WHY textOriginal not same as buffMainString ??????
console.log(buffMainString.toString("base64", 7, 12)); // bWlnb3M=
console.log(buffMainString.toString("base64", 7, 11)); // bWlnbw==

// buff.write() method ----------------
/* Already allocated
    const buff = Buffer.alloc(10); */
console.log(buff.write("Adios Amigos!")); //10 -> Returns the number of bytes written, not the buffer itself.

console.log(buff.toString()); // Adios Amig -> to read the text allocated in buffer need toString()

/* array like index access------------------------ 
 * buffBase64toString & buffMainString both variables are allocated in Buffer*/
console.log(buffBase64toString[0]); // 104
console.log(buffBase64toString.toString()); // hola! Amigos
console.log(buffBase64toString.toString("base64")); // aG9sYSEgQW1pZ29z
console.log(buffBase64toString); // <Buffer 68 6f 6c 61 21 20 41 6d 69 67 6f 73>
console.log(buffMainString[0]); // 104
console.log(buffMainString.toString()); // hola! Amigos
console.log(buffMainString); // <Buffer 68 6f 6c 61 21 20 41 6d 69 67 6f 73>

console.log(buffMainString[0].toString(16)); // 68  (hex)
console.log(buffMainString[0].toString(2)); // 1101000 (binary)
buffMainString[1] = 101; // hela! Amigos (replaced o by e = 101)
console.log(buffMainString.toString())

console.log("textOriginal :", textOriginal[0]); // textOriginal : h (bcz textOriginal is a string)
console.log("textOriginal :", textOriginal.toString("base64")); // textOriginal : hola! Amigos (bcz textOriginal is a string not a buffer)

/* slice---------------- */
const bufForSlice = Buffer.from("Slice Me!")
console.log("bufForSlice org:", bufForSlice); // bufForSlice org: <Buffer 53 6c 69 63 65 20 4d 65 21>
const bufSliced = bufForSlice.slice(0, 3);
console.log("bufSliced portion", bufSliced); // bufSliced portion <Buffer 53 6c 69>
console.log("bufForSlice after slice:", bufForSlice);

/* copy() ------------------ */
const bufForCopy = Buffer.from("Copy Me!")
console.log("bufForCopy before", bufForCopy);

const bufCopied= Buffer.alloc(3);
bufForCopy.copy(bufCopied, 0, 0, 3);
console.log("bufCopied :", bufCopied); 
console.log("bufCopied :", bufCopied.toString()); // bufCopied : Cop
console.log("bufForCopy after :", bufForCopy.toString());

const bufCopied2 = Buffer.alloc(3);
bufForCopy.copy(bufCopied2, 1, 5, 8);
console.log("bufCopied2 :", bufCopied2.toString()); // bufCopied2 : NULMe 
const bufCopied22 = Buffer.alloc(4);
bufForCopy.copy(bufCopied22, 1, 5, 8);
console.log("bufCopied22 :", bufCopied22.toString()); // bufCopied22 : NULMe! 

const bufCopied3 = Buffer.alloc(3);
bufForCopy.copy(bufCopied3, 0, 5, 8);
console.log("bufCopied3 :", bufCopied3.toString()); // bufCopied3 : Me!

/* Buffer Pool default ------------------- */
console.log(Buffer.poolSize); // 8192  which is 8KB = 8192 bytes

/* PRACTISE WORK POWER Point --------------------------------------------------
// Hint: fs.readFile + toString('base64')
// Hint: createReadStream + pipe
// Hint: net.createServer + toString('hex')
// Hint: Modify both, check original
--------------------------------------------------------------
 */

// const fs = require('fs'); 
import fs from 'fs';
const file = fs.createWriteStream('./big.file');

for(let i=0; i<= 1e2; i++) {
  file.write('Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n');
}

file.end();