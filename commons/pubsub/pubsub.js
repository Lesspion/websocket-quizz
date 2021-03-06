(function () {

    var listeners = {};
    var listenersAutoIncrement = 0;
    var netInterface = null;

    var pubsub = {
        publish: function (message, payload, noNetForwarding) {
            var listener;

            if (message === undefined || payload === undefined) {
                throw new Error('missing message or payload');
            }

            if (netInterface !== null && noNetForwarding !== true) {
                payload.type = message;
                console.log('emit', payload);
                netInterface.emit('message', payload);
            }

            // nobody is listening
            if (listeners[message] !== null) {
                for (var listenerIndex in listeners[message]) {
                    if (listeners[message].hasOwnProperty(listenerIndex)) {
                        listener = listeners[message][listenerIndex];
                        if (Array.isArray(listener)) {
                            listener[0].call(listener[1], payload);
                        } else {
                            listener.call(this, payload);
                        }
                    }
                };                
            }
        },
        subscribe: function (message, callback) {
            listenersAutoIncrement++;
            if (listeners[message] === undefined) {
                listeners[message] = {};
            }
            listeners[message][(listenersAutoIncrement).toString()] = callback;
            return listenersAutoIncrement;
        },
        unsubscribe: function (message, index) {
            var stillHasListeners = false;
            if (listeners[message] == undefined || listeners[message][index] == undefined) {
                return;
            }

            delete listeners[message][index];

            for (var prop in listeners[message]) {
                if (listeners[message].hasOwnProperty(prop)) {
                    stillHasListeners = true;
                    break;
                }
            }
            if (stillHasListeners === false) {
                delete listeners[message];
            }
        },
        ping: function (message, payload, callback) {
            this.subscribe('PONG_' + message, callback);
            this.publish(message, payload);
        },
        pong: function (message, onPing) {
            var that = this;
            this.subscribe(message, function (data) {
                var payload = onPing(data);
                this.publish('PONG_' + message, payload);
            });
        },
        setNetworkAdapter: function (networkAdapter) {
            if (netInterface !== null) {
                // clean old one
            }

            networkAdapter.setup(this, function (net) {
                netInterface = net
            });
        }
    }

    if (typeof module === "object" && module && typeof module.exports === "object") {
        module.exports = pubsub;
    } else {
        define(pubsub);
    }

})();