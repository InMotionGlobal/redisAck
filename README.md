# redisAck

`redisAck` is redis with Acknowledgement Channels

## How to use

### Data producer
```js
const client = require('redisAck')({'host': 'ascend.prod'});
const io = require('socket.io-emitter')({ host: 'ascend.prod', port: 6379 });

client.on("message", function (channel, message) {
   	try { message = JSON.parse(message); } catch (e) {}

   	var user = message.user;
   	var org = message.org;
   	var data = message.data;
   	if (channel === 'permission:check') {
   		doPermissionCheck(user, org, data)
   		.then(function(result) {
   			if (message.ack_id) {
   				io.to(user._id).ack(message.ack_id, result);
   			}
   			else if (message.module_ack_id) {
   				client.ack(message.module_ack_id, result);
   			}
   		})

   	}
});
client.subscribe('permission:check');
```
### Data consumer
```js
const client = require('redisAck')({'host': 'ascend.prod'});

function getData() {
	client.publish('permission:check', { 'user':{'_id':'a1b2c3'}, 'org':{'_id':'d4e5f6'}, 'data':{'permName':'canWatchTv'}})
	.then(function(data) {
		console.log('Return data: %j', data);
	});
}
```

## License

MIT
