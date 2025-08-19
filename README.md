## Controllers Done

### workspace controllers
1. create workspace
2. joinworkspace (with code)
3. get workspaces of user
4. add member to workspace
5. get channels of workspace
6. get channels of workspace user is present in
7. edit workspace
8. delete workspace

### user controller
1. getUserprofile
2. getUserbyID

### channel controller
1. add member to channel
2. create channel

### what is done
1. socket.io basic connection with the frontend with a bit of socket auth
2. signin with email connected to the frontend
3. permission middleware
4. join rooms socket controller done
5. file upload for object storage
6. message broadcast in channels using socket
7. message and attachments saving in the database
8. get messages for a channel in a workspace (use pagination) with pre signed url for attachments
9. default room for broadcasting messages, leave room logic

### what to add now
1. queues, producer, consumer for mailing and stuff
2. indexing in db
3. abstract userId middleware
4. global error handler
5. dummuy delete and edit messages
6. personal message
7. reactions, typing presense, mentions, search, threading/replies
8. logging and analytics
9. canvas
10. voice chat, stream 
11. send messages in the default channel