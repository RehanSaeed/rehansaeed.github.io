export function encode(email, key) {
  // Hex encode the key
  let encodedString = key.toString(16);
  // loop through every character in the email
  for (let n = 0; n < email.length; n++) {
    // Get the code (in decimal) for the nth character
    let charCode = email.charCodeAt(n);
    // XOR the character with the key
    let encoded = charCode ^ key;
    // Hex encode the result, and append to the output string
    encodedString += encoded.toString(16);
  }
  return encodedString;
}

export function decode(encodedString) {
  // Holds the final output
  let email = "";
  // Extract the first 2 letters
  let keyInHex = encodedString.substr(0, 2);
  // Convert the hex-encoded key into decimal
  let key = parseInt(keyInHex, 16);
  // Loop through the remaining encoded characters in steps of 2
  for (let n = 2; n < encodedString.length; n += 2) {
    // Get the next pair of characters
    let charInHex = encodedString.substr(n, 2);
    // Convert hex to decimal
    let char = parseInt(charInHex, 16);
    // XOR the character with the key to get the original character
    let output = char ^ key;
    // Append the decoded character to the output
    email += String.fromCharCode(output);
  }
  return email;
}
