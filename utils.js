const generateConfig = (url, accessToken) => {
  // The generateConfig function takes in a URL and an access token as parameters and returns a configuration object for making an HTTP request.
  return {
    method: "get",
    url: url,
    headers: {
      Authorization: `Bearer ${accessToken} `, // This allows the server to authenticate the request using the provided access token.
      "Content-type": "application/json", // The Content-type header is set to "application/json" to indicate that the request body, 
      // if any, will be in JSON format.
    },
  };
};

module.exports = { generateConfig };
