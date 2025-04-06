## Zedux Socket.IO Example

**This example is a work in progress**. It has plenty of elements you can learn from, but don't take it as a complete example.

This example demonstrates best practices for sending and receiving socket messages with Socket.IO and Zedux

### Project Structure

- `client/` - the code for the UI.
  - `client/state/` - some common, global atoms, namely:
    - `client/state/socket.ts` - the socket client setup.
- `server/` - the code for the socket-serving backend.
- `shared/` - code and types used by both the client and the server.
  - `shared/api.ts` - defines the possible socket messages. Ideally these would be generated e.g. with an RPC implementation
