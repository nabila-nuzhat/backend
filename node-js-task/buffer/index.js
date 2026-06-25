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
console.log(textOriginal.toString("utf-8", 0, 8)); // hola! Amigos Why ?????????
console.log(buffMainString.toString("utf-8", 0, 8)); // hola! Am
// const readTextinBase64 = textOriginal.toString("base64", 7, 12);
console.log(textOriginal.toString("base64", 7, 12)); // hola! Amigos WHY ?????????/
console.log(buffMainString.toString("base64", 7, 12)); // bWlnb3M=
console.log(buffMainString.toString("base64", 7, 11)); // bWlnbw==



