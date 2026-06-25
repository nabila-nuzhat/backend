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
