1. btw whenever a async method completes, it returns a promise
2. For the case of:

```js
app.on("error", (error) => {
  console.log("Errr: ", error);
  throw error;
});
```

In Express, `app` is an instance of `express()`, which inherits from `http.Server`.
The error event is actually emitted by the underlying HTTP server, not by Express itself.
This event is typically emitted for errors like a port already being in use when starting the server.

higher order functions in js:
passing a function in a function as a parameter and executing that

```js
const asyncHandler = (fn) = () => {}
// or
const asyncHandler = (fn) = {() => {}}
// If we want to make it async
const asyncHandler = (fn) = async () => {}
```

3. MongoDB stores data in BSON format both internally and over the network.
   BSON allows faster traversing of data than JSON.

4. `trim:true` - Removes leading and trailing whitespace

5. watchHistory is a very complex topic in itself.

6. MongoDB aggregation pipelines -> very deep topic and vastly used in production

7. In below line of code

```js
return res
  .status(200)
  .cookie("accessToken", accessToken, cookieOptions)
  .cookie("refreshToken", refreshToken, cookieOptions)
  .json(new ApiResponse(200, user, "User created successfully"));
```

what it means:
we are sending a response
(i) with status 200
(ii) then we are setting cookies for accessToken and refreshToken
(iii) then finally we are sending a json response.. basically we are telling it that the respones should be a json
