const redis = require("redis");
const uuid = require('uuid');

module.exports = function(options) {
    const pub = redis.createClient(options);
    const sub = redis.createClient(options);
    const moduleId = uuid.v4().replace(/\-/g,'');
    const ackChannel = 'moduleAck:'+moduleId+':';
    var module_ack_id = 0;
    var moduleCallbacks = [];

    sub.on("pmessage", function (pattern, channel, message) {
        try { message = JSON.parse(message); } catch (e) {}
        if (pattern === ackChannel+'*') {
            var returnAckId = +channel.split(':').pop();
            if (moduleCallbacks[returnAckId]) {
                    moduleCallbacks[returnAckId](message);
            }
        }
    });
    sub.psubscribe(ackChannel+'*');

    function publish(channel, message) {
        message.module_ack_id = ackChannel + module_ack_id;
        pub.publish(channel, JSON.stringify(message));
        console.log('Publishing: %s', message.module_ack_id);
        const response = new Promise(function(resolve, reject) {
            moduleCallbacks[module_ack_id] = function(message) {
                resolve(message);
                delete moduleCallbacks[module_ack_id];
                console.log(moduleCallbacks);
                return;
            }
        });
        module_ack_id++;
        return response;
    }

    function ack(ackId, result) {
       pub.publish(ackId, JSON.stringify(result));
    }

    function subscribe(channel) {
       return sub.subscribe(channel);
    }

    function on(message, callback) {
       return sub.on(message, callback);
    }


    return {
        publish,
        ack,
        subscribe,
        on
    }
}
